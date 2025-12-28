// ============================================
// PRISMA BILLING UNIT OF WORK
// src/infrastructure/persistence/billing/prisma-billing.uow.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IBillingUnitOfWork,
  BILLING_UNIT_OF_WORK,
} from '../../../core/domain/billing/ports/billing.uow';
import { IRefundRepository } from '../../../core/domain/billing/ports/refund.repository';
import { IDisputeRepository } from '../../../core/domain/billing/ports/dispute.repository';
import { ITransactionLogRepository } from '../../../core/domain/billing/ports/transaction-log.repository';
import { IMembershipInvoiceRepository } from '../../../core/domain/billing/ports/membership-invoice.repository';
import {
  FINANCIAL_TRANSACTION_OPTIONS,
  TransactionOptions,
} from '../../../core/domain/shared/ports/base-unit-of-work.interface';
import {
  toPrismaTransactionOptions,
  PrismaTransactionClient,
} from '../shared/prisma-transaction.helper';

// Import domain entities for repository implementations
import {
  Refund,
  RefundReviewData,
} from '../../../core/domain/billing/entities/refund.entity';
import {
  Dispute,
  DisputeResolutionData,
  DisputeEscalationData,
} from '../../../core/domain/billing/entities/dispute.entity';
import { TransactionLog } from '../../../core/domain/billing/entities/transaction-log.entity';
import { MembershipInvoice } from '../../../core/domain/billing/entities/membership-invoice.entity';
import { RefundStatusEnum } from '../../../core/domain/billing/value-objects/refund-status.vo';
import { DisputeStatusEnum } from '../../../core/domain/billing/value-objects/dispute-status.vo';
import { PriorityEnum } from '../../../core/domain/billing/value-objects/priority.vo';
import { PaymentStatusEnum } from '../../../core/domain/billing/value-objects/payment-status.vo';
import { InvoiceStatusEnum } from '../../../core/domain/billing/value-objects/invoice-status.vo';
import {
  RefundStatusMapper,
  DisputeStatusMapper,
  PriorityMapper,
  TransactionTypeMapper,
  PaymentStatusMapper,
  InvoiceStatusMapper,
  CurrencyMapper,
} from './billing-enum.mapper';
import {
  RefundListOptions,
  RefundCountOptions,
  RefundStatistics,
} from '../../../core/domain/billing/ports/refund.repository';
import {
  DisputeListOptions,
  DisputeCountOptions,
  DisputeStatistics,
} from '../../../core/domain/billing/ports/dispute.repository';
import {
  TransactionLogListOptions,
  TransactionLogCountOptions,
  TransactionSummary,
} from '../../../core/domain/billing/ports/transaction-log.repository';
import {
  MembershipInvoiceListOptions,
  MembershipInvoiceCountOptions,
} from '../../../core/domain/billing/ports/membership-invoice.repository';
import { TransactionTypeEnum } from '../../../core/domain/billing/value-objects/transaction-type.vo';

/**
 * Prisma implementation of the Billing Unit of Work.
 *
 * Provides transactional access to all billing repositories.
 * All operations within a transaction are atomic - they either
 * all succeed or all fail together.
 */
@Injectable()
export class PrismaBillingUnitOfWork implements IBillingUnitOfWork {
  // These are only used when NOT in a transaction (for non-transactional reads)
  private _refunds: IRefundRepository;
  private _disputes: IDisputeRepository;
  private _transactionLogs: ITransactionLogRepository;
  private _invoices: IMembershipInvoiceRepository;

  constructor(private readonly prisma: PrismaService) {
    // Initialize non-transactional repositories for simple reads
    this._refunds = new TransactionalRefundRepository(prisma);
    this._disputes = new TransactionalDisputeRepository(prisma);
    this._transactionLogs = new TransactionalTransactionLogRepository(prisma);
    this._invoices = new TransactionalMembershipInvoiceRepository(prisma);
  }

  get refunds(): IRefundRepository {
    return this._refunds;
  }

  get disputes(): IDisputeRepository {
    return this._disputes;
  }

  get transactionLogs(): ITransactionLogRepository {
    return this._transactionLogs;
  }

  get invoices(): IMembershipInvoiceRepository {
    return this._invoices;
  }

  /**
   * Execute operations within a database transaction.
   * Uses Serializable isolation for financial operations.
   */
  async transaction<R>(
    work: (uow: IBillingUnitOfWork) => Promise<R>,
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
  private createTransactionalUow(
    tx: PrismaTransactionClient,
  ): IBillingUnitOfWork {
    return {
      refunds: new TransactionalRefundRepository(tx),
      disputes: new TransactionalDisputeRepository(tx),
      transactionLogs: new TransactionalTransactionLogRepository(tx),
      invoices: new TransactionalMembershipInvoiceRepository(tx),
      transaction: async <R>(
        work: (uow: IBillingUnitOfWork) => Promise<R>,
      ): Promise<R> => {
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
 * Transactional Refund Repository.
 * Can be instantiated with either PrismaService or a transaction client.
 */
class TransactionalRefundRepository implements IRefundRepository {
  constructor(
    private readonly prisma: PrismaService | PrismaTransactionClient,
  ) {}

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

  async findById(id: string): Promise<Refund | null> {
    const found = await this.prisma.refund.findUnique({ where: { id } });
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

  async approve(id: string, reviewData: RefundReviewData): Promise<Refund> {
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

  async reject(id: string, reviewData: RefundReviewData): Promise<Refund> {
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

  async process(id: string, refundReference: string): Promise<Refund> {
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

  async delete(id: string): Promise<void> {
    await this.prisma.refund.delete({ where: { id } });
  }

  async findPendingRefunds(): Promise<Refund[]> {
    const found = await this.prisma.refund.findMany({
      where: { status: RefundStatusMapper.toPrisma(RefundStatusEnum.PENDING) },
      orderBy: { createdAt: 'asc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findApprovedButNotProcessed(): Promise<Refund[]> {
    const found = await this.prisma.refund.findMany({
      where: { status: RefundStatusMapper.toPrisma(RefundStatusEnum.APPROVED) },
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

    const [pending, approved, rejected, processed, totalAmount] =
      await Promise.all([
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
      ]);

    return {
      totalPending: pending,
      totalApproved: approved,
      totalRejected: rejected,
      totalProcessed: processed,
      totalAmount: totalAmount._sum.amount ?? 0,
      averageProcessingTime: null, // Complex query, skip in transaction context
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

  private buildWhereClause(
    options?: RefundListOptions | RefundCountOptions,
  ): any {
    const where: any = {};
    if (options?.userId) where.userId = options.userId;
    if (options?.status)
      where.status = RefundStatusMapper.toPrisma(options.status);
    if (options?.reviewedBy) where.reviewedBy = options.reviewedBy;
    if (options?.fromDate || options?.toDate) {
      where.createdAt = {};
      if (options?.fromDate) where.createdAt.gte = options.fromDate;
      if (options?.toDate) where.createdAt.lte = options.toDate;
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

/**
 * Transactional Dispute Repository.
 */
class TransactionalDisputeRepository implements IDisputeRepository {
  constructor(
    private readonly prisma: PrismaService | PrismaTransactionClient,
  ) {}

  async create(dispute: Dispute): Promise<Dispute> {
    const created = await this.prisma.dispute.create({
      data: {
        id: dispute.id,
        userId: dispute.userId,
        consultationId: dispute.consultationId,
        legalOpinionId: dispute.legalOpinionId,
        serviceRequestId: dispute.serviceRequestId,
        litigationCaseId: dispute.litigationCaseId,
        reason: dispute.reason,
        description: dispute.description,
        evidence: dispute.evidence as any,
        status: DisputeStatusMapper.toPrisma(dispute.status.getValue()),
        priority: PriorityMapper.toPrisma(dispute.priority.getValue()),
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
      },
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<Dispute | null> {
    const found = await this.prisma.dispute.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async findByUserId(userId: string): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByConsultationId(consultationId: string): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: { consultationId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByLegalOpinionId(legalOpinionId: string): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: { legalOpinionId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByServiceRequestId(serviceRequestId: string): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: { serviceRequestId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByLitigationCaseId(litigationCaseId: string): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: { litigationCaseId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async list(options?: DisputeListOptions): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: this.buildWhereClause(options),
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      orderBy: {
        [options?.orderBy ?? 'createdAt']: options?.orderDir ?? 'desc',
      },
    });
    return found.map((record) => this.toDomain(record));
  }

  async count(options?: DisputeCountOptions): Promise<number> {
    return await this.prisma.dispute.count({
      where: this.buildWhereClause(options),
    });
  }

  async update(dispute: Dispute): Promise<Dispute> {
    const updated = await this.prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        status: DisputeStatusMapper.toPrisma(dispute.status.getValue()),
        priority: PriorityMapper.toPrisma(dispute.priority.getValue()),
        evidence: dispute.evidence as any,
        resolution: dispute.resolution,
        resolvedBy: dispute.resolvedBy,
        resolvedAt: dispute.resolvedAt,
        escalatedAt: dispute.escalatedAt,
        escalatedTo: dispute.escalatedTo,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async startReview(id: string): Promise<Dispute> {
    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.UNDER_REVIEW),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async escalate(
    id: string,
    escalationData: DisputeEscalationData,
  ): Promise<Dispute> {
    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.ESCALATED),
        escalatedAt: new Date(),
        escalatedTo: escalationData.escalatedTo,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async resolve(
    id: string,
    resolutionData: DisputeResolutionData,
  ): Promise<Dispute> {
    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.RESOLVED),
        resolution: resolutionData.resolution,
        resolvedBy: resolutionData.resolvedBy,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async close(id: string): Promise<Dispute> {
    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.CLOSED),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async updatePriority(id: string, priority: PriorityEnum): Promise<Dispute> {
    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        priority: PriorityMapper.toPrisma(priority),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.dispute.delete({ where: { id } });
  }

  async findOpenDisputes(): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: { status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.OPEN) },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findActiveDisputes(): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: {
        status: {
          in: [
            DisputeStatusMapper.toPrisma(DisputeStatusEnum.OPEN),
            DisputeStatusMapper.toPrisma(DisputeStatusEnum.UNDER_REVIEW),
            DisputeStatusMapper.toPrisma(DisputeStatusEnum.ESCALATED),
          ],
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findEscalatedDisputes(): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: {
        status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.ESCALATED),
      },
      orderBy: [{ priority: 'desc' }, { escalatedAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findHighPriorityDisputes(): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: {
        priority: {
          in: [
            PriorityMapper.toPrisma(PriorityEnum.HIGH),
            PriorityMapper.toPrisma(PriorityEnum.URGENT),
          ],
        },
        status: {
          notIn: [
            DisputeStatusMapper.toPrisma(DisputeStatusEnum.RESOLVED),
            DisputeStatusMapper.toPrisma(DisputeStatusEnum.CLOSED),
          ],
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findDisputesRequiringAttention(): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: {
        OR: [
          {
            priority: {
              in: [
                PriorityMapper.toPrisma(PriorityEnum.HIGH),
                PriorityMapper.toPrisma(PriorityEnum.URGENT),
              ],
            },
            status: {
              in: [
                DisputeStatusMapper.toPrisma(DisputeStatusEnum.OPEN),
                DisputeStatusMapper.toPrisma(DisputeStatusEnum.UNDER_REVIEW),
                DisputeStatusMapper.toPrisma(DisputeStatusEnum.ESCALATED),
              ],
            },
          },
          { status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.ESCALATED) },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByResolver(resolvedBy: string): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: { resolvedBy },
      orderBy: { resolvedAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByEscalatee(escalatedTo: string): Promise<Dispute[]> {
    const found = await this.prisma.dispute.findMany({
      where: { escalatedTo },
      orderBy: { escalatedAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async getStatistics(
    fromDate?: Date,
    toDate?: Date,
  ): Promise<DisputeStatistics> {
    const dateFilter =
      fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {};

    const [open, underReview, escalated, resolved, closed, byPriority] =
      await Promise.all([
        this.prisma.dispute.count({
          where: {
            status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.OPEN),
            ...dateFilter,
          },
        }),
        this.prisma.dispute.count({
          where: {
            status: DisputeStatusMapper.toPrisma(
              DisputeStatusEnum.UNDER_REVIEW,
            ),
            ...dateFilter,
          },
        }),
        this.prisma.dispute.count({
          where: {
            status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.ESCALATED),
            ...dateFilter,
          },
        }),
        this.prisma.dispute.count({
          where: {
            status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.RESOLVED),
            ...dateFilter,
          },
        }),
        this.prisma.dispute.count({
          where: {
            status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.CLOSED),
            ...dateFilter,
          },
        }),
        Promise.all([
          this.prisma.dispute.count({
            where: {
              priority: PriorityMapper.toPrisma(PriorityEnum.LOW),
              ...dateFilter,
            },
          }),
          this.prisma.dispute.count({
            where: {
              priority: PriorityMapper.toPrisma(PriorityEnum.NORMAL),
              ...dateFilter,
            },
          }),
          this.prisma.dispute.count({
            where: {
              priority: PriorityMapper.toPrisma(PriorityEnum.HIGH),
              ...dateFilter,
            },
          }),
          this.prisma.dispute.count({
            where: {
              priority: PriorityMapper.toPrisma(PriorityEnum.URGENT),
              ...dateFilter,
            },
          }),
        ]),
      ]);

    return {
      totalOpen: open,
      totalUnderReview: underReview,
      totalEscalated: escalated,
      totalResolved: resolved,
      totalClosed: closed,
      averageResolutionTime: null,
      byPriority: {
        low: byPriority[0],
        normal: byPriority[1],
        high: byPriority[2],
        urgent: byPriority[3],
      },
    };
  }

  async hasActiveDispute(
    relatedEntityType:
      | 'consultation'
      | 'legal_opinion'
      | 'service_request'
      | 'litigation_case',
    relatedEntityId: string,
  ): Promise<boolean> {
    const fieldMap = {
      consultation: 'consultationId',
      legal_opinion: 'legalOpinionId',
      service_request: 'serviceRequestId',
      litigation_case: 'litigationCaseId',
    };
    const count = await this.prisma.dispute.count({
      where: {
        [fieldMap[relatedEntityType]]: relatedEntityId,
        status: {
          in: [
            DisputeStatusMapper.toPrisma(DisputeStatusEnum.OPEN),
            DisputeStatusMapper.toPrisma(DisputeStatusEnum.UNDER_REVIEW),
            DisputeStatusMapper.toPrisma(DisputeStatusEnum.ESCALATED),
          ],
        },
      },
    });
    return count > 0;
  }

  private buildWhereClause(
    options?: DisputeListOptions | DisputeCountOptions,
  ): any {
    const where: any = {};
    if (options?.userId) where.userId = options.userId;
    if (options?.status)
      where.status = DisputeStatusMapper.toPrisma(options.status);
    if (options?.priority)
      where.priority = PriorityMapper.toPrisma(options.priority);
    if (options?.resolvedBy) where.resolvedBy = options.resolvedBy;
    if (options?.escalatedTo) where.escalatedTo = options.escalatedTo;
    if ((options as DisputeListOptions)?.consultationId)
      where.consultationId = (options as DisputeListOptions).consultationId;
    if ((options as DisputeListOptions)?.legalOpinionId)
      where.legalOpinionId = (options as DisputeListOptions).legalOpinionId;
    if ((options as DisputeListOptions)?.serviceRequestId)
      where.serviceRequestId = (options as DisputeListOptions).serviceRequestId;
    if ((options as DisputeListOptions)?.litigationCaseId)
      where.litigationCaseId = (options as DisputeListOptions).litigationCaseId;
    if (options?.fromDate || options?.toDate) {
      where.createdAt = {};
      if (options?.fromDate) where.createdAt.gte = options.fromDate;
      if (options?.toDate) where.createdAt.lte = options.toDate;
    }
    return where;
  }

  private toDomain(record: any): Dispute {
    return Dispute.rehydrate({
      id: record.id,
      userId: record.userId,
      consultationId: record.consultationId ?? undefined,
      legalOpinionId: record.legalOpinionId ?? undefined,
      serviceRequestId: record.serviceRequestId ?? undefined,
      litigationCaseId: record.litigationCaseId ?? undefined,
      reason: record.reason,
      description: record.description,
      evidence: record.evidence ?? undefined,
      status: DisputeStatusMapper.toDomain(record.status),
      priority: PriorityMapper.toDomain(record.priority),
      resolution: record.resolution ?? undefined,
      resolvedBy: record.resolvedBy ?? undefined,
      resolvedAt: record.resolvedAt ?? undefined,
      escalatedAt: record.escalatedAt ?? undefined,
      escalatedTo: record.escalatedTo ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

/**
 * Transactional Transaction Log Repository.
 */
class TransactionalTransactionLogRepository
  implements ITransactionLogRepository
{
  constructor(
    private readonly prisma: PrismaService | PrismaTransactionClient,
  ) {}

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

  async findById(id: string): Promise<TransactionLog | null> {
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

  async markAsPaid(id: string): Promise<TransactionLog> {
    const updated = await this.prisma.transactionLog.update({
      where: { id },
      data: { status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.PAID) },
    });
    return this.toDomain(updated);
  }

  async markAsFailed(id: string): Promise<TransactionLog> {
    const updated = await this.prisma.transactionLog.update({
      where: { id },
      data: { status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.FAILED) },
    });
    return this.toDomain(updated);
  }

  async markAsRefunded(id: string): Promise<TransactionLog> {
    const updated = await this.prisma.transactionLog.update({
      where: { id },
      data: {
        status: PaymentStatusMapper.toPrisma(PaymentStatusEnum.REFUNDED),
      },
    });
    return this.toDomain(updated);
  }

  async markAsPartiallyRefunded(id: string): Promise<TransactionLog> {
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

  async delete(id: string): Promise<void> {
    await this.prisma.transactionLog.delete({ where: { id } });
  }

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

  private buildWhereClause(
    options?: TransactionLogListOptions | TransactionLogCountOptions,
  ): any {
    const where: any = {};
    if (options?.userId) where.userId = options.userId;
    if (options?.type)
      where.type = TransactionTypeMapper.toPrisma(options.type);
    if (options?.status)
      where.status = PaymentStatusMapper.toPrisma(options.status);
    if (options?.fromDate || options?.toDate) {
      where.createdAt = {};
      if (options?.fromDate) where.createdAt.gte = options.fromDate;
      if (options?.toDate) where.createdAt.lte = options.toDate;
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

/**
 * Transactional Membership Invoice Repository.
 */
class TransactionalMembershipInvoiceRepository
  implements IMembershipInvoiceRepository
{
  constructor(
    private readonly prisma: PrismaService | PrismaTransactionClient,
  ) {}

  async create(invoice: MembershipInvoice): Promise<MembershipInvoice> {
    const created = await this.prisma.membershipInvoice.create({
      data: {
        id: invoice.id,
        membershipId: invoice.membershipId,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount.amount,
        currency: CurrencyMapper.toPrisma(invoice.amount.currency),
        status: InvoiceStatusMapper.toPrisma(invoice.status.getValue()),
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      },
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<MembershipInvoice | null> {
    const found = await this.prisma.membershipInvoice.findUnique({
      where: { id },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByInvoiceNumber(
    invoiceNumber: string,
  ): Promise<MembershipInvoice | null> {
    const found = await this.prisma.membershipInvoice.findUnique({
      where: { invoiceNumber },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByMembershipId(membershipId: string): Promise<MembershipInvoice[]> {
    const found = await this.prisma.membershipInvoice.findMany({
      where: { membershipId },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async list(
    options?: MembershipInvoiceListOptions,
  ): Promise<MembershipInvoice[]> {
    const found = await this.prisma.membershipInvoice.findMany({
      where: this.buildWhereClause(options),
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      orderBy: {
        [options?.orderBy ?? 'createdAt']: options?.orderDir ?? 'desc',
      },
    });
    return found.map((record) => this.toDomain(record));
  }

  async count(options?: MembershipInvoiceCountOptions): Promise<number> {
    return await this.prisma.membershipInvoice.count({
      where: this.buildWhereClause(options),
    });
  }

  async update(invoice: MembershipInvoice): Promise<MembershipInvoice> {
    const updated = await this.prisma.membershipInvoice.update({
      where: { id: invoice.id },
      data: {
        status: InvoiceStatusMapper.toPrisma(invoice.status.getValue()),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async markAsPaid(id: string): Promise<MembershipInvoice> {
    const updated = await this.prisma.membershipInvoice.update({
      where: { id },
      data: {
        status: InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.PAID),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async markAsOverdue(id: string): Promise<MembershipInvoice> {
    const updated = await this.prisma.membershipInvoice.update({
      where: { id },
      data: {
        status: InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.OVERDUE),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async cancel(id: string): Promise<MembershipInvoice> {
    const updated = await this.prisma.membershipInvoice.update({
      where: { id },
      data: {
        status: InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.CANCELLED),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.membershipInvoice.delete({ where: { id } });
  }

  async findOverdueInvoices(): Promise<MembershipInvoice[]> {
    const found = await this.prisma.membershipInvoice.findMany({
      where: {
        status: InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.UNPAID),
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: 'asc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findDueSoon(daysAhead: number): Promise<MembershipInvoice[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const found = await this.prisma.membershipInvoice.findMany({
      where: {
        status: InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.UNPAID),
        dueDate: { gte: new Date(), lte: futureDate },
      },
      orderBy: { dueDate: 'asc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findUnpaidByMembershipId(
    membershipId: string,
  ): Promise<MembershipInvoice[]> {
    const found = await this.prisma.membershipInvoice.findMany({
      where: {
        membershipId,
        status: {
          in: [
            InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.UNPAID),
            InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.OVERDUE),
          ],
        },
      },
      orderBy: { dueDate: 'asc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async getTotalUnpaidAmount(membershipId: string): Promise<number> {
    const result = await this.prisma.membershipInvoice.aggregate({
      where: {
        membershipId,
        status: {
          in: [
            InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.UNPAID),
            InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.OVERDUE),
          ],
        },
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  private buildWhereClause(
    options?: MembershipInvoiceListOptions | MembershipInvoiceCountOptions,
  ): any {
    const where: any = {};
    if (options?.membershipId) where.membershipId = options.membershipId;
    if (options?.status)
      where.status = InvoiceStatusMapper.toPrisma(options.status);
    if (options?.dueBefore)
      where.dueDate = { ...where.dueDate, lte: options.dueBefore };
    if (options?.dueAfter)
      where.dueDate = { ...where.dueDate, gte: options.dueAfter };
    return where;
  }

  private toDomain(record: any): MembershipInvoice {
    return MembershipInvoice.rehydrate({
      id: record.id,
      membershipId: record.membershipId,
      invoiceNumber: record.invoiceNumber,
      amount: record.amount,
      currency: CurrencyMapper.toDomain(record.currency),
      status: InvoiceStatusMapper.toDomain(record.status),
      dueDate: record.dueDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

// Export the token for module registration
export { BILLING_UNIT_OF_WORK };
