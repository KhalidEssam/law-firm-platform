// src/core/application/reports/use-cases/analytics-metrics.use-cases.ts

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AnalyticsMetric } from '../../../domain/reports/entities/analytics-metric.entity';
import {
    MetricType,
    TimeRange,
    MetricDimensionsData,
} from '../../../domain/reports/value-objects/report.vo';
import {
    type IAnalyticsMetricRepository,
    ANALYTICS_METRIC_REPOSITORY,
    MetricFilter,
    MetricPaginationOptions,
} from '../ports/reports.repository';
import {
    RecordMetricDto,
    RecordMetricBatchDto,
    MetricResponseDto,
    MetricQueryDto,
    AggregateMetricDto,
    TimeSeriesQueryDto,
    AggregatedMetricDto,
    MetricTimeSeriesDto,
    MetricSummaryDto,
} from '../dto/reports.dto';

// ============================================
// RECORD METRIC USE CASE
// ============================================

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

// ============================================
// RECORD METRIC BATCH USE CASE
// ============================================

@Injectable()
export class RecordMetricBatchUseCase {
    constructor(
        @Inject(ANALYTICS_METRIC_REPOSITORY)
        private readonly metricRepo: IAnalyticsMetricRepository,
    ) {}

    async execute(dto: RecordMetricBatchDto): Promise<{ recordedCount: number }> {
        const metrics = dto.metrics.map(m =>
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

// ============================================
// QUERY METRICS USE CASE
// ============================================

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

// ============================================
// AGGREGATE METRICS USE CASE
// ============================================

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

// ============================================
// GET TIME SERIES USE CASE
// ============================================

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

// ============================================
// GET METRIC SUMMARY USE CASE
// ============================================

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

// ============================================
// LIST METRIC NAMES USE CASE
// ============================================

@Injectable()
export class ListMetricNamesUseCase {
    constructor(
        @Inject(ANALYTICS_METRIC_REPOSITORY)
        private readonly metricRepo: IAnalyticsMetricRepository,
    ) {}

    async execute(): Promise<string[]> {
        return this.metricRepo.getDistinctMetricNames();
    }
}

// ============================================
// DELETE OLD METRICS USE CASE
// ============================================

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

// ============================================
// RECORD COMMON METRICS HELPERS
// ============================================

@Injectable()
export class RecordCommonMetricsService {
    constructor(
        @Inject(ANALYTICS_METRIC_REPOSITORY)
        private readonly metricRepo: IAnalyticsMetricRepository,
    ) {}

    /**
     * Record a request created metric
     */
    async recordRequestCreated(requestType: string, subscriberId?: string): Promise<void> {
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
    async recordSLABreach(requestType: string, requestId: string): Promise<void> {
        const metric = AnalyticsMetric.counter('sla.breaches', 1, {
            requestType,
        });
        await this.metricRepo.create(metric);
    }

    /**
     * Record active users gauge
     */
    async recordActiveUsers(count: number, userType: 'subscriber' | 'provider'): Promise<void> {
        const metric = AnalyticsMetric.gauge('users.active', count, {
            userType,
        });
        await this.metricRepo.create(metric);
    }

    /**
     * Record revenue metric
     */
    async recordRevenue(amount: number, currency: string, serviceType: string): Promise<void> {
        const metric = AnalyticsMetric.counter('revenue.total', amount, {
            currency,
            serviceType,
        });
        await this.metricRepo.create(metric);
    }

    /**
     * Record provider rating metric
     */
    async recordProviderRating(providerId: string, rating: number): Promise<void> {
        const metric = AnalyticsMetric.gauge('provider.rating', rating, {
            providerId,
        });
        await this.metricRepo.create(metric);
    }

    /**
     * Record API response time
     */
    async recordApiResponseTime(endpoint: string, method: string, durationMs: number): Promise<void> {
        const metric = AnalyticsMetric.histogram('api.response_time_ms', durationMs, {
            endpoint,
            method,
        });
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
