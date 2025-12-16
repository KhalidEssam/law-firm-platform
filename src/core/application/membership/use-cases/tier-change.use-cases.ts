// ============================================
// TIER CHANGE USE CASES (UPGRADE/DOWNGRADE)
// core/application/membership/use-cases/tier-change.use-cases.ts
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { MembershipChangeLog, MembershipChangeReason } from '../../../domain/membership/entities/membership-change-log.entity';
import {
    type IMembershipRepository,
    type IMembershipTierRepository,
    type IMembershipChangeLogRepository,
} from '../ports/repository';

// ============================================
// DTOs
// ============================================

export interface ChangeTierDto {
    membershipId: string;
    newTierId: number;
    reason?: string;
    changedBy?: string;
    applyImmediately?: boolean;  // If false, applies at end of current billing period
}

export interface TierChangeResult {
    membershipId: string;
    oldTierId: number;
    newTierId: number;
    effectiveDate: Date;
    proratedAmount?: number;
    changeLogId: string;
}

export interface MembershipChangeLogResponseDto {
    id: string;
    membershipId: string;
    oldTierId: number | null;
    newTierId: number | null;
    reason: string | null;
    changedAt: Date;
    description: string;
}

// ============================================
// CHANGE MEMBERSHIP TIER USE CASE (UPGRADE/DOWNGRADE)
// ============================================

@Injectable()
export class ChangeMembershipTierUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
        @Inject('IMembershipTierRepository')
        private readonly tierRepo: IMembershipTierRepository,
        @Inject('IMembershipChangeLogRepository')
        private readonly changeLogRepo: IMembershipChangeLogRepository,
    ) {}

    async execute(dto: ChangeTierDto): Promise<TierChangeResult> {
        // Get membership
        const membership = await this.membershipRepo.findById(dto.membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        if (!membership.isActive) {
            throw new BadRequestException('Cannot change tier on inactive membership');
        }

        // Check if same tier
        if (membership.tierId === dto.newTierId) {
            throw new BadRequestException('New tier is the same as current tier');
        }

        // Get old and new tiers
        const oldTier = await this.tierRepo.findById(membership.tierId);
        const newTier = await this.tierRepo.findById(dto.newTierId);

        if (!newTier) {
            throw new NotFoundException('New tier not found');
        }

        if (!newTier.canBeSubscribed()) {
            throw new BadRequestException('New tier is not available for subscription');
        }

        // Determine if upgrade or downgrade
        const isUpgrade = newTier.price.amount > (oldTier?.price.amount || 0);
        const changeReason = isUpgrade ? MembershipChangeReason.UPGRADE : MembershipChangeReason.DOWNGRADE;

        // Calculate prorated amount (simplified - in real world you'd want more complex logic)
        let proratedAmount: number | undefined;
        if (dto.applyImmediately !== false && oldTier && membership.endDate) {
            const now = new Date();
            const remainingDays = Math.ceil((membership.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const totalDays = Math.ceil((membership.endDate.getTime() - membership.startDate.getTime()) / (1000 * 60 * 60 * 24));

            if (totalDays > 0 && remainingDays > 0) {
                const priceDifference = newTier.price.amount - oldTier.price.amount;
                proratedAmount = (priceDifference / totalDays) * remainingDays;
            }
        }

        // Create change log
        const changeLog = MembershipChangeLog.create({
            membershipId: dto.membershipId,
            oldTierId: membership.tierId,
            newTierId: dto.newTierId,
            reason: dto.reason || changeReason,
            changedBy: dto.changedBy,
            metadata: {
                proratedAmount,
                applyImmediately: dto.applyImmediately !== false,
            },
        });

        await this.changeLogRepo.create(changeLog);

        // Update membership tier
        // Note: In a real implementation, we'd update the Membership entity's tierId
        // For now, we'll use a direct repo update
        const updatedMembership = await this.membershipRepo.update({
            ...membership,
            tierId: dto.newTierId,
        } as any);

        return {
            membershipId: dto.membershipId,
            oldTierId: membership.tierId,
            newTierId: dto.newTierId,
            effectiveDate: new Date(),
            proratedAmount: proratedAmount && proratedAmount > 0 ? proratedAmount : undefined,
            changeLogId: changeLog.id,
        };
    }
}

// ============================================
// UPGRADE MEMBERSHIP USE CASE (CONVENIENCE)
// ============================================

@Injectable()
export class UpgradeMembershipUseCase {
    constructor(
        private readonly changeTier: ChangeMembershipTierUseCase,
        @Inject('IMembershipTierRepository')
        private readonly tierRepo: IMembershipTierRepository,
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
    ) {}

    async execute(membershipId: string, newTierId: number, changedBy?: string): Promise<TierChangeResult> {
        // Verify it's actually an upgrade
        const membership = await this.membershipRepo.findById(membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        const currentTier = await this.tierRepo.findById(membership.tierId);
        const newTier = await this.tierRepo.findById(newTierId);

        if (!newTier) {
            throw new NotFoundException('New tier not found');
        }

        if (currentTier && newTier.price.amount <= currentTier.price.amount) {
            throw new BadRequestException('New tier must have higher price for upgrade. Use downgrade instead.');
        }

        return await this.changeTier.execute({
            membershipId,
            newTierId,
            reason: MembershipChangeReason.UPGRADE,
            changedBy,
            applyImmediately: true,
        });
    }
}

// ============================================
// DOWNGRADE MEMBERSHIP USE CASE (CONVENIENCE)
// ============================================

@Injectable()
export class DowngradeMembershipUseCase {
    constructor(
        private readonly changeTier: ChangeMembershipTierUseCase,
        @Inject('IMembershipTierRepository')
        private readonly tierRepo: IMembershipTierRepository,
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
    ) {}

    async execute(membershipId: string, newTierId: number, changedBy?: string): Promise<TierChangeResult> {
        // Verify it's actually a downgrade
        const membership = await this.membershipRepo.findById(membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        const currentTier = await this.tierRepo.findById(membership.tierId);
        const newTier = await this.tierRepo.findById(newTierId);

        if (!newTier) {
            throw new NotFoundException('New tier not found');
        }

        if (currentTier && newTier.price.amount >= currentTier.price.amount) {
            throw new BadRequestException('New tier must have lower price for downgrade. Use upgrade instead.');
        }

        return await this.changeTier.execute({
            membershipId,
            newTierId,
            reason: MembershipChangeReason.DOWNGRADE,
            changedBy,
            applyImmediately: false, // Downgrades typically apply at end of billing period
        });
    }
}

// ============================================
// GET MEMBERSHIP CHANGE HISTORY USE CASE
// ============================================

@Injectable()
export class GetMembershipChangeHistoryUseCase {
    constructor(
        @Inject('IMembershipChangeLogRepository')
        private readonly changeLogRepo: IMembershipChangeLogRepository,
    ) {}

    async execute(
        membershipId: string,
        options?: { limit?: number; offset?: number; orderBy?: 'asc' | 'desc' }
    ): Promise<MembershipChangeLog[]> {
        return await this.changeLogRepo.findByMembershipId(membershipId, options);
    }
}

// ============================================
// GET LATEST MEMBERSHIP CHANGE USE CASE
// ============================================

@Injectable()
export class GetLatestMembershipChangeUseCase {
    constructor(
        @Inject('IMembershipChangeLogRepository')
        private readonly changeLogRepo: IMembershipChangeLogRepository,
    ) {}

    async execute(membershipId: string): Promise<MembershipChangeLog | null> {
        return await this.changeLogRepo.getLatestChange(membershipId);
    }
}

// ============================================
// GET TIER CHANGE STATISTICS USE CASE
// ============================================

@Injectable()
export class GetTierChangeStatisticsUseCase {
    constructor(
        @Inject('IMembershipChangeLogRepository')
        private readonly changeLogRepo: IMembershipChangeLogRepository,
    ) {}

    async execute(startDate: Date, endDate: Date): Promise<{
        upgrades: number;
        downgrades: number;
        cancellations: number;
        reactivations: number;
        total: number;
    }> {
        const stats = await this.changeLogRepo.getTierChangeStats(startDate, endDate);
        return {
            ...stats,
            total: stats.upgrades + stats.downgrades + stats.cancellations + stats.reactivations,
        };
    }
}
