// src/core/application/reports/use-cases/report-generation.use-cases.ts

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Report } from '../../../domain/reports/entities/report.entity';
import {
    ReportType,
    JobStatus,
    TimeRange,
} from '../../../domain/reports/value-objects/report.vo';
import {
    type IReportRepository,
    REPORT_REPOSITORY,
    ReportFilter,
    ReportPaginationOptions,
} from '../ports/reports.repository';
import {
    GenerateReportDto,
    ReportResponseDto,
    ReportListQueryDto,
    PaginatedReportsDto,
    FinancialReportData,
    OperationalReportData,
    PerformanceReportData,
    ComplianceReportData,
} from '../dto/reports.dto';

// ============================================
// BASE REPORT USE CASES
// ============================================

@Injectable()
export class CreateReportUseCase {
    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepo: IReportRepository,
    ) {}

    async execute(dto: GenerateReportDto): Promise<ReportResponseDto> {
        const report = Report.create({
            name: dto.name || `${dto.reportType} Report - ${new Date().toISOString().split('T')[0]}`,
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

@Injectable()
export class DeleteReportUseCase {
    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepo: IReportRepository,
    ) {}

    async execute(id: string): Promise<void> {
        const report = await this.reportRepo.findById(id);
        if (!report) {
            throw new NotFoundException(`Report with ID ${id} not found`);
        }
        await this.reportRepo.delete(id);
    }
}

// ============================================
// FINANCIAL REPORT USE CASE
// ============================================

@Injectable()
export class GenerateFinancialReportUseCase {
    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepo: IReportRepository,
        private readonly prisma: PrismaService,
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
        // Get active membership tiers count
        const activeMemberships = await this.prisma.membership.count({
            where: {
                isActive: true,
            },
        });

        // Get transaction data from TransactionLog
        const transactions = await this.prisma.transactionLog.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'paid',
            },
            _count: { id: true },
            _sum: { amount: true },
            _avg: { amount: true },
        });

        // Get membership payments as payout equivalent
        const payments = await this.prisma.membershipPayment.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'paid',
            },
            _count: { id: true },
            _sum: { amount: true },
        });

        const pendingPayments = await this.prisma.membershipPayment.aggregate({
            where: {
                status: 'pending',
            },
            _sum: { amount: true },
        });

        // Get revenue by service type
        const revenueByService: Record<string, number> = {};
        const serviceTypes = ['consultation', 'legal_opinion', 'litigation', 'call'];
        for (const stype of serviceTypes) {
            revenueByService[stype] = 0; // Would need to calculate from actual transaction data
        }

        return {
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            revenue: {
                total: transactions._sum.amount || 0,
                byService: revenueByService,
                byProvider: {},
            },
            subscriptions: {
                activeCount: activeMemberships,
                newCount: 0,
                churnedCount: 0,
                revenue: 0,
            },
            transactions: {
                count: transactions._count.id,
                totalAmount: transactions._sum.amount || 0,
                averageAmount: transactions._avg.amount || 0,
            },
            payouts: {
                count: payments._count.id,
                totalAmount: payments._sum.amount || 0,
                pendingAmount: pendingPayments._sum.amount || 0,
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

// ============================================
// OPERATIONAL REPORT USE CASE
// ============================================

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

// ============================================
// PERFORMANCE REPORT USE CASE
// ============================================

@Injectable()
export class GeneratePerformanceReportUseCase {
    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepo: IReportRepository,
        private readonly prisma: PrismaService,
    ) {}

    async execute(dto: GenerateReportDto): Promise<ReportResponseDto> {
        const report = Report.create({
            name: dto.name || `Performance Report - ${new Date().toISOString().split('T')[0]}`,
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
            savedReport.fail(error instanceof Error ? error.message : 'Unknown error');
            savedReport = await this.reportRepo.update(savedReport);
        }

        return this.toDto(savedReport);
    }

    private async generatePerformanceData(startDate: Date, endDate: Date): Promise<PerformanceReportData> {
        // Get provider ratings
        const ratings = await this.prisma.providerReview.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                isPublic: true,
            },
            _avg: { rating: true },
        });

        // Get rating distribution
        const ratingDistribution = await this.prisma.providerReview.groupBy({
            by: ['rating'],
            _count: { id: true },
            where: {
                createdAt: { gte: startDate, lte: endDate },
                isPublic: true,
            },
        });

        const distribution: Record<string, number> = {};
        for (const r of ratingDistribution) {
            distribution[String(r.rating)] = r._count.id;
        }

        // Get request throughput
        const totalRequests = await this.prisma.consultationRequest.count({
            where: { createdAt: { gte: startDate, lte: endDate } },
        });

        const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        const requestsPerHour = hoursDiff > 0 ? totalRequests / hoursDiff : 0;

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
                averageRating: ratings._avg.rating || 0,
                ratingDistribution: distribution,
                responseRate: 0,
                completionRate: 0,
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

// ============================================
// COMPLIANCE REPORT USE CASE
// ============================================

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

// ============================================
// REPORT STATISTICS USE CASE
// ============================================

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
            recentReports: recentReports.map(r => {
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
