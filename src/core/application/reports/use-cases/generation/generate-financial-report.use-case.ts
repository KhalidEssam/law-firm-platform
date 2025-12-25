// ============================================
// GENERATE FINANCIAL REPORT USE CASE
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
    FinancialReportData,
} from '../../dto/reports.dto';

@Injectable()
export class GenerateFinancialReportUseCase {
    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepo: IReportRepository,
        @Inject(REPORT_DATA_PROVIDER)
        private readonly dataProvider: IReportDataProvider,
    ) {}

    async execute(dto: GenerateReportDto): Promise<ReportResponseDto> {
        // Create the report record
        const report = Report.create({
            name: dto.name || `Financial Report - ${new Date().toISOString().split('T')[0]}`,
            reportType: ReportType.FINANCIAL,
            parameters: dto.parameters,
            generatedBy: dto.generatedBy,
        });

        let savedReport = await this.reportRepo.create(report);

        try {
            // Start processing
            savedReport.startProcessing();
            savedReport = await this.reportRepo.update(savedReport);

            // Generate report data
            const startDate = dto.parameters?.startDate
                ? new Date(dto.parameters.startDate)
                : new Date(new Date().setMonth(new Date().getMonth() - 1));
            const endDate = dto.parameters?.endDate
                ? new Date(dto.parameters.endDate)
                : new Date();

            const reportData = await this.generateFinancialData(startDate, endDate);

            // Complete the report
            savedReport.complete(reportData as unknown as Record<string, unknown>);
            savedReport = await this.reportRepo.update(savedReport);
        } catch (error) {
            savedReport.fail(error instanceof Error ? error.message : 'Unknown error');
            savedReport = await this.reportRepo.update(savedReport);
        }

        return this.toDto(savedReport);
    }

    private async generateFinancialData(startDate: Date, endDate: Date): Promise<FinancialReportData> {
        const stats = await this.dataProvider.getFinancialStats({
            startDate,
            endDate,
        });

        return {
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            revenue: {
                total: stats.transactions.totalAmount,
                byService: stats.revenueByService,
                byProvider: {},
            },
            subscriptions: {
                activeCount: stats.activeMemberships,
                newCount: 0,
                churnedCount: 0,
                revenue: 0,
            },
            transactions: {
                count: stats.transactions.count,
                totalAmount: stats.transactions.totalAmount,
                averageAmount: stats.transactions.averageAmount,
            },
            payouts: {
                count: stats.payments.count,
                totalAmount: stats.payments.totalAmount,
                pendingAmount: stats.payments.pendingAmount,
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
