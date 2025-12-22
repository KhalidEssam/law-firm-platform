// ============================================
// GET REPORT BY ID USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Report } from '../../../../domain/reports/entities/report.entity';
import {
    type IReportRepository,
    REPORT_REPOSITORY,
} from '../../ports/reports.repository';
import { ReportResponseDto } from '../../dto/reports.dto';

@Injectable()
export class GetReportByIdUseCase {
    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepo: IReportRepository,
    ) {}

    async execute(id: string): Promise<ReportResponseDto> {
        const report = await this.reportRepo.findById(id);
        if (!report) {
            throw new NotFoundException(`Report with ID ${id} not found`);
        }
        return this.toDto(report);
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
