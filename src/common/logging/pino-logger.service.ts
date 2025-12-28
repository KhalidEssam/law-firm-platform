import { Injectable, LoggerService, Scope } from '@nestjs/common';
import pino, { Logger } from 'pino';

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

@Injectable({ scope: Scope.TRANSIENT })
export class PinoLoggerService implements LoggerService {
  private logger: Logger;
  private context?: string;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      formatters: {
        level: (label) => ({ level: label }),
      },
      base: {
        service: 'exoln-lex',
        env: process.env.NODE_ENV || 'development',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: [
          // Authentication & Security
          'password',
          'token',
          'authorization',
          'cookie',
          'secret',
          'apiKey',
          'api_key',
          'accessToken',
          'refreshToken',
          'Bearer',
          // Financial Data (PCI-DSS)
          'creditCard',
          'cardNumber',
          'cvv',
          'accountNumber',
          'bankAccount',
          'iban',
          // Personal Identifiable Information (GDPR/PII)
          'email',
          'emailAddress',
          'phoneNumber',
          'phone',
          'mobileNumber',
          'ssn',
          'socialSecurityNumber',
          'nationalId',
          'idNumber',
          'passportNumber',
          'dateOfBirth',
          'dob',
          'address',
          'streetAddress',
          // Nested paths for request/response bodies
          '*.password',
          '*.token',
          '*.email',
          '*.phoneNumber',
          '*.ssn',
          '*.creditCard',
          'body.password',
          'body.email',
          'body.phoneNumber',
          'req.body.password',
          'req.body.email',
          'req.headers.authorization',
        ],
        censor: '[REDACTED]',
      },
    });
  }

  setContext(context: string): void {
    this.context = context;
  }

  private formatMessage(message: any, context?: LogContext): object {
    const logObject: any = {
      context: this.context,
      ...context,
    };

    if (typeof message === 'string') {
      logObject.message = message;
    } else if (message instanceof Error) {
      logObject.message = message.message;
      logObject.error = {
        name: message.name,
        stack: message.stack,
      };
    } else {
      logObject.message = message;
    }

    return logObject;
  }

  log(message: any, context?: string | LogContext): void {
    const ctx = typeof context === 'string' ? { context } : context;
    this.logger.info(this.formatMessage(message, ctx));
  }

  error(message: any, trace?: string, context?: string | LogContext): void {
    const ctx = typeof context === 'string' ? { context } : context;
    const logObj = this.formatMessage(message, ctx);
    if (trace) {
      (logObj as any).stack = trace;
    }
    this.logger.error(logObj);
  }

  warn(message: any, context?: string | LogContext): void {
    const ctx = typeof context === 'string' ? { context } : context;
    this.logger.warn(this.formatMessage(message, ctx));
  }

  debug(message: any, context?: string | LogContext): void {
    const ctx = typeof context === 'string' ? { context } : context;
    this.logger.debug(this.formatMessage(message, ctx));
  }

  verbose(message: any, context?: string | LogContext): void {
    const ctx = typeof context === 'string' ? { context } : context;
    this.logger.trace(this.formatMessage(message, ctx));
  }

  // Business-specific logging methods
  logRequest(context: LogContext): void {
    this.logger.info({
      type: 'http_request',
      ...context,
    });
  }

  logResponse(context: LogContext): void {
    const level = context.statusCode && context.statusCode >= 400 ? 'warn' : 'info';
    this.logger[level]({
      type: 'http_response',
      ...context,
    });
  }

  logAudit(action: string, context: LogContext): void {
    this.logger.info({
      type: 'audit',
      action,
      ...context,
    });
  }

  logSecurity(event: string, context: LogContext): void {
    this.logger.warn({
      type: 'security',
      event,
      ...context,
    });
  }

  logPerformance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? 'warn' : 'info';
    this.logger[level]({
      type: 'performance',
      operation,
      duration,
      ...context,
    });
  }
}

// Factory function for creating child loggers
export function createLogger(context: string): PinoLoggerService {
  const logger = new PinoLoggerService();
  logger.setContext(context);
  return logger;
}
