// ============================================
// GENERATE COMPLIANCE REPORT USE CASE
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
    ComplianceReportData,
} from '../../dto/reports.dto';

@Injectable()
export class GenerateComplianceReportUseCase {
    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepo: IReportRepository,
        @Inject(REPORT_DATA_PROVIDER)
        private readonly dataProvider: IReportDataProvider,
    ) {}

    async execute(dto: GenerateReportDto): Promise<ReportResponseDto> {
        const report = Report.create({
            name: dto.name || `Compliance Report - ${new Date().toISOString().split('T')[0]}`,
            reportType: ReportType.COMPLIANCE,
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

            const reportData = await this.generateComplianceData(startDate, endDate);

            savedReport.complete(reportData as unknown as Record<string, unknown>);
            savedReport = await this.reportRepo.update(savedReport);
        } catch (error) {
            savedReport.fail(error instanceof Error ? error.message : 'Unknown error');
            savedReport = await this.reportRepo.update(savedReport);
        }

        return this.toDto(savedReport);
    }

    private async generateComplianceData(startDate: Date, endDate: Date): Promise<ComplianceReportData> {
        const dateRange = { startDate, endDate };
        const complianceStats = await this.dataProvider.getComplianceStats(dateRange);

        return {
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            dataAccess: {
                totalAccessEvents: complianceStats.auditStats.totalLogs,
                byUser: {},
                byEntityType: {},
            },
            securityEvents: {
                loginAttempts: complianceStats.sessionCount,
                failedLogins: 0,
                passwordResets: 0,
                suspiciousActivities: 0,
            },
            auditTrail: {
                totalEvents: complianceStats.auditStats.totalLogs,
                byAction: complianceStats.auditStats.byAction,
                criticalEvents: 0,
            },
            dataRetention: {
                recordsProcessed: 0,
                recordsDeleted: 0,
                storageUsed: 0,
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
