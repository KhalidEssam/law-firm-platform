// ============================================
// PRISMA REFUND REPOSITORY
// src/infrastructure/persistence/billing/prisma-refund.repository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  Refund,
  RefundReviewData,
} from '../../../core/domain/billing/entities/refund.entity';
import { RefundStatusEnum } from '../../../core/domain/billing/value-objects/refund-status.vo';
import {
  IRefundRepository,
  RefundListOptions,
  RefundCountOptions,
  RefundStatistics,
} from '../../../core/domain/billing/ports/refund.repository';
import { RefundStatusMapper, CurrencyMapper } from './billing-enum.mapper';

@Injectable()
export class PrismaRefundRepository implements IRefundRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CREATE
  // ============================================
  async create(refund: Refund): Promise<Refund> {
    const created = await this.prisma.refund.create({
      data: {
        id: refund.id,
        userId: refund.userId,
        transactionLogId: refund.transactionLogId,
        paymentId: refund.paymentId,
        amount: refund.amount.amount,
        currency: CurrencyMapper.toPrisma(refund.amount.currency),
        reason: refund.reason,
        status: RefundStatusMapper.toPrisma(refund.status.getValue()),
        createdAt: refund.createdAt,
        updatedAt: refund.updatedAt,
      },
    });
    return this.toDomain(created);
  }

  // ============================================
  // READ
  // ============================================
  async findById(_id: string): Promise<Refund | null> {
    const found = await this.prisma.refund.findUnique({
      where: { id },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByTransactionLogId(transactionLogId: string): Promise<Refund[]> {
    const found = await this.prisma.refund.findMany({
      where: { transactionLogId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByPaymentId(paymentId: string): Promise<Refund[]> {
    const found = await this.prisma.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByUserId(userId: string): Promise<Refund[]> {
    const found = await this.prisma.refund.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async list(options?: RefundListOptions): Promise<Refund[]> {
    const found = await this.prisma.refund.findMany({
      where: this.buildWhereClause(options),
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      orderBy: {
        [options?.orderBy ?? 'createdAt']: options?.orderDir ?? 'desc',
      },
    });
    return found.map((record) => this.toDomain(record));
  }

  async count(options?: RefundCountOptions): Promise<number> {
    return await this.prisma.refund.count({
      where: this.buildWhereClause(options),
    });
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(refund: Refund): Promise<Refund> {
    const updated = await this.prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: RefundStatusMapper.toPrisma(refund.status.getValue()),
        reviewedBy: refund.reviewedBy,
        reviewedAt: refund.reviewedAt,
        reviewNotes: refund.reviewNotes,
        processedAt: refund.processedAt,
        refundReference: refund.refundReference,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async approve(_id: string, reviewData: RefundReviewData): Promise<Refund> {
    const updated = await this.prisma.refund.update({
      where: { id },
      data: {
        status: RefundStatusMapper.toPrisma(RefundStatusEnum.APPROVED),
        reviewedBy: reviewData.reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: reviewData.reviewNotes,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async reject(_id: string, reviewData: RefundReviewData): Promise<Refund> {
    const updated = await this.prisma.refund.update({
      where: { id },
      data: {
        status: RefundStatusMapper.toPrisma(RefundStatusEnum.REJECTED),
        reviewedBy: reviewData.reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: reviewData.reviewNotes,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async process(_id: string, refundReference: string): Promise<Refund> {
    const updated = await this.prisma.refund.update({
      where: { id },
      data: {
        status: RefundStatusMapper.toPrisma(RefundStatusEnum.PROCESSED),
        processedAt: new Date(),
        refundReference,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  // ============================================
  // DELETE
  // ============================================
  async delete(_id: string): Promise<void> {
    await this.prisma.refund.delete({
      where: { id },
    });
  }

  // ============================================
  // BUSINESS QUERIES
  // ============================================
  async findPendingRefunds(): Promise<Refund[]> {
    const found = await this.prisma.refund.findMany({
      where: {
        status: RefundStatusMapper.toPrisma(RefundStatusEnum.PENDING),
      },
      orderBy: { createdAt: 'asc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findApprovedButNotProcessed(): Promise<Refund[]> {
    const found = await this.prisma.refund.findMany({
      where: {
        status: RefundStatusMapper.toPrisma(RefundStatusEnum.APPROVED),
      },
      orderBy: { reviewedAt: 'asc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByReviewer(reviewedBy: string): Promise<Refund[]> {
    const found = await this.prisma.refund.findMany({
      where: { reviewedBy },
      orderBy: { reviewedAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async getStatistics(
    fromDate?: Date,
    toDate?: Date,
  ): Promise<RefundStatistics> {
    const dateFilter =
      fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {};

    const [
      pending,
      approved,
      rejected,
      processed,
      totalAmount,
      avgProcessingTime,
    ] = await Promise.all([
      this.prisma.refund.count({
        where: {
          status: RefundStatusMapper.toPrisma(RefundStatusEnum.PENDING),
          ...dateFilter,
        },
      }),
      this.prisma.refund.count({
        where: {
          status: RefundStatusMapper.toPrisma(RefundStatusEnum.APPROVED),
          ...dateFilter,
        },
      }),
      this.prisma.refund.count({
        where: {
          status: RefundStatusMapper.toPrisma(RefundStatusEnum.REJECTED),
          ...dateFilter,
        },
      }),
      this.prisma.refund.count({
        where: {
          status: RefundStatusMapper.toPrisma(RefundStatusEnum.PROCESSED),
          ...dateFilter,
        },
      }),
      this.prisma.refund.aggregate({
        where: {
          status: RefundStatusMapper.toPrisma(RefundStatusEnum.PROCESSED),
          ...dateFilter,
        },
        _sum: { amount: true },
      }),
      // Calculate average processing time for processed refunds
      this.prisma.$queryRaw<{ avg: number }[]>`
                SELECT AVG(EXTRACT(EPOCH FROM ("processedAt" - "reviewedAt"))) as avg
                FROM "Refund"
                WHERE status = 'processed'
                AND "processedAt" IS NOT NULL
                AND "reviewedAt" IS NOT NULL
                ${fromDate ? this.prisma.$queryRaw`AND "createdAt" >= ${fromDate}` : this.prisma.$queryRaw``}
                ${toDate ? this.prisma.$queryRaw`AND "createdAt" <= ${toDate}` : this.prisma.$queryRaw``}
            `.catch(() => [{ avg: null }]),
    ]);

    return {
      totalPending: pending,
      totalApproved: approved,
      totalRejected: rejected,
      totalProcessed: processed,
      totalAmount: totalAmount._sum.amount ?? 0,
      averageProcessingTime: avgProcessingTime[0]?.avg ?? null,
    };
  }

  async getTotalRefundedAmount(userId?: string): Promise<number> {
    const result = await this.prisma.refund.aggregate({
      where: {
        ...(userId && { userId }),
        status: RefundStatusMapper.toPrisma(RefundStatusEnum.PROCESSED),
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async getPendingRefundAmount(userId?: string): Promise<number> {
    const result = await this.prisma.refund.aggregate({
      where: {
        ...(userId && { userId }),
        status: {
          in: [
            RefundStatusMapper.toPrisma(RefundStatusEnum.PENDING),
            RefundStatusMapper.toPrisma(RefundStatusEnum.APPROVED),
          ],
        },
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================
  private buildWhereClause(options?: RefundListOptions | RefundCountOptions) {
    const where: any = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.status) {
      where.status = RefundStatusMapper.toPrisma(options.status);
    }

    if (options?.reviewedBy) {
      where.reviewedBy = options.reviewedBy;
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

  private toDomain(record: any): Refund {
    return Refund.rehydrate({
      id: record.id,
      userId: record.userId,
      transactionLogId: record.transactionLogId ?? undefined,
      paymentId: record.paymentId ?? undefined,
      amount: record.amount,
      currency: CurrencyMapper.toDomain(record.currency),
      reason: record.reason,
      status: RefundStatusMapper.toDomain(record.status),
      reviewedBy: record.reviewedBy ?? undefined,
      reviewedAt: record.reviewedAt ?? undefined,
      reviewNotes: record.reviewNotes ?? undefined,
      processedAt: record.processedAt ?? undefined,
      refundReference: record.refundReference ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
