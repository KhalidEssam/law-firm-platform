// ============================================
// QUERY METRICS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { AnalyticsMetric } from '../../../../domain/reports/entities/analytics-metric.entity';
import {
    type IAnalyticsMetricRepository,
    ANALYTICS_METRIC_REPOSITORY,
    MetricFilter,
    MetricPaginationOptions,
} from '../../ports/reports.repository';
import {
    MetricResponseDto,
    MetricQueryDto,
} from '../../dto/reports.dto';

@Injectable()
export class QueryMetricsUseCase {
    constructor(
        @Inject(ANALYTICS_METRIC_REPOSITORY)
        private readonly metricRepo: IAnalyticsMetricRepository,
    ) {}

    async execute(query: MetricQueryDto): Promise<{
        data: MetricResponseDto[];
        total: number;
        hasMore: boolean;
    }> {
        const filter: MetricFilter = {};

        if (query.metricName) filter.metricName = query.metricName;
        if (query.metricType) filter.metricType = query.metricType;
        if (query.dimensions) filter.dimensions = query.dimensions;
        if (query.startDate) filter.timestampAfter = new Date(query.startDate);
        if (query.endDate) filter.timestampBefore = new Date(query.endDate);

        const pagination: MetricPaginationOptions = {
            limit: query.limit || 100,
            offset: query.offset || 0,
            orderBy: 'timestamp',
            orderDirection: 'desc',
        };

        const result = await this.metricRepo.findAll(filter, pagination);

        return {
            data: result.data.map(m => this.toDto(m)),
            total: result.total,
            hasMore: result.hasMore,
        };
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
