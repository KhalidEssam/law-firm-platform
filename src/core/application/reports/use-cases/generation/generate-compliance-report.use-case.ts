// ============================================
// GENERATE COMPLIANCE REPORT USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Report } from '../../../../domain/reports/entities/report.entity';
import { ReportType } from '../../../../domain/reports/value-objects/report.vo';
import {
    type IReportRepository,
    REPORT_REPOSITORY,
} from '../../ports/reports.repository';
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
        private readonly prisma: PrismaService,
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
        // Get audit log data
        const auditLogs = await this.prisma.auditLog.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
            _count: { id: true },
        });

        const auditByAction = await this.prisma.auditLog.groupBy({
            by: ['action'],
            _count: { id: true },
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
        });

        const actionCounts: Record<string, number> = {};
        for (const a of auditByAction) {
            actionCounts[a.action] = a._count.id;
        }

        // Get session data for security events
        const sessions = await this.prisma.session.count({
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
        });

        return {
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            dataAccess: {
                totalAccessEvents: auditLogs._count.id,
                byUser: {},
                byEntityType: {},
            },
            securityEvents: {
                loginAttempts: sessions,
                failedLogins: 0,
                passwordResets: 0,
                suspiciousActivities: 0,
            },
            auditTrail: {
                totalEvents: auditLogs._count.id,
                byAction: actionCounts,
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
