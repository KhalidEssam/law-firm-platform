// ============================================
// MEMBERSHIP LIFECYCLE USE CASES
// core/application/membership/use-cases/membership-lifecycle.use-cases.ts
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Membership } from '../../../domain/membership/entities/membership.entity';
import {
  MembershipChangeLog,
  MembershipChangeReason,
} from '../../../domain/membership/entities/membership-change-log.entity';
import {
  type IMembershipRepository,
  type IMembershipChangeLogRepository,
} from '../ports/repository';

// ============================================
// DTOs
// ============================================

export interface PauseMembershipDto {
  membershipId: string;
  reason?: string;
  pausedBy?: string;
  pauseUntil?: Date; // Optional: auto-resume date
}

export interface ResumeMembershipDto {
  membershipId: string;
  resumedBy?: string;
  extendEndDate?: boolean; // Extend end date by paused duration
}

export interface ExpiringMembershipsQueryDto {
  days: number; // Get memberships expiring within X days
  includeAutoRenew?: boolean;
}

// ============================================
// PAUSE MEMBERSHIP USE CASE
// ============================================

@Injectable()
export class PauseMembershipUseCase {
  constructor(
    @Inject('IMembershipRepository')
    private readonly membershipRepo: IMembershipRepository,
    @Inject('IMembershipChangeLogRepository')
    private readonly changeLogRepo: IMembershipChangeLogRepository,
  ) {}

  async execute(dto: PauseMembershipDto): Promise<Membership> {
    const membership = await this.membershipRepo.findById(dto.membershipId);
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (!membership.isActive) {
      throw new BadRequestException('Membership is already inactive');
    }

    // Create change log
    const changeLog = MembershipChangeLog.create({
      membershipId: dto.membershipId,
      oldTierId: membership.tierId,
      newTierId: membership.tierId, // Same tier, just paused
      reason: MembershipChangeReason.PAUSE,
      changedBy: dto.pausedBy,
      metadata: {
        pauseUntil: dto.pauseUntil,
        pauseReason: dto.reason,
        pausedAt: new Date(),
      },
    });
    await this.changeLogRepo.create(changeLog);

    // Deactivate membership (pause)
    await this.membershipRepo.cancel(dto.membershipId);

    return (await this.membershipRepo.findById(dto.membershipId))!;
  }
}

// ============================================
// RESUME MEMBERSHIP USE CASE
// ============================================

@Injectable()
export class ResumeMembershipUseCase {
  constructor(
    @Inject('IMembershipRepository')
    private readonly membershipRepo: IMembershipRepository,
    @Inject('IMembershipChangeLogRepository')
    private readonly changeLogRepo: IMembershipChangeLogRepository,
  ) {}

  async execute(dto: ResumeMembershipDto): Promise<Membership> {
    const membership = await this.membershipRepo.findById(dto.membershipId);
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.isActive) {
      throw new BadRequestException('Membership is already active');
    }

    // Get last pause log to calculate extension
    const lastChange = await this.changeLogRepo.getLatestChange(
      dto.membershipId,
    );
    let extensionDays = 0;

    if (
      dto.extendEndDate &&
      lastChange?.reason === MembershipChangeReason.PAUSE
    ) {
      const pausedAt = lastChange.changedAt;
      extensionDays = Math.ceil(
        (Date.now() - pausedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    // Create change log
    const changeLog = MembershipChangeLog.create({
      membershipId: dto.membershipId,
      oldTierId: membership.tierId,
      newTierId: membership.tierId,
      reason: MembershipChangeReason.RESUME,
      changedBy: dto.resumedBy,
      metadata: {
        resumedAt: new Date(),
        extensionDays,
      },
    });
    await this.changeLogRepo.create(changeLog);

    // Reactivate and optionally extend
    const renewDuration = extensionDays > 0 ? Math.ceil(extensionDays / 30) : 0;
    if (renewDuration > 0) {
      return await this.membershipRepo.renew(dto.membershipId, renewDuration);
    } else {
      // Just reactivate without extending
      return await this.membershipRepo.toggleAutoRenew(
        dto.membershipId,
        membership.autoRenew,
      );
    }
  }
}

// ============================================
// EXPIRE MEMBERSHIPS USE CASE (BATCH JOB)
// ============================================

@Injectable()
export class ExpireMembershipsUseCase {
  constructor(
    @Inject('IMembershipRepository')
    private readonly membershipRepo: IMembershipRepository,
    @Inject('IMembershipChangeLogRepository')
    private readonly changeLogRepo: IMembershipChangeLogRepository,
  ) {}

  async execute(): Promise<{ expired: number; membershipIds: string[] }> {
    // Find all expired active memberships
    const expiredMemberships = await this.membershipRepo.findExpired();

    const expiredIds: string[] = [];

    for (const membership of expiredMemberships) {
      // Create change log
      const changeLog = MembershipChangeLog.create({
        membershipId: membership.id,
        oldTierId: membership.tierId,
        newTierId: null,
        reason: MembershipChangeReason.EXPIRATION,
        changedBy: 'system',
      });
      await this.changeLogRepo.create(changeLog);

      // Cancel the membership
      await this.membershipRepo.cancel(membership.id);
      expiredIds.push(membership.id);
    }

    return {
      expired: expiredIds.length,
      membershipIds: expiredIds,
    };
  }
}

// ============================================
// GET EXPIRING MEMBERSHIPS USE CASE
// ============================================

@Injectable()
export class GetExpiringMembershipsUseCase {
  constructor(
    @Inject('IMembershipRepository')
    private readonly membershipRepo: IMembershipRepository,
  ) {}

  async execute(query: ExpiringMembershipsQueryDto): Promise<Membership[]> {
    const memberships = await this.membershipRepo.findExpiringSoon(query.days);

    if (query.includeAutoRenew === false) {
      return memberships.filter((m) => !m.autoRenew);
    }

    return memberships;
  }
}

// ============================================
// REACTIVATE MEMBERSHIP USE CASE
// ============================================

@Injectable()
export class ReactivateMembershipUseCase {
  constructor(
    @Inject('IMembershipRepository')
    private readonly membershipRepo: IMembershipRepository,
    @Inject('IMembershipChangeLogRepository')
    private readonly changeLogRepo: IMembershipChangeLogRepository,
  ) {}

  async execute(
    membershipId: string,
    durationInMonths: number,
    reactivatedBy?: string,
  ): Promise<Membership> {
    const membership = await this.membershipRepo.findById(membershipId);
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.isActive) {
      throw new BadRequestException(
        'Membership is already active. Use renew instead.',
      );
    }

    // Create change log
    const changeLog = MembershipChangeLog.create({
      membershipId,
      oldTierId: null,
      newTierId: membership.tierId,
      reason: MembershipChangeReason.REACTIVATION,
      changedBy: reactivatedBy,
      metadata: {
        durationInMonths,
        reactivatedAt: new Date(),
      },
    });
    await this.changeLogRepo.create(changeLog);

    // Renew the membership
    return await this.membershipRepo.renew(membershipId, durationInMonths);
  }
}

// ============================================
// CHECK MEMBERSHIP STATUS USE CASE
// ============================================

@Injectable()
export class CheckMembershipStatusUseCase {
  constructor(
    @Inject('IMembershipRepository')
    private readonly membershipRepo: IMembershipRepository,
  ) {}

  async execute(membershipId: string): Promise<{
    isActive: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean;
    daysUntilExpiry: number | null;
    autoRenew: boolean;
  }> {
    const membership = await this.membershipRepo.findById(membershipId);
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const now = new Date();
    const endDate = membership.endDate;

    let isExpired = false;
    let isExpiringSoon = false;
    let daysUntilExpiry: number | null = null;

    if (endDate) {
      isExpired = endDate < now;
      daysUntilExpiry = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }

    return {
      isActive: membership.isActive && !isExpired,
      isExpired,
      isExpiringSoon,
      daysUntilExpiry,
      autoRenew: membership.autoRenew,
    };
  }
}
