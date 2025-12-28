// ============================================
// GENERATE OPERATIONAL REPORT USE CASE
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
  OperationalReportData,
} from '../../dto/reports.dto';

@Injectable()
export class GenerateOperationalReportUseCase {
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
        `Operational Report - ${new Date().toISOString().split('T')[0]}`,
      reportType: ReportType.OPERATIONAL,
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

      const reportData = await this.generateOperationalData(startDate, endDate);

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

  private async generateOperationalData(
    startDate: Date,
    endDate: Date,
  ): Promise<OperationalReportData> {
    const dateRange = { startDate, endDate };

    const [operationalStats, providerStats, subscriberStats] =
      await Promise.all([
        this.dataProvider.getOperationalStats(dateRange),
        this.dataProvider.getProviderWorkloadStats(),
        this.dataProvider.getSubscriberStats(dateRange),
      ]);

    const { requestCounts, slaStats } = operationalStats;
    const totalRequests =
      requestCounts.consultations +
      requestCounts.legalOpinions +
      requestCounts.litigations +
      requestCounts.calls +
      requestCounts.services;

    const complianceRate =
      slaStats.total > 0 ? (slaStats.onTrack / slaStats.total) * 100 : 100;

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      requests: {
        total: totalRequests,
        byType: {
          consultation: requestCounts.consultations,
          legal_opinion: requestCounts.legalOpinions,
          litigation: requestCounts.litigations,
          call: requestCounts.calls,
        },
        byStatus: {},
        averageCompletionTime: 0,
      },
      providers: {
        totalActive: providerStats.totalActive,
        averageWorkload: providerStats.averageWorkload,
        topPerformers: providerStats.topPerformers,
      },
      subscribers: {
        totalActive: subscriberStats.totalActive,
        newThisPeriod: subscriberStats.newThisPeriod,
        retention: subscriberStats.retention,
      },
      sla: {
        onTrack: slaStats.onTrack,
        atRisk: slaStats.atRisk,
        breached: slaStats.breached,
        complianceRate,
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
