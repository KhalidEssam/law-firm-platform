import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

// ✅ ES-module-safe augmentation (NO namespace)
declare module 'express' {
  interface Request {
    requestId?: string;
    correlationId?: string;
    startTime?: number;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId =
      (req.headers[REQUEST_ID_HEADER] as string | undefined) ?? uuidv4();

    const correlationId =
      (req.headers[CORRELATION_ID_HEADER] as string | undefined) ?? requestId;

    req.requestId = requestId;
    req.correlationId = correlationId;
    req.startTime = Date.now();

    res.setHeader(REQUEST_ID_HEADER, requestId);
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    next();
  }
}
