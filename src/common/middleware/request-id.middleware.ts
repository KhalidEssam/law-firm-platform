import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

// Extend Express Request to include custom properties
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      correlationId?: string;
      startTime?: number;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Generate or use existing request ID
    const requestId = (req.headers[REQUEST_ID_HEADER] as string) || uuidv4();

    // Correlation ID for tracing across services
    const correlationId =
      (req.headers[CORRELATION_ID_HEADER] as string) || requestId;

    // Attach to request object
    req.requestId = requestId;
    req.correlationId = correlationId;
    req.startTime = Date.now();

    // Add to response headers for tracing
    res.setHeader(REQUEST_ID_HEADER, requestId);
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    next();
  }
}
