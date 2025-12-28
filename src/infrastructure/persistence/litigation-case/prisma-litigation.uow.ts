// ============================================
// PRISMA LITIGATION UNIT OF WORK
// src/infrastructure/persistence/litigation-case/prisma-litigation.uow.ts
// ============================================

import { Injectable } from '@nestjs/common';
import {
  Prisma,
  RequestStatus as PrismaRequestStatus,
  PaymentStatus as PrismaPaymentStatus,
  Currency as PrismaCurrency,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ILitigationUnitOfWork,
  ILitigationStatusHistoryRepository,
  LITIGATION_UNIT_OF_WORK,
} from '../../../core/domain/litigation-case/ports/litigation.uow';
import {
  ILitigationCaseRepository,
  LitigationCaseFilters,
  PaginationParams,
  PaginatedResult,
  PaginationMeta,
  LitigationCaseStatistics,
} from '../../../core/domain/litigation-case/port/litigation-case.repository';
import { LitigationCase } from '../../../core/domain/litigation-case/entities/litigation-case.entity';
import {
  LitigationStatusHistory,
  StatusHistoryId,
} from '../../../core/domain/litigation-case/entities/litigation-status-history.entity';
import {
  CaseId,
  CaseNumber,
  UserId,
  CaseType,
  CaseSubtype,
  CaseTitle,
  CaseDescription,
  CaseStatus,
  CaseStatusEnum,
  CourtName,
  CaseDetails,
  Money,
  QuoteDetails,
  PaymentStatus,
  PaymentStatusEnum,
  PaymentReference,
} from '../../../core/domain/litigation-case/value-objects/litigation-case.vo';
import {
  TransactionOptions,
  DEFAULT_TRANSACTION_OPTIONS,
} from '../../../core/domain/shared/ports/base-unit-of-work.interface';
import {
  toPrismaTransactionOptions,
  PrismaTransactionClient,
} from '../shared/prisma-transaction.helper';

// ============================================
// ENUM MAPPERS
// ============================================

class CaseStatusMapper {
  private static readonly toPrismaMap: Record<
    CaseStatusEnum,
    PrismaRequestStatus
  > = {
    [CaseStatusEnum.PENDING]: PrismaRequestStatus.pending,
    [CaseStatusEnum.QUOTE_SENT]: PrismaRequestStatus.quote_sent,
    [CaseStatusEnum.SCHEDULED]: PrismaRequestStatus.scheduled,
    [CaseStatusEnum.QUOTE_ACCEPTED]: PrismaRequestStatus.quote_accepted,
    [CaseStatusEnum.ACTIVE]: PrismaRequestStatus.in_progress,
    [CaseStatusEnum.CLOSED]: PrismaRequestStatus.closed,
    [CaseStatusEnum.CANCELLED]: PrismaRequestStatus.cancelled,
  };

  private static readonly toDomainMap: Record<
    PrismaRequestStatus,
    CaseStatusEnum
  > = {
    [PrismaRequestStatus.pending]: CaseStatusEnum.PENDING,
    [PrismaRequestStatus.assigned]: CaseStatusEnum.PENDING,
    [PrismaRequestStatus.scheduled]: CaseStatusEnum.ACTIVE,
    [PrismaRequestStatus.in_progress]: CaseStatusEnum.ACTIVE,
    [PrismaRequestStatus.quote_sent]: CaseStatusEnum.QUOTE_SENT,
    [PrismaRequestStatus.quote_accepted]: CaseStatusEnum.QUOTE_ACCEPTED,
    [PrismaRequestStatus.completed]: CaseStatusEnum.CLOSED,
    [PrismaRequestStatus.disputed]: CaseStatusEnum.ACTIVE,
    [PrismaRequestStatus.cancelled]: CaseStatusEnum.CANCELLED,
    [PrismaRequestStatus.closed]: CaseStatusEnum.CLOSED,
    [PrismaRequestStatus.no_show]: CaseStatusEnum.CANCELLED,
    [PrismaRequestStatus.rescheduled]: CaseStatusEnum.PENDING,
  };

  static toPrisma(status: CaseStatus): PrismaRequestStatus {
    return this.toPrismaMap[status.getValue()];
  }

  static toDomain(prismaStatus: PrismaRequestStatus): CaseStatus {
    return CaseStatus.create(this.toDomainMap[prismaStatus]);
  }

  static toPrismaString(status: string): string {
    const caseStatus = CaseStatus.create(status);
    return this.toPrismaMap[caseStatus.getValue()] || status;
  }
}

class PaymentStatusMapper {
  private static readonly toPrismaMap: Record<
    PaymentStatusEnum,
    PrismaPaymentStatus
  > = {
    [PaymentStatusEnum.PENDING]: PrismaPaymentStatus.pending,
    [PaymentStatusEnum.PAID]: PrismaPaymentStatus.paid,
    [PaymentStatusEnum.REFUNDED]: PrismaPaymentStatus.refunded,
    [PaymentStatusEnum.PARTIALLY_PAID]: PrismaPaymentStatus.partially_refunded,
  };

  private static readonly toDomainMap: Record<
    PrismaPaymentStatus,
    PaymentStatusEnum
  > = {
    [PrismaPaymentStatus.pending]: PaymentStatusEnum.PENDING,
    [PrismaPaymentStatus.paid]: PaymentStatusEnum.PAID,
    [PrismaPaymentStatus.failed]: PaymentStatusEnum.PENDING,
    [PrismaPaymentStatus.refunded]: PaymentStatusEnum.REFUNDED,
    [PrismaPaymentStatus.partially_refunded]: PaymentStatusEnum.PARTIALLY_PAID,
  };

  static toPrisma(status: PaymentStatus): PrismaPaymentStatus {
    return this.toPrismaMap[status.getValue() as PaymentStatusEnum];
  }

  static toDomain(prismaStatus: PrismaPaymentStatus | null): PaymentStatus {
    if (!prismaStatus) return PaymentStatus.create(PaymentStatusEnum.PENDING);
    return PaymentStatus.create(this.toDomainMap[prismaStatus]);
  }
}

/**
 * Prisma implementation of the Litigation Unit of Work.
 *
 * Provides transactional access to litigation repositories with
 * ReadCommitted isolation for state transitions and status history tracking.
 */
@Injectable()
export class PrismaLitigationUnitOfWork implements ILitigationUnitOfWork {
  private _cases: ILitigationCaseRepository;
  private _statusHistories: ILitigationStatusHistoryRepository;

  constructor(private readonly prisma: PrismaService) {
    this._cases = new TransactionalLitigationCaseRepository(prisma);
    this._statusHistories = new TransactionalLitigationStatusHistoryRepository(
      prisma,
    );
  }

  get cases(): ILitigationCaseRepository {
    return this._cases;
  }

  get statusHistories(): ILitigationStatusHistoryRepository {
    return this._statusHistories;
  }

  /**
   * Execute operations within a database transaction.
   * Uses ReadCommitted isolation for status transitions.
   */
  async transaction<R>(
    work: (uow: ILitigationUnitOfWork) => Promise<R>,
    options?: TransactionOptions,
  ): Promise<R> {
    const prismaOptions = toPrismaTransactionOptions(
      options ?? DEFAULT_TRANSACTION_OPTIONS,
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
  ): ILitigationUnitOfWork {
    return {
      cases: new TransactionalLitigationCaseRepository(tx),
      statusHistories: new TransactionalLitigationStatusHistoryRepository(tx),
      transaction: async <R>(
        work: (uow: ILitigationUnitOfWork) => Promise<R>,
      ): Promise<R> => {
        // Already in a transaction, just execute the work
        return await work(this.createTransactionalUow(tx));
      },
    };
  }
}

// ============================================
// TRANSACTIONAL LITIGATION CASE REPOSITORY
// ============================================

class TransactionalLitigationCaseRepository
  implements ILitigationCaseRepository
{
  constructor(
    private readonly prisma: PrismaService | PrismaTransactionClient,
  ) {}

  async save(litigationCase: LitigationCase): Promise<LitigationCase> {
    const data = this.toPrisma(litigationCase);
    const created = await this.prisma.litigationCase.create({ data });
    return this.toDomain(created);
  }

  async update(litigationCase: LitigationCase): Promise<LitigationCase> {
    const data = this.toUpdatePrisma(litigationCase);
    const updated = await this.prisma.litigationCase.update({
      where: { id: litigationCase.id.getValue() },
      data,
    });
    return this.toDomain(updated);
  }

  async findById(id: CaseId): Promise<LitigationCase | null> {
    const found = await this.prisma.litigationCase.findUnique({
      where: { id: id.getValue() },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByCaseNumber(caseNumber: string): Promise<LitigationCase | null> {
    const found = await this.prisma.litigationCase.findUnique({
      where: { caseNumber },
    });
    return found ? this.toDomain(found) : null;
  }

  async findBySubscriberId(
    subscriberId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LitigationCase>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LitigationCaseWhereInput = {
      subscriberId: subscriberId.getValue(),
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      this.prisma.litigationCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.litigationCase.count({ where }),
    ]);

    return {
      data: data.map((c) => this.toDomain(c)),
      pagination: this.buildPaginationMeta(page, limit, total),
    };
  }

  async findByProviderId(
    providerId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LitigationCase>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LitigationCaseWhereInput = {
      assignedProviderId: providerId.getValue(),
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      this.prisma.litigationCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.litigationCase.count({ where }),
    ]);

    return {
      data: data.map((c) => this.toDomain(c)),
      pagination: this.buildPaginationMeta(page, limit, total),
    };
  }

  async findAll(
    filters: LitigationCaseFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<LitigationCase>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters);

    const [data, total] = await Promise.all([
      this.prisma.litigationCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.litigationCase.count({ where }),
    ]);

    return {
      data: data.map((c) => this.toDomain(c)),
      pagination: this.buildPaginationMeta(page, limit, total),
    };
  }

  async findByStatus(
    status: CaseStatus,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LitigationCase>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LitigationCaseWhereInput = {
      status: CaseStatusMapper.toPrisma(status),
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      this.prisma.litigationCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.litigationCase.count({ where }),
    ]);

    return {
      data: data.map((c) => this.toDomain(c)),
      pagination: this.buildPaginationMeta(page, limit, total),
    };
  }

  async delete(id: CaseId): Promise<boolean> {
    try {
      await this.prisma.litigationCase.update({
        where: { id: id.getValue() },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: CaseId): Promise<boolean> {
    const count = await this.prisma.litigationCase.count({
      where: { id: id.getValue(), deletedAt: null },
    });
    return count > 0;
  }

  async count(filters?: LitigationCaseFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return await this.prisma.litigationCase.count({ where });
  }

  async getStatistics(
    filters?: LitigationCaseFilters,
  ): Promise<LitigationCaseStatistics> {
    const where = this.buildWhereClause(filters);

    const [total, cases] = await Promise.all([
      this.prisma.litigationCase.count({ where }),
      this.prisma.litigationCase.findMany({
        where,
        select: {
          status: true,
          caseType: true,
          paymentStatus: true,
          quoteAmount: true,
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byPaymentStatus: Record<string, number> = {};
    let totalRevenue = 0;

    for (const c of cases) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      byType[c.caseType] = (byType[c.caseType] || 0) + 1;
      if (c.paymentStatus) {
        byPaymentStatus[c.paymentStatus] =
          (byPaymentStatus[c.paymentStatus] || 0) + 1;
      }
      if (c.quoteAmount && c.paymentStatus === PrismaPaymentStatus.paid) {
        totalRevenue += Number(c.quoteAmount);
      }
    }

    const activeCount = byStatus[PrismaRequestStatus.in_progress] || 0;
    const closedCount = byStatus[PrismaRequestStatus.closed] || 0;
    const paidCount = byPaymentStatus[PrismaPaymentStatus.paid] || 0;
    const averageRevenue = paidCount > 0 ? totalRevenue / paidCount : 0;

    return {
      total,
      byStatus,
      byType,
      byPaymentStatus,
      totalRevenue,
      averageRevenue,
      activeCount,
      closedCount,
    };
  }

  private buildWhereClause(
    filters?: LitigationCaseFilters,
  ): Prisma.LitigationCaseWhereInput {
    const where: Prisma.LitigationCaseWhereInput = { deletedAt: null };

    if (filters?.subscriberId) where.subscriberId = filters.subscriberId;
    if (filters?.assignedProviderId)
      where.assignedProviderId = filters.assignedProviderId;
    if (filters?.caseType) where.caseType = filters.caseType;

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status as PrismaRequestStatus[] };
      } else {
        where.status = filters.status as PrismaRequestStatus;
      }
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus as PrismaPaymentStatus;
    }

    return where;
  }

  private toPrisma(
    litigationCase: LitigationCase,
  ): Prisma.LitigationCaseCreateInput {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      subscriber: { connect: { id: litigationCase.subscriberId.getValue() } },
      assignedProvider: litigationCase.assignedProviderId
        ? { connect: { id: litigationCase.assignedProviderId.getValue() } }
        : undefined,
      caseType: litigationCase.caseType.getValue(),
      caseSubtype: litigationCase.caseSubtype?.getValue() || null,
      title: litigationCase.title.getValue(),
      description: litigationCase.description.getValue(),
      courtName: litigationCase.courtName?.getValue() || null,
      caseDetails:
        (litigationCase.caseDetails?.toJSON() as Prisma.InputJsonValue) ||
        Prisma.JsonNull,
      status: CaseStatusMapper.toPrisma(litigationCase.status),
      quoteAmount: litigationCase.quoteAmount?.getAmount() || null,
      quoteCurrency:
        (litigationCase.quoteAmount?.getCurrency() as PrismaCurrency) || null,
      quoteDetails:
        (litigationCase.quoteDetails?.toJSON() as Prisma.InputJsonValue) ||
        Prisma.JsonNull,
      quoteValidUntil: litigationCase.quoteValidUntil || null,
      quoteAcceptedAt: litigationCase.quoteAcceptedAt || null,
      paymentStatus: PaymentStatusMapper.toPrisma(litigationCase.paymentStatus),
      paymentReference: litigationCase.paymentReference?.getValue() || null,
      submittedAt: litigationCase.submittedAt,
      closedAt: litigationCase.closedAt || null,
      createdAt: litigationCase.createdAt,
      updatedAt: litigationCase.updatedAt,
      deletedAt: litigationCase.deletedAt || null,
    };
  }

  private toUpdatePrisma(
    litigationCase: LitigationCase,
  ): Prisma.LitigationCaseUpdateInput {
    return {
      assignedProvider: litigationCase.assignedProviderId
        ? { connect: { id: litigationCase.assignedProviderId.getValue() } }
        : undefined,
      caseSubtype: litigationCase.caseSubtype?.getValue() || null,
      title: litigationCase.title.getValue(),
      description: litigationCase.description.getValue(),
      courtName: litigationCase.courtName?.getValue() || null,
      caseDetails:
        (litigationCase.caseDetails?.toJSON() as Prisma.InputJsonValue) ||
        Prisma.JsonNull,
      status: CaseStatusMapper.toPrisma(litigationCase.status),
      quoteAmount: litigationCase.quoteAmount?.getAmount() || null,
      quoteCurrency:
        (litigationCase.quoteAmount?.getCurrency() as PrismaCurrency) || null,
      quoteDetails:
        (litigationCase.quoteDetails?.toJSON() as Prisma.InputJsonValue) ||
        Prisma.JsonNull,
      quoteValidUntil: litigationCase.quoteValidUntil || null,
      quoteAcceptedAt: litigationCase.quoteAcceptedAt || null,
      paymentStatus: PaymentStatusMapper.toPrisma(litigationCase.paymentStatus),
      paymentReference: litigationCase.paymentReference?.getValue() || null,
      closedAt: litigationCase.closedAt || null,
      updatedAt: new Date(),
      deletedAt: litigationCase.deletedAt || null,
    };
  }

  private toDomain(prisma: any): LitigationCase {
    return LitigationCase.reconstitute({
      id: CaseId.create(prisma.id),
      caseNumber: CaseNumber.create(prisma.caseNumber),
      subscriberId: UserId.create(prisma.subscriberId),
      assignedProviderId: prisma.assignedProviderId
        ? UserId.create(prisma.assignedProviderId)
        : undefined,
      caseType: CaseType.create(prisma.caseType),
      caseSubtype: prisma.caseSubtype
        ? CaseSubtype.create(prisma.caseSubtype)
        : undefined,
      title: CaseTitle.create(prisma.title),
      description: CaseDescription.create(prisma.description),
      courtName: prisma.courtName
        ? CourtName.create(prisma.courtName)
        : undefined,
      caseDetails: prisma.caseDetails
        ? CaseDetails.create(prisma.caseDetails as Record<string, any>)
        : undefined,
      status: CaseStatusMapper.toDomain(prisma.status),
      quoteAmount:
        prisma.quoteAmount && prisma.quoteCurrency
          ? Money.create(Number(prisma.quoteAmount), prisma.quoteCurrency)
          : undefined,
      quoteDetails: prisma.quoteDetails
        ? QuoteDetails.create(prisma.quoteDetails as Record<string, any>)
        : undefined,
      quoteValidUntil: prisma.quoteValidUntil || undefined,
      quoteAcceptedAt: prisma.quoteAcceptedAt || undefined,
      paymentStatus: PaymentStatusMapper.toDomain(prisma.paymentStatus),
      paymentReference: prisma.paymentReference
        ? PaymentReference.create(prisma.paymentReference)
        : undefined,
      submittedAt: prisma.submittedAt,
      closedAt: prisma.closedAt || undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
      deletedAt: prisma.deletedAt || undefined,
    });
  }

  private buildPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }
}

// ============================================
// TRANSACTIONAL STATUS HISTORY REPOSITORY
// ============================================

class TransactionalLitigationStatusHistoryRepository
  implements ILitigationStatusHistoryRepository
{
  constructor(
    private readonly prisma: PrismaService | PrismaTransactionClient,
  ) {}

  async create(
    history: LitigationStatusHistory,
  ): Promise<LitigationStatusHistory> {
    const created = await this.prisma.requestStatusHistory.create({
      data: {
        id: history.id.getValue(),
        litigationCaseId: history.litigationCaseId.getValue(),
        fromStatus: history.fromStatus?.getValue() || null,
        toStatus: history.toStatus.getValue(),
        reason: history.reason || null,
        changedBy: history.changedBy?.getValue() || null,
        changedAt: history.changedAt,
      },
    });
    return this.toDomain(created);
  }

  async createMany(
    histories: LitigationStatusHistory[],
  ): Promise<LitigationStatusHistory[]> {
    const data = histories.map((h) => ({
      id: h.id.getValue(),
      litigationCaseId: h.litigationCaseId.getValue(),
      fromStatus: h.fromStatus?.getValue() || null,
      toStatus: h.toStatus.getValue(),
      reason: h.reason || null,
      changedBy: h.changedBy?.getValue() || null,
      changedAt: h.changedAt,
    }));

    await this.prisma.requestStatusHistory.createMany({ data });

    // Return the created histories
    const ids = histories.map((h) => h.id.getValue());
    const created = await this.prisma.requestStatusHistory.findMany({
      where: { id: { in: ids } },
    });

    return created.map((c) => this.toDomain(c));
  }

  async findById(id: StatusHistoryId): Promise<LitigationStatusHistory | null> {
    const found = await this.prisma.requestStatusHistory.findUnique({
      where: { id: id.getValue() },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByLitigationCaseId(
    litigationCaseId: CaseId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LitigationStatusHistory>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where = { litigationCaseId: litigationCaseId.getValue() };

    const [data, total] = await Promise.all([
      this.prisma.requestStatusHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { changedAt: 'desc' },
      }),
      this.prisma.requestStatusHistory.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((d) => this.toDomain(d)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findLatestByLitigationCaseId(
    litigationCaseId: CaseId,
  ): Promise<LitigationStatusHistory | null> {
    const found = await this.prisma.requestStatusHistory.findFirst({
      where: { litigationCaseId: litigationCaseId.getValue() },
      orderBy: { changedAt: 'desc' },
    });
    return found ? this.toDomain(found) : null;
  }

  async countByLitigationCaseId(litigationCaseId: CaseId): Promise<number> {
    return await this.prisma.requestStatusHistory.count({
      where: { litigationCaseId: litigationCaseId.getValue() },
    });
  }

  async delete(id: StatusHistoryId): Promise<void> {
    await this.prisma.requestStatusHistory.delete({
      where: { id: id.getValue() },
    });
  }

  private toDomain(record: any): LitigationStatusHistory {
    return LitigationStatusHistory.rehydrate({
      id: record.id,
      litigationCaseId: record.litigationCaseId,
      fromStatus: record.fromStatus || undefined,
      toStatus: record.toStatus,
      reason: record.reason || undefined,
      changedBy: record.changedBy || undefined,
      changedAt: record.changedAt,
    });
  }
}

// Export the token for module registration
export { LITIGATION_UNIT_OF_WORK };
