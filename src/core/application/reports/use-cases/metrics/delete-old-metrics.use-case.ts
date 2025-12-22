// ============================================
// DELETE OLD METRICS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import {
    type IAnalyticsMetricRepository,
    ANALYTICS_METRIC_REPOSITORY,
} from '../../ports/reports.repository';

@Injectable()
export class DeleteOldMetricsUseCase {
    constructor(
        @Inject(ANALYTICS_METRIC_REPOSITORY)
        private readonly metricRepo: IAnalyticsMetricRepository,
    ) {}

    async execute(olderThanDays: number): Promise<{ deletedCount: number }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const deletedCount = await this.metricRepo.deleteOlderThan(cutoffDate);
        return { deletedCount };
    }
}
