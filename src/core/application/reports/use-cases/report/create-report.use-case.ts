// ============================================
// CREATE REPORT USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { Report } from '../../../../domain/reports/entities/report.entity';
import {
  type IReportRepository,
  REPORT_REPOSITORY,
} from '../../ports/reports.repository';
import { GenerateReportDto, ReportResponseDto } from '../../dto/reports.dto';

@Injectable()
export class CreateReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepo: IReportRepository,
  ) {}

  async execute(dto: GenerateReportDto): Promise<ReportResponseDto> {
    const report = Report.create({
      name:
        dto.name ||
        `${dto.reportType} Report - ${new Date().toISOString().split('T')[0]}`,
      reportType: dto.reportType,
      parameters: dto.parameters,
      generatedBy: dto.generatedBy,
    });

    const saved = await this.reportRepo.create(report);
    return this.toDto(saved);
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
