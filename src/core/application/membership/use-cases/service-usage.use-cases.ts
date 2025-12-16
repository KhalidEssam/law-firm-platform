// ============================================
// SERVICE USAGE USE CASES
// core/application/membership/use-cases/service-usage.use-cases.ts
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ServiceUsage } from '../../../domain/membership/entities/service-usage.entity';
import { IServiceUsageRepository, ServiceUsageSummary, IMembershipRepository, ITierServiceRepository } from '../ports/repository';

// ============================================
// DTOs
// ============================================

export interface RecordServiceUsageDto {
    membershipId: string;
    serviceId: string;
    consultationId?: string;
    legalOpinionId?: string;
    serviceRequestId?: string;
    litigationCaseId?: string;
    callRequestId?: string;
    chargedAmount?: number;
    currency?: string;
}

export interface ServiceUsageHistoryQueryDto {
    serviceId?: string;
    periodStart?: Date;
    periodEnd?: Date;
    limit?: number;
    offset?: number;
}

export interface ServiceUsageResponseDto {
    id: string;
    membershipId: string;
    serviceId: string;
    requestType: string | null;
    requestId: string | null;
    usedAt: Date;
    periodStart: Date;
    periodEnd: Date;
    chargedAmount: number | null;
    currency: string;
    isBilled: boolean;
}

// ============================================
// RECORD SERVICE USAGE USE CASE
// ============================================

@Injectable()
export class RecordServiceUsageUseCase {
    constructor(
        @Inject('IServiceUsageRepository')
        private readonly serviceUsageRepo: IServiceUsageRepository,
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
        @Inject('ITierServiceRepository')
        private readonly tierServiceRepo: ITierServiceRepository,
    ) {}

    async execute(dto: RecordServiceUsageDto): Promise<ServiceUsage> {
        // Verify membership exists and is active
        const membership = await this.membershipRepo.findById(dto.membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        if (!membership.isActive) {
            throw new BadRequestException('Membership is not active');
        }

        // Get current billing period
        const periodStart = membership.startDate;
        const periodEnd = membership.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        // Check quota if tier service exists
        const tierService = await this.tierServiceRepo.findByTierAndService(membership.tierId, dto.serviceId);
        if (tierService && tierService.quotaPerMonth !== null) {
            const currentMonthStart = new Date();
            currentMonthStart.setDate(1);
            currentMonthStart.setHours(0, 0, 0, 0);

            const currentMonthEnd = new Date(currentMonthStart);
            currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);

            const usageCount = await this.serviceUsageRepo.countUsageInPeriod(
                dto.membershipId,
                dto.serviceId,
                currentMonthStart,
                currentMonthEnd,
            );

            if (usageCount >= tierService.quotaPerMonth) {
                throw new BadRequestException(`Monthly quota exceeded for this service (${tierService.quotaPerMonth} per month)`);
            }
        }

        const serviceUsage = ServiceUsage.create({
            membershipId: dto.membershipId,
            serviceId: dto.serviceId,
            consultationId: dto.consultationId,
            legalOpinionId: dto.legalOpinionId,
            serviceRequestId: dto.serviceRequestId,
            litigationCaseId: dto.litigationCaseId,
            callRequestId: dto.callRequestId,
            periodStart,
            periodEnd,
            chargedAmount: dto.chargedAmount,
            currency: dto.currency,
        });

        return await this.serviceUsageRepo.create(serviceUsage);
    }
}

// ============================================
// GET SERVICE USAGE HISTORY USE CASE
// ============================================

@Injectable()
export class GetServiceUsageHistoryUseCase {
    constructor(
        @Inject('IServiceUsageRepository')
        private readonly serviceUsageRepo: IServiceUsageRepository,
    ) {}

    async execute(membershipId: string, query: ServiceUsageHistoryQueryDto): Promise<ServiceUsage[]> {
        return await this.serviceUsageRepo.findByMembershipId(membershipId, {
            serviceId: query.serviceId,
            periodStart: query.periodStart,
            periodEnd: query.periodEnd,
            limit: query.limit || 50,
            offset: query.offset || 0,
        });
    }
}

// ============================================
// GET SERVICE USAGE BY ID USE CASE
// ============================================

@Injectable()
export class GetServiceUsageByIdUseCase {
    constructor(
        @Inject('IServiceUsageRepository')
        private readonly serviceUsageRepo: IServiceUsageRepository,
    ) {}

    async execute(id: string): Promise<ServiceUsage> {
        const usage = await this.serviceUsageRepo.findById(id);
        if (!usage) {
            throw new NotFoundException('Service usage not found');
        }
        return usage;
    }
}

// ============================================
// GET SERVICE USAGE SUMMARY USE CASE
// ============================================

@Injectable()
export class GetServiceUsageSummaryUseCase {
    constructor(
        @Inject('IServiceUsageRepository')
        private readonly serviceUsageRepo: IServiceUsageRepository,
    ) {}

    async execute(
        membershipId: string,
        periodStart?: Date,
        periodEnd?: Date,
    ): Promise<ServiceUsageSummary[]> {
        return await this.serviceUsageRepo.getUsageSummaryByService(membershipId, periodStart, periodEnd);
    }
}

// ============================================
// GET TOTAL USAGE COUNT USE CASE
// ============================================

@Injectable()
export class GetTotalUsageCountUseCase {
    constructor(
        @Inject('IServiceUsageRepository')
        private readonly serviceUsageRepo: IServiceUsageRepository,
    ) {}

    async execute(
        membershipId: string,
        periodStart: Date,
        periodEnd: Date,
    ): Promise<number> {
        return await this.serviceUsageRepo.getTotalUsageCount(membershipId, periodStart, periodEnd);
    }
}

// ============================================
// MARK USAGE AS BILLED USE CASE
// ============================================

@Injectable()
export class MarkUsageAsBilledUseCase {
    constructor(
        @Inject('IServiceUsageRepository')
        private readonly serviceUsageRepo: IServiceUsageRepository,
    ) {}

    async execute(id: string, amount: number, currency: string = 'SAR'): Promise<ServiceUsage> {
        const usage = await this.serviceUsageRepo.findById(id);
        if (!usage) {
            throw new NotFoundException('Service usage not found');
        }

        if (usage.isBilled) {
            throw new BadRequestException('Service usage already billed');
        }

        return await this.serviceUsageRepo.markAsBilled(id, amount, currency);
    }
}

// ============================================
// GET UNBILLED USAGE USE CASE
// ============================================

@Injectable()
export class GetUnbilledUsageUseCase {
    constructor(
        @Inject('IServiceUsageRepository')
        private readonly serviceUsageRepo: IServiceUsageRepository,
    ) {}

    async execute(membershipId: string): Promise<ServiceUsage[]> {
        return await this.serviceUsageRepo.getUnbilledUsage(membershipId);
    }
}

// ============================================
// CHECK REMAINING QUOTA USE CASE
// ============================================

@Injectable()
export class CheckRemainingServiceQuotaUseCase {
    constructor(
        @Inject('IServiceUsageRepository')
        private readonly serviceUsageRepo: IServiceUsageRepository,
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
        @Inject('ITierServiceRepository')
        private readonly tierServiceRepo: ITierServiceRepository,
    ) {}

    async execute(membershipId: string, serviceId: string): Promise<{
        used: number;
        limit: number | null;
        remaining: number | null;
        isUnlimited: boolean;
    }> {
        const membership = await this.membershipRepo.findById(membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        const tierService = await this.tierServiceRepo.findByTierAndService(membership.tierId, serviceId);

        // Get current month usage
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const currentMonthEnd = new Date(currentMonthStart);
        currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);

        const used = await this.serviceUsageRepo.countUsageInPeriod(
            membershipId,
            serviceId,
            currentMonthStart,
            currentMonthEnd,
        );

        const limit = tierService?.quotaPerMonth ?? null;
        const isUnlimited = limit === null;
        const remaining = isUnlimited ? null : Math.max(0, limit - used);

        return { used, limit, remaining, isUnlimited };
    }
}
