// ============================================
// LIST REPORTS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { Report } from '../../../../domain/reports/entities/report.entity';
import {
    type IReportRepository,
    REPORT_REPOSITORY,
    ReportFilter,
    ReportPaginationOptions,
} from '../../ports/reports.repository';
import {
    ReportResponseDto,
    ReportListQueryDto,
    PaginatedReportsDto,
} from '../../dto/reports.dto';

@Injectable()
export class ListReportsUseCase {
    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepo: IReportRepository,
    ) {}

    async execute(query: ReportListQueryDto): Promise<PaginatedReportsDto> {
        const filter: ReportFilter = {};
        if (query.reportType) filter.reportType = query.reportType;
        if (query.status) filter.status = query.status;
        if (query.generatedBy) filter.generatedBy = query.generatedBy;
        if (query.generatedAfter) filter.generatedAfter = new Date(query.generatedAfter);
        if (query.generatedBefore) filter.generatedBefore = new Date(query.generatedBefore);

        const pagination: ReportPaginationOptions = {
            limit: query.limit || 20,
            offset: query.offset || 0,
            orderBy: query.orderBy || 'generatedAt',
            orderDirection: query.orderDirection || 'desc',
        };

        const result = await this.reportRepo.findAll(filter, pagination);

        return {
            data: result.data.map(r => this.toDto(r)),
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            hasMore: result.hasMore,
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
        };
    }
}
