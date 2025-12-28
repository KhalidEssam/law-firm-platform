import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../auth/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
  };
}

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(): Promise<HealthCheckResponse> {
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      // Use $queryRaw with template literal for safe query
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.0.1',
      services: {
        database: dbStatus,
      },
    };
  }

  @Public()
  @Get('live')
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async readiness(): Promise<{ status: 'ok' | 'error'; database: boolean }> {
    let databaseReady = false;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseReady = true;
    } catch {
      databaseReady = false;
    }

    return {
      status: databaseReady ? 'ok' : 'error',
      database: databaseReady,
    };
  }
}
