// ============================================
// MEMBERSHIP INTEGRATION SERVICE
// Provides cross-module integration for quota checking and service usage tracking
// src/core/application/membership/services/membership-integration.service.ts
// ============================================

import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { QuotaResource } from '../../../domain/membership/value-objects/quota-resource.vo';
import {
  type IMembershipRepository,
  type IMembershipTierRepository,
  type IMembershipQuotaUsageRepository,
  type IServiceUsageRepository,
  type ITierServiceRepository,
} from '../ports/repository';
import { ServiceUsage } from '../../../domain/membership/entities/service-usage.entity';

// ============================================
// SERVICE TYPES
// ============================================
export enum ServiceType {
  CONSULTATION = 'consultation',
  LEGAL_OPINION = 'legal_opinion',
  LITIGATION = 'litigation',
  CALL = 'call',
  SERVICE_REQUEST = 'service_request',
}

// Map service types to quota resources
const SERVICE_TO_QUOTA: Record<ServiceType, QuotaResource> = {
  [ServiceType.CONSULTATION]: QuotaResource.CONSULTATIONS,
  [ServiceType.LEGAL_OPINION]: QuotaResource.OPINIONS,
  [ServiceType.LITIGATION]: QuotaResource.CASES,
  [ServiceType.CALL]: QuotaResource.CALL_MINUTES,
  [ServiceType.SERVICE_REQUEST]: QuotaResource.SERVICES,
};

// ============================================
// DTOs
// ============================================
export interface MembershipValidationResult {
  isValid: boolean;
  membershipId: string | null;
  tierId: number | null;
  tierName: string | null;
  hasQuota: boolean;
  quotaRemaining: number | null;
  quotaLimit: number | null;
  quotaUsed: number;
  isUnlimited: boolean;
  errorMessage?: string;
}

export interface RecordUsageDto {
  userId: string;
  serviceType: ServiceType;
  requestId: string;
  chargedAmount?: number;
  currency?: string;
}

export interface UsageRecordResult {
  serviceUsageId: string;
  membershipId: string;
  quotaRemaining: number | null;
  wasCharged: boolean;
  chargedAmount: number;
}

// ============================================
// MEMBERSHIP INTEGRATION SERVICE
// ============================================

@Injectable()
export class MembershipIntegrationService {
  constructor(
    @Inject('IMembershipRepository')
    private readonly membershipRepo: IMembershipRepository,
    @Inject('IMembershipTierRepository')
    private readonly tierRepo: IMembershipTierRepository,
    @Inject('IMembershipQuotaUsageRepository')
    private readonly quotaUsageRepo: IMembershipQuotaUsageRepository,
    @Inject('IServiceUsageRepository')
    private readonly serviceUsageRepo: IServiceUsageRepository,
    @Inject('ITierServiceRepository')
    private readonly tierServiceRepo: ITierServiceRepository,
  ) {}

  // ============================================
  // VALIDATE MEMBERSHIP FOR SERVICE
  // Check if user can use a service based on membership and quota
  // ============================================
  async validateMembershipForService(
    userId: string,
    serviceType: ServiceType,
  ): Promise<MembershipValidationResult> {
    // 1. Find active membership
    const membership = await this.membershipRepo.findActiveByUserId(userId);

    if (!membership) {
      return {
        isValid: false,
        membershipId: null,
        tierId: null,
        tierName: null,
        hasQuota: false,
        quotaRemaining: null,
        quotaLimit: null,
        quotaUsed: 0,
        isUnlimited: false,
        errorMessage:
          'No active membership found. Please subscribe to a membership plan.',
      };
    }

    if (!membership.isActive) {
      return {
        isValid: false,
        membershipId: membership.id,
        tierId: membership.tierId,
        tierName: null,
        hasQuota: false,
        quotaRemaining: null,
        quotaLimit: null,
        quotaUsed: 0,
        isUnlimited: false,
        errorMessage:
          'Your membership is not active. Please renew your subscription.',
      };
    }

    // Check if membership is expired
    if (membership.endDate && membership.endDate < new Date()) {
      return {
        isValid: false,
        membershipId: membership.id,
        tierId: membership.tierId,
        tierName: null,
        hasQuota: false,
        quotaRemaining: null,
        quotaLimit: null,
        quotaUsed: 0,
        isUnlimited: false,
        errorMessage:
          'Your membership has expired. Please renew your subscription.',
      };
    }

    // 2. Get tier details
    const tier = await this.tierRepo.findById(membership.tierId);
    if (!tier) {
      return {
        isValid: false,
        membershipId: membership.id,
        tierId: membership.tierId,
        tierName: null,
        hasQuota: false,
        quotaRemaining: null,
        quotaLimit: null,
        quotaUsed: 0,
        isUnlimited: false,
        errorMessage: 'Membership tier configuration not found.',
      };
    }

    // 3. Get quota information
    const quotaResource = SERVICE_TO_QUOTA[serviceType];
    const resourceMap: Record<QuotaResource, keyof typeof tier.quota> = {
      [QuotaResource.CONSULTATIONS]: 'consultationsPerMonth',
      [QuotaResource.OPINIONS]: 'opinionsPerMonth',
      [QuotaResource.SERVICES]: 'servicesPerMonth',
      [QuotaResource.CASES]: 'casesPerMonth',
      [QuotaResource.CALL_MINUTES]: 'callMinutesPerMonth',
    };

    const quotaKey = resourceMap[quotaResource];
    const quotaLimitValue = tier.getQuotaLimit(quotaKey);
    const quotaLimit = quotaLimitValue ?? null;
    const isUnlimited = quotaLimit === null;

    // 4. Get current usage
    const quotaUsage = await this.quotaUsageRepo.findCurrentByMembership(
      membership.id,
    );
    const quotaUsed = quotaUsage?.getUsage(quotaResource) || 0;

    // 5. Calculate remaining quota
    let quotaRemaining: number | null = null;
    let hasQuota = true;

    if (!isUnlimited && quotaLimit !== null) {
      quotaRemaining = Math.max(0, quotaLimit - quotaUsed);
      hasQuota = quotaRemaining > 0;
    }

    if (!hasQuota && !isUnlimited) {
      return {
        isValid: false,
        membershipId: membership.id,
        tierId: membership.tierId,
        tierName: tier.name,
        hasQuota: false,
        quotaRemaining: 0,
        quotaLimit,
        quotaUsed,
        isUnlimited: false,
        errorMessage: `You have reached your monthly quota for ${serviceType.replace('_', ' ')}s. Used: ${quotaUsed}/${quotaLimit}. Please upgrade your plan or wait until next billing cycle.`,
      };
    }

    return {
      isValid: true,
      membershipId: membership.id,
      tierId: membership.tierId,
      tierName: tier.name,
      hasQuota: true,
      quotaRemaining,
      quotaLimit,
      quotaUsed,
      isUnlimited,
    };
  }

  // ============================================
  // RECORD SERVICE USAGE
  // Record when a service is consumed and update quota
  // ============================================
  async recordServiceUsage(dto: RecordUsageDto): Promise<UsageRecordResult> {
    // 1. Find active membership
    const membership = await this.membershipRepo.findActiveByUserId(dto.userId);
    if (!membership) {
      throw new NotFoundException('No active membership found for user');
    }

    // 2. Get tier for pricing info
    const tier = await this.tierRepo.findById(membership.tierId);

    // 3. Check if this request already has usage recorded
    const requestTypeMap: Record<
      ServiceType,
      'consultation' | 'legal_opinion' | 'service' | 'litigation' | 'call'
    > = {
      [ServiceType.CONSULTATION]: 'consultation',
      [ServiceType.LEGAL_OPINION]: 'legal_opinion',
      [ServiceType.LITIGATION]: 'litigation',
      [ServiceType.CALL]: 'call',
      [ServiceType.SERVICE_REQUEST]: 'service',
    };

    const alreadyRecorded = await this.serviceUsageRepo.hasUsageForRequest(
      requestTypeMap[dto.serviceType],
      dto.requestId,
    );

    if (alreadyRecorded) {
      throw new BadRequestException(
        'Service usage already recorded for this request',
      );
    }

    // 4. Calculate period dates
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd =
      membership.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 5. Build service usage entity
    const serviceUsageData: any = {
      membershipId: membership.id,
      serviceId: dto.serviceType,
      usedAt: now,
      periodStart,
      periodEnd,
      chargedAmount: dto.chargedAmount || 0,
      currency: dto.currency || 'SAR',
      isBilled: false,
    };

    // Set the appropriate request ID
    switch (dto.serviceType) {
      case ServiceType.CONSULTATION:
        serviceUsageData.consultationId = dto.requestId;
        break;
      case ServiceType.LEGAL_OPINION:
        serviceUsageData.legalOpinionId = dto.requestId;
        break;
      case ServiceType.LITIGATION:
        serviceUsageData.litigationCaseId = dto.requestId;
        break;
      case ServiceType.CALL:
        serviceUsageData.callRequestId = dto.requestId;
        break;
      case ServiceType.SERVICE_REQUEST:
        serviceUsageData.serviceRequestId = dto.requestId;
        break;
    }

    const serviceUsage = ServiceUsage.create(serviceUsageData);

    // 6. Save usage record
    const savedUsage = await this.serviceUsageRepo.create(serviceUsage);

    // 7. Update quota usage
    const quotaResource = SERVICE_TO_QUOTA[dto.serviceType];
    await this.quotaUsageRepo.incrementUsage(membership.id, quotaResource, 1);

    // 8. Get updated quota info
    const quotaUsage = await this.quotaUsageRepo.findCurrentByMembership(
      membership.id,
    );
    const quotaUsed = quotaUsage?.getUsage(quotaResource) || 0;

    let quotaLimit: number | null = null;
    let quotaRemaining: number | null = null;

    if (tier) {
      const resourceMap: Record<QuotaResource, keyof typeof tier.quota> = {
        [QuotaResource.CONSULTATIONS]: 'consultationsPerMonth',
        [QuotaResource.OPINIONS]: 'opinionsPerMonth',
        [QuotaResource.SERVICES]: 'servicesPerMonth',
        [QuotaResource.CASES]: 'casesPerMonth',
        [QuotaResource.CALL_MINUTES]: 'callMinutesPerMonth',
      };

      const limitValue = tier.getQuotaLimit(resourceMap[quotaResource]);
      quotaLimit = limitValue ?? null;
      quotaRemaining =
        quotaLimit !== null ? Math.max(0, quotaLimit - quotaUsed) : null;
    }

    return {
      serviceUsageId: savedUsage.id,
      membershipId: membership.id,
      quotaRemaining,
      wasCharged: (dto.chargedAmount || 0) > 0,
      chargedAmount: dto.chargedAmount || 0,
    };
  }

  // ============================================
  // GET MEMBERSHIP STATUS
  // Quick check of user's membership status
  // ============================================
  async getMembershipStatus(userId: string): Promise<{
    hasMembership: boolean;
    isActive: boolean;
    membershipId: string | null;
    tierName: string | null;
    expiresAt: Date | null;
    daysUntilExpiry: number | null;
  }> {
    const membership = await this.membershipRepo.findActiveByUserId(userId);

    if (!membership) {
      return {
        hasMembership: false,
        isActive: false,
        membershipId: null,
        tierName: null,
        expiresAt: null,
        daysUntilExpiry: null,
      };
    }

    const tier = await this.tierRepo.findById(membership.tierId);
    const now = new Date();
    const daysUntilExpiry = membership.endDate
      ? Math.ceil(
          (membership.endDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      hasMembership: true,
      isActive:
        membership.isActive &&
        (!membership.endDate || membership.endDate > now),
      membershipId: membership.id,
      tierName: tier?.name ?? null,
      expiresAt: membership.endDate ?? null,
      daysUntilExpiry,
    };
  }

  // ============================================
  // GET QUOTA SUMMARY
  // Get all quota information for a user
  // ============================================
  async getQuotaSummary(userId: string): Promise<{
    membershipId: string;
    tierName: string;
    quotas: {
      serviceType: ServiceType;
      used: number;
      limit: number | null;
      remaining: number | null;
      isUnlimited: boolean;
    }[];
  } | null> {
    const membership = await this.membershipRepo.findActiveByUserId(userId);
    if (!membership) {
      return null;
    }

    const tier = await this.tierRepo.findById(membership.tierId);
    if (!tier) {
      return null;
    }

    const quotaUsage = await this.quotaUsageRepo.findCurrentByMembership(
      membership.id,
    );

    const quotas: {
      serviceType: ServiceType;
      used: number;
      limit: number | null;
      remaining: number | null;
      isUnlimited: boolean;
    }[] = [];

    const resourceMap: Record<QuotaResource, keyof typeof tier.quota> = {
      [QuotaResource.CONSULTATIONS]: 'consultationsPerMonth',
      [QuotaResource.OPINIONS]: 'opinionsPerMonth',
      [QuotaResource.SERVICES]: 'servicesPerMonth',
      [QuotaResource.CASES]: 'casesPerMonth',
      [QuotaResource.CALL_MINUTES]: 'callMinutesPerMonth',
    };

    for (const [serviceType, quotaResource] of Object.entries(
      SERVICE_TO_QUOTA,
    )) {
      const quotaKey = resourceMap[quotaResource];
      const limitValue = tier.getQuotaLimit(quotaKey);
      const limit = limitValue ?? null;
      const used = quotaUsage?.getUsage(quotaResource) || 0;
      const isUnlimited = limit === null;
      const remaining = isUnlimited ? null : Math.max(0, limit - used);

      quotas.push({
        serviceType: serviceType as ServiceType,
        used,
        limit,
        remaining,
        isUnlimited,
      });
    }

    return {
      membershipId: membership.id,
      tierName: tier.name,
      quotas,
    };
  }

  // ============================================
  // CHECK CAN USE SERVICE (Simple boolean check)
  // ============================================
  async canUseService(
    userId: string,
    serviceType: ServiceType,
  ): Promise<boolean> {
    const validation = await this.validateMembershipForService(
      userId,
      serviceType,
    );
    return validation.isValid;
  }

  // ============================================
  // GET UNBILLED USAGE FOR BILLING
  // ============================================
  async getUnbilledUsage(membershipId: string): Promise<ServiceUsage[]> {
    return await this.serviceUsageRepo.getUnbilledUsage(membershipId);
  }

  // ============================================
  // MARK USAGE AS BILLED
  // ============================================
  async markUsageAsBilled(
    usageId: string,
    amount: number,
    currency: string,
  ): Promise<ServiceUsage> {
    return await this.serviceUsageRepo.markAsBilled(usageId, amount, currency);
  }
}
