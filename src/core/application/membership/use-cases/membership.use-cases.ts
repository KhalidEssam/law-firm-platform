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
        // Check if user already has active membership
        const existing = await this.membershipRepo.findActiveByUserId(command.userId);
        if (existing) {
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
        @Inject('IMembershipTierRepository')
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
            amount: Money.create(command.amount, command.currency),
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