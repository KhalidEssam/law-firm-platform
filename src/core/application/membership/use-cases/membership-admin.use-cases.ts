// ============================================
// MEMBERSHIP ADMIN USE CASES
// core/application/membership/use-cases/membership-admin.use-cases.ts
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { Membership } from '../../../domain/membership/entities/membership.entity';
import {
    IMembershipRepository,
    IMembershipTierRepository,
    IMembershipPaymentRepository,
    IMembershipChangeLogRepository,
} from '../ports/repository';

// ============================================
// DTOs
// ============================================

export interface ListMembershipsQueryDto {
    isActive?: boolean;
    tierId?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'startDate' | 'endDate';
    sortOrder?: 'asc' | 'desc';
}

export interface MembershipStatisticsDto {
    totalMemberships: number;
    activeMemberships: number;
    inactiveMemberships: number;
    expiringThisMonth: number;
    newThisMonth: number;
    byTier: {
        tierId: number;
        tierName: string;
        count: number;
        activeCount: number;
    }[];
    revenue: {
        totalRevenue: number;
        revenueThisMonth: number;
        currency: string;
    };
    changes: {
        upgradesThisMonth: number;
        downgradesThisMonth: number;
        cancellationsThisMonth: number;
    };
}

// ============================================
// LIST MEMBERSHIPS USE CASE (ADMIN)
// ============================================

@Injectable()
export class ListMembershipsUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
    ) {}

    async execute(query: ListMembershipsQueryDto): Promise<{
        memberships: Membership[];
        total: number;
        limit: number;
        offset: number;
    }> {
        const memberships = await this.membershipRepo.list({
            isActive: query.isActive,
            tierId: query.tierId,
            limit: query.limit || 20,
            offset: query.offset || 0,
        });

        const total = await this.membershipRepo.count({
            isActive: query.isActive,
            tierId: query.tierId,
        });

        return {
            memberships,
            total,
            limit: query.limit || 20,
            offset: query.offset || 0,
        };
    }
}

// ============================================
// GET MEMBERSHIP STATISTICS USE CASE (ADMIN)
// ============================================

@Injectable()
export class GetMembershipStatisticsUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
        @Inject('IMembershipTierRepository')
        private readonly tierRepo: IMembershipTierRepository,
        @Inject('IMembershipPaymentRepository')
        private readonly paymentRepo: IMembershipPaymentRepository,
        @Inject('IMembershipChangeLogRepository')
        private readonly changeLogRepo: IMembershipChangeLogRepository,
    ) {}

    async execute(): Promise<MembershipStatisticsDto> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Get counts
        const totalMemberships = await this.membershipRepo.count({});
        const activeMemberships = await this.membershipRepo.count({ isActive: true });
        const inactiveMemberships = totalMemberships - activeMemberships;

        // Get expiring memberships
        const expiringMemberships = await this.membershipRepo.findExpiringSoon(30);
        const expiringThisMonth = expiringMemberships.filter(m => {
            if (!m.endDate) return false;
            return m.endDate <= endOfMonth;
        }).length;

        // Get all tiers for breakdown
        const tiers = await this.tierRepo.findAll({});
        const byTier: MembershipStatisticsDto['byTier'] = [];

        for (const tier of tiers) {
            const totalForTier = await this.membershipRepo.count({ tierId: tier.id });
            const activeForTier = await this.membershipRepo.count({ tierId: tier.id, isActive: true });
            byTier.push({
                tierId: tier.id,
                tierName: tier.name,
                count: totalForTier,
                activeCount: activeForTier,
            });
        }

        // Get revenue stats
        const totalRevenue = await this.paymentRepo.getTotalRevenue({});
        const revenueThisMonth = await this.paymentRepo.getTotalRevenue({
            startDate: startOfMonth,
            endDate: endOfMonth,
        });

        // Get change stats
        const changeStats = await this.changeLogRepo.getTierChangeStats(startOfMonth, endOfMonth);

        // Count new memberships this month (simplified - would need a proper query)
        // For now, we'll estimate from the list
        const allMemberships = await this.membershipRepo.list({ limit: 10000 });
        const newThisMonth = allMemberships.filter(m =>
            m.createdAt >= startOfMonth && m.createdAt <= endOfMonth
        ).length;

        return {
            totalMemberships,
            activeMemberships,
            inactiveMemberships,
            expiringThisMonth,
            newThisMonth,
            byTier,
            revenue: {
                totalRevenue,
                revenueThisMonth,
                currency: 'SAR',
            },
            changes: {
                upgradesThisMonth: changeStats.upgrades,
                downgradesThisMonth: changeStats.downgrades,
                cancellationsThisMonth: changeStats.cancellations,
            },
        };
    }
}

// ============================================
// GET MEMBERSHIP ACTIVITY SUMMARY USE CASE
// ============================================

@Injectable()
export class GetMembershipActivitySummaryUseCase {
    constructor(
        @Inject('IMembershipChangeLogRepository')
        private readonly changeLogRepo: IMembershipChangeLogRepository,
    ) {}

    async execute(startDate: Date, endDate: Date): Promise<{
        totalChanges: number;
        upgrades: number;
        downgrades: number;
        cancellations: number;
        reactivations: number;
        periodStart: Date;
        periodEnd: Date;
    }> {
        const stats = await this.changeLogRepo.getTierChangeStats(startDate, endDate);

        return {
            totalChanges: stats.upgrades + stats.downgrades + stats.cancellations + stats.reactivations,
            upgrades: stats.upgrades,
            downgrades: stats.downgrades,
            cancellations: stats.cancellations,
            reactivations: stats.reactivations,
            periodStart: startDate,
            periodEnd: endDate,
        };
    }
}

// ============================================
// GET TIER DISTRIBUTION USE CASE
// ============================================

@Injectable()
export class GetTierDistributionUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
        @Inject('IMembershipTierRepository')
        private readonly tierRepo: IMembershipTierRepository,
    ) {}

    async execute(): Promise<{
        tierId: number;
        tierName: string;
        totalCount: number;
        activeCount: number;
        percentage: number;
    }[]> {
        const tiers = await this.tierRepo.findAll({});
        const totalActive = await this.membershipRepo.count({ isActive: true });

        const distribution: {
            tierId: number;
            tierName: string;
            totalCount: number;
            activeCount: number;
            percentage: number;
        }[] = [];

        for (const tier of tiers) {
            const totalCount = await this.membershipRepo.count({ tierId: tier.id });
            const activeCount = await this.membershipRepo.count({ tierId: tier.id, isActive: true });
            const percentage = totalActive > 0 ? (activeCount / totalActive) * 100 : 0;

            distribution.push({
                tierId: tier.id,
                tierName: tier.name,
                totalCount,
                activeCount,
                percentage: Math.round(percentage * 100) / 100,
            });
        }

        return distribution.sort((a, b) => b.activeCount - a.activeCount);
    }
}
