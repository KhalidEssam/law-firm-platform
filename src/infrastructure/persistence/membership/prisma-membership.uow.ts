// ============================================
// PRISMA MEMBERSHIP UNIT OF WORK
// src/infrastructure/persistence/membership/prisma-membership.uow.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { Prisma, BillingCycle as PrismaBillingCycle, Currency as PrismaCurrency, DiscountType as PrismaDiscountType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    IMembershipUnitOfWork,
    MEMBERSHIP_UNIT_OF_WORK,
} from '../../../core/domain/membership/ports/membership.uow';
import {
    IMembershipRepository,
    IMembershipTierRepository,
    IMembershipCouponRepository,
    IMembershipCouponRedemptionRepository,
    IMembershipQuotaUsageRepository,
} from '../../../core/application/membership/ports/repository';
import {
    FINANCIAL_TRANSACTION_OPTIONS,
    TransactionOptions,
} from '../../../core/domain/shared/ports/base-unit-of-work.interface';
import {
    toPrismaTransactionOptions,
    PrismaTransactionClient,
} from '../shared/prisma-transaction.helper';

// Import domain entities
import { Membership } from '../../../core/domain/membership/entities/membership.entity';
import { MembershipTier, TierQuota } from '../../../core/domain/membership/entities/membership-tier.entity';
import { MembershipCoupon } from '../../../core/domain/membership/entities/membership-coupon.entity';
import { MembershipCouponRedemption } from '../../../core/domain/membership/entities/membership-coupon-redemption.entity';
import { MembershipQuotaUsage } from '../../../core/domain/membership/entities/membership-quota-usage.entity';
import { QuotaResource } from '../../../core/domain/membership/value-objects/quota-resource.vo';

// ============================================
// ENUM MAPPERS (Reusing from prisma.repository.ts pattern)
// ============================================

class BillingCycleMapper {
    private static readonly toPrismaMap: Record<string, PrismaBillingCycle> = {
        'monthly': PrismaBillingCycle.monthly,
        'quarterly': PrismaBillingCycle.quarterly,
        'yearly': PrismaBillingCycle.yearly,
    };

    private static readonly toDomainMap: Record<PrismaBillingCycle, string> = {
        [PrismaBillingCycle.monthly]: 'monthly',
        [PrismaBillingCycle.quarterly]: 'quarterly',
        [PrismaBillingCycle.yearly]: 'yearly',
    };

    static toPrisma(cycle: string): PrismaBillingCycle {
        return this.toPrismaMap[cycle.toLowerCase()] || PrismaBillingCycle.monthly;
    }

    static toDomain(prismaCycle: PrismaBillingCycle): string {
        return this.toDomainMap[prismaCycle];
    }
}

class CurrencyMapper {
    private static readonly toPrismaMap: Record<string, PrismaCurrency> = {
        'SAR': PrismaCurrency.SAR,
        'USD': PrismaCurrency.USD,
        'EUR': PrismaCurrency.EUR,
    };

    private static readonly toDomainMap: Record<PrismaCurrency, string> = {
        [PrismaCurrency.SAR]: 'SAR',
        [PrismaCurrency.USD]: 'USD',
        [PrismaCurrency.EUR]: 'EUR',
    };

    static toPrisma(currency: string): PrismaCurrency {
        return this.toPrismaMap[currency.toUpperCase()] || PrismaCurrency.SAR;
    }

    static toDomain(prismaCurrency: PrismaCurrency): string {
        return this.toDomainMap[prismaCurrency];
    }
}

/**
 * Prisma implementation of the Membership Unit of Work.
 *
 * Provides transactional access to membership repositories with
 * Serializable isolation for preventing race conditions in:
 * - Quota consumption (read-check-update atomicity)
 * - Coupon redemption (single-use enforcement)
 */
@Injectable()
export class PrismaMembershipUnitOfWork implements IMembershipUnitOfWork {
    private _memberships: IMembershipRepository;
    private _tiers: IMembershipTierRepository;
    private _coupons: IMembershipCouponRepository;
    private _redemptions: IMembershipCouponRedemptionRepository;
    private _quotaUsage: IMembershipQuotaUsageRepository;

    constructor(private readonly prisma: PrismaService) {
        // Initialize non-transactional repositories for simple reads
        this._memberships = new TransactionalMembershipRepository(prisma);
        this._tiers = new TransactionalMembershipTierRepository(prisma);
        this._coupons = new TransactionalMembershipCouponRepository(prisma);
        this._redemptions = new TransactionalMembershipCouponRedemptionRepository(prisma);
        this._quotaUsage = new TransactionalMembershipQuotaUsageRepository(prisma);
    }

    get memberships(): IMembershipRepository {
        return this._memberships;
    }

    get tiers(): IMembershipTierRepository {
        return this._tiers;
    }

    get coupons(): IMembershipCouponRepository {
        return this._coupons;
    }

    get redemptions(): IMembershipCouponRedemptionRepository {
        return this._redemptions;
    }

    get quotaUsage(): IMembershipQuotaUsageRepository {
        return this._quotaUsage;
    }

    /**
     * Execute operations within a database transaction.
     * Uses Serializable isolation for quota/coupon operations.
     */
    async transaction<R>(
        work: (uow: IMembershipUnitOfWork) => Promise<R>,
        options?: TransactionOptions,
    ): Promise<R> {
        const prismaOptions = toPrismaTransactionOptions(
            options ?? FINANCIAL_TRANSACTION_OPTIONS,
        );

        return await this.prisma.$transaction(async (tx) => {
            const transactionalUow = this.createTransactionalUow(tx);
            return await work(transactionalUow);
        }, prismaOptions);
    }

    /**
     * Creates a new UoW instance that uses the transaction client.
     */
    private createTransactionalUow(tx: PrismaTransactionClient): IMembershipUnitOfWork {
        return {
            memberships: new TransactionalMembershipRepository(tx),
            tiers: new TransactionalMembershipTierRepository(tx),
            coupons: new TransactionalMembershipCouponRepository(tx),
            redemptions: new TransactionalMembershipCouponRedemptionRepository(tx),
            quotaUsage: new TransactionalMembershipQuotaUsageRepository(tx),
            transaction: async <R>(work: (uow: IMembershipUnitOfWork) => Promise<R>): Promise<R> => {
                // Already in a transaction, just execute the work
                return await work(this.createTransactionalUow(tx));
            },
        };
    }
}

// ============================================
// TRANSACTIONAL REPOSITORY IMPLEMENTATIONS
// ============================================

/**
 * Transactional Membership Repository.
 */
class TransactionalMembershipRepository implements IMembershipRepository {
    constructor(private readonly prisma: PrismaService | PrismaTransactionClient) {}

    private mapToDomain(data: any): Membership {
        return Membership.rehydrate({
            id: data.id,
            userId: data.userId,
            tierId: data.tierId,
            startDate: data.startDate,
            endDate: data.endDate,
            isActive: data.isActive,
            autoRenew: data.autoRenew,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    async create(membership: Membership): Promise<Membership> {
        const created = await this.prisma.membership.create({
            data: {
                id: membership.id,
                user: { connect: { id: membership.userId } },
                tier: { connect: { id: membership.tierId } },
                startDate: membership.startDate,
                endDate: membership.endDate,
                isActive: membership.isActive,
                autoRenew: membership.autoRenew,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(created);
    }

    async findById(id: string): Promise<Membership | null> {
        const found = await this.prisma.membership.findUnique({ where: { id } });
        return found ? this.mapToDomain(found) : null;
    }

    async findByUserId(userId: string): Promise<Membership | null> {
        const found = await this.prisma.membership.findUnique({ where: { userId } });
        return found ? this.mapToDomain(found) : null;
    }

    async findActiveByUserId(userId: string): Promise<Membership | null> {
        const found = await this.prisma.membership.findFirst({
            where: { userId, isActive: true, endDate: { gte: new Date() } },
        });
        return found ? this.mapToDomain(found) : null;
    }

    async list(options?: { isActive?: boolean; tierId?: number; limit?: number; offset?: number }): Promise<Membership[]> {
        const where: Prisma.MembershipWhereInput = {};
        if (options?.isActive !== undefined) where.isActive = options.isActive;
        if (options?.tierId) where.tierId = options.tierId;

        const found = await this.prisma.membership.findMany({
            where,
            take: options?.limit || 10,
            skip: options?.offset || 0,
            orderBy: { createdAt: 'desc' },
        });
        return found.map(m => this.mapToDomain(m));
    }

    async count(options?: { isActive?: boolean; tierId?: number }): Promise<number> {
        const where: Prisma.MembershipWhereInput = {};
        if (options?.isActive !== undefined) where.isActive = options.isActive;
        if (options?.tierId) where.tierId = options.tierId;
        return await this.prisma.membership.count({ where });
    }

    async update(membership: Membership): Promise<Membership> {
        const updated = await this.prisma.membership.update({
            where: { id: membership.id },
            data: {
                tierId: membership.tierId,
                startDate: membership.startDate,
                endDate: membership.endDate,
                isActive: membership.isActive,
                autoRenew: membership.autoRenew,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async cancel(membershipId: string): Promise<Membership> {
        const updated = await this.prisma.membership.update({
            where: { id: membershipId },
            data: { endDate: new Date(), isActive: false, autoRenew: false, updatedAt: new Date() },
        });
        return this.mapToDomain(updated);
    }

    async renew(membershipId: string, durationInMonths: number): Promise<Membership> {
        const membership = await this.findById(membershipId);
        if (!membership) throw new Error('Membership not found');

        const newEnd = new Date(membership.endDate || new Date());
        newEnd.setMonth(newEnd.getMonth() + durationInMonths);

        const updated = await this.prisma.membership.update({
            where: { id: membershipId },
            data: { endDate: newEnd, isActive: true, updatedAt: new Date() },
        });
        return this.mapToDomain(updated);
    }

    async toggleAutoRenew(membershipId: string, autoRenew: boolean): Promise<Membership> {
        const updated = await this.prisma.membership.update({
            where: { id: membershipId },
            data: { autoRenew, updatedAt: new Date() },
        });
        return this.mapToDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.membership.delete({ where: { id } });
    }

    async findExpiringSoon(days: number): Promise<Membership[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const found = await this.prisma.membership.findMany({
            where: { isActive: true, autoRenew: true, endDate: { gte: new Date(), lte: futureDate } },
        });
        return found.map(m => this.mapToDomain(m));
    }

    async findExpired(): Promise<Membership[]> {
        const found = await this.prisma.membership.findMany({
            where: { isActive: true, endDate: { lt: new Date() } },
        });
        return found.map(m => this.mapToDomain(m));
    }

    async deactivate(membershipId: string): Promise<void> {
        await this.prisma.membership.update({
            where: { id: membershipId },
            data: { isActive: false, updatedAt: new Date() },
        });
    }
}

/**
 * Transactional Membership Tier Repository.
 */
class TransactionalMembershipTierRepository implements IMembershipTierRepository {
    constructor(private readonly prisma: PrismaService | PrismaTransactionClient) {}

    private mapToDomain(data: any, quota?: TierQuota): MembershipTier {
        return MembershipTier.rehydrate({
            id: data.id,
            name: data.name,
            nameAr: data.nameAr,
            description: data.description,
            descriptionAr: data.descriptionAr,
            price: data.price,
            currency: CurrencyMapper.toDomain(data.currency),
            billingCycle: BillingCycleMapper.toDomain(data.billingCycle),
            quota: quota,
            benefits: data.benefits,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    private async loadQuotaForTier(tierId: number): Promise<TierQuota> {
        const tierServices = await this.prisma.tierService.findMany({
            where: { tierId, isActive: true },
            include: { service: { select: { code: true } } },
        });

        const quota: TierQuota = {};
        for (const ts of tierServices) {
            const code = ts.service?.code;
            if (code === 'CONSULTATION') quota.consultationsPerMonth = ts.quotaPerMonth ?? undefined;
            else if (code === 'LEGAL_OPINION') quota.opinionsPerMonth = ts.quotaPerMonth ?? undefined;
            else if (code === 'SERVICE_REQUEST') quota.servicesPerMonth = ts.quotaPerMonth ?? undefined;
            else if (code === 'LITIGATION') quota.casesPerMonth = ts.quotaPerMonth ?? undefined;
            else if (code === 'CALL_REQUEST') quota.callMinutesPerMonth = ts.quotaPerMonth ?? undefined;
        }
        return quota;
    }

    async findById(id: number): Promise<MembershipTier | null> {
        const tier = await this.prisma.membershipTier.findUnique({ where: { id } });
        if (!tier) return null;
        const quota = await this.loadQuotaForTier(tier.id);
        return this.mapToDomain(tier, quota);
    }

    async findByName(name: string): Promise<MembershipTier | null> {
        const tier = await this.prisma.membershipTier.findUnique({ where: { name } });
        if (!tier) return null;
        const quota = await this.loadQuotaForTier(tier.id);
        return this.mapToDomain(tier, quota);
    }

    async findAll(options?: { isActive?: boolean }): Promise<MembershipTier[]> {
        const where: Prisma.MembershipTierWhereInput = {};
        if (options?.isActive !== undefined) where.isActive = options.isActive;

        const tiers = await this.prisma.membershipTier.findMany({ where, orderBy: { price: 'asc' } });
        return Promise.all(tiers.map(async (t) => {
            const quota = await this.loadQuotaForTier(t.id);
            return this.mapToDomain(t, quota);
        }));
    }

    async findActive(): Promise<MembershipTier[]> {
        return this.findAll({ isActive: true });
    }

    async findByStatus(isActive: boolean): Promise<MembershipTier[]> {
        return this.findAll({ isActive });
    }

    async hasActiveMemberships(tierId: number): Promise<boolean> {
        const count = await this.prisma.membership.count({ where: { tierId, isActive: true } });
        return count > 0;
    }

    async create(tier: MembershipTier): Promise<MembershipTier> {
        const created = await this.prisma.membershipTier.create({
            data: {
                name: tier.name,
                nameAr: tier.nameAr,
                description: tier.description,
                descriptionAr: tier.descriptionAr,
                price: tier.price.amount,
                currency: CurrencyMapper.toPrisma(tier.price.currency),
                billingCycle: BillingCycleMapper.toPrisma(tier.billingCycle.value),
                benefits: tier.benefits as Prisma.InputJsonValue,
                isActive: tier.isActive,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        const quota = await this.loadQuotaForTier(created.id);
        return this.mapToDomain(created, quota);
    }

    async update(tier: MembershipTier): Promise<MembershipTier> {
        const updated = await this.prisma.membershipTier.update({
            where: { id: tier.id },
            data: {
                name: tier.name,
                nameAr: tier.nameAr,
                description: tier.description,
                descriptionAr: tier.descriptionAr,
                price: tier.price.amount,
                currency: CurrencyMapper.toPrisma(tier.price.currency),
                billingCycle: BillingCycleMapper.toPrisma(tier.billingCycle.value),
                benefits: tier.benefits as Prisma.InputJsonValue,
                isActive: tier.isActive,
                updatedAt: new Date(),
            },
        });
        const quota = await this.loadQuotaForTier(updated.id);
        return this.mapToDomain(updated, quota);
    }

    async activate(tierId: number): Promise<MembershipTier> {
        const updated = await this.prisma.membershipTier.update({
            where: { id: tierId },
            data: { isActive: true, updatedAt: new Date() },
        });
        const quota = await this.loadQuotaForTier(tierId);
        return this.mapToDomain(updated, quota);
    }

    async deactivate(tierId: number): Promise<MembershipTier> {
        const updated = await this.prisma.membershipTier.update({
            where: { id: tierId },
            data: { isActive: false, updatedAt: new Date() },
        });
        const quota = await this.loadQuotaForTier(tierId);
        return this.mapToDomain(updated, quota);
    }

    async delete(id: number): Promise<void> {
        await this.prisma.membershipTier.delete({ where: { id } });
    }
}

/**
 * Transactional Membership Coupon Repository.
 */
class TransactionalMembershipCouponRepository implements IMembershipCouponRepository {
    constructor(private readonly prisma: PrismaService | PrismaTransactionClient) {}

    private mapToDomain(data: any): MembershipCoupon {
        return MembershipCoupon.rehydrate({
            id: data.id,
            code: data.code,
            discountPercentage: Number(data.discountValue),
            validFrom: data.validFrom,
            validUntil: data.validUntil,
            usageLimit: data.maxRedemptions,
            usedCount: data.currentRedemptions,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    async create(coupon: MembershipCoupon): Promise<MembershipCoupon> {
        const created = await this.prisma.membershipCoupon.create({
            data: {
                id: coupon.id,
                code: coupon.code,
                discountValue: coupon.discountPercentage,
                discountType: PrismaDiscountType.percentage,
                validFrom: coupon.validFrom,
                validUntil: coupon.validUntil,
                maxRedemptions: coupon.usageLimit,
                currentRedemptions: coupon.usedCount,
                isActive: coupon.isActive,
                createdAt: coupon.createdAt,
                updatedAt: coupon.updatedAt,
            },
        });
        return this.mapToDomain(created);
    }

    async findById(id: string): Promise<MembershipCoupon | null> {
        const found = await this.prisma.membershipCoupon.findUnique({ where: { id } });
        return found ? this.mapToDomain(found) : null;
    }

    async findByCode(code: string): Promise<MembershipCoupon | null> {
        const found = await this.prisma.membershipCoupon.findUnique({ where: { code } });
        return found ? this.mapToDomain(found) : null;
    }

    async findAll(options?: { isActive?: boolean; validAt?: Date; limit?: number; offset?: number }): Promise<MembershipCoupon[]> {
        const where: Prisma.MembershipCouponWhereInput = {};
        if (options?.isActive !== undefined) where.isActive = options.isActive;
        if (options?.validAt) {
            where.validFrom = { lte: options.validAt };
            where.validUntil = { gte: options.validAt };
        }

        const found = await this.prisma.membershipCoupon.findMany({
            where,
            take: options?.limit || 10,
            skip: options?.offset || 0,
            orderBy: { createdAt: 'desc' },
        });
        return found.map(c => this.mapToDomain(c));
    }

    async findActive(): Promise<MembershipCoupon[]> {
        return this.findAll({ isActive: true, validAt: new Date() });
    }

    async update(coupon: MembershipCoupon): Promise<MembershipCoupon> {
        const updated = await this.prisma.membershipCoupon.update({
            where: { id: coupon.id },
            data: {
                code: coupon.code,
                discountValue: coupon.discountPercentage,
                validFrom: coupon.validFrom,
                validUntil: coupon.validUntil,
                maxRedemptions: coupon.usageLimit,
                currentRedemptions: coupon.usedCount,
                isActive: coupon.isActive,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async incrementUsage(couponId: string): Promise<MembershipCoupon> {
        const updated = await this.prisma.membershipCoupon.update({
            where: { id: couponId },
            data: { currentRedemptions: { increment: 1 }, updatedAt: new Date() },
        });
        return this.mapToDomain(updated);
    }

    async activate(couponId: string): Promise<MembershipCoupon> {
        const updated = await this.prisma.membershipCoupon.update({
            where: { id: couponId },
            data: { isActive: true, updatedAt: new Date() },
        });
        return this.mapToDomain(updated);
    }

    async deactivate(couponId: string): Promise<MembershipCoupon> {
        const updated = await this.prisma.membershipCoupon.update({
            where: { id: couponId },
            data: { isActive: false, updatedAt: new Date() },
        });
        return this.mapToDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.membershipCoupon.delete({ where: { id } });
    }

    async validateCoupon(code: string): Promise<{ valid: boolean; reason?: string; coupon?: MembershipCoupon }> {
        const coupon = await this.findByCode(code);
        if (!coupon) return { valid: false, reason: 'Coupon not found' };

        const validation = coupon.canBeRedeemed();
        if (!validation.valid) return { valid: false, reason: validation.reason };

        return { valid: true, coupon };
    }
}

/**
 * Transactional Membership Coupon Redemption Repository.
 * Critical for single-use enforcement.
 */
class TransactionalMembershipCouponRedemptionRepository implements IMembershipCouponRedemptionRepository {
    constructor(private readonly prisma: PrismaService | PrismaTransactionClient) {}

    private mapToDomain(data: any): MembershipCouponRedemption {
        return MembershipCouponRedemption.create({
            membershipId: data.membershipId,
            couponId: data.couponId,
        });
    }

    async create(redemption: MembershipCouponRedemption): Promise<MembershipCouponRedemption> {
        const created = await this.prisma.membershipCouponRedemption.create({
            data: {
                id: redemption.id,
                discountAmount: 0,
                membershipId: redemption.membershipId,
                couponId: redemption.couponId,
                redeemedAt: redemption.redeemedAt,
            },
        });
        return this.mapToDomain(created);
    }

    async findById(id: string): Promise<MembershipCouponRedemption | null> {
        const found = await this.prisma.membershipCouponRedemption.findUnique({ where: { id } });
        return found ? this.mapToDomain(found) : null;
    }

    async findByMembership(membershipId: string): Promise<MembershipCouponRedemption[]> {
        const found = await this.prisma.membershipCouponRedemption.findMany({
            where: { membershipId },
            orderBy: { redeemedAt: 'desc' },
        });
        return found.map(r => this.mapToDomain(r));
    }

    async findByCoupon(couponId: string): Promise<MembershipCouponRedemption[]> {
        const found = await this.prisma.membershipCouponRedemption.findMany({
            where: { couponId },
            orderBy: { redeemedAt: 'desc' },
        });
        return found.map(r => this.mapToDomain(r));
    }

    async hasUserRedeemedCoupon(membershipId: string, couponId: string): Promise<boolean> {
        const count = await this.prisma.membershipCouponRedemption.count({
            where: { membershipId, couponId },
        });
        return count > 0;
    }

    async delete(id: string): Promise<void> {
        await this.prisma.membershipCouponRedemption.delete({ where: { id } });
    }
}

/**
 * Transactional Membership Quota Usage Repository.
 * Critical for race condition prevention in quota consumption.
 */
class TransactionalMembershipQuotaUsageRepository implements IMembershipQuotaUsageRepository {
    constructor(private readonly prisma: PrismaService | PrismaTransactionClient) {}

    private mapToDomain(data: any): MembershipQuotaUsage {
        const usage: Partial<Record<QuotaResource, number>> = {};

        if (data.consultationsUsed !== null) usage[QuotaResource.CONSULTATIONS] = data.consultationsUsed;
        if (data.opinionsUsed !== null) usage[QuotaResource.OPINIONS] = data.opinionsUsed;
        if (data.servicesUsed !== null) usage[QuotaResource.SERVICES] = data.servicesUsed;
        if (data.casesUsed !== null) usage[QuotaResource.CASES] = data.casesUsed;
        if (data.callMinutesUsed !== null) usage[QuotaResource.CALL_MINUTES] = data.callMinutesUsed;

        return MembershipQuotaUsage.rehydrate({
            id: data.id,
            membershipId: data.membershipId,
            usage,
            periodStart: data.periodStart,
            periodEnd: data.periodEnd,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    private mapToPrisma(quotaUsage: MembershipQuotaUsage): any {
        const allUsage = quotaUsage.getAllUsage();
        return {
            membershipId: quotaUsage.membershipId,
            consultationsUsed: allUsage[QuotaResource.CONSULTATIONS] || 0,
            opinionsUsed: allUsage[QuotaResource.OPINIONS] || 0,
            servicesUsed: allUsage[QuotaResource.SERVICES] || 0,
            casesUsed: allUsage[QuotaResource.CASES] || 0,
            callMinutesUsed: allUsage[QuotaResource.CALL_MINUTES] || 0,
            periodStart: quotaUsage.periodStart,
            periodEnd: quotaUsage.periodEnd,
        };
    }

    async create(quotaUsage: MembershipQuotaUsage): Promise<MembershipQuotaUsage> {
        const data = this.mapToPrisma(quotaUsage);
        const created = await this.prisma.membershipQuotaUsage.create({
            data: { ...data, createdAt: new Date(), updatedAt: new Date() },
        });
        return this.mapToDomain(created);
    }

    async findById(id: string): Promise<MembershipQuotaUsage | null> {
        const found = await this.prisma.membershipQuotaUsage.findUnique({ where: { id } });
        return found ? this.mapToDomain(found) : null;
    }

    async findCurrentByMembership(membershipId: string): Promise<MembershipQuotaUsage | null> {
        const now = new Date();
        const found = await this.prisma.membershipQuotaUsage.findFirst({
            where: { membershipId, periodStart: { lte: now }, periodEnd: { gte: now } },
            orderBy: { createdAt: 'desc' },
        });
        return found ? this.mapToDomain(found) : null;
    }

    async findByMembership(membershipId: string, options?: { startDate?: Date; endDate?: Date }): Promise<MembershipQuotaUsage[]> {
        const where: Prisma.MembershipQuotaUsageWhereInput = { membershipId };

        if (options?.startDate || options?.endDate) {
            where.AND = [];
            if (options.startDate) where.AND.push({ periodStart: { gte: options.startDate } });
            if (options.endDate) where.AND.push({ periodEnd: { lte: options.endDate } });
        }

        const found = await this.prisma.membershipQuotaUsage.findMany({
            where,
            orderBy: { periodStart: 'desc' },
        });
        return found.map(q => this.mapToDomain(q));
    }

    async update(quotaUsage: MembershipQuotaUsage): Promise<MembershipQuotaUsage> {
        const data = this.mapToPrisma(quotaUsage);
        const updated = await this.prisma.membershipQuotaUsage.update({
            where: { id: quotaUsage.id },
            data: { ...data, updatedAt: new Date() },
        });
        return this.mapToDomain(updated);
    }

    async incrementUsage(membershipId: string, resource: QuotaResource, amount: number): Promise<MembershipQuotaUsage> {
        let quotaUsage = await this.findCurrentByMembership(membershipId);

        if (!quotaUsage) {
            const membership = await this.prisma.membership.findUnique({ where: { id: membershipId } });
            if (!membership) throw new Error('Membership not found');

            quotaUsage = await this.create(
                MembershipQuotaUsage.create({
                    membershipId,
                    periodStart: new Date(),
                    periodEnd: membership.endDate || new Date(),
                }),
            );
        }

        const updatedQuota = quotaUsage.incrementUsage(resource, amount);
        return await this.update(updatedQuota);
    }

    async getRemainingQuota(membershipId: string, resource: QuotaResource, tierLimit?: number): Promise<number | null> {
        if (tierLimit === undefined || tierLimit === null) return null; // Unlimited

        const quotaUsage = await this.findCurrentByMembership(membershipId);
        const used = quotaUsage?.getUsage(resource) || 0;
        return Math.max(0, tierLimit - used);
    }

    async hasAvailableQuota(membershipId: string, resource: QuotaResource, required: number, tierLimit?: number): Promise<boolean> {
        if (tierLimit === undefined || tierLimit === null) return true; // Unlimited

        const remaining = await this.getRemainingQuota(membershipId, resource, tierLimit);
        if (remaining === null) return true;
        return remaining >= required;
    }

    async resetQuota(membershipId: string): Promise<MembershipQuotaUsage> {
        const membership = await this.prisma.membership.findUnique({ where: { id: membershipId } });
        if (!membership) throw new Error('Membership not found');

        return await this.create(
            MembershipQuotaUsage.create({
                membershipId,
                usage: {
                    [QuotaResource.CONSULTATIONS]: 0,
                    [QuotaResource.OPINIONS]: 0,
                    [QuotaResource.SERVICES]: 0,
                    [QuotaResource.CASES]: 0,
                    [QuotaResource.CALL_MINUTES]: 0,
                },
                periodStart: new Date(),
                periodEnd: membership.endDate || new Date(),
            }),
        );
    }
}

// Export the token for module registration
export { MEMBERSHIP_UNIT_OF_WORK };
