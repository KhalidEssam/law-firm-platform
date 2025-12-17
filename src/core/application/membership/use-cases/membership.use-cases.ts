// ============================================
// MEMBERSHIP USE CASES - COMPLETE COLLECTION
// core/application/membership/use-cases/
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Membership } from '../../../domain/membership/entities/membership.entity';
import { MembershipTier } from '../../../domain/membership/entities/membership-tier.entity';
import { MembershipPayment } from '../../../domain/membership/entities/membership-payment.entity';
// import { MembershipCoupon } from '../../../domain/membership/entities/membership-coupon.entity';
import { MembershipQuotaUsage } from '../../../domain/membership/entities/membership-quota-usage.entity';
import { MembershipCouponRedemption } from '../../../domain/membership/entities/membership-coupon-redemption.entity';
import { QuotaResource } from '../../../domain/membership/value-objects/quota-resource.vo';
import { Money } from '../../../domain/membership/value-objects/money.vo';
import {
    type IMembershipRepository,
    type IMembershipTierRepository,
    type IMembershipPaymentRepository,
    type IMembershipCouponRepository,
    type IMembershipCouponRedemptionRepository,
    type IMembershipQuotaUsageRepository,
} from '../ports/repository';

// ============================================
// 1. CREATE MEMBERSHIP USE CASE
// ============================================

export interface CreateMembershipCommand {
    userId: string;
    tierId: number;
    couponCode?: string;
}

@Injectable()
export class CreateMembershipUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
        @Inject('IMembershipTierRepository')
        private readonly tierRepo: IMembershipTierRepository,
        @Inject('IMembershipQuotaUsageRepository')
        private readonly quotaRepo: IMembershipQuotaUsageRepository,
    ) { }

    async execute(command: CreateMembershipCommand): Promise<Membership> {
        // Check if user already has ANY membership (userId is unique in schema)
        const existingAny = await this.membershipRepo.findByUserId(command.userId);
        if (existingAny) {
            // If membership exists but is inactive/expired, suggest reactivation
            if (!existingAny.isActive) {
                throw new ConflictException(
                    'User has an inactive membership. Please use the reactivate endpoint instead: POST /memberships/{id}/reactivate'
                );
            }
            throw new ConflictException('User already has an active membership');
        }

        // Get tier
        const tier = await this.tierRepo.findById(command.tierId);
        if (!tier) {
            throw new NotFoundException('Membership tier not found');
        }

        if (!tier.canBeSubscribed()) {
            throw new BadRequestException('This tier is not available for subscription');
        }

        // Calculate end date based on billing cycle
        const startDate = new Date();
        const endDate = new Date(startDate);
        const cycleMonths = tier.billingCycle.getMonths();
        endDate.setMonth(endDate.getMonth() + cycleMonths);

        // Create membership
        const membership = Membership.create({
            userId: command.userId,
            tierId: command.tierId,
            price: tier.price,
            billingCycle: tier.billingCycle,
            startDate,
            endDate,
            isActive: true,
            autoRenew: true,
        });

        const created = await this.membershipRepo.create(membership);

        // Initialize quota usage
        await this.quotaRepo.create(
            MembershipQuotaUsage.create({
                membershipId: created.id,
                periodStart: startDate,
                periodEnd: endDate,
            })
        );

        return created;
    }
}

// ============================================
// 2. GET MEMBERSHIP BY ID USE CASE
// ============================================

@Injectable()
export class GetMembershipByIdUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
    ) { }

    async execute(id: string): Promise<Membership> {
        const membership = await this.membershipRepo.findById(id);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }
        return membership;
    }
}

// ============================================
// 3. GET ACTIVE MEMBERSHIP BY USER USE CASE
// ============================================

@Injectable()
export class GetActiveMembershipByUserUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
    ) { }

    async execute(userId: string): Promise<Membership | null> {
        return await this.membershipRepo.findActiveByUserId(userId);
    }
}

// ============================================
// 4. CANCEL MEMBERSHIP USE CASE
// ============================================

@Injectable()
export class CancelMembershipUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
    ) { }

    async execute(membershipId: string): Promise<Membership> {
        const membership = await this.membershipRepo.findById(membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        if (!membership.isActive) {
            throw new BadRequestException('Membership is already cancelled');
        }

        return await this.membershipRepo.cancel(membershipId);
    }
}

// ============================================
// 5. RENEW MEMBERSHIP USE CASE
// ============================================

export interface RenewMembershipCommand {
    membershipId: string;
    durationInMonths?: number;
}

@Injectable()
export class RenewMembershipUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
        @Inject('IMembershipTierRepository')
        private readonly tierRepo: IMembershipTierRepository,
    ) { }

    async execute(command: RenewMembershipCommand): Promise<Membership> {
        const membership = await this.membershipRepo.findById(command.membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        // Get tier to determine billing cycle
        const tier = await this.tierRepo.findById(membership.tierId);
        if (!tier) {
            throw new NotFoundException('Membership tier not found');
        }

        const duration = command.durationInMonths || tier.billingCycle.getMonths();
        return await this.membershipRepo.renew(command.membershipId, duration);
    }
}

// ============================================
// 6. TOGGLE AUTO RENEW USE CASE
// ============================================

@Injectable()
export class ToggleAutoRenewUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
    ) { }

    async execute(membershipId: string, autoRenew: boolean): Promise<Membership> {
        const membership = await this.membershipRepo.findById(membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        return await this.membershipRepo.toggleAutoRenew(membershipId, autoRenew);
    }
}

// ============================================
// 7. APPLY COUPON USE CASE
// ============================================

@Injectable()
export class ApplyCouponUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
        @Inject('IMembershipTierRepository')
        private readonly tierRepo: IMembershipTierRepository,
        @Inject('IMembershipCouponRepository')
        private readonly couponRepo: IMembershipCouponRepository,
        @Inject('IMembershipCouponRedemptionRepository')
        private readonly redemptionRepo: IMembershipCouponRedemptionRepository,
    ) { }

    async execute(membershipId: string, couponCode: string): Promise<{ discountAmount: number }> {
        // Validate membership
        const membership = await this.membershipRepo.findById(membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        // Validate coupon
        const validationResult = await this.couponRepo.validateCoupon(couponCode);
        if (!validationResult.valid) {
            throw new BadRequestException(validationResult.reason || 'Invalid coupon');
        }

        const coupon = validationResult.coupon!;

        // Check if already redeemed
        const alreadyRedeemed = await this.redemptionRepo.hasUserRedeemedCoupon(membershipId, coupon.id);
        if (alreadyRedeemed) {
            throw new BadRequestException('Coupon already redeemed for this membership');
        }

        // Get tier price
        const tier = await this.tierRepo.findById(membership.tierId);
        if (!tier) {
            throw new NotFoundException('Membership tier not found');
        }

        // Calculate discount
        const discountAmount = coupon.calculateDiscount(tier.price.amount);

        // Create redemption
        await this.redemptionRepo.create(
            MembershipCouponRedemption.create({
                membershipId,
                couponId: coupon.id,
            })
        );

        // Increment coupon usage
        await this.couponRepo.incrementUsage(coupon.id);

        return { discountAmount };
    }
}

// ============================================
// 8. CHECK QUOTA USE CASE
// ============================================

@Injectable()
export class CheckQuotaUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
        @Inject('IMembershipTierRepository')
        private readonly tierRepo: IMembershipTierRepository,
        @Inject('IMembershipQuotaUsageRepository')
        private readonly quotaRepo: IMembershipQuotaUsageRepository,
    ) { }

    async execute(membershipId: string, resource: QuotaResource): Promise<{
        used: number;
        limit: number | null; // null = unlimited
        remaining: number | null;
    }> {
        const membership = await this.membershipRepo.findById(membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        const tier = await this.tierRepo.findById(membership.tierId);
        if (!tier) {
            throw new NotFoundException('Membership tier not found');
        }

        const quotaUsage = await this.quotaRepo.findCurrentByMembership(membershipId);
        const used = quotaUsage?.getUsage(resource) || 0;

        const resourceMap: Record<QuotaResource, keyof typeof tier.quota> = {
            [QuotaResource.CONSULTATIONS]: 'consultationsPerMonth',
            [QuotaResource.OPINIONS]: 'opinionsPerMonth',
            [QuotaResource.SERVICES]: 'servicesPerMonth',
            [QuotaResource.CASES]: 'casesPerMonth',
            [QuotaResource.CALL_MINUTES]: 'callMinutesPerMonth',
        };

        const limit = tier.getQuotaLimit(resourceMap[resource]) || null;
        const remaining = limit !== null ? Math.max(0, limit - used) : null;

        return { used, limit, remaining };
    }
}

// ============================================
// 9. CONSUME QUOTA USE CASE
// ============================================

@Injectable()
export class ConsumeQuotaUseCase {
    constructor(
        @Inject('IMembershipRepository')
        private readonly membershipRepo: IMembershipRepository,
        @Inject('IMembershipTierRepository')
        private readonly tierRepo: IMembershipTierRepository,
        @Inject('IMembershipQuotaUsageRepository')
        private readonly quotaRepo: IMembershipQuotaUsageRepository,
    ) { }

    async execute(membershipId: string, resource: QuotaResource, amount: number): Promise<void> {
        const membership = await this.membershipRepo.findById(membershipId);
        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        if (!membership.isActive) {
            throw new BadRequestException('Membership is not active');
        }

        const tier = await this.tierRepo.findById(membership.tierId);
        if (!tier) {
            throw new NotFoundException('Membership tier not found');
        }

        // Get tier limit
        const resourceMap: Record<QuotaResource, keyof typeof tier.quota> = {
            [QuotaResource.CONSULTATIONS]: 'consultationsPerMonth',
            [QuotaResource.OPINIONS]: 'opinionsPerMonth',
            [QuotaResource.SERVICES]: 'servicesPerMonth',
            [QuotaResource.CASES]: 'casesPerMonth',
            [QuotaResource.CALL_MINUTES]: 'callMinutesPerMonth',
        };

        const limit = tier.getQuotaLimit(resourceMap[resource]);

        // Check if has available quota
        const hasQuota = await this.quotaRepo.hasAvailableQuota(membershipId, resource, amount, limit);
        if (!hasQuota) {
            throw new BadRequestException(`Insufficient quota for ${resource}`);
        }

        // Consume quota
        await this.quotaRepo.incrementUsage(membershipId, resource, amount);
    }
}

// ============================================
// 10. LIST TIERS USE CASE
// ============================================

@Injectable()
export class ListMembershipTiersUseCase {
    constructor(
        @Inject('IMembershipTierRepository') // 👈 ADD THIS
        private readonly tierRepo: IMembershipTierRepository,
    ) { }

    async execute(options?: { isActive?: boolean }): Promise<MembershipTier[]> {
        return await this.tierRepo.findAll(options);
    }
}

// ============================================
// 11. CREATE PAYMENT USE CASE
// ============================================

export interface CreatePaymentCommand {
    invoiceId: string;
    provider: 'moyasar' | 'hyperpay' | 'stripe' | 'paypal';
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
}

@Injectable()
export class CreatePaymentUseCase {
    constructor(
        @Inject('IMembershipPaymentRepository')
        private readonly paymentRepo: IMembershipPaymentRepository,
    ) { }

    async execute(command: CreatePaymentCommand): Promise<MembershipPayment> {
        const payment = MembershipPayment.create({
            invoiceId: command.invoiceId,
            provider: command.provider,
            amount: Money.create({ amount: command.amount, currency: command.currency }),
            metadata: command.metadata,
        });

        return await this.paymentRepo.create(payment);
    }
}

// ============================================
// 12. COMPLETE PAYMENT USE CASE
// ============================================

@Injectable()
export class CompletePaymentUseCase {
    constructor(
        @Inject('IMembershipPaymentRepository')
        private readonly paymentRepo: IMembershipPaymentRepository,
    ) { }

    async execute(paymentId: string, providerTxnId: string): Promise<MembershipPayment> {
        const payment = await this.paymentRepo.findById(paymentId);
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.isSuccessful()) {
            throw new BadRequestException('Payment already completed');
        }

        return await this.paymentRepo.markAsCompleted(paymentId, providerTxnId);
    }
}








// ============================================
// TIER USE CASES
// core/application/membership/use-cases/tier.use-cases.ts
// ============================================

import { BillingCycle } from '../../../domain/membership/value-objects/billing-cycle.vo';
import { CreateMembershipTierDto, UpdateMembershipTierDto } from '../dto/index.dto';

// ============================================
// CREATE MEMBERSHIP TIER USE CASE
// ============================================
@Injectable()
export class CreateMembershipTierUseCase {
    constructor(
        @Inject('IMembershipTierRepository') // 👈 ADD THIS
        private readonly tierRepository: IMembershipTierRepository,
    ) { }

    async execute(dto: CreateMembershipTierDto): Promise<MembershipTier> {
        // Check if tier with same name already exists
        const existingTier = await this.tierRepository.findByName(dto.name);
        if (existingTier) {
            throw new BadRequestException(`Tier with name "${dto.name}" already exists`);
        }

        // Normalize quota field names (support both user-friendly and internal names)
        const normalizedQuota = dto.quota ? {
            consultationsPerMonth: (dto.quota as any).consultationsPerMonth ?? (dto.quota as any).consultations,
            opinionsPerMonth: (dto.quota as any).opinionsPerMonth ?? (dto.quota as any).legalOpinions,
            servicesPerMonth: (dto.quota as any).servicesPerMonth ?? (dto.quota as any).services,
            casesPerMonth: (dto.quota as any).casesPerMonth ?? (dto.quota as any).litigationCases,
            callMinutesPerMonth: (dto.quota as any).callMinutesPerMonth ?? (dto.quota as any).callMinutes,
        } : {};

        // Create tier entity
        const tier = MembershipTier.create({
            name: dto.name,
            nameAr: dto.nameAr,
            description: dto.description,
            descriptionAr: dto.descriptionAr,
            price: Money.create({
                amount: dto.price,
                currency: dto.currency || 'SAR',
            }),
            billingCycle: BillingCycle.fromValue(dto.billingCycle),
            quota: normalizedQuota,
            benefits: dto.benefits || [],
            isActive: dto.isActive !== undefined ? dto.isActive : true,
        });

        // Persist to database
        return await this.tierRepository.create(tier);
    }
}

// ============================================
// GET MEMBERSHIP TIER BY ID USE CASE
// ============================================
@Injectable()
export class GetMembershipTierByIdUseCase {
    constructor(
        @Inject('IMembershipTierRepository') // 👈 ADD THIS
        private readonly tierRepository: IMembershipTierRepository,
    ) { }

    async execute(tierId: number): Promise<MembershipTier> {
        const tier = await this.tierRepository.findById(tierId);

        if (!tier) {
            throw new NotFoundException(`Membership tier with ID ${tierId} not found`);
        }

        return tier;
    }
}

// ============================================
// UPDATE MEMBERSHIP TIER USE CASE
// ============================================
@Injectable()
export class UpdateMembershipTierUseCase {
    constructor(
        @Inject('IMembershipTierRepository') // 👈 ADD THIS
        private readonly tierRepository: IMembershipTierRepository,
    ) { }

    async execute(tierId: number, dto: UpdateMembershipTierDto): Promise<MembershipTier> {
        // Find existing tier
        const existingTier = await this.tierRepository.findById(tierId);
        if (!existingTier) {
            throw new NotFoundException(`Membership tier with ID ${tierId} not found`);
        }

        // Check if name is being changed and if new name conflicts
        if (dto.name && dto.name !== existingTier.name) {
            const conflictingTier = await this.tierRepository.findByName(dto.name);
            if (conflictingTier && conflictingTier.id !== tierId) {
                throw new BadRequestException(`Tier with name "${dto.name}" already exists`);
            }
        }

        // Update tier properties
        if (dto.name !== undefined) {
            existingTier.name = dto.name;
        }
        if (dto.nameAr !== undefined) {
            existingTier.nameAr = dto.nameAr;
        }
        if (dto.description !== undefined) {
            existingTier.description = dto.description;
        }
        if (dto.descriptionAr !== undefined) {
            existingTier.descriptionAr = dto.descriptionAr;
        }
        if (dto.price !== undefined) {
            existingTier.price = Money.create({
                amount: dto.price,
                currency: dto.currency || existingTier.price.currency,
            });
        }
        if (dto.billingCycle !== undefined) {
            existingTier.billingCycle = BillingCycle.fromValue(dto.billingCycle);
        }
        if (dto.quota !== undefined) {
            // Normalize quota field names (support both user-friendly and internal names)
            existingTier.quota = {
                consultationsPerMonth: (dto.quota as any).consultationsPerMonth ?? (dto.quota as any).consultations,
                opinionsPerMonth: (dto.quota as any).opinionsPerMonth ?? (dto.quota as any).legalOpinions,
                servicesPerMonth: (dto.quota as any).servicesPerMonth ?? (dto.quota as any).services,
                casesPerMonth: (dto.quota as any).casesPerMonth ?? (dto.quota as any).litigationCases,
                callMinutesPerMonth: (dto.quota as any).callMinutesPerMonth ?? (dto.quota as any).callMinutes,
            };
        }
        if (dto.benefits !== undefined) {
            existingTier.benefits = dto.benefits;
        }
        if (dto.isActive !== undefined) {
            existingTier.isActive = dto.isActive;
        }

        // Update timestamp
        existingTier.updatedAt = new Date();

        // Persist changes
        return await this.tierRepository.update(existingTier);
    }
}

// ============================================
// DELETE MEMBERSHIP TIER USE CASE
// ============================================
@Injectable()
export class DeleteMembershipTierUseCase {
    constructor(
        @Inject('IMembershipTierRepository') // 👈 ADD THIS
        private readonly tierRepository: IMembershipTierRepository,
    ) { }

    async execute(tierId: number): Promise<void> {
        // Find existing tier
        const tier = await this.tierRepository.findById(tierId);
        if (!tier) {
            throw new NotFoundException(`Membership tier with ID ${tierId} not found`);
        }

        // Check if tier has active memberships
        const hasActiveMemberships = await this.tierRepository.hasActiveMemberships(tierId);
        if (hasActiveMemberships) {
            throw new BadRequestException(
                'Cannot delete tier with active memberships. Please deactivate the tier instead.',
            );
        }

        // Soft delete the tier
        await this.tierRepository.delete(tierId);
    }
}
