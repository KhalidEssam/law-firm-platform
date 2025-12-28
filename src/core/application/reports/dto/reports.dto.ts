// src/core/application/reports/dto/reports.dto.ts

import {
  ReportType,
  JobStatus,
  MetricType,
  ReportParametersData,
  MetricDimensionsData,
} from '../../../domain/reports/value-objects/report.vo';

// ============================================
// REPORT DTOs
// ============================================

export interface GenerateReportDto {
  reportType: ReportType;
  name?: string;
  parameters?: ReportParametersData;
  generatedBy?: string;
}

export interface ReportResponseDto {
  id: string;
  name: string;
  reportType: ReportType;
  parameters: ReportParametersData;
  generatedBy: string | null;
  generatedAt: Date;
  fileUrl: string | null;
  status: JobStatus;
  resultData?: Record<string, unknown>;
  errorMessage?: string | null;
}

export interface ReportListQueryDto {
  reportType?: ReportType;
  status?: JobStatus;
  generatedBy?: string;
  generatedAfter?: string;
  generatedBefore?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'generatedAt' | 'name' | 'reportType';
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedReportsDto {
  data: ReportResponseDto[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================
// ANALYTICS METRIC DTOs
// ============================================

export interface RecordMetricDto {
  metricName: string;
  metricType: MetricType;
  value: number;
  dimensions?: MetricDimensionsData;
}

export interface RecordMetricBatchDto {
  metrics: RecordMetricDto[];
}

export interface MetricResponseDto {
  id: string;
  metricName: string;
  metricType: MetricType;
  value: number;
  dimensions: MetricDimensionsData;
  timestamp: Date;
}

export interface MetricQueryDto {
  metricName?: string;
  metricType?: MetricType;
  dimensions?: Partial<MetricDimensionsData>;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AggregateMetricDto {
  metricName: string;
  startDate: string;
  endDate: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  dimensionKey?: string;
}

export interface TimeSeriesQueryDto {
  metricName: string;
  startDate: string;
  endDate: string;
  interval: 'hour' | 'day' | 'week' | 'month';
}

export interface AggregatedMetricDto {
  metricName: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  dimensions?: MetricDimensionsData;
}

export interface MetricTimeSeriesDto {
  metricName: string;
  dataPoints: Array<{
    timestamp: string;
    value: number;
  }>;
  dimensions?: MetricDimensionsData;
}

export interface MetricSummaryDto {
  metricName: string;
  metricType: MetricType;
  totalDataPoints: number;
  latestValue: number;
  latestTimestamp: Date;
  aggregations: {
    sum: number;
    avg: number;
    min: number;
    max: number;
  };
}

// ============================================
// REPORT DATA TYPES
// ============================================

export interface FinancialReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    total: number;
    byService: Record<string, number>;
    byProvider: Record<string, number>;
  };
  subscriptions: {
    activeCount: number;
    newCount: number;
    churnedCount: number;
    revenue: number;
  };
  transactions: {
    count: number;
    totalAmount: number;
    averageAmount: number;
  };
  payouts: {
    count: number;
    totalAmount: number;
    pendingAmount: number;
  };
}

export interface OperationalReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  requests: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    averageCompletionTime: number;
  };
  providers: {
    totalActive: number;
    averageWorkload: number;
    topPerformers: Array<{
      providerId: string;
      name: string;
      completedRequests: number;
    }>;
  };
  subscribers: {
    totalActive: number;
    newThisPeriod: number;
    retention: number;
  };
  sla: {
    onTrack: number;
    atRisk: number;
    breached: number;
    complianceRate: number;
  };
}

export interface PerformanceReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerHour: number;
    peakHour: string;
    lowestHour: string;
  };
  providers: {
    averageRating: number;
    ratingDistribution: Record<string, number>;
    responseRate: number;
    completionRate: number;
  };
  routing: {
    autoAssignRate: number;
    averageAssignmentTime: number;
    reassignmentRate: number;
  };
}

export interface ComplianceReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  dataAccess: {
    totalAccessEvents: number;
    byUser: Record<string, number>;
    byEntityType: Record<string, number>;
  };
  securityEvents: {
    loginAttempts: number;
    failedLogins: number;
    passwordResets: number;
    suspiciousActivities: number;
  };
  auditTrail: {
    totalEvents: number;
    byAction: Record<string, number>;
    criticalEvents: number;
  };
  dataRetention: {
    recordsProcessed: number;
    recordsDeleted: number;
    storageUsed: number;
  };
}
