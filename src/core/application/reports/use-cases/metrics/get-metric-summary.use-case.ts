// ============================================
// GET METRIC SUMMARY USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
    type IAnalyticsMetricRepository,
    ANALYTICS_METRIC_REPOSITORY,
} from '../../ports/reports.repository';
import { MetricSummaryDto } from '../../dto/reports.dto';

@Injectable()
export class GetMetricSummaryUseCase {
    constructor(
        @Inject(ANALYTICS_METRIC_REPOSITORY)
        private readonly metricRepo: IAnalyticsMetricRepository,
    ) {}

    async execute(metricName: string): Promise<MetricSummaryDto> {
        const summary = await this.metricRepo.getSummary(metricName);

        if (!summary) {
            throw new NotFoundException(`Metric '${metricName}' not found`);
        }

        return {
            metricName: summary.metricName,
            metricType: summary.metricType,
            totalDataPoints: summary.totalDataPoints,
            latestValue: summary.latestValue,
            latestTimestamp: summary.latestTimestamp,
            aggregations: summary.aggregations,
        };
    }
}
