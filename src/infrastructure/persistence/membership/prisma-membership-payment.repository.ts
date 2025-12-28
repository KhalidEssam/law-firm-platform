// src/infrastructure/persistence/prisma/repositories/prisma-membership-payment.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IMembershipPaymentRepository } from '../../../core/domain/membership/repositories/membership-payment.repository';
import { MembershipPayment } from '../../../core/domain/membership/entities/membership-payment.entity';

// Prisma 7 imports from generated path
import {
  Prisma,
  Currency as PrismaCurrency,
  PaymentStatus as PrismaPaymentStatus,
} from '@prisma/client';

// ============================================
// ENUM MAPPERS
// ============================================

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
    [PrismaPaymentStatus.paid]: 'paid',
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

// ============================================
// REPOSITORY
// ============================================

@Injectable()
export class PrismaMembershipPaymentRepository
  implements IMembershipPaymentRepository
{
  constructor(private readonly prisma: PrismaService) {}

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
        metadata: (payment.metadata || {}) as Prisma.InputJsonValue,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    });
    return this.toDomain(created);
  }

  async findById(_id: string): Promise<MembershipPayment | null> {
    const payment = await this.prisma.membershipPayment.findUnique({
      where: { id },
    });
    return payment ? this.toDomain(payment) : null;
  }

  async findByInvoice(invoiceId: string): Promise<MembershipPayment[]> {
    const payments = await this.prisma.membershipPayment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => this.toDomain(p));
  }

  async findByProviderTxnId(
    providerTxnId: string,
  ): Promise<MembershipPayment | null> {
    const payment = await this.prisma.membershipPayment.findFirst({
      where: { providerTxnId },
    });
    return payment ? this.toDomain(payment) : null;
  }

  async findPendingPayments(): Promise<MembershipPayment[]> {
    const payments = await this.prisma.membershipPayment.findMany({
      where: { status: PrismaPaymentStatus.pending },
      orderBy: { createdAt: 'asc' },
    });
    return payments.map((p) => this.toDomain(p));
  }

  async update(payment: MembershipPayment): Promise<MembershipPayment> {
    const updated = await this.prisma.membershipPayment.update({
      where: { id: payment.id },
      data: {
        providerTxnId: payment.providerTxnId,
        status: PaymentStatusMapper.toPrisma(payment.status),
        metadata: (payment.metadata || {}) as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  private toDomain(record: any): MembershipPayment {
    return MembershipPayment.rehydrate({
      id: record.id,
      invoiceId: record.invoiceId,
      provider: record.provider,
      providerTxnId: record.providerTxnId,
      amount: Number(record.amount),
      currency: CurrencyMapper.toDomain(record.currency),
      status: PaymentStatusMapper.toDomain(record.status),
      metadata: record.metadata as Record<string, any>,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
