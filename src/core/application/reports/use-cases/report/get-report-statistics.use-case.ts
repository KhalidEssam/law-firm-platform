// ============================================
// GET REPORT STATISTICS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { Report } from '../../../../domain/reports/entities/report.entity';
import {
  ReportType,
  JobStatus,
} from '../../../../domain/reports/value-objects/report.vo';
import {
  type IReportRepository,
  REPORT_REPOSITORY,
} from '../../ports/reports.repository';
import { ReportResponseDto } from '../../dto/reports.dto';

@Injectable()
export class GetReportStatisticsUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepo: IReportRepository,
  ) {}

  async execute(): Promise<{
    byType: Record<ReportType, number>;
    byStatus: Record<JobStatus, number>;
    recentReports: ReportResponseDto[];
  }> {
    const [byType, byStatus, recentReports] = await Promise.all([
      this.reportRepo.countByType(),
      this.reportRepo.countByStatus(),
      this.reportRepo.findRecentReports(5),
    ]);

    return {
      byType,
      byStatus,
      recentReports: recentReports.map((r) => {
        const obj = r.toObject();
        return {
          id: obj.id,
          name: obj.name,
          reportType: obj.reportType,
          parameters: obj.parameters,
          generatedBy: obj.generatedBy,
          generatedAt: obj.generatedAt,
          fileUrl: obj.fileUrl,
          status: obj.status,
        };
      }),
    };
  }
}
