// ============================================
// AGGREGATE METRICS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { TimeRange } from '../../../../domain/reports/value-objects/report.vo';
import {
    type IAnalyticsMetricRepository,
    ANALYTICS_METRIC_REPOSITORY,
} from '../../ports/reports.repository';
import {
    AggregateMetricDto,
    AggregatedMetricDto,
} from '../../dto/reports.dto';

@Injectable()
export class AggregateMetricsUseCase {
    constructor(
        @Inject(ANALYTICS_METRIC_REPOSITORY)
        private readonly metricRepo: IAnalyticsMetricRepository,
    ) {}

    async execute(dto: AggregateMetricDto): Promise<AggregatedMetricDto | AggregatedMetricDto[]> {
        const timeRange = TimeRange.create(
            new Date(dto.startDate),
            new Date(dto.endDate),
        );

        if (dto.dimensionKey) {
            // Aggregate by dimension
            const results = await this.metricRepo.aggregateByDimension(
                dto.metricName,
                dto.dimensionKey,
                timeRange,
            );
            return results.map(r => ({
                metricName: r.metricName,
                count: r.count,
                sum: r.sum,
                avg: r.avg,
                min: r.min,
                max: r.max,
                dimensions: r.dimensions,
            }));
        }

        // Simple aggregation
        const result = await this.metricRepo.aggregate(
            dto.metricName,
            timeRange,
            { groupBy: dto.groupBy },
        );

        return {
            metricName: result.metricName,
            count: result.count,
            sum: result.sum,
            avg: result.avg,
            min: result.min,
            max: result.max,
        };
    }
}
