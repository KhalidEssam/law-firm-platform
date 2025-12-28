// src/infrastructure/persistence/reports/prisma-reports.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Report } from '../../../core/domain/reports/entities/report.entity';
import {
  AnalyticsMetric,
  AggregatedMetric,
  MetricTimeSeries,
  MetricSummary,
} from '../../../core/domain/reports/entities/analytics-metric.entity';
import {
  ReportType,
  JobStatus,
  MetricType,
  TimeRange,
  MetricDimensionsData,
  ReportParametersData,
} from '../../../core/domain/reports/value-objects/report.vo';
import {
  IReportRepository,
  IAnalyticsMetricRepository,
  ReportFilter,
  ReportPaginationOptions,
  PaginatedReports,
  MetricFilter,
  MetricPaginationOptions,
  PaginatedMetrics,
  AggregationOptions,
} from '../../../core/application/reports/ports/reports.repository';
import {
  ReportType as PrismaReportType,
  JobStatus as PrismaJobStatus,
} from '@prisma/client';

// ============================================
// MAPPERS
// ============================================

class ReportMapper {
  static toDomain(raw: any): Report {
    return Report.rehydrate({
      id: raw.id,
      name: raw.name,
      reportType: raw.reportType as ReportType,
      parameters: raw.parameters as ReportParametersData,
      generatedBy: raw.generatedBy,
      generatedAt: raw.generatedAt,
      fileUrl: raw.fileUrl,
      status: raw.status as JobStatus,
    });
  }

  static toPrisma(report: Report): any {
    const obj = report.toObject();
    return {
      id: obj.id,
      name: obj.name,
      reportType: obj.reportType as PrismaReportType,
      parameters: obj.parameters,
      generatedBy: obj.generatedBy,
      generatedAt: obj.generatedAt,
      fileUrl: obj.fileUrl,
      status: obj.status as PrismaJobStatus,
    };
  }
}

class AnalyticsMetricMapper {
  static toDomain(raw: any): AnalyticsMetric {
    return AnalyticsMetric.rehydrate({
      id: raw.id,
      metricName: raw.metricName,
      metricType: raw.metricType as MetricType,
      value: raw.value,
      dimensions: raw.dimensions as MetricDimensionsData,
      timestamp: raw.timestamp,
    });
  }

  static toPrisma(metric: AnalyticsMetric): any {
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
// REPORT REPOSITORY IMPLEMENTATION
// ============================================

@Injectable()
export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(report: Report): Promise<Report> {
    const data = ReportMapper.toPrisma(report);
    const created = await this.prisma.report.create({ data });
    return ReportMapper.toDomain(created);
  }

  async update(report: Report): Promise<Report> {
    const data = ReportMapper.toPrisma(report);
    const updated = await this.prisma.report.update({
      where: { id: report.id },
      data,
    });
    return ReportMapper.toDomain(updated);
  }

  async delete(_id: string): Promise<void> {
    await this.prisma.report.delete({ where: { id } });
  }

  async findById(_id: string): Promise<Report | null> {
    const report = await this.prisma.report.findUnique({ where: { id } });
    return report ? ReportMapper.toDomain(report) : null;
  }

  async findAll(
    filter?: ReportFilter,
    pagination?: ReportPaginationOptions,
  ): Promise<PaginatedReports> {
    const where = this.buildWhereClause(filter);
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          [pagination?.orderBy || 'generatedAt']:
            pagination?.orderDirection || 'desc',
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: data.map(ReportMapper.toDomain),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  async findByType(
    type: ReportType,
    pagination?: ReportPaginationOptions,
  ): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: { reportType: type as PrismaReportType },
      take: pagination?.limit || 20,
      skip: pagination?.offset || 0,
      orderBy: {
        [pagination?.orderBy || 'generatedAt']:
          pagination?.orderDirection || 'desc',
      },
    });
    return reports.map(ReportMapper.toDomain);
  }

  async findByStatus(
    status: JobStatus,
    pagination?: ReportPaginationOptions,
  ): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: { status: status as PrismaJobStatus },
      take: pagination?.limit || 20,
      skip: pagination?.offset || 0,
      orderBy: {
        [pagination?.orderBy || 'generatedAt']:
          pagination?.orderDirection || 'desc',
      },
    });
    return reports.map(ReportMapper.toDomain);
  }

  async findByGeneratedBy(
    userId: string,
    pagination?: ReportPaginationOptions,
  ): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: { generatedBy: userId },
      take: pagination?.limit || 20,
      skip: pagination?.offset || 0,
      orderBy: {
        [pagination?.orderBy || 'generatedAt']:
          pagination?.orderDirection || 'desc',
      },
    });
    return reports.map(ReportMapper.toDomain);
  }

  async findPendingReports(): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: { status: 'pending' },
      orderBy: { generatedAt: 'asc' },
    });
    return reports.map(ReportMapper.toDomain);
  }

  async findFailedReports(): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: { status: 'failed' },
      orderBy: { generatedAt: 'desc' },
    });
    return reports.map(ReportMapper.toDomain);
  }

  async findRecentReports(limit: number = 10): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });
    return reports.map(ReportMapper.toDomain);
  }

  async countByType(): Promise<Record<ReportType, number>> {
    const result = await this.prisma.report.groupBy({
      by: ['reportType'],
      _count: { id: true },
    });

    const counts: Record<string, number> = {};
    for (const item of result) {
      counts[item.reportType] = item._count.id;
    }

    return counts as Record<ReportType, number>;
  }

  async countByStatus(): Promise<Record<JobStatus, number>> {
    const result = await this.prisma.report.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const counts: Record<string, number> = {};
    for (const item of result) {
      counts[item.status] = item._count.id;
    }

    return counts as Record<JobStatus, number>;
  }

  private buildWhereClause(filter?: ReportFilter): any {
    if (!filter) return {};

    const where: any = {};

    if (filter.reportType) {
      where.reportType = filter.reportType as PrismaReportType;
    }

    if (filter.status) {
      if (Array.isArray(filter.status)) {
        where.status = { in: filter.status as PrismaJobStatus[] };
      } else {
        where.status = filter.status as PrismaJobStatus;
      }
    }

    if (filter.generatedBy) {
      where.generatedBy = filter.generatedBy;
    }

    if (filter.generatedAfter || filter.generatedBefore) {
      where.generatedAt = {};
      if (filter.generatedAfter) {
        where.generatedAt.gte = filter.generatedAfter;
      }
      if (filter.generatedBefore) {
        where.generatedAt.lte = filter.generatedBefore;
      }
    }

    return where;
  }
}

// ============================================
// ANALYTICS METRIC REPOSITORY IMPLEMENTATION
// ============================================

@Injectable()
export class PrismaAnalyticsMetricRepository
  implements IAnalyticsMetricRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(metric: AnalyticsMetric): Promise<AnalyticsMetric> {
    const data = AnalyticsMetricMapper.toPrisma(metric);
    const created = await this.prisma.analyticsMetric.create({ data });
    return AnalyticsMetricMapper.toDomain(created);
  }

  async createMany(metrics: AnalyticsMetric[]): Promise<number> {
    const data = metrics.map(AnalyticsMetricMapper.toPrisma);
    const result = await this.prisma.analyticsMetric.createMany({ data });
    return result.count;
  }

  async delete(_id: string): Promise<void> {
    await this.prisma.analyticsMetric.delete({ where: { id } });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prisma.analyticsMetric.deleteMany({
      where: { timestamp: { lt: date } },
    });
    return result.count;
  }

  async findById(_id: string): Promise<AnalyticsMetric | null> {
    const metric = await this.prisma.analyticsMetric.findUnique({
      where: { id },
    });
    return metric ? AnalyticsMetricMapper.toDomain(metric) : null;
  }

  async findAll(
    filter?: MetricFilter,
    pagination?: MetricPaginationOptions,
  ): Promise<PaginatedMetrics> {
    const where = this.buildWhereClause(filter);
    const limit = pagination?.limit || 100;
    const offset = pagination?.offset || 0;

    const [data, total] = await Promise.all([
      this.prisma.analyticsMetric.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          [pagination?.orderBy || 'timestamp']:
            pagination?.orderDirection || 'desc',
        },
      }),
      this.prisma.analyticsMetric.count({ where }),
    ]);

    return {
      data: data.map(AnalyticsMetricMapper.toDomain),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  async findByName(
    metricName: string,
    timeRange?: TimeRange,
  ): Promise<AnalyticsMetric[]> {
    const where: any = { metricName };

    if (timeRange) {
      where.timestamp = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const metrics = await this.prisma.analyticsMetric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    return metrics.map(AnalyticsMetricMapper.toDomain);
  }

  async findByDimensions(
    dimensions: Partial<MetricDimensionsData>,
    timeRange?: TimeRange,
  ): Promise<AnalyticsMetric[]> {
    const where: any = {};

    // Use JSON path for dimension filtering
    for (const [key, value] of Object.entries(dimensions)) {
      if (value !== undefined) {
        where.dimensions = {
          path: [key],
          equals: value,
        };
      }
    }

    if (timeRange) {
      where.timestamp = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const metrics = await this.prisma.analyticsMetric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    return metrics.map(AnalyticsMetricMapper.toDomain);
  }

  async aggregate(
    metricName: string,
    timeRange: TimeRange,
    options?: AggregationOptions,
  ): Promise<AggregatedMetric> {
    const result = await this.prisma.analyticsMetric.aggregate({
      where: {
        metricName,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
      _count: { id: true },
      _sum: { value: true },
      _avg: { value: true },
      _min: { value: true },
      _max: { value: true },
    });

    return {
      metricName,
      count: result._count.id,
      sum: result._sum.value || 0,
      avg: result._avg.value || 0,
      min: result._min.value || 0,
      max: result._max.value || 0,
    };
  }

  async aggregateByDimension(
    metricName: string,
    dimensionKey: string,
    timeRange: TimeRange,
  ): Promise<AggregatedMetric[]> {
    // For complex dimension-based aggregation, we need raw query
    // This is a simplified version that filters and groups in memory
    const metrics = await this.findByName(metricName, timeRange);

    const groups = new Map<string, AnalyticsMetric[]>();
    for (const metric of metrics) {
      const dimValue = metric.dimensions.get(dimensionKey) || 'unknown';
      if (!groups.has(dimValue)) {
        groups.set(dimValue, []);
      }
      groups.get(dimValue)!.push(metric);
    }

    const aggregations: AggregatedMetric[] = [];
    for (const [dimValue, metricsInGroup] of groups) {
      const values = metricsInGroup.map((m) => m.value);
      aggregations.push({
        metricName,
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        dimensions: { [dimensionKey]: dimValue },
      });
    }

    return aggregations;
  }

  async getTimeSeries(
    metricName: string,
    timeRange: TimeRange,
    interval: 'hour' | 'day' | 'week' | 'month',
  ): Promise<MetricTimeSeries> {
    const metrics = await this.findByName(metricName, timeRange);

    // Group by interval
    const buckets = new Map<string, number[]>();
    for (const metric of metrics) {
      const bucketKey = this.getBucketKey(metric.timestamp, interval);
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(metric.value);
    }

    // Calculate average for each bucket
    const dataPoints: Array<{ timestamp: Date; value: number }> = [];
    for (const [bucketKey, values] of buckets) {
      dataPoints.push({
        timestamp: new Date(bucketKey),
        value: values.reduce((a, b) => a + b, 0) / values.length,
      });
    }

    // Sort by timestamp
    dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      metricName,
      dataPoints,
    };
  }

  async getSummary(metricName: string): Promise<MetricSummary | null> {
    const [aggregation, latest] = await Promise.all([
      this.prisma.analyticsMetric.aggregate({
        where: { metricName },
        _count: { id: true },
        _sum: { value: true },
        _avg: { value: true },
        _min: { value: true },
        _max: { value: true },
      }),
      this.prisma.analyticsMetric.findFirst({
        where: { metricName },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    if (!latest) return null;

    return {
      metricName,
      metricType: latest.metricType as MetricType,
      totalDataPoints: aggregation._count.id,
      latestValue: latest.value,
      latestTimestamp: latest.timestamp,
      aggregations: {
        sum: aggregation._sum.value || 0,
        avg: aggregation._avg.value || 0,
        min: aggregation._min.value || 0,
        max: aggregation._max.value || 0,
      },
    };
  }

  async getDistinctMetricNames(): Promise<string[]> {
    const result = await this.prisma.analyticsMetric.findMany({
      select: { metricName: true },
      distinct: ['metricName'],
    });
    return result.map((r) => r.metricName);
  }

  async getDistinctDimensionValues(dimensionKey: string): Promise<string[]> {
    // This requires raw query or fetching all and extracting unique values
    const metrics = await this.prisma.analyticsMetric.findMany({
      select: { dimensions: true },
    });

    const values = new Set<string>();
    for (const metric of metrics) {
      const dims = metric.dimensions as Record<string, unknown>;
      if (dims && dims[dimensionKey]) {
        values.add(String(dims[dimensionKey]));
      }
    }

    return Array.from(values);
  }

  async count(filter?: MetricFilter): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.analyticsMetric.count({ where });
  }

  private buildWhereClause(filter?: MetricFilter): any {
    if (!filter) return {};

    const where: any = {};

    if (filter.metricName) {
      where.metricName = filter.metricName;
    }

    if (filter.metricType) {
      where.metricType = filter.metricType;
    }

    if (filter.timestampAfter || filter.timestampBefore) {
      where.timestamp = {};
      if (filter.timestampAfter) {
        where.timestamp.gte = filter.timestampAfter;
      }
      if (filter.timestampBefore) {
        where.timestamp.lte = filter.timestampBefore;
      }
    }

    return where;
  }

  private getBucketKey(
    date: Date,
    interval: 'hour' | 'day' | 'week' | 'month',
  ): string {
    const d = new Date(date);

    switch (interval) {
      case 'hour':
        d.setMinutes(0, 0, 0);
        break;
      case 'day':
        d.setHours(0, 0, 0, 0);
        break;
      case 'week':
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay());
        break;
      case 'month':
        d.setHours(0, 0, 0, 0);
        d.setDate(1);
        break;
    }

    return d.toISOString();
  }
}
