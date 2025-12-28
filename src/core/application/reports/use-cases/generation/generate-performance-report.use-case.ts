// ============================================
// GENERATE PERFORMANCE REPORT USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { Report } from '../../../../domain/reports/entities/report.entity';
import { ReportType } from '../../../../domain/reports/value-objects/report.vo';
import {
  type IReportRepository,
  REPORT_REPOSITORY,
} from '../../ports/reports.repository';
import {
  type IReportDataProvider,
  REPORT_DATA_PROVIDER,
} from '../../ports/report-data-provider';
import {
  GenerateReportDto,
  ReportResponseDto,
  PerformanceReportData,
} from '../../dto/reports.dto';

@Injectable()
export class GeneratePerformanceReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepo: IReportRepository,
    @Inject(REPORT_DATA_PROVIDER)
    private readonly dataProvider: IReportDataProvider,
  ) {}

  async execute(dto: GenerateReportDto): Promise<ReportResponseDto> {
    const report = Report.create({
      name:
        dto.name ||
        `Performance Report - ${new Date().toISOString().split('T')[0]}`,
      reportType: ReportType.PERFORMANCE,
      parameters: dto.parameters,
      generatedBy: dto.generatedBy,
    });

    let savedReport = await this.reportRepo.create(report);

    try {
      savedReport.startProcessing();
      savedReport = await this.reportRepo.update(savedReport);

      const startDate = dto.parameters?.startDate
        ? new Date(dto.parameters.startDate)
        : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const endDate = dto.parameters?.endDate
        ? new Date(dto.parameters.endDate)
        : new Date();

      const reportData = await this.generatePerformanceData(startDate, endDate);

      savedReport.complete(reportData as unknown as Record<string, unknown>);
      savedReport = await this.reportRepo.update(savedReport);
    } catch (error) {
      savedReport.fail(
        error instanceof Error ? error.message : 'Unknown error',
      );
      savedReport = await this.reportRepo.update(savedReport);
    }

    return this.toDto(savedReport);
  }

  private async generatePerformanceData(
    startDate: Date,
    endDate: Date,
  ): Promise<PerformanceReportData> {
    const dateRange = { startDate, endDate };
    const performanceStats =
      await this.dataProvider.getPerformanceStats(dateRange);

    const distribution: Record<string, number> = {};
    for (const [rating, count] of Object.entries(
      performanceStats.ratings.distribution,
    )) {
      distribution[String(rating)] = count;
    }

    const hoursDiff =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const requestsPerHour =
      hoursDiff > 0 ? performanceStats.totalRequests / hoursDiff : 0;

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      responseTime: {
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      },
      throughput: {
        requestsPerHour: Math.round(requestsPerHour * 100) / 100,
        peakHour: 'N/A',
        lowestHour: 'N/A',
      },
      providers: {
        averageRating: performanceStats.ratings.average,
        ratingDistribution: distribution,
        responseRate: 0,
        completionRate: performanceStats.completionRate,
      },
      routing: {
        autoAssignRate: 0,
        averageAssignmentTime: 0,
        reassignmentRate: 0,
      },
    };
  }

  private toDto(report: Report): ReportResponseDto {
    const obj = report.toObject();
    return {
      id: obj.id,
      name: obj.name,
      reportType: obj.reportType,
      parameters: obj.parameters,
      generatedBy: obj.generatedBy,
      generatedAt: obj.generatedAt,
      fileUrl: obj.fileUrl,
      status: obj.status,
      resultData: obj.resultData || undefined,
      errorMessage: obj.errorMessage,
    };
  }
}
