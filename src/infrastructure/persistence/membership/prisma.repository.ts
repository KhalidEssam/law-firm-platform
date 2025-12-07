// ============================================
// MEMBERSHIP PRISMA REPOSITORIES
// infrastructure/persistence/repositories/membership/
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Membership } from '../../../core/domain/membership/entities/membership.entity';
import { MembershipTier } from '../../../core/domain/membership/entities/membership-tier.entity';
import { MembershipPayment, PaymentStatus, PaymentProvider } from '../../../core/domain/membership/entities/membership-payment.entity';
import { MembershipCoupon } from '../../../core/domain/membership/entities/membership-coupon.entity';
import { MembershipCouponRedemption } from '../../../core/domain/membership/entities/membership-coupon-redemption.entity';
import { MembershipQuotaUsage } from '../../../core/domain/membership/entities/membership-quota-usage.entity';
import { QuotaResource } from '../../../core/domain/membership/value-objects/quota-resource.vo';
import {
    IMembershipRepository,
    IMembershipTierRepository,
    IMembershipPaymentRepository,
    IMembershipCouponRepository,
    IMembershipCouponRedemptionRepository,
    IMembershipQuotaUsageRepository,
} from '../../../core/application/membership/ports/repository';

// Prisma 7 imports from generated path
import {
    Prisma,
    BillingCycle as PrismaBillingCycle,
    Currency as PrismaCurrency,
    PaymentStatus as PrismaPaymentStatus,
    DiscountType as PrismaDiscountType,
} from '@prisma/client';

// ============================================
// ENUM MAPPERS
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

class PaymentStatusMapper {
    private static readonly toPrismaMap: Record<string, PrismaPaymentStatus> = {
        'pending': PrismaPaymentStatus.pending,
        'paid': PrismaPaymentStatus.paid,
        'completed': PrismaPaymentStatus.paid,
        'failed': PrismaPaymentStatus.failed,
        'refunded': PrismaPaymentStatus.refunded,
        'partially_refunded': PrismaPaymentStatus.partially_refunded,
    };

    private static readonly toDomainMap: Record<PrismaPaymentStatus, string> = {
        [PrismaPaymentStatus.pending]: 'pending',
        [PrismaPaymentStatus.paid]: 'completed',
        [PrismaPaymentStatus.failed]: 'failed',
        [PrismaPaymentStatus.refunded]: 'refunded',
        [PrismaPaymentStatus.partially_refunded]: 'partially_refunded',
    };

    static toPrisma(status: string): PrismaPaymentStatus {
        return this.toPrismaMap[status.toLowerCase()] || PrismaPaymentStatus.pending;
    }

    static toDomain(prismaStatus: PrismaPaymentStatus): string {
        return this.toDomainMap[prismaStatus];
    }
}

class DiscountTypeMapper {
    private static readonly toPrismaMap: Record<string, PrismaDiscountType> = {
        'percentage': PrismaDiscountType.percentage,
        'fixed': PrismaDiscountType.fixed,
    };

    private static readonly toDomainMap: Record<PrismaDiscountType, string> = {
        [PrismaDiscountType.percentage]: 'percentage',
        [PrismaDiscountType.fixed]: 'fixed',
    };

    static toPrisma(type: string): PrismaDiscountType {
        return this.toPrismaMap[type.toLowerCase()] || PrismaDiscountType.percentage;
    }

    static toDomain(prismaType: PrismaDiscountType): string {
        return this.toDomainMap[prismaType];
    }
}

// ============================================
// PRISMA MEMBERSHIP REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipRepository implements IMembershipRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ============================================
    // MAPPERS
    // ============================================

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

    private mapToPrisma(membership: Membership): Prisma.MembershipUpdateInput {
        return {
            user: { connect: { id: membership.userId } },
            tier: { connect: { id: membership.tierId } },
            startDate: membership.startDate,
            endDate: membership.endDate,
            isActive: membership.isActive,
            autoRenew: membership.autoRenew,
            updatedAt: new Date(),
        };
    }

    // ============================================
    // CREATE
    // ============================================

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

    // ============================================
    // READ
    // ============================================

    async findById(id: string): Promise<Membership | null> {
        const membership = await this.prisma.membership.findUnique({
            where: { id },
        });
        return membership ? this.mapToDomain(membership) : null;
    }

    async findByUserId(userId: string): Promise<Membership | null> {
        const membership = await this.prisma.membership.findUnique({
            where: { userId },
        });
        return membership ? this.mapToDomain(membership) : null;
    }

    async findActiveByUserId(userId: string): Promise<Membership | null> {
        const membership = await this.prisma.membership.findFirst({
            where: {
                userId,
                isActive: true,
                endDate: { gte: new Date() },
            },
        });
        return membership ? this.mapToDomain(membership) : null;
    }

    async list(options?: {
        isActive?: boolean;
        tierId?: number;
        limit?: number;
        offset?: number;
    }): Promise<Membership[]> {
        const where: Prisma.MembershipWhereInput = {};

        if (options?.isActive !== undefined) {
            where.isActive = options.isActive;
        }
        if (options?.tierId) {
            where.tierId = options.tierId;
        }

        const memberships = await this.prisma.membership.findMany({
            where,
            take: options?.limit || 10,
            skip: options?.offset || 0,
            orderBy: { createdAt: 'desc' },
        });

        return memberships.map((m) => this.mapToDomain(m));
    }

    async count(options?: { isActive?: boolean; tierId?: number }): Promise<number> {
        const where: Prisma.MembershipWhereInput = {};

        if (options?.isActive !== undefined) {
            where.isActive = options.isActive;
        }
        if (options?.tierId) {
            where.tierId = options.tierId;
        }

        return await this.prisma.membership.count({ where });
    }

    // ============================================
    // UPDATE
    // ============================================

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
            data: {
                endDate: new Date(),
                isActive: false,
                autoRenew: false,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async renew(membershipId: string, durationInMonths: number): Promise<Membership> {
        const membership = await this.findById(membershipId);
        if (!membership) {
            throw new Error('Membership not found');
        }

        const newEnd = new Date(membership.endDate || new Date());
        newEnd.setMonth(newEnd.getMonth() + durationInMonths);

        const updated = await this.prisma.membership.update({
            where: { id: membershipId },
            data: {
                endDate: newEnd,
                isActive: true,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async toggleAutoRenew(membershipId: string, autoRenew: boolean): Promise<Membership> {
        const updated = await this.prisma.membership.update({
            where: { id: membershipId },
            data: {
                autoRenew,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    // ============================================
    // DELETE
    // ============================================

    async delete(id: string): Promise<void> {
        await this.prisma.membership.delete({
            where: { id },
        });
    }

    // ============================================
    // BUSINESS LOGIC
    // ============================================

    async findExpiringSoon(days: number): Promise<Membership[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const memberships = await this.prisma.membership.findMany({
            where: {
                isActive: true,
                autoRenew: true,
                endDate: {
                    gte: new Date(),
                    lte: futureDate,
                },
            },
        });

        return memberships.map((m) => this.mapToDomain(m));
    }

    async findExpired(): Promise<Membership[]> {
        const memberships = await this.prisma.membership.findMany({
            where: {
                isActive: true,
                endDate: {
                    lt: new Date(),
                },
            },
        });

        return memberships.map((m) => this.mapToDomain(m));
    }
}

// ============================================
// PRISMA MEMBERSHIP TIER REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipTierRepository implements IMembershipTierRepository {
    constructor(private readonly prisma: PrismaService) {}

    private mapToDomain(data: any): MembershipTier {
        return MembershipTier.rehydrate({
            id: data.id,
            name: data.name,
            nameAr: data.nameAr,
            description: data.description,
            descriptionAr: data.descriptionAr,
            price: data.price,
            currency: CurrencyMapper.toDomain(data.currency),
            billingCycle: BillingCycleMapper.toDomain(data.billingCycle),
            benefits: data.benefits,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    async hasActiveMemberships(tierId: number): Promise<boolean> {
        const count = await this.prisma.membership.count({
            where: {
                tierId,
                isActive: true,
            },
        });
        return count > 0;
    }

    async findByStatus(isActive: boolean): Promise<MembershipTier[]> {
        const tiers = await this.prisma.membershipTier.findMany({
            where: { isActive },
            orderBy: { price: 'asc' },
        });
        return tiers.map((t) => this.mapToDomain(t));
    }

    async findById(id: number): Promise<MembershipTier | null> {
        const tier = await this.prisma.membershipTier.findUnique({
            where: { id },
        });
        return tier ? this.mapToDomain(tier) : null;
    }

    async findByName(name: string): Promise<MembershipTier | null> {
        const tier = await this.prisma.membershipTier.findUnique({
            where: { name },
        });
        return tier ? this.mapToDomain(tier) : null;
    }

    async findAll(options?: { isActive?: boolean }): Promise<MembershipTier[]> {
        const where: Prisma.MembershipTierWhereInput = {};
        if (options?.isActive !== undefined) {
            where.isActive = options.isActive;
        }

        const tiers = await this.prisma.membershipTier.findMany({
            where,
            orderBy: { price: 'asc' },
        });

        return tiers.map((t) => this.mapToDomain(t));
    }

    async findActive(): Promise<MembershipTier[]> {
        return this.findAll({ isActive: true });
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
                benefits: tier.benefits ? (tier.benefits as Prisma.InputJsonValue) : Prisma.JsonNull,
                isActive: tier.isActive,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        // Create tier services with quotas if provided
        if (tier.quota) {
            await this.createTierServices(created.id, tier.quota);
        }

        return this.mapToDomain(created);
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
                benefits: tier.benefits ? (tier.benefits as Prisma.InputJsonValue) : Prisma.JsonNull,
                isActive: tier.isActive,
                updatedAt: new Date(),
            },
        });

        // Update tier services
        if (tier.quota) {
            await this.prisma.tierService.deleteMany({
                where: { tierId: tier.id },
            });
            await this.createTierServices(tier.id, tier.quota);
        }

        return this.mapToDomain(updated);
    }

    // Helper method to create tier services
    private async createTierServices(tierId: number, quota: any): Promise<void> {
        const services = await this.prisma.service.findMany({
            where: {
                code: {
                    in: ['CONSULTATION', 'LEGAL_OPINION', 'SERVICE_REQUEST', 'LITIGATION', 'CALL_REQUEST'],
                },
            },
            select: { id: true, code: true },
        });

        const serviceMap = new Map<string, string>(services.map((s) => [s.code, s.id]));

        const tierServices: Array<{
            tierId: number;
            serviceId: string;
            quotaPerMonth: number;
            isActive: boolean;
        }> = [];

        if (quota.consultationsPerMonth !== undefined && serviceMap.has('CONSULTATION')) {
            tierServices.push({
                tierId,
                serviceId: serviceMap.get('CONSULTATION')!,
                quotaPerMonth: quota.consultationsPerMonth,
                isActive: true,
            });
        }

        if (quota.opinionsPerMonth !== undefined && serviceMap.has('LEGAL_OPINION')) {
            tierServices.push({
                tierId,
                serviceId: serviceMap.get('LEGAL_OPINION')!,
                quotaPerMonth: quota.opinionsPerMonth,
                isActive: true,
            });
        }

        if (quota.servicesPerMonth !== undefined && serviceMap.has('SERVICE_REQUEST')) {
            tierServices.push({
                tierId,
                serviceId: serviceMap.get('SERVICE_REQUEST')!,
                quotaPerMonth: quota.servicesPerMonth,
                isActive: true,
            });
        }

        if (quota.casesPerMonth !== undefined && serviceMap.has('LITIGATION')) {
            tierServices.push({
                tierId,
                serviceId: serviceMap.get('LITIGATION')!,
                quotaPerMonth: quota.casesPerMonth,
                isActive: true,
            });
        }

        if (quota.callMinutesPerMonth !== undefined && serviceMap.has('CALL_REQUEST')) {
            tierServices.push({
                tierId,
                serviceId: serviceMap.get('CALL_REQUEST')!,
                quotaPerMonth: quota.callMinutesPerMonth,
                isActive: true,
            });
        }

        if (tierServices.length > 0) {
            await this.prisma.tierService.createMany({
                data: tierServices,
            });
        }
    }

    async activate(tierId: number): Promise<MembershipTier> {
        const updated = await this.prisma.membershipTier.update({
            where: { id: tierId },
            data: { isActive: true, updatedAt: new Date() },
        });
        return this.mapToDomain(updated);
    }

    async deactivate(tierId: number): Promise<MembershipTier> {
        const updated = await this.prisma.membershipTier.update({
            where: { id: tierId },
            data: { isActive: false, updatedAt: new Date() },
        });
        return this.mapToDomain(updated);
    }

    async delete(id: number): Promise<void> {
        await this.prisma.membershipTier.delete({
            where: { id },
        });
    }
}

// ============================================
// PRISMA MEMBERSHIP PAYMENT REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipPaymentRepository implements IMembershipPaymentRepository {
    constructor(private readonly prisma: PrismaService) {}

    private mapToDomain(data: any): MembershipPayment {
        return MembershipPayment.rehydrate({
            id: data.id,
            invoiceId: data.invoiceId,
            provider: data.provider,
            providerTxnId: data.providerTxnId,
            amount: data.amount,
            currency: CurrencyMapper.toDomain(data.currency),
            status: PaymentStatusMapper.toDomain(data.status),
            metadata: data.metadata,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    async create(payment: MembershipPayment): Promise<MembershipPayment> {
        const created = await this.prisma.membershipPayment.create({
            data: {
                id: payment.id,
                invoiceId: payment.invoiceId,
                provider: payment.provider,
                providerTxnId: payment.providerTxnId,
                amount: payment.amount.amount,
                currency: CurrencyMapper.toPrisma(payment.amount.currency),
                status: PaymentStatusMapper.toPrisma(payment.status),
                metadata: payment.metadata as Prisma.InputJsonValue,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
            },
        });
        return this.mapToDomain(created);
    }

    async findById(id: string): Promise<MembershipPayment | null> {
        const payment = await this.prisma.membershipPayment.findUnique({
            where: { id },
        });
        return payment ? this.mapToDomain(payment) : null;
    }

    async findByInvoiceId(invoiceId: string): Promise<MembershipPayment | null> {
        const payment = await this.prisma.membershipPayment.findFirst({
            where: { invoiceId },
        });
        return payment ? this.mapToDomain(payment) : null;
    }

    async findByProviderTxnId(providerTxnId: string): Promise<MembershipPayment | null> {
        const payment = await this.prisma.membershipPayment.findFirst({
            where: { providerTxnId },
        });
        return payment ? this.mapToDomain(payment) : null;
    }

    async findByMembership(
        membershipId: string,
        options?: { status?: string; limit?: number; offset?: number },
    ): Promise<MembershipPayment[]> {
        const where: Prisma.MembershipPaymentWhereInput = { invoiceId: membershipId };
        if (options?.status) {
            where.status = PaymentStatusMapper.toPrisma(options.status);
        }

        const payments = await this.prisma.membershipPayment.findMany({
            where,
            take: options?.limit || 10,
            skip: options?.offset || 0,
            orderBy: { createdAt: 'desc' },
        });

        return payments.map((p) => this.mapToDomain(p));
    }

    async update(payment: MembershipPayment): Promise<MembershipPayment> {
        const updated = await this.prisma.membershipPayment.update({
            where: { id: payment.id },
            data: {
                providerTxnId: payment.providerTxnId,
                status: PaymentStatusMapper.toPrisma(payment.status),
                metadata: payment.metadata as Prisma.InputJsonValue,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async markAsCompleted(paymentId: string, providerTxnId: string): Promise<MembershipPayment> {
        const updated = await this.prisma.membershipPayment.update({
            where: { id: paymentId },
            data: {
                providerTxnId,
                status: PrismaPaymentStatus.paid,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async markAsFailed(paymentId: string, reason?: string): Promise<MembershipPayment> {
        const payment = await this.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        const metadata = { ...payment.metadata, failureReason: reason };

        const updated = await this.prisma.membershipPayment.update({
            where: { id: paymentId },
            data: {
                status: PrismaPaymentStatus.failed,
                metadata: metadata as Prisma.InputJsonValue,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async markAsRefunded(paymentId: string, refundReason?: string): Promise<MembershipPayment> {
        const payment = await this.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        const metadata = {
            ...payment.metadata,
            refundReason,
            refundedAt: new Date().toISOString(),
        };

        const updated = await this.prisma.membershipPayment.update({
            where: { id: paymentId },
            data: {
                status: PrismaPaymentStatus.refunded,
                metadata: metadata as Prisma.InputJsonValue,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async getTotalRevenue(options?: {
        startDate?: Date;
        endDate?: Date;
        tierId?: number;
    }): Promise<number> {
        const where: Prisma.MembershipPaymentWhereInput = { 
            status: PrismaPaymentStatus.paid,
        };

        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const result = await this.prisma.membershipPayment.aggregate({
            where,
            _sum: { amount: true },
        });

        return Number(result._sum.amount) || 0;
    }

    async getPaymentStats(options?: { startDate?: Date; endDate?: Date }): Promise<{
        total: number;
        completed: number;
        pending: number;
        failed: number;
        refunded: number;
    }> {
        const where: Prisma.MembershipPaymentWhereInput = {};

        if (options?.startDate || options?.endDate) {
            where.createdAt = {};
            if (options.startDate) where.createdAt.gte = options.startDate;
            if (options.endDate) where.createdAt.lte = options.endDate;
        }

        const [total, completed, pending, failed, refunded] = await Promise.all([
            this.prisma.membershipPayment.count({ where }),
            this.prisma.membershipPayment.count({ 
                where: { ...where, status: PrismaPaymentStatus.paid } 
            }),
            this.prisma.membershipPayment.count({ 
                where: { ...where, status: PrismaPaymentStatus.pending } 
            }),
            this.prisma.membershipPayment.count({ 
                where: { ...where, status: PrismaPaymentStatus.failed } 
            }),
            this.prisma.membershipPayment.count({ 
                where: { ...where, status: PrismaPaymentStatus.refunded } 
            }),
        ]);

        return { total, completed, pending, failed, refunded };
    }
}

// ============================================
// PRISMA MEMBERSHIP COUPON REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipCouponRepository implements IMembershipCouponRepository {
    constructor(private readonly prisma: PrismaService) {}

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
        const coupon = await this.prisma.membershipCoupon.findUnique({
            where: { id },
        });
        return coupon ? this.mapToDomain(coupon) : null;
    }

    async findByCode(code: string): Promise<MembershipCoupon | null> {
        const coupon = await this.prisma.membershipCoupon.findUnique({
            where: { code },
        });
        return coupon ? this.mapToDomain(coupon) : null;
    }

    async findAll(options?: {
        isActive?: boolean;
        validAt?: Date;
        limit?: number;
        offset?: number;
    }): Promise<MembershipCoupon[]> {
        const where: Prisma.MembershipCouponWhereInput = {};

        if (options?.isActive !== undefined) {
            where.isActive = options.isActive;
        }

        if (options?.validAt) {
            where.validFrom = { lte: options.validAt };
            where.validUntil = { gte: options.validAt };
        }

        const coupons = await this.prisma.membershipCoupon.findMany({
            where,
            take: options?.limit || 10,
            skip: options?.offset || 0,
            orderBy: { createdAt: 'desc' },
        });

        return coupons.map((c) => this.mapToDomain(c));
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
            data: {
                currentRedemptions: { increment: 1 },
                updatedAt: new Date(),
            },
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
        await this.prisma.membershipCoupon.delete({
            where: { id },
        });
    }

    async validateCoupon(code: string): Promise<{
        valid: boolean;
        reason?: string;
        coupon?: MembershipCoupon;
    }> {
        const coupon = await this.findByCode(code);
        if (!coupon) {
            return { valid: false, reason: 'Coupon not found' };
        }

        const validation = coupon.canBeRedeemed();
        if (!validation.valid) {
            return { valid: false, reason: validation.reason };
        }

        return { valid: true, coupon };
    }
}

// ============================================
// PRISMA MEMBERSHIP COUPON REDEMPTION REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipCouponRedemptionRepository implements IMembershipCouponRedemptionRepository {
    constructor(private readonly prisma: PrismaService) {}

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
        const redemption = await this.prisma.membershipCouponRedemption.findUnique({
            where: { id },
        });
        return redemption ? this.mapToDomain(redemption) : null;
    }

    async findByMembership(membershipId: string): Promise<MembershipCouponRedemption[]> {
        const redemptions = await this.prisma.membershipCouponRedemption.findMany({
            where: { membershipId },
            orderBy: { redeemedAt: 'desc' },
        });
        return redemptions.map((r) => this.mapToDomain(r));
    }

    async findByCoupon(couponId: string): Promise<MembershipCouponRedemption[]> {
        const redemptions = await this.prisma.membershipCouponRedemption.findMany({
            where: { couponId },
            orderBy: { redeemedAt: 'desc' },
        });
        return redemptions.map((r) => this.mapToDomain(r));
    }

    async hasUserRedeemedCoupon(membershipId: string, couponId: string): Promise<boolean> {
        const count = await this.prisma.membershipCouponRedemption.count({
            where: {
                membershipId,
                couponId,
            },
        });
        return count > 0;
    }

    async delete(id: string): Promise<void> {
        await this.prisma.membershipCouponRedemption.delete({
            where: { id },
        });
    }
}

// ============================================
// PRISMA MEMBERSHIP QUOTA USAGE REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipQuotaUsageRepository implements IMembershipQuotaUsageRepository {
    constructor(private readonly prisma: PrismaService) {}

    private mapToDomain(data: any): MembershipQuotaUsage {
        const usage: Partial<Record<QuotaResource, number>> = {};

        if (data.consultationsUsed !== null) {
            usage[QuotaResource.CONSULTATIONS] = data.consultationsUsed;
        }
        if (data.opinionsUsed !== null) {
            usage[QuotaResource.OPINIONS] = data.opinionsUsed;
        }
        if (data.servicesUsed !== null) {
            usage[QuotaResource.SERVICES] = data.servicesUsed;
        }
        if (data.casesUsed !== null) {
            usage[QuotaResource.CASES] = data.casesUsed;
        }
        if (data.callMinutesUsed !== null) {
            usage[QuotaResource.CALL_MINUTES] = data.callMinutesUsed;
        }

        return MembershipQuotaUsage.create({
            membershipId: data.membershipId,
            usage,
            periodStart: data.periodStart,
            periodEnd: data.periodEnd,
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
            data: {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(created);
    }

    async findById(id: string): Promise<MembershipQuotaUsage | null> {
        const quota = await this.prisma.membershipQuotaUsage.findUnique({
            where: { id },
        });
        return quota ? this.mapToDomain(quota) : null;
    }

    async findCurrentByMembership(membershipId: string): Promise<MembershipQuotaUsage | null> {
        const now = new Date();
        const quota = await this.prisma.membershipQuotaUsage.findFirst({
            where: {
                membershipId,
                periodStart: { lte: now },
                periodEnd: { gte: now },
            },
            orderBy: { createdAt: 'desc' },
        });
        return quota ? this.mapToDomain(quota) : null;
    }

    async findByMembership(
        membershipId: string,
        options?: { startDate?: Date; endDate?: Date },
    ): Promise<MembershipQuotaUsage[]> {
        const where: Prisma.MembershipQuotaUsageWhereInput = { membershipId };

        if (options?.startDate || options?.endDate) {
            where.AND = [];
            if (options.startDate) {
                where.AND.push({ periodStart: { gte: options.startDate } });
            }
            if (options.endDate) {
                where.AND.push({ periodEnd: { lte: options.endDate } });
            }
        }

        const quotas = await this.prisma.membershipQuotaUsage.findMany({
            where,
            orderBy: { periodStart: 'desc' },
        });

        return quotas.map((q) => this.mapToDomain(q));
    }

    async update(quotaUsage: MembershipQuotaUsage): Promise<MembershipQuotaUsage> {
        const data = this.mapToPrisma(quotaUsage);
        const updated = await this.prisma.membershipQuotaUsage.update({
            where: { id: quotaUsage.id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async incrementUsage(
        membershipId: string,
        resource: QuotaResource,
        amount: number,
    ): Promise<MembershipQuotaUsage> {
        let quotaUsage = await this.findCurrentByMembership(membershipId);

        if (!quotaUsage) {
            const membership = await this.prisma.membership.findUnique({
                where: { id: membershipId },
            });

            if (!membership) {
                throw new Error('Membership not found');
            }

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

    async getRemainingQuota(
        membershipId: string,
        resource: QuotaResource,
        tierLimit?: number,
    ): Promise<number | null> {
        if (tierLimit === undefined || tierLimit === null) {
            return null; // Unlimited
        }

        const quotaUsage = await this.findCurrentByMembership(membershipId);
        const used = quotaUsage?.getUsage(resource) || 0;

        return Math.max(0, tierLimit - used);
    }

    async hasAvailableQuota(
        membershipId: string,
        resource: QuotaResource,
        required: number,
        tierLimit?: number,
    ): Promise<boolean> {
        if (tierLimit === undefined || tierLimit === null) {
            return true; // Unlimited quota
        }

        const remaining = await this.getRemainingQuota(membershipId, resource, tierLimit);

        if (remaining === null) {
            return true; // Unlimited
        }

        return remaining >= required;
    }

    async resetQuota(membershipId: string): Promise<MembershipQuotaUsage> {
        const membership = await this.prisma.membership.findUnique({
            where: { id: membershipId },
        });

        if (!membership) {
            throw new Error('Membership not found');
        }

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