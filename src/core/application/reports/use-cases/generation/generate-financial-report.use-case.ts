// ============================================
// GENERATE FINANCIAL REPORT USE CASE
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
    FinancialReportData,
} from '../../dto/reports.dto';

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
