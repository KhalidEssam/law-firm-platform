// ============================================
// RECORD METRIC USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { AnalyticsMetric } from '../../../../domain/reports/entities/analytics-metric.entity';
import {
  type IAnalyticsMetricRepository,
  ANALYTICS_METRIC_REPOSITORY,
} from '../../ports/reports.repository';
import { RecordMetricDto, MetricResponseDto } from '../../dto/reports.dto';

@Injectable()
export class RecordMetricUseCase {
  constructor(
    @Inject(ANALYTICS_METRIC_REPOSITORY)
    private readonly metricRepo: IAnalyticsMetricRepository,
  ) {}

  async execute(dto: RecordMetricDto): Promise<MetricResponseDto> {
    const metric = AnalyticsMetric.create({
      metricName: dto.metricName,
      metricType: dto.metricType,
      value: dto.value,
      dimensions: dto.dimensions,
    });

    const saved = await this.metricRepo.create(metric);
    return this.toDto(saved);
  }

  private toDto(metric: AnalyticsMetric): MetricResponseDto {
    const obj = metric.toObject();
    return {
      id: obj.id,
      metricName: obj.metricName,
      metricType: obj.metricType,
      value: obj.value,
      dimensions: obj.dimensions,
      timestamp: obj.timestamp,
    };
  }
}
