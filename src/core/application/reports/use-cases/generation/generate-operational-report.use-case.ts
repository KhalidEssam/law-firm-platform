// ============================================
// GENERATE OPERATIONAL REPORT USE CASE
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
    OperationalReportData,
} from '../../dto/reports.dto';

@Injectable()
export class GenerateOperationalReportUseCase {
    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepo: IReportRepository,
        private readonly prisma: PrismaService,
    ) {}

    async execute(dto: GenerateReportDto): Promise<ReportResponseDto> {
        const report = Report.create({
            name: dto.name || `Operational Report - ${new Date().toISOString().split('T')[0]}`,
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
            savedReport.fail(error instanceof Error ? error.message : 'Unknown error');
            savedReport = await this.reportRepo.update(savedReport);
        }

        return this.toDto(savedReport);
    }

    private async generateOperationalData(startDate: Date, endDate: Date): Promise<OperationalReportData> {
        // Get request counts by type
        const [consultations, opinions, litigations, calls] = await Promise.all([
            this.prisma.consultationRequest.count({
                where: { createdAt: { gte: startDate, lte: endDate } },
            }),
            this.prisma.legalOpinionRequest.count({
                where: { createdAt: { gte: startDate, lte: endDate } },
            }),
            this.prisma.litigationCase.count({
                where: { createdAt: { gte: startDate, lte: endDate } },
            }),
            this.prisma.callRequest.count({
                where: { createdAt: { gte: startDate, lte: endDate } },
            }),
        ]);

        // Get active providers
        const activeProviders = await this.prisma.providerUser.count({
            where: { isActive: true, canAcceptRequests: true },
        });

        // Get active subscribers
        const activeSubscribers = await this.prisma.user.count({
            where: {
                profileStatus: 'active',
                roles: { some: { role: { name: 'user' } } },
            },
        });

        // Get SLA metrics
        const slaMetrics = await this.prisma.consultationRequest.groupBy({
            by: ['slaStatus'],
            _count: { id: true },
            where: { createdAt: { gte: startDate, lte: endDate } },
        });

        const slaData = {
            onTrack: 0,
            atRisk: 0,
            breached: 0,
            complianceRate: 0,
        };

        let total = 0;
        for (const m of slaMetrics) {
            total += m._count.id;
            if (m.slaStatus === 'on_track') slaData.onTrack = m._count.id;
            if (m.slaStatus === 'at_risk') slaData.atRisk = m._count.id;
            if (m.slaStatus === 'breached') slaData.breached = m._count.id;
        }
        slaData.complianceRate = total > 0 ? (slaData.onTrack / total) * 100 : 100;

        return {
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            requests: {
                total: consultations + opinions + litigations + calls,
                byType: {
                    consultation: consultations,
                    legal_opinion: opinions,
                    litigation: litigations,
                    call: calls,
                },
                byStatus: {},
                averageCompletionTime: 0,
            },
            providers: {
                totalActive: activeProviders,
                averageWorkload: 0,
                topPerformers: [],
            },
            subscribers: {
                totalActive: activeSubscribers,
                newThisPeriod: 0,
                retention: 0,
            },
            sla: slaData,
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
