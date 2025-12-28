import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PinoLoggerService } from '../logging/pino-logger.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger: PinoLoggerService;

  constructor() {
    this.logger = new PinoLoggerService();
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'unknown';
    const startTime = req.startTime || Date.now();

    // Log incoming request
    this.logger.logRequest({
      requestId: req.requestId,
      correlationId: req.correlationId,
      method,
      url: originalUrl,
      ip,
      userAgent,
    });

    // Capture response
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const contentLength = res.get('content-length');

      this.logger.logResponse({
        requestId: req.requestId,
        correlationId: req.correlationId,
        method,
        url: originalUrl,
        statusCode,
        duration,
        contentLength: contentLength ? parseInt(contentLength, 10) : 0,
      });

      // Log slow requests as warnings
      if (duration > 3000) {
        this.logger.logPerformance('slow_request', duration, {
          requestId: req.requestId,
          method,
          url: originalUrl,
        });
      }
    });

    next();
  }
}
