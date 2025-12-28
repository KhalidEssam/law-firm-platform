// ============================================
// MEMBERSHIP PRISMA REPOSITORIES
// infrastructure/persistence/repositories/membership/
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Membership } from '../../../core/domain/membership/entities/membership.entity';
import {
  MembershipTier,
  TierQuota,
} from '../../../core/domain/membership/entities/membership-tier.entity';
import {
  MembershipPayment,
  PaymentStatus,
  PaymentProvider,
} from '../../../core/domain/membership/entities/membership-payment.entity';
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
  ITierServiceRepository,
  IServiceUsageRepository,
  ServiceUsageFilter,
  ServiceUsageSummary,
  IMembershipChangeLogRepository,
} from '../../../core/application/membership/ports/repository';
import { TierService } from '../../../core/domain/membership/entities/tier-service.entity';
import { ServiceUsage } from '../../../core/domain/membership/entities/service-usage.entity';
import { MembershipChangeLog } from '../../../core/domain/membership/entities/membership-change-log.entity';

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
    monthly: PrismaBillingCycle.monthly,
    quarterly: PrismaBillingCycle.quarterly,
    yearly: PrismaBillingCycle.yearly,
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
    SAR: PrismaCurrency.SAR,
    USD: PrismaCurrency.USD,
    EUR: PrismaCurrency.EUR,
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
    pending: PrismaPaymentStatus.pending,
    paid: PrismaPaymentStatus.paid,
    completed: PrismaPaymentStatus.paid,
    failed: PrismaPaymentStatus.failed,
    refunded: PrismaPaymentStatus.refunded,
    partially_refunded: PrismaPaymentStatus.partially_refunded,
  };

  private static readonly toDomainMap: Record<PrismaPaymentStatus, string> = {
    [PrismaPaymentStatus.pending]: 'pending',
    [PrismaPaymentStatus.paid]: 'completed',
    [PrismaPaymentStatus.failed]: 'failed',
    [PrismaPaymentStatus.refunded]: 'refunded',
    [PrismaPaymentStatus.partially_refunded]: 'partially_refunded',
  };

  static toPrisma(status: string): PrismaPaymentStatus {
    return (
      this.toPrismaMap[status.toLowerCase()] || PrismaPaymentStatus.pending
    );
  }

  static toDomain(prismaStatus: PrismaPaymentStatus): string {
    return this.toDomainMap[prismaStatus];
  }
}

class DiscountTypeMapper {
  private static readonly toPrismaMap: Record<string, PrismaDiscountType> = {
    percentage: PrismaDiscountType.percentage,
    fixed: PrismaDiscountType.fixed,
  };

  private static readonly toDomainMap: Record<PrismaDiscountType, string> = {
    [PrismaDiscountType.percentage]: 'percentage',
    [PrismaDiscountType.fixed]: 'fixed',
  };

  static toPrisma(type: string): PrismaDiscountType {
    return (
      this.toPrismaMap[type.toLowerCase()] || PrismaDiscountType.percentage
    );
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

  async findById(_id: string): Promise<Membership | null> {
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

  async count(options?: {
    isActive?: boolean;
    tierId?: number;
  }): Promise<number> {
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

  async renew(
    membershipId: string,
    durationInMonths: number,
  ): Promise<Membership> {
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

  async toggleAutoRenew(
    membershipId: string,
    autoRenew: boolean,
  ): Promise<Membership> {
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

  async delete(_id: string): Promise<void> {
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
export class PrismaMembershipTierRepository
  implements IMembershipTierRepository
{
  constructor(private readonly prisma: PrismaService) {}

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

  // Load quota from TierService table
  private async loadQuotaForTier(tierId: number): Promise<TierQuota> {
    const tierServices = await this.prisma.tierService.findMany({
      where: { tierId, isActive: true },
      include: { service: { select: { code: true } } },
    });

    const quota: TierQuota = {};
    for (const ts of tierServices) {
      const code = ts.service?.code;
      if (code === 'CONSULTATION')
        quota.consultationsPerMonth = ts.quotaPerMonth ?? undefined;
      else if (code === 'LEGAL_OPINION')
        quota.opinionsPerMonth = ts.quotaPerMonth ?? undefined;
      else if (code === 'SERVICE_REQUEST')
        quota.servicesPerMonth = ts.quotaPerMonth ?? undefined;
      else if (code === 'LITIGATION')
        quota.casesPerMonth = ts.quotaPerMonth ?? undefined;
      else if (code === 'CALL_REQUEST')
        quota.callMinutesPerMonth = ts.quotaPerMonth ?? undefined;
    }
    return quota;
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
    return Promise.all(
      tiers.map(async (t) => {
        const quota = await this.loadQuotaForTier(t.id);
        return this.mapToDomain(t, quota);
      }),
    );
  }

  async findById(id: number): Promise<MembershipTier | null> {
    const tier = await this.prisma.membershipTier.findUnique({
      where: { id },
    });
    if (!tier) return null;
    const quota = await this.loadQuotaForTier(tier.id);
    return this.mapToDomain(tier, quota);
  }

  async findByName(name: string): Promise<MembershipTier | null> {
    const tier = await this.prisma.membershipTier.findUnique({
      where: { name },
    });
    if (!tier) return null;
    const quota = await this.loadQuotaForTier(tier.id);
    return this.mapToDomain(tier, quota);
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

    return Promise.all(
      tiers.map(async (t) => {
        const quota = await this.loadQuotaForTier(t.id);
        return this.mapToDomain(t, quota);
      }),
    );
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
        benefits: tier.benefits
          ? (tier.benefits as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        isActive: tier.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create tier services with quotas if provided
    if (tier.quota && Object.keys(tier.quota).length > 0) {
      await this.createTierServices(created.id, tier.quota);
    }

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
        benefits: tier.benefits
          ? (tier.benefits as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        isActive: tier.isActive,
        updatedAt: new Date(),
      },
    });

    // Update tier services
    if (tier.quota && Object.keys(tier.quota).length > 0) {
      await this.prisma.tierService.deleteMany({
        where: { tierId: tier.id },
      });
      await this.createTierServices(tier.id, tier.quota);
    }

    const quota = await this.loadQuotaForTier(updated.id);
    return this.mapToDomain(updated, quota);
  }

  // Helper method to create tier services
  private async createTierServices(tierId: number, quota: any): Promise<void> {
    const services = await this.prisma.service.findMany({
      where: {
        code: {
          in: [
            'CONSULTATION',
            'LEGAL_OPINION',
            'SERVICE_REQUEST',
            'LITIGATION',
            'CALL_REQUEST',
          ],
        },
      },
      select: { id: true, code: true },
    });

    const serviceMap = new Map<string, string>(
      services.map((s) => [s.code, s.id]),
    );

    const tierServices: Array<{
      tierId: number;
      serviceId: string;
      quotaPerMonth: number;
      isActive: boolean;
    }> = [];

    if (
      quota.consultationsPerMonth !== undefined &&
      serviceMap.has('CONSULTATION')
    ) {
      tierServices.push({
        tierId,
        serviceId: serviceMap.get('CONSULTATION')!,
        quotaPerMonth: quota.consultationsPerMonth,
        isActive: true,
      });
    }

    if (
      quota.opinionsPerMonth !== undefined &&
      serviceMap.has('LEGAL_OPINION')
    ) {
      tierServices.push({
        tierId,
        serviceId: serviceMap.get('LEGAL_OPINION')!,
        quotaPerMonth: quota.opinionsPerMonth,
        isActive: true,
      });
    }

    if (
      quota.servicesPerMonth !== undefined &&
      serviceMap.has('SERVICE_REQUEST')
    ) {
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

    if (
      quota.callMinutesPerMonth !== undefined &&
      serviceMap.has('CALL_REQUEST')
    ) {
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
    await this.prisma.membershipTier.delete({
      where: { id },
    });
  }
}

// ============================================
// PRISMA MEMBERSHIP PAYMENT REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipPaymentRepository
  implements IMembershipPaymentRepository
{
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

  async findById(_id: string): Promise<MembershipPayment | null> {
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

  async findByProviderTxnId(
    providerTxnId: string,
  ): Promise<MembershipPayment | null> {
    const payment = await this.prisma.membershipPayment.findFirst({
      where: { providerTxnId },
    });
    return payment ? this.mapToDomain(payment) : null;
  }

  async findByMembership(
    membershipId: string,
    options?: { status?: string; limit?: number; offset?: number },
  ): Promise<MembershipPayment[]> {
    const where: Prisma.MembershipPaymentWhereInput = {
      invoiceId: membershipId,
    };
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

  async markAsCompleted(
    paymentId: string,
    providerTxnId: string,
  ): Promise<MembershipPayment> {
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

  async markAsFailed(
    paymentId: string,
    reason?: string,
  ): Promise<MembershipPayment> {
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

  async markAsRefunded(
    paymentId: string,
    refundReason?: string,
  ): Promise<MembershipPayment> {
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

  async getPaymentStats(options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
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
        where: { ...where, status: PrismaPaymentStatus.paid },
      }),
      this.prisma.membershipPayment.count({
        where: { ...where, status: PrismaPaymentStatus.pending },
      }),
      this.prisma.membershipPayment.count({
        where: { ...where, status: PrismaPaymentStatus.failed },
      }),
      this.prisma.membershipPayment.count({
        where: { ...where, status: PrismaPaymentStatus.refunded },
      }),
    ]);

    return { total, completed, pending, failed, refunded };
  }
}

// ============================================
// PRISMA MEMBERSHIP COUPON REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipCouponRepository
  implements IMembershipCouponRepository
{
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

  async findById(_id: string): Promise<MembershipCoupon | null> {
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

  async delete(_id: string): Promise<void> {
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
export class PrismaMembershipCouponRedemptionRepository
  implements IMembershipCouponRedemptionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(data: any): MembershipCouponRedemption {
    return MembershipCouponRedemption.create({
      membershipId: data.membershipId,
      couponId: data.couponId,
    });
  }

  async create(
    redemption: MembershipCouponRedemption,
  ): Promise<MembershipCouponRedemption> {
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

  async findById(_id: string): Promise<MembershipCouponRedemption | null> {
    const redemption = await this.prisma.membershipCouponRedemption.findUnique({
      where: { id },
    });
    return redemption ? this.mapToDomain(redemption) : null;
  }

  async findByMembership(
    membershipId: string,
  ): Promise<MembershipCouponRedemption[]> {
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

  async hasUserRedeemedCoupon(
    membershipId: string,
    couponId: string,
  ): Promise<boolean> {
    const count = await this.prisma.membershipCouponRedemption.count({
      where: {
        membershipId,
        couponId,
      },
    });
    return count > 0;
  }

  async delete(_id: string): Promise<void> {
    await this.prisma.membershipCouponRedemption.delete({
      where: { id },
    });
  }
}

// ============================================
// PRISMA MEMBERSHIP QUOTA USAGE REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipQuotaUsageRepository
  implements IMembershipQuotaUsageRepository
{
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

  async create(
    quotaUsage: MembershipQuotaUsage,
  ): Promise<MembershipQuotaUsage> {
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

  async findById(_id: string): Promise<MembershipQuotaUsage | null> {
    const quota = await this.prisma.membershipQuotaUsage.findUnique({
      where: { id },
    });
    return quota ? this.mapToDomain(quota) : null;
  }

  async findCurrentByMembership(
    membershipId: string,
  ): Promise<MembershipQuotaUsage | null> {
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

  async update(
    quotaUsage: MembershipQuotaUsage,
  ): Promise<MembershipQuotaUsage> {
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

    const remaining = await this.getRemainingQuota(
      membershipId,
      resource,
      tierLimit,
    );

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

// ============================================
// PRISMA TIER SERVICE REPOSITORY
// ============================================

@Injectable()
export class PrismaTierServiceRepository implements ITierServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(data: any): TierService {
    return TierService.rehydrate({
      id: data.id,
      tierId: data.tierId,
      serviceId: data.serviceId,
      quotaPerMonth: data.quotaPerMonth,
      quotaPerYear: data.quotaPerYear,
      rolloverUnused: data.rolloverUnused,
      discountPercent: data.discountPercent,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async create(tierService: TierService): Promise<TierService> {
    const created = await this.prisma.tierService.create({
      data: {
        id: tierService.id,
        tierId: tierService.tierId,
        serviceId: tierService.serviceId,
        quotaPerMonth: tierService.quotaPerMonth,
        quotaPerYear: tierService.quotaPerYear,
        rolloverUnused: tierService.rolloverUnused,
        discountPercent: tierService.discountPercent,
        isActive: tierService.isActive,
        createdAt: tierService.createdAt,
        updatedAt: tierService.updatedAt,
      },
    });
    return this.mapToDomain(created);
  }

  async findById(_id: string): Promise<TierService | null> {
    const tierService = await this.prisma.tierService.findUnique({
      where: { id },
    });
    return tierService ? this.mapToDomain(tierService) : null;
  }

  async findByTierAndService(
    tierId: number,
    serviceId: string,
  ): Promise<TierService | null> {
    const tierService = await this.prisma.tierService.findUnique({
      where: {
        tierId_serviceId: { tierId, serviceId },
      },
    });
    return tierService ? this.mapToDomain(tierService) : null;
  }

  async findByTierId(
    tierId: number,
    options?: { isActive?: boolean },
  ): Promise<TierService[]> {
    const where: Prisma.TierServiceWhereInput = { tierId };
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const tierServices = await this.prisma.tierService.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return tierServices.map((ts) => this.mapToDomain(ts));
  }

  async findByServiceId(
    serviceId: string,
    options?: { isActive?: boolean },
  ): Promise<TierService[]> {
    const where: Prisma.TierServiceWhereInput = { serviceId };
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const tierServices = await this.prisma.tierService.findMany({
      where,
      orderBy: { tierId: 'asc' },
    });
    return tierServices.map((ts) => this.mapToDomain(ts));
  }

  async update(tierService: TierService): Promise<TierService> {
    const updated = await this.prisma.tierService.update({
      where: { id: tierService.id },
      data: {
        quotaPerMonth: tierService.quotaPerMonth,
        quotaPerYear: tierService.quotaPerYear,
        rolloverUnused: tierService.rolloverUnused,
        discountPercent: tierService.discountPercent,
        isActive: tierService.isActive,
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async delete(_id: string): Promise<void> {
    await this.prisma.tierService.delete({
      where: { id },
    });
  }

  async createMany(tierServices: TierService[]): Promise<TierService[]> {
    await this.prisma.tierService.createMany({
      data: tierServices.map((ts) => ({
        id: ts.id,
        tierId: ts.tierId,
        serviceId: ts.serviceId,
        quotaPerMonth: ts.quotaPerMonth,
        quotaPerYear: ts.quotaPerYear,
        rolloverUnused: ts.rolloverUnused,
        discountPercent: ts.discountPercent,
        isActive: ts.isActive,
        createdAt: ts.createdAt,
        updatedAt: ts.updatedAt,
      })),
    });

    // Fetch the created records
    const ids = tierServices.map((ts) => ts.id);
    const created = await this.prisma.tierService.findMany({
      where: { id: { in: ids } },
    });
    return created.map((ts) => this.mapToDomain(ts));
  }

  async deleteByTierId(tierId: number): Promise<void> {
    await this.prisma.tierService.deleteMany({
      where: { tierId },
    });
  }

  async tierHasService(tierId: number, serviceId: string): Promise<boolean> {
    const count = await this.prisma.tierService.count({
      where: { tierId, serviceId, isActive: true },
    });
    return count > 0;
  }

  async getQuota(
    tierId: number,
    serviceId: string,
  ): Promise<{
    quotaPerMonth: number | null;
    quotaPerYear: number | null;
    rolloverUnused: boolean;
  } | null> {
    const tierService = await this.findByTierAndService(tierId, serviceId);
    if (!tierService || !tierService.isActive) {
      return null;
    }

    return {
      quotaPerMonth: tierService.quotaPerMonth,
      quotaPerYear: tierService.quotaPerYear,
      rolloverUnused: tierService.rolloverUnused,
    };
  }
}

// ============================================
// PRISMA SERVICE USAGE REPOSITORY
// ============================================

@Injectable()
export class PrismaServiceUsageRepository implements IServiceUsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(data: any): ServiceUsage {
    return ServiceUsage.rehydrate({
      id: data.id,
      membershipId: data.membershipId,
      serviceId: data.serviceId,
      consultationId: data.consultationId,
      legalOpinionId: data.legalOpinionId,
      serviceRequestId: data.serviceRequestId,
      litigationCaseId: data.litigationCaseId,
      callRequestId: data.callRequestId,
      usedAt: data.usedAt,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      chargedAmount: data.chargedAmount,
      currency: CurrencyMapper.toDomain(data.currency),
      isBilled: data.isBilled,
    });
  }

  async create(serviceUsage: ServiceUsage): Promise<ServiceUsage> {
    const created = await this.prisma.serviceUsage.create({
      data: {
        id: serviceUsage.id,
        membershipId: serviceUsage.membershipId,
        serviceId: serviceUsage.serviceId,
        consultationId: serviceUsage.consultationId,
        legalOpinionId: serviceUsage.legalOpinionId,
        serviceRequestId: serviceUsage.serviceRequestId,
        litigationCaseId: serviceUsage.litigationCaseId,
        callRequestId: serviceUsage.callRequestId,
        usedAt: serviceUsage.usedAt,
        periodStart: serviceUsage.periodStart,
        periodEnd: serviceUsage.periodEnd,
        chargedAmount: serviceUsage.chargedAmount,
        currency: CurrencyMapper.toPrisma(serviceUsage.currency),
        isBilled: serviceUsage.isBilled,
      },
    });
    return this.mapToDomain(created);
  }

  async findById(_id: string): Promise<ServiceUsage | null> {
    const usage = await this.prisma.serviceUsage.findUnique({
      where: { id },
    });
    return usage ? this.mapToDomain(usage) : null;
  }

  async findByMembershipId(
    membershipId: string,
    options?: {
      serviceId?: string;
      periodStart?: Date;
      periodEnd?: Date;
      limit?: number;
      offset?: number;
    },
  ): Promise<ServiceUsage[]> {
    const where: Prisma.ServiceUsageWhereInput = { membershipId };

    if (options?.serviceId) {
      where.serviceId = options.serviceId;
    }
    if (options?.periodStart) {
      where.usedAt = { ...(where.usedAt as any), gte: options.periodStart };
    }
    if (options?.periodEnd) {
      where.usedAt = { ...(where.usedAt as any), lte: options.periodEnd };
    }

    const usages = await this.prisma.serviceUsage.findMany({
      where,
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { usedAt: 'desc' },
    });

    return usages.map((u) => this.mapToDomain(u));
  }

  async findByFilter(filter: ServiceUsageFilter): Promise<ServiceUsage[]> {
    const where: Prisma.ServiceUsageWhereInput = {};

    if (filter.membershipId) where.membershipId = filter.membershipId;
    if (filter.serviceId) where.serviceId = filter.serviceId;
    if (filter.isBilled !== undefined) where.isBilled = filter.isBilled;
    if (filter.periodStart) where.usedAt = { gte: filter.periodStart };
    if (filter.periodEnd)
      where.usedAt = { ...(where.usedAt as any), lte: filter.periodEnd };

    if (filter.requestType) {
      switch (filter.requestType) {
        case 'consultation':
          where.consultationId = { not: null };
          break;
        case 'legal_opinion':
          where.legalOpinionId = { not: null };
          break;
        case 'service':
          where.serviceRequestId = { not: null };
          break;
        case 'litigation':
          where.litigationCaseId = { not: null };
          break;
        case 'call':
          where.callRequestId = { not: null };
          break;
      }
    }

    const usages = await this.prisma.serviceUsage.findMany({
      where,
      orderBy: { usedAt: 'desc' },
    });

    return usages.map((u) => this.mapToDomain(u));
  }

  async countUsageInPeriod(
    membershipId: string,
    serviceId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    return await this.prisma.serviceUsage.count({
      where: {
        membershipId,
        serviceId,
        usedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });
  }

  async getUsageSummaryByService(
    membershipId: string,
    periodStart?: Date,
    periodEnd?: Date,
  ): Promise<ServiceUsageSummary[]> {
    const where: Prisma.ServiceUsageWhereInput = { membershipId };
    if (periodStart) where.usedAt = { gte: periodStart };
    if (periodEnd) where.usedAt = { ...(where.usedAt as any), lte: periodEnd };

    const result = await this.prisma.serviceUsage.groupBy({
      by: ['serviceId'],
      where,
      _count: { id: true },
      _sum: { chargedAmount: true },
    });

    return result.map((r) => ({
      serviceId: r.serviceId,
      totalUsage: r._count.id,
      billedUsage: 0, // Would need separate query
      freeUsage: 0,
      totalChargedAmount: Number(r._sum.chargedAmount) || 0,
      currency: 'SAR',
    }));
  }

  async getTotalUsageCount(
    membershipId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    return await this.prisma.serviceUsage.count({
      where: {
        membershipId,
        usedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });
  }

  async markAsBilled(
    id: string,
    amount: number,
    currency: string,
  ): Promise<ServiceUsage> {
    const updated = await this.prisma.serviceUsage.update({
      where: { id },
      data: {
        chargedAmount: amount,
        currency: CurrencyMapper.toPrisma(currency),
        isBilled: true,
      },
    });
    return this.mapToDomain(updated);
  }

  async getUnbilledUsage(membershipId: string): Promise<ServiceUsage[]> {
    const usages = await this.prisma.serviceUsage.findMany({
      where: {
        membershipId,
        isBilled: false,
      },
      orderBy: { usedAt: 'asc' },
    });
    return usages.map((u) => this.mapToDomain(u));
  }

  async delete(_id: string): Promise<void> {
    await this.prisma.serviceUsage.delete({
      where: { id },
    });
  }

  async hasUsageForRequest(
    requestType:
      | 'consultation'
      | 'legal_opinion'
      | 'service'
      | 'litigation'
      | 'call',
    requestId: string,
  ): Promise<boolean> {
    const where: Prisma.ServiceUsageWhereInput = {};

    switch (requestType) {
      case 'consultation':
        where.consultationId = requestId;
        break;
      case 'legal_opinion':
        where.legalOpinionId = requestId;
        break;
      case 'service':
        where.serviceRequestId = requestId;
        break;
      case 'litigation':
        where.litigationCaseId = requestId;
        break;
      case 'call':
        where.callRequestId = requestId;
        break;
    }

    const count = await this.prisma.serviceUsage.count({ where });
    return count > 0;
  }
}

// ============================================
// PRISMA MEMBERSHIP CHANGE LOG REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipChangeLogRepository
  implements IMembershipChangeLogRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(data: any): MembershipChangeLog {
    return MembershipChangeLog.rehydrate({
      id: data.id,
      membershipId: data.membershipId,
      oldTierId: data.oldTierId,
      newTierId: data.newTierId,
      reason: data.reason,
      changedAt: data.changedAt,
    });
  }

  async create(changeLog: MembershipChangeLog): Promise<MembershipChangeLog> {
    const created = await this.prisma.membershipChangeLog.create({
      data: {
        id: changeLog.id,
        membershipId: changeLog.membershipId,
        oldTierId: changeLog.oldTierId,
        newTierId: changeLog.newTierId,
        reason: changeLog.reason,
        changedAt: changeLog.changedAt,
      },
    });
    return this.mapToDomain(created);
  }

  async findById(_id: string): Promise<MembershipChangeLog | null> {
    const changeLog = await this.prisma.membershipChangeLog.findUnique({
      where: { id },
    });
    return changeLog ? this.mapToDomain(changeLog) : null;
  }

  async findByMembershipId(
    membershipId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'asc' | 'desc';
    },
  ): Promise<MembershipChangeLog[]> {
    const changeLogs = await this.prisma.membershipChangeLog.findMany({
      where: { membershipId },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { changedAt: options?.orderBy || 'desc' },
    });
    return changeLogs.map((cl) => this.mapToDomain(cl));
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      membershipId?: string;
      reason?: string;
    },
  ): Promise<MembershipChangeLog[]> {
    const where: Prisma.MembershipChangeLogWhereInput = {
      changedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (options?.membershipId) where.membershipId = options.membershipId;
    if (options?.reason) where.reason = options.reason;

    const changeLogs = await this.prisma.membershipChangeLog.findMany({
      where,
      orderBy: { changedAt: 'desc' },
    });
    return changeLogs.map((cl) => this.mapToDomain(cl));
  }

  async getLatestChange(
    membershipId: string,
  ): Promise<MembershipChangeLog | null> {
    const changeLog = await this.prisma.membershipChangeLog.findFirst({
      where: { membershipId },
      orderBy: { changedAt: 'desc' },
    });
    return changeLog ? this.mapToDomain(changeLog) : null;
  }

  async countByMembershipId(membershipId: string): Promise<number> {
    return await this.prisma.membershipChangeLog.count({
      where: { membershipId },
    });
  }

  async getTierChangeStats(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    upgrades: number;
    downgrades: number;
    cancellations: number;
    reactivations: number;
  }> {
    const where: Prisma.MembershipChangeLogWhereInput = {
      changedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [upgrades, downgrades, cancellations, reactivations] =
      await Promise.all([
        this.prisma.membershipChangeLog.count({
          where: { ...where, reason: 'upgrade' },
        }),
        this.prisma.membershipChangeLog.count({
          where: { ...where, reason: 'downgrade' },
        }),
        this.prisma.membershipChangeLog.count({
          where: { ...where, reason: 'cancellation' },
        }),
        this.prisma.membershipChangeLog.count({
          where: { ...where, reason: 'reactivation' },
        }),
      ]);

    return { upgrades, downgrades, cancellations, reactivations };
  }
}
