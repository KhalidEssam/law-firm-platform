// ============================================
// RECORD COMMON METRICS SERVICE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { AnalyticsMetric } from '../../../../domain/reports/entities/analytics-metric.entity';
import {
  type IAnalyticsMetricRepository,
  ANALYTICS_METRIC_REPOSITORY,
} from '../../ports/reports.repository';

@Injectable()
export class RecordCommonMetricsService {
  constructor(
    @Inject(ANALYTICS_METRIC_REPOSITORY)
    private readonly metricRepo: IAnalyticsMetricRepository,
  ) {}

  /**
   * Record a request created metric
   */
  async recordRequestCreated(
    requestType: string,
    subscriberId?: string,
  ): Promise<void> {
    const metric = AnalyticsMetric.counter('requests.created', 1, {
      requestType,
      subscriberId,
    });
    await this.metricRepo.create(metric);
  }

  /**
   * Record a request completed metric
   */
  async recordRequestCompleted(
    requestType: string,
    durationMs: number,
    providerId?: string,
  ): Promise<void> {
    const metrics = [
      AnalyticsMetric.counter('requests.completed', 1, {
        requestType,
        providerId,
      }),
      AnalyticsMetric.histogram('requests.duration_ms', durationMs, {
        requestType,
        providerId,
      }),
    ];
    await this.metricRepo.createMany(metrics);
  }

  /**
   * Record provider assignment metric
   */
  async recordProviderAssignment(
    requestType: string,
    providerId: string,
    autoAssigned: boolean,
  ): Promise<void> {
    const metric = AnalyticsMetric.counter('provider.assignments', 1, {
      requestType,
      providerId,
      autoAssigned: autoAssigned ? 'true' : 'false',
    });
    await this.metricRepo.create(metric);
  }

  /**
   * Record SLA breach metric
   */
  async recordSLABreach(requestType: string, _requestId: string): Promise<void> {
    const metric = AnalyticsMetric.counter('sla.breaches', 1, {
      requestType,
    });
    await this.metricRepo.create(metric);
  }

  /**
   * Record active users gauge
   */
  async recordActiveUsers(
    count: number,
    userType: 'subscriber' | 'provider',
  ): Promise<void> {
    const metric = AnalyticsMetric.gauge('users.active', count, {
      userType,
    });
    await this.metricRepo.create(metric);
  }

  /**
   * Record revenue metric
   */
  async recordRevenue(
    amount: number,
    currency: string,
    serviceType: string,
  ): Promise<void> {
    const metric = AnalyticsMetric.counter('revenue.total', amount, {
      currency,
      serviceType,
    });
    await this.metricRepo.create(metric);
  }

  /**
   * Record provider rating metric
   */
  async recordProviderRating(
    providerId: string,
    rating: number,
  ): Promise<void> {
    const metric = AnalyticsMetric.gauge('provider.rating', rating, {
      providerId,
    });
    await this.metricRepo.create(metric);
  }

  /**
   * Record API response time
   */
  async recordApiResponseTime(
    endpoint: string,
    method: string,
    durationMs: number,
  ): Promise<void> {
    const metric = AnalyticsMetric.histogram(
      'api.response_time_ms',
      durationMs,
      {
        endpoint,
        method,
      },
    );
    await this.metricRepo.create(metric);
  }

  /**
   * Record error count
   */
  async recordError(errorType: string, service: string): Promise<void> {
    const metric = AnalyticsMetric.counter('errors.total', 1, {
      errorType,
      service,
    });
    await this.metricRepo.create(metric);
  }
}
