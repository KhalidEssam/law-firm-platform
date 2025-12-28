// ============================================
// RECORD METRIC BATCH USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { AnalyticsMetric } from '../../../../domain/reports/entities/analytics-metric.entity';
import {
  type IAnalyticsMetricRepository,
  ANALYTICS_METRIC_REPOSITORY,
} from '../../ports/reports.repository';
import { RecordMetricBatchDto } from '../../dto/reports.dto';

@Injectable()
export class RecordMetricBatchUseCase {
  constructor(
    @Inject(ANALYTICS_METRIC_REPOSITORY)
    private readonly metricRepo: IAnalyticsMetricRepository,
  ) {}

  async execute(dto: RecordMetricBatchDto): Promise<{ recordedCount: number }> {
    const metrics = dto.metrics.map((m) =>
      AnalyticsMetric.create({
        metricName: m.metricName,
        metricType: m.metricType,
        value: m.value,
        dimensions: m.dimensions,
      }),
    );

    const count = await this.metricRepo.createMany(metrics);
    return { recordedCount: count };
  }
}
