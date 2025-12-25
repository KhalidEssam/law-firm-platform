// ============================================
// PRISMA REPORT DATA PROVIDER
// src/infrastructure/persistence/reports/prisma-report-data-provider.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    IReportDataProvider,
    DateRange,
    FinancialStats,
    OperationalStats,
    PerformanceStats,
    ComplianceStats,
    RequestCounts,
    SLAStats,
} from '../../../core/application/reports/ports/report-data-provider';

@Injectable()
export class PrismaReportDataProvider implements IReportDataProvider {
    constructor(private readonly prisma: PrismaService) {}

    async getFinancialStats(dateRange: DateRange): Promise<FinancialStats> {
        const [activeMemberships, transactions, payments, pendingPayments] = await Promise.all([
            // Active memberships
            this.prisma.membership.count({
                where: { isActive: true },
            }),

            // Transaction data
            this.prisma.transactionLog.aggregate({
                where: {
                    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
                    status: 'paid',
                },
                _count: { id: true },
                _sum: { amount: true },
                _avg: { amount: true },
            }),

            // Payments data
            this.prisma.membershipPayment.aggregate({
                where: {
                    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
                    status: 'paid',
                },
                _count: { id: true },
                _sum: { amount: true },
            }),

            // Pending payments
            this.prisma.membershipPayment.aggregate({
                where: { status: 'pending' },
                _sum: { amount: true },
            }),
        ]);

        // Revenue by service type (placeholder - would need transaction type grouping)
        const revenueByService: Record<string, number> = {
            consultation: 0,
            legal_opinion: 0,
            litigation: 0,
            call: 0,
            service: 0,
        };

        return {
            activeMemberships,
            transactions: {
                count: transactions._count.id,
                totalAmount: transactions._sum.amount || 0,
                averageAmount: transactions._avg.amount || 0,
            },
            payments: {
                count: payments._count.id,
                totalAmount: payments._sum.amount || 0,
                pendingAmount: pendingPayments._sum.amount || 0,
            },
            revenueByService,
        };
    }

    async getOperationalStats(dateRange: DateRange): Promise<OperationalStats> {
        const [requestCounts, activeProviders, activeSubscribers, slaStats] = await Promise.all([
            this.getRequestCountsByType(dateRange),
            this.getActiveProviderCount(),
            this.getActiveSubscriberCount(),
            this.getSLAStats(dateRange),
        ]);

        return {
            requestCounts,
            activeProviders,
            activeSubscribers,
            slaStats,
        };
    }

    async getPerformanceStats(dateRange: DateRange): Promise<PerformanceStats> {
        const [ratings, ratingDistribution, requestStats] = await Promise.all([
            // Average ratings
            this.prisma.providerReview.aggregate({
                where: {
                    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
                    isPublic: true,
                },
                _count: { id: true },
                _avg: { rating: true },
            }),

            // Rating distribution
            this.prisma.providerReview.groupBy({
                by: ['rating'],
                where: {
                    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
                    isPublic: true,
                },
                _count: true,
            }),

            // Request completion stats
            this.getRequestCompletionStats(dateRange),
        ]);

        const distribution: Record<number, number> = {};
        for (const rd of ratingDistribution) {
            distribution[rd.rating] = rd._count;
        }

        return {
            ratings: {
                count: ratings._count.id,
                average: ratings._avg.rating || 0,
                distribution,
            },
            completionRate: requestStats.completionRate,
            totalRequests: requestStats.total,
            completedRequests: requestStats.completed,
        };
    }

    async getComplianceStats(dateRange: DateRange): Promise<ComplianceStats> {
        const [auditLogs, auditByAction, sessionCount] = await Promise.all([
            this.prisma.auditLog.count({
                where: {
                    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
                },
            }),

            this.prisma.auditLog.groupBy({
                by: ['action'],
                where: {
                    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
                },
                _count: true,
            }),

            this.prisma.session.count({
                where: {
                    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
                },
            }),
        ]);

        const byAction: Record<string, number> = {};
        for (const ab of auditByAction) {
            byAction[ab.action] = ab._count;
        }

        return {
            auditStats: {
                totalLogs: auditLogs,
                byAction,
            },
            sessionCount,
            dataExportRequests: 0, // Could add if needed
        };
    }

    async getRequestCountsByType(dateRange: DateRange): Promise<RequestCounts> {
        const [consultations, legalOpinions, litigations, calls, services] = await Promise.all([
            this.prisma.consultationRequest.count({
                where: { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } },
            }),
            this.prisma.legalOpinionRequest.count({
                where: { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } },
            }),
            this.prisma.litigationCase.count({
                where: { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } },
            }),
            this.prisma.callRequest.count({
                where: { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } },
            }),
            this.prisma.serviceRequest.count({
                where: { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } },
            }),
        ]);

        return {
            consultations,
            legalOpinions,
            litigations,
            calls,
            services,
        };
    }

    async getSLAStats(dateRange: DateRange): Promise<SLAStats> {
        const slaMetrics = await this.prisma.consultationRequest.groupBy({
            by: ['slaStatus'],
            _count: { id: true },
            where: {
                createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
            },
        });

        const stats: SLAStats = {
            onTrack: 0,
            atRisk: 0,
            breached: 0,
            total: 0,
        };

        for (const m of slaMetrics) {
            stats.total += m._count.id;
            if (m.slaStatus === 'on_track') stats.onTrack = m._count.id;
            if (m.slaStatus === 'at_risk') stats.atRisk = m._count.id;
            if (m.slaStatus === 'breached') stats.breached = m._count.id;
        }

        return stats;
    }

    async getProviderWorkloadStats(): Promise<{
        totalActive: number;
        averageWorkload: number;
        topPerformers: Array<{ providerId: string; name: string; completedRequests: number }>;
    }> {
        const activeProviders = await this.prisma.providerUser.count({
            where: { isActive: true, canAcceptRequests: true },
        });

        // Get top performers by completed requests (consultation + legal opinion)
        const topProviders = await this.prisma.consultationRequest.groupBy({
            by: ['assignedProviderId'],
            where: {
                status: 'completed',
                assignedProviderId: { not: null },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });

        // Get provider names
        const providerIds = topProviders
            .filter(p => p.assignedProviderId)
            .map(p => p.assignedProviderId as string);

        const providerNames = await this.prisma.user.findMany({
            where: { id: { in: providerIds } },
            select: { id: true, fullName: true, username: true },
        });

        const nameMap = new Map(providerNames.map(p => [p.id, p.fullName || p.username || 'Unknown']));

        const topPerformers = topProviders
            .filter(p => p.assignedProviderId)
            .map(p => ({
                providerId: p.assignedProviderId as string,
                name: nameMap.get(p.assignedProviderId as string) || 'Unknown',
                completedRequests: p._count.id,
            }));

        // Calculate average workload
        const totalCompleted = topPerformers.reduce((sum, p) => sum + p.completedRequests, 0);
        const averageWorkload = activeProviders > 0 ? totalCompleted / activeProviders : 0;

        return {
            totalActive: activeProviders,
            averageWorkload,
            topPerformers,
        };
    }

    async getSubscriberStats(dateRange: DateRange): Promise<{
        totalActive: number;
        newThisPeriod: number;
        retention: number;
    }> {
        const [totalActive, newThisPeriod] = await Promise.all([
            this.prisma.user.count({
                where: {
                    profileStatus: 'active',
                    roles: { some: { role: { name: 'user' } } },
                },
            }),
            this.prisma.user.count({
                where: {
                    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
                    roles: { some: { role: { name: 'user' } } },
                },
            }),
        ]);

        // Calculate retention (simplified - would need more complex logic in production)
        const retention = totalActive > 0 ? 95 : 0; // Placeholder

        return {
            totalActive,
            newThisPeriod,
            retention,
        };
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private async getActiveProviderCount(): Promise<number> {
        return this.prisma.providerUser.count({
            where: { isActive: true, canAcceptRequests: true },
        });
    }

    private async getActiveSubscriberCount(): Promise<number> {
        return this.prisma.user.count({
            where: {
                profileStatus: 'active',
                roles: { some: { role: { name: 'user' } } },
            },
        });
    }

    private async getRequestCompletionStats(dateRange: DateRange): Promise<{
        total: number;
        completed: number;
        completionRate: number;
    }> {
        const [total, completed] = await Promise.all([
            this.prisma.consultationRequest.count({
                where: {
                    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
                },
            }),
            this.prisma.consultationRequest.count({
                where: {
                    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
                    status: 'completed',
                },
            }),
        ]);

        return {
            total,
            completed,
            completionRate: total > 0 ? (completed / total) * 100 : 0,
        };
    }
}
