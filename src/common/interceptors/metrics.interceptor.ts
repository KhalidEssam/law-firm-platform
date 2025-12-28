import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(request, response, startTime);
        },
        error: () => {
          this.recordMetrics(request, response, startTime);
        },
      }),
    );
  }

  private recordMetrics(request: any, response: any, startTime: number): void {
    const { method, route, url } = request;
    const statusCode = response.statusCode;
    const durationSeconds = (Date.now() - startTime) / 1000;

    // Use route path if available, otherwise use URL
    const routePath = route?.path || url?.split('?')[0] || '/';

    this.metricsService.recordHttpRequest(method, routePath, statusCode);
    this.metricsService.recordHttpDuration(
      method,
      routePath,
      statusCode,
      durationSeconds,
    );

    // Record errors
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      this.metricsService.recordError(errorType, statusCode.toString());
    }
  }
}
