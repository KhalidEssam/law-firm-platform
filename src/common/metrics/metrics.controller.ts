import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('metrics')
@SkipThrottle()
export class MetricsController {
  @Public()
  @Get('health')
  metricsHealth(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'Prometheus metrics available at /metrics',
    };
  }
}
