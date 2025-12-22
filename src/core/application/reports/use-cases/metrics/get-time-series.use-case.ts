// ============================================
// GET TIME SERIES USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { TimeRange } from '../../../../domain/reports/value-objects/report.vo';
import {
    type IAnalyticsMetricRepository,
    ANALYTICS_METRIC_REPOSITORY,
} from '../../ports/reports.repository';
import {
    TimeSeriesQueryDto,
    MetricTimeSeriesDto,
} from '../../dto/reports.dto';

@Injectable()
export class GetTimeSeriesUseCase {
    constructor(
        @Inject(ANALYTICS_METRIC_REPOSITORY)
        private readonly metricRepo: IAnalyticsMetricRepository,
    ) {}

    async execute(dto: TimeSeriesQueryDto): Promise<MetricTimeSeriesDto> {
        const timeRange = TimeRange.create(
            new Date(dto.startDate),
            new Date(dto.endDate),
        );

        const result = await this.metricRepo.getTimeSeries(
            dto.metricName,
            timeRange,
            dto.interval,
        );

        return {
            metricName: result.metricName,
            dataPoints: result.dataPoints.map(dp => ({
                timestamp: dp.timestamp.toISOString(),
                value: dp.value,
            })),
            dimensions: result.dimensions,
        };
    }
}
