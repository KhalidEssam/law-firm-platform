// ============================================
// PRISMA TRANSACTION LOG REPOSITORY
// src/infrastructure/persistence/billing/prisma-transaction-log.repository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionLog } from '../../../core/domain/billing/entities/transaction-log.entity';
import { TransactionTypeEnum } from '../../../core/domain/billing/value-objects/transaction-type.vo';
import { PaymentStatusEnum } from '../../../core/domain/billing/value-objects/payment-status.vo';
import {
  ITransactionLogRepository,
  TransactionLogListOptions,
  TransactionLogCountOptions,
  TransactionSummary,
} from '../../../core/domain/billing/ports/transaction-log.repository';
import {
  TransactionTypeMapper,
  PaymentStatusMapper,
  CurrencyMapper,
} from './billing-enum.mapper';

@Injectable()
export class PrismaTransactionLogRepository
  implements ITransactionLogRepository
{
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CREATE
  // ============================================
  async create(transaction: TransactionLog): Promise<TransactionLog> {
    const created = await this.prisma.transactionLog.create({
      data: {
        id: transaction.id,
        userId: transaction.userId,
        type: TransactionTypeMapper.toPrisma(transaction.type.getValue()),
        amount: transaction.amount.amount,
        currency: CurrencyMapper.toPrisma(transaction.amount.currency),
        status: PaymentStatusMapper.toPrisma(transaction.status.getValue()),
        reference: transaction.reference,
        metadata: transaction.metadata as any,
        createdAt: transaction.createdAt,
      },
    });
    return this.toDomain(created);
  }

  // ============================================
  // READ
  // ============================================
  async findById(_id: string): Promise<TransactionLog | null> {
    const found = await this.prisma.transactionLog.findUnique({
      where: { id },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByReference(reference: string): Promise<TransactionLog | null> {
    const found = await this.prisma.transactionLog.findFirst({
      where: { reference },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByUserId(userId: string): Promise<TransactionLog[]> {
    const found = await this.prisma.transactionLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async list(options?: TransactionLogListOptions): Promise<TransactionLog[]> {
    const found = await this.prisma.transactionLog.findMany({
      where: this.buildWhereClause(options),
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      orderBy: {
        [options?.orderBy ?? 'createdAt']: options?.orderDir ?? 'desc',
      },
    });
    return found.map((record) => this.toDomain(record));
  }

  async count(options?: TransactionLogCountOptions): Promise<number> {
    return await this.prisma.transactionLog.count({
      where: this.buildWhereClause(options),
    });
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(transaction: TransactionLog): Promise<TransactionLog> {
    const updated = await this.prisma.transactionLog.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatusMapper.toPrisma(transaction.status.getValue()),
        reference: transaction.reference,
        metadata: transaction.metadata as any,
      },
    });
    return this.toDomain(updated);
  }

  async markAsPaid(_id: string): Promise<TransactionLog> {
    const updated = await this.prisma.transactionLog.update({
      where: { id },
      data: {
        status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.PAID),
      },
    });
    return this.toDomain(updated);
  }

  async markAsFailed(_id: string): Promise<TransactionLog> {
    const updated = await this.prisma.transactionLog.update({
      where: { id },
      data: {
        status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.FAILED),
      },
    });
    return this.toDomain(updated);
  }

  async markAsRefunded(_id: string): Promise<TransactionLog> {
    const updated = await this.prisma.transactionLog.update({
      where: { id },
      data: {
        status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.REFUNDED),
      },
    });
    return this.toDomain(updated);
  }

  async markAsPartiallyRefunded(_id: string): Promise<TransactionLog> {
    const updated = await this.prisma.transactionLog.update({
      where: { id },
      data: {
        status: PaymentStatusMapper.toPrisma(
          PaymentStatusEnum.PARTIALLY_REFUNDED,
        ),
      },
    });
    return this.toDomain(updated);
  }

  // ============================================
  // DELETE
  // ============================================
  async delete(_id: string): Promise<void> {
    await this.prisma.transactionLog.delete({
      where: { id },
    });
  }

  // ============================================
  // BUSINESS QUERIES
  // ============================================
  async findPendingTransactions(userId?: string): Promise<TransactionLog[]> {
    const found = await this.prisma.transactionLog.findMany({
      where: {
        ...(userId && { userId }),
        status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.PENDING),
      },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findFailedTransactions(userId?: string): Promise<TransactionLog[]> {
    const found = await this.prisma.transactionLog.findMany({
      where: {
        ...(userId && { userId }),
        status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.FAILED),
      },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findSuccessfulTransactions(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TransactionLog[]> {
    const found = await this.prisma.transactionLog.findMany({
      where: {
        userId,
        status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.PAID),
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate && { gte: fromDate }),
                ...(toDate && { lte: toDate }),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async getUserTransactionSummary(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TransactionSummary> {
    const dateFilter =
      fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {};

    const [credits, debits, count] = await Promise.all([
      // Sum of credits (wallet_topup, refund)
      this.prisma.transactionLog.aggregate({
        where: {
          userId,
          status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.PAID),
          type: {
            in: [
              TransactionTypeMapper.toPrisma(TransactionTypeEnum.WALLET_TOPUP),
              TransactionTypeMapper.toPrisma(TransactionTypeEnum.REFUND),
            ],
          },
          ...dateFilter,
        },
        _sum: { amount: true },
      }),
      // Sum of debits (subscription, service_payment)
      this.prisma.transactionLog.aggregate({
        where: {
          userId,
          status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.PAID),
          type: {
            in: [
              TransactionTypeMapper.toPrisma(TransactionTypeEnum.SUBSCRIPTION),
              TransactionTypeMapper.toPrisma(
                TransactionTypeEnum.SERVICE_PAYMENT,
              ),
            ],
          },
          ...dateFilter,
        },
        _sum: { amount: true },
      }),
      // Total count
      this.prisma.transactionLog.count({
        where: {
          userId,
          status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.PAID),
          ...dateFilter,
        },
      }),
    ]);

    const totalCredits = credits._sum.amount ?? 0;
    const totalDebits = debits._sum.amount ?? 0;

    return {
      totalCredits,
      totalDebits,
      netAmount: totalCredits - totalDebits,
      transactionCount: count,
    };
  }

  async getTotalSpent(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<number> {
    const result = await this.prisma.transactionLog.aggregate({
      where: {
        userId,
        status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.PAID),
        type: {
          in: [
            TransactionTypeMapper.toPrisma(TransactionTypeEnum.SUBSCRIPTION),
            TransactionTypeMapper.toPrisma(TransactionTypeEnum.SERVICE_PAYMENT),
          ],
        },
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate && { gte: fromDate }),
                ...(toDate && { lte: toDate }),
              },
            }
          : {}),
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async getTotalRefunded(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<number> {
    const result = await this.prisma.transactionLog.aggregate({
      where: {
        userId,
        status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.PAID),
        type: TransactionTypeMapper.toPrisma(TransactionTypeEnum.REFUND),
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate && { gte: fromDate }),
                ...(toDate && { lte: toDate }),
              },
            }
          : {}),
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================
  private buildWhereClause(
    options?: TransactionLogListOptions | TransactionLogCountOptions,
  ) {
    const where: any = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.type) {
      where.type = TransactionTypeMapper.toPrisma(options.type);
    }

    if (options?.status) {
      where.status = PaymentStatusMapper.toPrisma(options.status);
    }

    if (options?.fromDate || options?.toDate) {
      where.createdAt = {};
      if (options?.fromDate) {
        where.createdAt.gte = options.fromDate;
      }
      if (options?.toDate) {
        where.createdAt.lte = options.toDate;
      }
    }

    return where;
  }

  private toDomain(record: any): TransactionLog {
    return TransactionLog.rehydrate({
      id: record.id,
      userId: record.userId,
      type: TransactionTypeMapper.toDomain(record.type),
      amount: record.amount,
      currency: CurrencyMapper.toDomain(record.currency),
      status: PaymentStatusMapper.toDomain(record.status),
      reference: record.reference ?? undefined,
      metadata: record.metadata ?? undefined,
      createdAt: record.createdAt,
    });
  }
}
