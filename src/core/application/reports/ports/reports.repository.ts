// src/core/application/reports/ports/reports.repository.ts

import { Report } from '../../../domain/reports/entities/report.entity';
import {
  AnalyticsMetric,
  AggregatedMetric,
  MetricTimeSeries,
  MetricSummary,
} from '../../../domain/reports/entities/analytics-metric.entity';
import {
  ReportType,
  JobStatus,
  MetricType,
  TimeRange,
  MetricDimensionsData,
} from '../../../domain/reports/value-objects/report.vo';

// ============================================
// REPORT REPOSITORY
// ============================================

export interface ReportFilter {
  reportType?: ReportType;
  status?: JobStatus | JobStatus[];
  generatedBy?: string;
  generatedAfter?: Date;
  generatedBefore?: Date;
}

export interface ReportPaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'generatedAt' | 'name' | 'reportType';
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedReports {
  data: Report[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface IReportRepository {
  // CRUD Operations
  create(report: Report): Promise<Report>;
  update(report: Report): Promise<Report>;
  delete(id: string): Promise<void>;

  // Query Operations
  findById(id: string): Promise<Report | null>;
  findAll(
    filter?: ReportFilter,
    pagination?: ReportPaginationOptions,
  ): Promise<PaginatedReports>;
  findByType(
    type: ReportType,
    pagination?: ReportPaginationOptions,
  ): Promise<Report[]>;
  findByStatus(
    status: JobStatus,
    pagination?: ReportPaginationOptions,
  ): Promise<Report[]>;
  findByGeneratedBy(
    userId: string,
    pagination?: ReportPaginationOptions,
  ): Promise<Report[]>;

  // Business Operations
  findPendingReports(): Promise<Report[]>;
  findFailedReports(): Promise<Report[]>;
  findRecentReports(limit?: number): Promise<Report[]>;

  // Aggregations
  countByType(): Promise<Record<ReportType, number>>;
  countByStatus(): Promise<Record<JobStatus, number>>;
}

// ============================================
// ANALYTICS METRIC REPOSITORY
// ============================================

export interface MetricFilter {
  metricName?: string;
  metricType?: MetricType;
  dimensions?: Partial<MetricDimensionsData>;
  timestampAfter?: Date;
  timestampBefore?: Date;
}

export interface MetricPaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'timestamp' | 'value' | 'metricName';
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedMetrics {
  data: AnalyticsMetric[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AggregationOptions {
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  dimensions?: string[];
}

export interface IAnalyticsMetricRepository {
  // CRUD Operations
  create(metric: AnalyticsMetric): Promise<AnalyticsMetric>;
  createMany(metrics: AnalyticsMetric[]): Promise<number>;
  delete(id: string): Promise<void>;
  deleteOlderThan(date: Date): Promise<number>;

  // Query Operations
  findById(id: string): Promise<AnalyticsMetric | null>;
  findAll(
    filter?: MetricFilter,
    pagination?: MetricPaginationOptions,
  ): Promise<PaginatedMetrics>;
  findByName(
    metricName: string,
    timeRange?: TimeRange,
  ): Promise<AnalyticsMetric[]>;
  findByDimensions(
    dimensions: Partial<MetricDimensionsData>,
    timeRange?: TimeRange,
  ): Promise<AnalyticsMetric[]>;

  // Aggregation Operations
  aggregate(
    metricName: string,
    timeRange: TimeRange,
    options?: AggregationOptions,
  ): Promise<AggregatedMetric>;

  aggregateByDimension(
    metricName: string,
    dimensionKey: string,
    timeRange: TimeRange,
  ): Promise<AggregatedMetric[]>;

  getTimeSeries(
    metricName: string,
    timeRange: TimeRange,
    interval: 'hour' | 'day' | 'week' | 'month',
  ): Promise<MetricTimeSeries>;

  getSummary(metricName: string): Promise<MetricSummary | null>;

  // Distinct Operations
  getDistinctMetricNames(): Promise<string[]>;
  getDistinctDimensionValues(dimensionKey: string): Promise<string[]>;

  // Count Operations
  count(filter?: MetricFilter): Promise<number>;
}

// ============================================
// REPOSITORY TOKENS
// ============================================

export const REPORT_REPOSITORY = 'IReportRepository';
export const ANALYTICS_METRIC_REPOSITORY = 'IAnalyticsMetricRepository';
