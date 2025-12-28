// ============================================
// PRISMA CALL REQUEST UNIT OF WORK
// src/infrastructure/persistence/call-request/prisma-call-request.uow.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ICallRequestUnitOfWork,
  ICallStatusHistoryRepository,
  CALL_REQUEST_UNIT_OF_WORK,
} from '../../../core/domain/call-request/ports/call-request.uow';
import {
  ICallRequestRepository,
  CallRequestFilter,
  PaginationOptions,
  PaginatedResult,
} from '../../../core/domain/call-request/ports/call-request.repository';
import { CallRequest } from '../../../core/domain/call-request/entities/call-request.entity';
import {
  CallStatusHistory,
  StatusHistoryId,
} from '../../../core/domain/call-request/entities/call-status-history.entity';
import {
  CallStatus,
  mapPrismaStatusToCallStatus,
  mapCallStatusToPrisma,
} from '../../../core/domain/call-request/value-objects/call-status.vo';
import {
  TransactionOptions,
  DEFAULT_TRANSACTION_OPTIONS,
} from '../../../core/domain/shared/ports/base-unit-of-work.interface';
import {
  toPrismaTransactionOptions,
  PrismaTransactionClient,
} from '../shared/prisma-transaction.helper';

/**
 * Prisma implementation of the Call Request Unit of Work.
 *
 * Provides transactional access to call request repositories with
 * ReadCommitted isolation for state transitions and status history tracking.
 */
@Injectable()
export class PrismaCallRequestUnitOfWork implements ICallRequestUnitOfWork {
  private _callRequests: ICallRequestRepository;
  private _statusHistories: ICallStatusHistoryRepository;

  constructor(private readonly prisma: PrismaService) {
    this._callRequests = new TransactionalCallRequestRepository(prisma);
    this._statusHistories = new TransactionalCallStatusHistoryRepository(
      prisma,
    );
  }

  get callRequests(): ICallRequestRepository {
    return this._callRequests;
  }

  get statusHistories(): ICallStatusHistoryRepository {
    return this._statusHistories;
  }

  /**
   * Execute operations within a database transaction.
   * Uses ReadCommitted isolation for status transitions.
   */
  async transaction<R>(
    work: (uow: ICallRequestUnitOfWork) => Promise<R>,
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
  ): ICallRequestUnitOfWork {
    return {
      callRequests: new TransactionalCallRequestRepository(tx),
      statusHistories: new TransactionalCallStatusHistoryRepository(tx),
      transaction: async <R>(
        work: (uow: ICallRequestUnitOfWork) => Promise<R>,
      ): Promise<R> => {
        // Already in a transaction, just execute the work
        return await work(this.createTransactionalUow(tx));
      },
    };
  }
}

// ============================================
// TRANSACTIONAL CALL REQUEST REPOSITORY
// ============================================

class TransactionalCallRequestRepository implements ICallRequestRepository {
  constructor(
    private readonly prisma: PrismaService | PrismaTransactionClient,
  ) {}

  // ============================================
  // MAPPING METHODS
  // ============================================

  private mapToDomain(data: any): CallRequest {
    return CallRequest.rehydrate({
      id: data.id,
      requestNumber: data.requestNumber,
      subscriberId: data.subscriberId,
      assignedProviderId: data.assignedProviderId,
      consultationType: data.consultationType,
      purpose: data.purpose,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      status: mapPrismaStatusToCallStatus(data.status),
      scheduledAt: data.scheduledAt,
      scheduledDuration: data.scheduledDuration,
      actualDuration: data.actualDuration,
      callStartedAt: data.callStartedAt,
      callEndedAt: data.callEndedAt,
      recordingUrl: data.recordingUrl,
      callPlatform: data.callPlatform,
      callLink: data.callLink,
      submittedAt: data.submittedAt,
      completedAt: data.completedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private mapStatusToPrisma(status: CallStatus): RequestStatus {
    return mapCallStatusToPrisma(status) as RequestStatus;
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async create(callRequest: CallRequest): Promise<CallRequest> {
    const data = callRequest.toObject();
    const created = await this.prisma.callRequest.create({
      data: {
        id: data.id,
        requestNumber: data.requestNumber,
        subscriberId: data.subscriberId,
        assignedProviderId: data.assignedProviderId,
        consultationType: data.consultationType,
        purpose: data.purpose,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        status: this.mapStatusToPrisma(data.status),
        scheduledAt: data.scheduledAt,
        scheduledDuration: data.scheduledDuration,
        actualDuration: data.actualDuration,
        callStartedAt: data.callStartedAt,
        callEndedAt: data.callEndedAt,
        recordingUrl: data.recordingUrl,
        callPlatform: data.callPlatform,
        callLink: data.callLink,
        submittedAt: data.submittedAt,
        completedAt: data.completedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
    return this.mapToDomain(created);
  }

  async update(callRequest: CallRequest): Promise<CallRequest> {
    const data = callRequest.toObject();
    const updated = await this.prisma.callRequest.update({
      where: { id: data.id },
      data: {
        assignedProviderId: data.assignedProviderId,
        consultationType: data.consultationType,
        purpose: data.purpose,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        status: this.mapStatusToPrisma(data.status),
        scheduledAt: data.scheduledAt,
        scheduledDuration: data.scheduledDuration,
        actualDuration: data.actualDuration,
        callStartedAt: data.callStartedAt,
        callEndedAt: data.callEndedAt,
        recordingUrl: data.recordingUrl,
        callPlatform: data.callPlatform,
        callLink: data.callLink,
        completedAt: data.completedAt,
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.callRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.callRequest.delete({
      where: { id },
    });
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  async findById(id: string): Promise<CallRequest | null> {
    const data = await this.prisma.callRequest.findUnique({
      where: { id, deletedAt: null },
    });
    return data ? this.mapToDomain(data) : null;
  }

  async findByRequestNumber(
    requestNumber: string,
  ): Promise<CallRequest | null> {
    const data = await this.prisma.callRequest.findUnique({
      where: { requestNumber, deletedAt: null },
    });
    return data ? this.mapToDomain(data) : null;
  }

  async findAll(
    filter?: CallRequestFilter,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CallRequest>> {
    const where: Prisma.CallRequestWhereInput = { deletedAt: null };

    if (filter?.subscriberId) where.subscriberId = filter.subscriberId;
    if (filter?.assignedProviderId)
      where.assignedProviderId = filter.assignedProviderId;
    if (filter?.consultationType)
      where.consultationType = filter.consultationType;

    if (filter?.status) {
      if (Array.isArray(filter.status)) {
        where.status = {
          in: filter.status.map((s) => this.mapStatusToPrisma(s)),
        };
      } else {
        where.status = this.mapStatusToPrisma(filter.status);
      }
    }

    if (filter?.scheduledAfter || filter?.scheduledBefore) {
      where.scheduledAt = {};
      if (filter.scheduledAfter) where.scheduledAt.gte = filter.scheduledAfter;
      if (filter.scheduledBefore)
        where.scheduledAt.lte = filter.scheduledBefore;
    }

    if (filter?.createdAfter || filter?.createdBefore) {
      where.createdAt = {};
      if (filter.createdAfter) where.createdAt.gte = filter.createdAfter;
      if (filter.createdBefore) where.createdAt.lte = filter.createdBefore;
    }

    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDirection = pagination?.orderDirection || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.callRequest.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [orderBy]: orderDirection },
      }),
      this.prisma.callRequest.count({ where }),
    ]);

    return {
      data: data.map((d) => this.mapToDomain(d)),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  async findBySubscriber(
    subscriberId: string,
    options?: PaginationOptions,
  ): Promise<CallRequest[]> {
    const data = await this.prisma.callRequest.findMany({
      where: { subscriberId, deletedAt: null },
      take: options?.limit || 20,
      skip: options?.offset || 0,
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.orderDirection || 'desc',
      },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  async findByProvider(
    providerId: string,
    options?: PaginationOptions,
  ): Promise<CallRequest[]> {
    const data = await this.prisma.callRequest.findMany({
      where: { assignedProviderId: providerId, deletedAt: null },
      take: options?.limit || 20,
      skip: options?.offset || 0,
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.orderDirection || 'desc',
      },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  async findByStatus(
    status: CallStatus | CallStatus[],
    options?: PaginationOptions,
  ): Promise<CallRequest[]> {
    const statusArray = Array.isArray(status) ? status : [status];
    const prismaStatuses = statusArray.map((s) => this.mapStatusToPrisma(s));

    const data = await this.prisma.callRequest.findMany({
      where: {
        status: { in: prismaStatuses },
        deletedAt: null,
      },
      take: options?.limit || 20,
      skip: options?.offset || 0,
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.orderDirection || 'desc',
      },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  async findScheduledCalls(
    startDate: Date,
    endDate: Date,
    providerId?: string,
  ): Promise<CallRequest[]> {
    const where: Prisma.CallRequestWhereInput = {
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
      status: { in: [RequestStatus.scheduled, RequestStatus.in_progress] },
      deletedAt: null,
    };

    if (providerId) where.assignedProviderId = providerId;

    const data = await this.prisma.callRequest.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  async findUpcomingCallsForProvider(
    providerId: string,
    limit: number = 10,
  ): Promise<CallRequest[]> {
    const now = new Date();
    const data = await this.prisma.callRequest.findMany({
      where: {
        assignedProviderId: providerId,
        scheduledAt: { gte: now },
        status: RequestStatus.assigned,
        deletedAt: null,
      },
      take: limit,
      orderBy: { scheduledAt: 'asc' },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  async findOverdueCalls(): Promise<CallRequest[]> {
    const now = new Date();
    const data = await this.prisma.callRequest.findMany({
      where: {
        scheduledAt: { lt: now },
        status: RequestStatus.assigned,
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  // ============================================
  // AGGREGATION OPERATIONS
  // ============================================

  async countByStatus(status: CallStatus): Promise<number> {
    return await this.prisma.callRequest.count({
      where: {
        status: this.mapStatusToPrisma(status),
        deletedAt: null,
      },
    });
  }

  async countBySubscriber(
    subscriberId: string,
    status?: CallStatus,
  ): Promise<number> {
    const where: Prisma.CallRequestWhereInput = {
      subscriberId,
      deletedAt: null,
    };
    if (status) where.status = this.mapStatusToPrisma(status);

    return await this.prisma.callRequest.count({ where });
  }

  async countByProvider(
    providerId: string,
    status?: CallStatus,
  ): Promise<number> {
    const where: Prisma.CallRequestWhereInput = {
      assignedProviderId: providerId,
      deletedAt: null,
    };
    if (status) where.status = this.mapStatusToPrisma(status);

    return await this.prisma.callRequest.count({ where });
  }

  async getTotalCallMinutes(
    subscriberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.callRequest.aggregate({
      where: {
        subscriberId,
        status: RequestStatus.completed,
        callEndedAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      _sum: {
        actualDuration: true,
      },
    });
    return result._sum.actualDuration || 0;
  }

  async findConflictingCalls(
    providerId: string,
    scheduledAt: Date,
    durationMinutes: number,
  ): Promise<CallRequest[]> {
    const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    const data = await this.prisma.callRequest.findMany({
      where: {
        assignedProviderId: providerId,
        status: { in: [RequestStatus.scheduled, RequestStatus.in_progress] },
        deletedAt: null,
        AND: [
          {
            OR: [
              // Existing call starts during new call
              {
                scheduledAt: {
                  gte: scheduledAt,
                  lt: endTime,
                },
              },
              // Existing call ends during new call
              {
                AND: [
                  { scheduledAt: { lt: scheduledAt } },
                  { scheduledDuration: { not: null } },
                ],
              },
            ],
          },
        ],
      },
    });

    // Further filter for overlapping calls
    return data
      .filter((d) => {
        if (!d.scheduledAt || !d.scheduledDuration) return false;
        const existingEnd = new Date(
          d.scheduledAt.getTime() + d.scheduledDuration * 60000,
        );
        // Check for overlap
        return d.scheduledAt < endTime && existingEnd > scheduledAt;
      })
      .map((d) => this.mapToDomain(d));
  }

  // ============================================
  // EXISTENCE CHECKS
  // ============================================

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.callRequest.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async hasPendingCalls(subscriberId: string): Promise<boolean> {
    const count = await this.prisma.callRequest.count({
      where: {
        subscriberId,
        status: { in: [RequestStatus.pending, RequestStatus.assigned] },
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async isProviderAvailable(
    providerId: string,
    scheduledAt: Date,
    durationMinutes: number,
  ): Promise<boolean> {
    const conflicts = await this.findConflictingCalls(
      providerId,
      scheduledAt,
      durationMinutes,
    );
    return conflicts.length === 0;
  }
}

// ============================================
// TRANSACTIONAL STATUS HISTORY REPOSITORY
// ============================================

class TransactionalCallStatusHistoryRepository
  implements ICallStatusHistoryRepository
{
  constructor(
    private readonly prisma: PrismaService | PrismaTransactionClient,
  ) {}

  async create(history: CallStatusHistory): Promise<CallStatusHistory> {
    const created = await this.prisma.requestStatusHistory.create({
      data: {
        id: history.id.getValue(),
        callRequestId: history.callRequestId,
        fromStatus: history.fromStatus || null,
        toStatus: history.toStatus,
        reason: history.reason || null,
        changedBy: history.changedBy || null,
        changedAt: history.changedAt,
      },
    });
    return this.toDomain(created);
  }

  async createMany(
    histories: CallStatusHistory[],
  ): Promise<CallStatusHistory[]> {
    const data = histories.map((h) => ({
      id: h.id.getValue(),
      callRequestId: h.callRequestId,
      fromStatus: h.fromStatus || null,
      toStatus: h.toStatus,
      reason: h.reason || null,
      changedBy: h.changedBy || null,
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

  async findById(id: StatusHistoryId): Promise<CallStatusHistory | null> {
    const found = await this.prisma.requestStatusHistory.findUnique({
      where: { id: id.getValue() },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByCallRequestId(
    callRequestId: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CallStatusHistory>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const where = { callRequestId };

    const [data, total] = await Promise.all([
      this.prisma.requestStatusHistory.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { changedAt: 'desc' },
      }),
      this.prisma.requestStatusHistory.count({ where }),
    ]);

    return {
      data: data.map((d) => this.toDomain(d)),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  async findLatestByCallRequestId(
    callRequestId: string,
  ): Promise<CallStatusHistory | null> {
    const found = await this.prisma.requestStatusHistory.findFirst({
      where: { callRequestId },
      orderBy: { changedAt: 'desc' },
    });
    return found ? this.toDomain(found) : null;
  }

  async countByCallRequestId(callRequestId: string): Promise<number> {
    return await this.prisma.requestStatusHistory.count({
      where: { callRequestId },
    });
  }

  async delete(id: StatusHistoryId): Promise<void> {
    await this.prisma.requestStatusHistory.delete({
      where: { id: id.getValue() },
    });
  }

  private toDomain(record: any): CallStatusHistory {
    return CallStatusHistory.rehydrate({
      id: record.id,
      callRequestId: record.callRequestId,
      fromStatus: record.fromStatus || undefined,
      toStatus: record.toStatus,
      reason: record.reason || undefined,
      changedBy: record.changedBy || undefined,
      changedAt: record.changedAt,
    });
  }
}

// Export the token for module registration
export { CALL_REQUEST_UNIT_OF_WORK };
