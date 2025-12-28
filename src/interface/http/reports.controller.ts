// src/interface/http/reports.controller.ts

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';
import {
  ReportType,
  JobStatus,
  MetricType,
} from '../../core/domain/reports/value-objects/report.vo';

// Report Use Cases
import {
  CreateReportUseCase,
  GetReportByIdUseCase,
  ListReportsUseCase,
  DeleteReportUseCase,
  GenerateFinancialReportUseCase,
  GenerateOperationalReportUseCase,
  GeneratePerformanceReportUseCase,
  GenerateComplianceReportUseCase,
  GetReportStatisticsUseCase,
} from '../../core/application/reports/use-cases/report-generation.use-cases';

// Analytics Use Cases
import {
  RecordMetricUseCase,
  RecordMetricBatchUseCase,
  QueryMetricsUseCase,
  AggregateMetricsUseCase,
  GetTimeSeriesUseCase,
  GetMetricSummaryUseCase,
  ListMetricNamesUseCase,
  DeleteOldMetricsUseCase,
} from '../../core/application/reports/use-cases/analytics-metrics.use-cases';

// DTOs
import {
  ReportListQueryDto,
  type RecordMetricDto,
  type RecordMetricBatchDto,
  MetricQueryDto,
  type AggregateMetricDto,
  type TimeSeriesQueryDto,
} from '../../core/application/reports/dto/reports.dto';
import { ReportParametersData } from '../../core/domain/reports/value-objects/report.vo';
// ============================================
// REPORTS CONTROLLER
// ============================================

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly createReport: CreateReportUseCase,
    private readonly getReportById: GetReportByIdUseCase,
    private readonly listReports: ListReportsUseCase,
    private readonly deleteReport: DeleteReportUseCase,
    private readonly generateFinancialReport: GenerateFinancialReportUseCase,
    private readonly generateOperationalReport: GenerateOperationalReportUseCase,
    private readonly generatePerformanceReport: GeneratePerformanceReportUseCase,
    private readonly generateComplianceReport: GenerateComplianceReportUseCase,
    private readonly getReportStatistics: GetReportStatisticsUseCase,
  ) {}

  // ============================================
  // REPORT CRUD ENDPOINTS
  // ============================================

  /**
   * List all reports with filtering
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('read:reports')
  @Get()
  async list(
    @Query('reportType') reportType?: string,
    @Query('status') status?: string,
    @Query('generatedBy') generatedBy?: string,
    @Query('generatedAfter') generatedAfter?: string,
    @Query('generatedBefore') generatedBefore?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: string,
  ) {
    const query: ReportListQueryDto = {
      reportType: reportType as ReportType,
      status: status as JobStatus,
      generatedBy,
      generatedAfter,
      generatedBefore,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      orderBy: orderBy as 'generatedAt' | 'name' | 'reportType',
      orderDirection: orderDirection as 'asc' | 'desc',
    };

    return this.listReports.execute(query);
  }

  /**
   * Get report by ID
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('read:reports')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.getReportById.execute(id);
  }

  /**
   * Delete a report
   */
  @Roles('system_admin', 'platform_admin')
  @Permissions('delete:reports')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deleteReport.execute(id);
  }

  /**
   * Get report statistics
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('read:reports')
  @Get('statistics/summary')
  async getStatistics() {
    return this.getReportStatistics.execute();
  }

  // ============================================
  // REPORT GENERATION ENDPOINTS
  // ============================================

  /**
   * Generate Financial Report
   */
  @Roles('system_admin', 'platform_admin', 'finance_admin')
  @Permissions('create:reports')
  @Post('generate/financial')
  @HttpCode(HttpStatus.CREATED)
  async generateFinancial(
    @Body()
    body: {
      name?: string;
      startDate?: string;
      endDate?: string;
      providerId?: string;
      format?: 'json' | 'csv' | 'pdf' | 'excel';
    },
  ) {
    const parameters: ReportParametersData = {
      startDate: body.startDate,
      endDate: body.endDate,
      providerId: body.providerId,
      format: body.format,
    };

    return this.generateFinancialReport.execute({
      reportType: ReportType.FINANCIAL,
      name: body.name,
      parameters,
    });
  }

  /**
   * Generate Operational Report
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('create:reports')
  @Post('generate/operational')
  @HttpCode(HttpStatus.CREATED)
  async generateOperational(
    @Body()
    body: {
      name?: string;
      startDate?: string;
      endDate?: string;
      requestType?: string;
      format?: 'json' | 'csv' | 'pdf' | 'excel';
    },
  ) {
    const parameters: ReportParametersData = {
      startDate: body.startDate,
      endDate: body.endDate,
      requestType: body.requestType,
      format: body.format,
    };

    return this.generateOperationalReport.execute({
      reportType: ReportType.OPERATIONAL,
      name: body.name,
      parameters,
    });
  }

  /**
   * Generate Performance Report
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('create:reports')
  @Post('generate/performance')
  @HttpCode(HttpStatus.CREATED)
  async generatePerformance(
    @Body()
    body: {
      name?: string;
      startDate?: string;
      endDate?: string;
      providerId?: string;
      format?: 'json' | 'csv' | 'pdf' | 'excel';
    },
  ) {
    const parameters: ReportParametersData = {
      startDate: body.startDate,
      endDate: body.endDate,
      providerId: body.providerId,
      format: body.format,
    };

    return this.generatePerformanceReport.execute({
      reportType: ReportType.PERFORMANCE,
      name: body.name,
      parameters,
    });
  }

  /**
   * Generate Compliance Report
   */
  @Roles('system_admin', 'platform_admin', 'compliance_officer')
  @Permissions('create:reports')
  @Post('generate/compliance')
  @HttpCode(HttpStatus.CREATED)
  async generateCompliance(
    @Body()
    body: {
      name?: string;
      startDate?: string;
      endDate?: string;
      includeDetails?: boolean;
      format?: 'json' | 'csv' | 'pdf' | 'excel';
    },
  ) {
    const parameters: ReportParametersData = {
      startDate: body.startDate,
      endDate: body.endDate,
      includeDetails: body.includeDetails,
      format: body.format,
    };

    return this.generateComplianceReport.execute({
      reportType: ReportType.COMPLIANCE,
      name: body.name,
      parameters,
    });
  }
}

// ============================================
// ANALYTICS METRICS CONTROLLER
// ============================================

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly recordMetric: RecordMetricUseCase,
    private readonly recordMetricBatch: RecordMetricBatchUseCase,
    private readonly queryMetrics: QueryMetricsUseCase,
    private readonly aggregateMetrics: AggregateMetricsUseCase,
    private readonly getTimeSeries: GetTimeSeriesUseCase,
    private readonly getMetricSummary: GetMetricSummaryUseCase,
    private readonly listMetricNames: ListMetricNamesUseCase,
    private readonly deleteOldMetrics: DeleteOldMetricsUseCase,
  ) {}

  // ============================================
  // METRIC RECORDING ENDPOINTS
  // ============================================

  /**
   * Record a single metric
   */
  @Roles('system_admin', 'platform_admin', 'service')
  @Permissions('create:analytics')
  @Post('metrics')
  @HttpCode(HttpStatus.CREATED)
  async record(@Body() dto: RecordMetricDto) {
    return this.recordMetric.execute(dto);
  }

  /**
   * Record multiple metrics in batch
   */
  @Roles('system_admin', 'platform_admin', 'service')
  @Permissions('create:analytics')
  @Post('metrics/batch')
  @HttpCode(HttpStatus.CREATED)
  async recordBatch(@Body() dto: RecordMetricBatchDto) {
    return this.recordMetricBatch.execute(dto);
  }

  // ============================================
  // METRIC QUERY ENDPOINTS
  // ============================================

  /**
   * Query metrics with filters
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('read:analytics')
  @Get('metrics')
  async query(
    @Query('metricName') metricName?: string,
    @Query('metricType') metricType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const query: MetricQueryDto = {
      metricName,
      metricType: metricType as MetricType,
      startDate,
      endDate,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.queryMetrics.execute(query);
  }

  /**
   * List all available metric names
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('read:analytics')
  @Get('metrics/names')
  async getMetricNames() {
    const names = await this.listMetricNames.execute();
    return { metricNames: names };
  }

  /**
   * Get metric summary
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('read:analytics')
  @Get('metrics/:metricName/summary')
  async getSummary(@Param('metricName') metricName: string) {
    return this.getMetricSummary.execute(metricName);
  }

  // ============================================
  // AGGREGATION ENDPOINTS
  // ============================================

  /**
   * Aggregate metrics
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('read:analytics')
  @Post('metrics/aggregate')
  async aggregate(@Body() dto: AggregateMetricDto) {
    return this.aggregateMetrics.execute(dto);
  }

  /**
   * Get time series data
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('read:analytics')
  @Post('metrics/timeseries')
  async timeSeries(@Body() dto: TimeSeriesQueryDto) {
    return this.getTimeSeries.execute(dto);
  }

  // ============================================
  // MAINTENANCE ENDPOINTS
  // ============================================

  /**
   * Delete old metrics (data retention)
   */
  @Roles('system_admin')
  @Permissions('delete:analytics')
  @Delete('metrics/cleanup')
  async cleanup(@Query('olderThanDays') olderThanDays: string) {
    const days = parseInt(olderThanDays, 10) || 90;
    return this.deleteOldMetrics.execute(days);
  }
}

// ============================================
// DASHBOARD CONTROLLER
// ============================================

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getReportStatistics: GetReportStatisticsUseCase,
    private readonly queryMetrics: QueryMetricsUseCase,
    private readonly aggregateMetrics: AggregateMetricsUseCase,
  ) {}

  /**
   * Get admin dashboard summary
   */
  @Roles('system_admin', 'platform_admin', 'manager')
  @Permissions('read:dashboard')
  @Get('admin/summary')
  async getAdminSummary() {
    const reportStats = await this.getReportStatistics.execute();

    // Get key metrics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const requestsCreated = await this.aggregateMetrics.execute({
      metricName: 'requests.created',
      startDate: thirtyDaysAgo.toISOString(),
      endDate: new Date().toISOString(),
    });

    const requestsCompleted = await this.aggregateMetrics.execute({
      metricName: 'requests.completed',
      startDate: thirtyDaysAgo.toISOString(),
      endDate: new Date().toISOString(),
    });

    return {
      reports: reportStats,
      last30Days: {
        requestsCreated: Array.isArray(requestsCreated)
          ? requestsCreated
          : requestsCreated,
        requestsCompleted: Array.isArray(requestsCompleted)
          ? requestsCompleted
          : requestsCompleted,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get provider dashboard summary
   */
  @Roles('provider', 'provider_admin')
  @Permissions('read:dashboard')
  @Get('provider/summary')
  async getProviderSummary(@Query('providerId') providerId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get provider-specific metrics
    const assignments = await this.queryMetrics.execute({
      metricName: 'provider.assignments',
      dimensions: { providerId },
      startDate: sevenDaysAgo.toISOString(),
      endDate: new Date().toISOString(),
      limit: 100,
    });

    return {
      providerId,
      last7Days: {
        assignments: assignments.total,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
