// ============================================
// PRISMA CONSULTATION UNIT OF WORK
// src/infrastructure/persistence/consultation/prisma-consultation.uow.ts
// ============================================

import { Injectable } from '@nestjs/common';
import {
  Prisma,
  RequestStatus as PrismaRequestStatus,
  Priority as PrismaPriority,
  SLAStatus as PrismaSLAStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IConsultationRequestUnitOfWork,
  IConsultationRequestRepository,
  IDocumentRepository,
  IRequestMessageRepository,
  IRequestStatusHistoryRepository,
  IRequestRatingRepository,
  IRequestCollaboratorRepository,
  CONSULTATION_UNIT_OF_WORK,
  PaginationParams,
  PaginatedResult,
  ConsultationRequestFilters,
  DocumentFilters,
  MessageFilters,
  StatusHistoryFilters,
  CollaboratorFilters,
} from '../../../core/domain/consultation/ports/consultation-request.repository';
import {
  ConsultationRequest,
  ConsultationId,
  UserId,
  RequestNumber,
  ConsultationTypeVO,
  ConsultationStatusVO,
  ConsultationStatus,
  Urgency,
  SLAStatus,
  ConsultationCategory,
  Subject,
  Description,
} from '../../../core/domain/consultation/value-objects/consultation-request-domain';
import {
  Document,
  DocumentId,
  RequestMessage,
  MessageId,
  RequestStatusHistory,
  StatusHistoryId,
  RequestRating,
  RatingId,
  RequestCollaborator,
  CollaboratorId,
  ProviderUserId,
} from '../../../core/domain/consultation/entities/consultation-request-entities';
import { DEFAULT_TRANSACTION_OPTIONS } from '../../../core/domain/shared/ports/base-unit-of-work.interface';
import {
  toPrismaTransactionOptions,
  PrismaTransactionClient,
} from '../shared/prisma-transaction.helper';

// ============================================
// STATUS MAPPERS
// ============================================

class ConsultationStatusMapper {
  private static readonly toPrismaMap: Record<
    ConsultationStatus,
    PrismaRequestStatus
  > = {
    [ConsultationStatus.PENDING]: PrismaRequestStatus.pending,
    [ConsultationStatus.ASSIGNED]: PrismaRequestStatus.assigned,
    [ConsultationStatus.IN_PROGRESS]: PrismaRequestStatus.in_progress,
    [ConsultationStatus.AWAITING_INFO]: PrismaRequestStatus.pending,
    [ConsultationStatus.COMPLETED]: PrismaRequestStatus.completed,
    [ConsultationStatus.DISPUTED]: PrismaRequestStatus.disputed,
    [ConsultationStatus.CANCELLED]: PrismaRequestStatus.cancelled,
    [ConsultationStatus.RESPONDED]: PrismaRequestStatus.closed,
  };

  private static readonly toDomainMap: Record<
    PrismaRequestStatus,
    ConsultationStatus
  > = {
    [PrismaRequestStatus.pending]: ConsultationStatus.PENDING,
    [PrismaRequestStatus.assigned]: ConsultationStatus.ASSIGNED,
    [PrismaRequestStatus.scheduled]: ConsultationStatus.IN_PROGRESS,
    [PrismaRequestStatus.in_progress]: ConsultationStatus.IN_PROGRESS,
    [PrismaRequestStatus.quote_sent]: ConsultationStatus.IN_PROGRESS,
    [PrismaRequestStatus.quote_accepted]: ConsultationStatus.ASSIGNED,
    [PrismaRequestStatus.completed]: ConsultationStatus.COMPLETED,
    [PrismaRequestStatus.disputed]: ConsultationStatus.DISPUTED,
    [PrismaRequestStatus.cancelled]: ConsultationStatus.CANCELLED,
    [PrismaRequestStatus.closed]: ConsultationStatus.CANCELLED,
    [PrismaRequestStatus.no_show]: ConsultationStatus.CANCELLED,
    [PrismaRequestStatus.rescheduled]: ConsultationStatus.PENDING,
  };

  static toPrisma(
    status: ConsultationStatusVO | ConsultationStatus,
  ): PrismaRequestStatus {
    const value = typeof status === 'string' ? status : status.getValue();
    return this.toPrismaMap[value] || PrismaRequestStatus.pending;
  }

  static toDomain(prismaStatus: PrismaRequestStatus): ConsultationStatusVO {
    return ConsultationStatusVO.create(this.toDomainMap[prismaStatus]);
  }
}

class UrgencyMapper {
  private static readonly toPrismaMap: Record<string, PrismaPriority> = {
    low: PrismaPriority.low,
    normal: PrismaPriority.normal,
    high: PrismaPriority.high,
    urgent: PrismaPriority.urgent,
  };

  private static readonly toDomainMap: Record<PrismaPriority, string> = {
    [PrismaPriority.low]: 'low',
    [PrismaPriority.normal]: 'normal',
    [PrismaPriority.high]: 'high',
    [PrismaPriority.urgent]: 'urgent',
  };

  static toPrisma(urgency: Urgency): PrismaPriority {
    return this.toPrismaMap[urgency.getValue()] || PrismaPriority.normal;
  }

  static toDomain(prismaPriority: PrismaPriority): Urgency {
    return Urgency.create(this.toDomainMap[prismaPriority]);
  }
}

class SLAStatusMapper {
  private static readonly toPrismaMap: Record<string, PrismaSLAStatus> = {
    on_track: PrismaSLAStatus.on_track,
    at_risk: PrismaSLAStatus.at_risk,
    breached: PrismaSLAStatus.breached,
  };

  private static readonly toDomainMap: Record<PrismaSLAStatus, string> = {
    [PrismaSLAStatus.on_track]: 'on_track',
    [PrismaSLAStatus.at_risk]: 'at_risk',
    [PrismaSLAStatus.breached]: 'breached',
  };

  static toPrisma(slaStatus: SLAStatus): PrismaSLAStatus {
    return this.toPrismaMap[slaStatus.getValue()] || PrismaSLAStatus.on_track;
  }

  static toDomain(prismaSLAStatus: PrismaSLAStatus): SLAStatus {
    return SLAStatus.create(this.toDomainMap[prismaSLAStatus]);
  }
}

/**
 * Prisma implementation of the Consultation Unit of Work.
 */
@Injectable()
export class PrismaConsultationUnitOfWork
  implements IConsultationRequestUnitOfWork
{
  public consultationRequests: IConsultationRequestRepository;
  public documents: IDocumentRepository;
  public messages: IRequestMessageRepository;
  public statusHistories: IRequestStatusHistoryRepository;
  public ratings: IRequestRatingRepository;
  public collaborators: IRequestCollaboratorRepository;

  constructor(private readonly prisma: PrismaService) {
    this.consultationRequests = new TransactionalConsultationRepository(prisma);
    this.documents = new TransactionalDocumentRepository(prisma);
    this.messages = new TransactionalMessageRepository(prisma);
    this.statusHistories = new TransactionalStatusHistoryRepository(prisma);
    this.ratings = new TransactionalRatingRepository(prisma);
    this.collaborators = new TransactionalCollaboratorRepository(prisma);
  }

  async begin(): Promise<void> {
    // No-op for Prisma - transactions are handled by transaction()
  }

  async commit(): Promise<void> {
    // No-op for Prisma - transactions are handled by transaction()
  }

  async rollback(): Promise<void> {
    // No-op for Prisma - transactions are handled by transaction()
  }

  async transaction<T>(
    work: (uow: IConsultationRequestUnitOfWork) => Promise<T>,
  ): Promise<T> {
    const prismaOptions = toPrismaTransactionOptions(
      DEFAULT_TRANSACTION_OPTIONS,
    );

    return await this.prisma.$transaction(async (tx) => {
      const transactionalUow = this.createTransactionalUow(tx);
      return await work(transactionalUow);
    }, prismaOptions);
  }

  private createTransactionalUow(
    tx: PrismaTransactionClient,
  ): IConsultationRequestUnitOfWork {
    return {
      consultationRequests: new TransactionalConsultationRepository(tx),
      documents: new TransactionalDocumentRepository(tx),
      messages: new TransactionalMessageRepository(tx),
      statusHistories: new TransactionalStatusHistoryRepository(tx),
      ratings: new TransactionalRatingRepository(tx),
      collaborators: new TransactionalCollaboratorRepository(tx),
      begin: async () => {},
      commit: async () => {},
      rollback: async () => {},
      transaction: async <R>(
        work: (uow: IConsultationRequestUnitOfWork) => Promise<R>,
      ): Promise<R> => {
        return await work(this.createTransactionalUow(tx));
      },
    };
  }
}

// ============================================
// TRANSACTIONAL CONSULTATION REPOSITORY
// ============================================

class TransactionalConsultationRepository
  implements IConsultationRequestRepository
{
  constructor(
    private readonly prisma: PrismaService | PrismaTransactionClient,
  ) {}

  async create(
    consultation: ConsultationRequest,
  ): Promise<ConsultationRequest> {
    const data: Prisma.ConsultationRequestCreateInput = {
      id: consultation.id.getValue(),
      requestNumber: consultation.requestNumber.getValue(),
      subscriber: {
        connect: { id: consultation.subscriberId?.getValue() || '' },
      },
      assignedProvider: consultation.assignedProviderId
        ? { connect: { id: consultation.assignedProviderId.getValue() } }
        : undefined,
      consultationType: consultation.consultationType.getValue(),
      category: consultation.category?.getValue(),
      subject: consultation.subject.getValue(),
      description: consultation.description.getValue(),
      urgency: UrgencyMapper.toPrisma(consultation.urgency),
      status: ConsultationStatusMapper.toPrisma(consultation.status),
      submittedAt: consultation.submittedAt,
      assignedAt: consultation.assignedAt,
      respondedAt: consultation.respondedAt,
      completedAt: consultation.completedAt,
      slaDeadline: consultation.slaDeadline,
      slaStatus: consultation.slaStatus
        ? SLAStatusMapper.toPrisma(consultation.slaStatus)
        : undefined,
      createdAt: consultation.createdAt,
      updatedAt: consultation.updatedAt,
    };

    const created = await this.prisma.consultationRequest.create({ data });
    return this.toDomain(created);
  }

  async createMany(
    consultations: ConsultationRequest[],
  ): Promise<ConsultationRequest[]> {
    const results = await Promise.all(consultations.map((c) => this.create(c)));
    return results;
  }

  async findById(id: ConsultationId): Promise<ConsultationRequest | null> {
    const result = await this.prisma.consultationRequest.findUnique({
      where: { id: id.getValue() },
    });
    return result ? this.toDomain(result) : null;
  }

  async findByRequestNumber(
    requestNumber: RequestNumber,
  ): Promise<ConsultationRequest | null> {
    const result = await this.prisma.consultationRequest.findUnique({
      where: { requestNumber: requestNumber.getValue() },
    });
    return result ? this.toDomain(result) : null;
  }

  async findBySubscriberId(
    subscriberId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ConsultationRequest>> {
    return this.findAll({ subscriberId: subscriberId.getValue() }, pagination);
  }

  async findByProviderId(
    providerId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ConsultationRequest>> {
    return this.findAll(
      { assignedProviderId: providerId.getValue() },
      pagination,
    );
  }

  async findByStatus(
    status: ConsultationStatusVO,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ConsultationRequest>> {
    return this.findAll({ status: status.getValue() }, pagination);
  }

  async findSLABreached(
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ConsultationRequest>> {
    return this.findAll({ slaStatus: ['breached'] }, pagination);
  }

  async findSLAAtRisk(
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ConsultationRequest>> {
    return this.findAll({ slaStatus: ['at_risk'] }, pagination);
  }

  async findAll(
    filters?: ConsultationRequestFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ConsultationRequest>> {
    const where = this.buildWhereClause(filters);
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.consultationRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [pagination?.sortBy || 'createdAt']: pagination?.sortOrder || 'desc',
        },
      }),
      this.prisma.consultationRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((cr) => this.toDomain(cr)),
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

  async getAll(
    filters?: ConsultationRequestFilters,
  ): Promise<ConsultationRequest[]> {
    const where = this.buildWhereClause(filters);
    const data = await this.prisma.consultationRequest.findMany({ where });
    return data.map((cr) => this.toDomain(cr));
  }

  async count(filters?: ConsultationRequestFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.consultationRequest.count({ where });
  }

  async exists(id: ConsultationId): Promise<boolean> {
    const count = await this.prisma.consultationRequest.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async existsByRequestNumber(requestNumber: RequestNumber): Promise<boolean> {
    const count = await this.prisma.consultationRequest.count({
      where: { requestNumber: requestNumber.getValue() },
    });
    return count > 0;
  }

  async update(
    consultation: ConsultationRequest,
  ): Promise<ConsultationRequest> {
    const updated = await this.prisma.consultationRequest.update({
      where: { id: consultation.id.getValue() },
      data: {
        assignedProviderId: consultation.assignedProviderId?.getValue(),
        status: ConsultationStatusMapper.toPrisma(consultation.status),
        assignedAt: consultation.assignedAt,
        respondedAt: consultation.respondedAt,
        completedAt: consultation.completedAt,
        slaDeadline: consultation.slaDeadline,
        slaStatus: consultation.slaStatus
          ? SLAStatusMapper.toPrisma(consultation.slaStatus)
          : undefined,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async updateMany(
    consultations: ConsultationRequest[],
  ): Promise<ConsultationRequest[]> {
    return Promise.all(consultations.map((c) => this.update(c)));
  }

  async assign(
    id: ConsultationId,
    providerId: UserId,
  ): Promise<ConsultationRequest> {
    const updated = await this.prisma.consultationRequest.update({
      where: { id: id.getValue() },
      data: {
        assignedProviderId: providerId.getValue(),
        status: PrismaRequestStatus.assigned,
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async updateStatus(
    id: ConsultationId,
    status: ConsultationStatusVO,
  ): Promise<ConsultationRequest> {
    const updated = await this.prisma.consultationRequest.update({
      where: { id: id.getValue() },
      data: {
        status: ConsultationStatusMapper.toPrisma(status),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async updateSLAStatuses(ids: ConsultationId[]): Promise<number> {
    const result = await this.prisma.consultationRequest.updateMany({
      where: { id: { in: ids.map((id) => id.getValue()) } },
      data: { updatedAt: new Date() },
    });
    return result.count;
  }

  async softDelete(id: ConsultationId): Promise<boolean> {
    await this.prisma.consultationRequest.update({
      where: { id: id.getValue() },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  async softDeleteMany(ids: ConsultationId[]): Promise<number> {
    const result = await this.prisma.consultationRequest.updateMany({
      where: { id: { in: ids.map((id) => id.getValue()) } },
      data: { deletedAt: new Date() },
    });
    return result.count;
  }

  async restore(id: ConsultationId): Promise<ConsultationRequest> {
    const restored = await this.prisma.consultationRequest.update({
      where: { id: id.getValue() },
      data: { deletedAt: null },
    });
    return this.toDomain(restored);
  }

  async hardDelete(id: ConsultationId): Promise<boolean> {
    await this.prisma.consultationRequest.delete({
      where: { id: id.getValue() },
    });
    return true;
  }

  async hardDeleteMany(ids: ConsultationId[]): Promise<number> {
    const result = await this.prisma.consultationRequest.deleteMany({
      where: { id: { in: ids.map((id) => id.getValue()) } },
    });
    return result.count;
  }

  async getStatistics(filters?: ConsultationRequestFilters): Promise<any> {
    const where = this.buildWhereClause(filters);
    const total = await this.prisma.consultationRequest.count({ where });
    return {
      total,
      byStatus: {},
      byUrgency: {},
      bySLAStatus: {},
      averageResponseTime: 0,
      averageCompletionTime: 0,
      slaBreachRate: 0,
    };
  }

  async groupByStatus(
    _filters?: ConsultationRequestFilters,
  ): Promise<Record<ConsultationStatus, ConsultationRequest[]>> {
    return {} as Record<ConsultationStatus, ConsultationRequest[]>;
  }

  async findPendingOlderThan(hours: number): Promise<ConsultationRequest[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const data = await this.prisma.consultationRequest.findMany({
      where: {
        status: PrismaRequestStatus.pending,
        createdAt: { lt: cutoff },
        deletedAt: null,
      },
    });
    return data.map((cr) => this.toDomain(cr));
  }

  async getProviderWorkload(providerId: UserId): Promise<number> {
    return this.prisma.consultationRequest.count({
      where: {
        assignedProviderId: providerId.getValue(),
        status: {
          in: [PrismaRequestStatus.assigned, PrismaRequestStatus.in_progress],
        },
        deletedAt: null,
      },
    });
  }

  private buildWhereClause(
    filters?: ConsultationRequestFilters,
  ): Prisma.ConsultationRequestWhereInput {
    if (!filters) return { deletedAt: null };

    const where: Prisma.ConsultationRequestWhereInput = { deletedAt: null };

    if (filters.subscriberId) where.subscriberId = filters.subscriberId;
    if (filters.assignedProviderId)
      where.assignedProviderId = filters.assignedProviderId;
    if (filters.category) where.category = filters.category;

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      where.status = {
        in: statuses.map((s) =>
          ConsultationStatusMapper.toPrisma(ConsultationStatusVO.create(s)),
        ),
      };
    }

    if (filters.slaStatus) {
      const slaStatuses = Array.isArray(filters.slaStatus)
        ? filters.slaStatus
        : [filters.slaStatus];
      where.slaStatus = {
        in: slaStatuses.map((s) =>
          SLAStatusMapper.toPrisma(SLAStatus.create(s)),
        ),
      };
    }

    if (filters.searchTerm) {
      where.OR = [
        { subject: { contains: filters.searchTerm, mode: 'insensitive' } },
        { description: { contains: filters.searchTerm, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private toDomain(data: any): ConsultationRequest {
    return ConsultationRequest.reconstitute({
      id: ConsultationId.create(data.id),
      requestNumber: RequestNumber.create(data.requestNumber),
      subscriberId: data.subscriberId
        ? UserId.create(data.subscriberId)
        : undefined,
      assignedProviderId: data.assignedProviderId
        ? UserId.create(data.assignedProviderId)
        : undefined,
      consultationType: ConsultationTypeVO.create(data.consultationType),
      category: data.category
        ? ConsultationCategory.create(data.category)
        : undefined,
      subject: Subject.create(data.subject),
      description: Description.create(data.description),
      urgency: UrgencyMapper.toDomain(data.urgency),
      status: ConsultationStatusMapper.toDomain(data.status),
      submittedAt: data.submittedAt,
      assignedAt: data.assignedAt,
      respondedAt: data.respondedAt,
      completedAt: data.completedAt,
      slaDeadline: data.slaDeadline,
      slaStatus: data.slaStatus
        ? SLAStatusMapper.toDomain(data.slaStatus)
        : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    });
  }
}

// ============================================
// TRANSACTIONAL STATUS HISTORY REPOSITORY
// ============================================

class TransactionalStatusHistoryRepository
  implements IRequestStatusHistoryRepository
{
  constructor(
    private readonly prisma: PrismaService | PrismaTransactionClient,
  ) {}

  async create(history: RequestStatusHistory): Promise<RequestStatusHistory> {
    const created = await this.prisma.requestStatusHistory.create({
      data: {
        id: history.id.getValue(),
        consultationId: history.consultationId.getValue(),
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
    histories: RequestStatusHistory[],
  ): Promise<RequestStatusHistory[]> {
    return Promise.all(histories.map((h) => this.create(h)));
  }

  async findById(id: StatusHistoryId): Promise<RequestStatusHistory | null> {
    const found = await this.prisma.requestStatusHistory.findUnique({
      where: { id: id.getValue() },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByConsultationId(
    consultationId: ConsultationId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<RequestStatusHistory>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where = { consultationId: consultationId.getValue() };

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

  async findAll(
    filters?: StatusHistoryFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<RequestStatusHistory>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RequestStatusHistoryWhereInput = {};
    if (filters?.consultationId) where.consultationId = filters.consultationId;

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

  async count(filters?: StatusHistoryFilters): Promise<number> {
    const where: Prisma.RequestStatusHistoryWhereInput = {};
    if (filters?.consultationId) where.consultationId = filters.consultationId;
    return this.prisma.requestStatusHistory.count({ where });
  }

  async getStatusTimeline(
    consultationId: ConsultationId,
  ): Promise<RequestStatusHistory[]> {
    const data = await this.prisma.requestStatusHistory.findMany({
      where: { consultationId: consultationId.getValue() },
      orderBy: { changedAt: 'asc' },
    });
    return data.map((d) => this.toDomain(d));
  }

  async getAverageTimeInStatus(_status: ConsultationStatus): Promise<number> {
    return 0; // Simplified implementation
  }

  private toDomain(data: any): RequestStatusHistory {
    return RequestStatusHistory.reconstitute({
      id: StatusHistoryId.create(data.id),
      consultationId: ConsultationId.create(data.consultationId),
      fromStatus: data.fromStatus
        ? ConsultationStatusVO.create(data.fromStatus)
        : undefined,
      toStatus: ConsultationStatusVO.create(data.toStatus),
      reason: data.reason,
      changedBy: data.changedBy ? UserId.create(data.changedBy) : undefined,
      changedAt: data.changedAt,
    });
  }
}

// ============================================
// STUB REPOSITORIES (Simplified for UoW)
// ============================================

class TransactionalDocumentRepository implements IDocumentRepository {
  constructor(_prisma: PrismaService | PrismaTransactionClient) {}
  async create(document: Document): Promise<Document> {
    return document;
  }
  async createMany(documents: Document[]): Promise<Document[]> {
    return documents;
  }
  async findById(_id: DocumentId): Promise<Document | null> {
    return null;
  }
  async findByConsultationId(
    _consultationId: ConsultationId,
  ): Promise<Document[]> {
    return [];
  }
  async findAll(
    _filters?: DocumentFilters,
    _pagination?: PaginationParams,
  ): Promise<PaginatedResult<Document>> {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }
  async count(_filters?: DocumentFilters): Promise<number> {
    return 0;
  }
  async exists(_id: DocumentId): Promise<boolean> {
    return false;
  }
  async update(document: Document): Promise<Document> {
    return document;
  }
  async verify(_id: DocumentId): Promise<Document> {
    throw new Error('Not implemented');
  }
  async softDelete(_id: DocumentId): Promise<boolean> {
    return true;
  }
  async softDeleteMany(ids: DocumentId[]): Promise<number> {
    return ids.length;
  }
  async hardDelete(_id: DocumentId): Promise<boolean> {
    return true;
  }
  async hardDeleteMany(ids: DocumentId[]): Promise<number> {
    return ids.length;
  }
  async getTotalSize(_consultationId: ConsultationId): Promise<number> {
    return 0;
  }
  async countByConsultation(_consultationId: ConsultationId): Promise<number> {
    return 0;
  }
}

class TransactionalMessageRepository implements IRequestMessageRepository {
  constructor(_prisma: PrismaService | PrismaTransactionClient) {}
  async create(message: RequestMessage): Promise<RequestMessage> {
    return message;
  }
  async createMany(messages: RequestMessage[]): Promise<RequestMessage[]> {
    return messages;
  }
  async findById(_id: MessageId): Promise<RequestMessage | null> {
    return null;
  }
  async findByConsultationId(
    _consultationId: ConsultationId,
    _pagination?: PaginationParams,
  ): Promise<PaginatedResult<RequestMessage>> {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }
  async findUnreadByConsultation(
    _consultationId: ConsultationId,
  ): Promise<RequestMessage[]> {
    return [];
  }
  async findAll(
    _filters?: MessageFilters,
    _pagination?: PaginationParams,
  ): Promise<PaginatedResult<RequestMessage>> {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }
  async count(_filters?: MessageFilters): Promise<number> {
    return 0;
  }
  async update(message: RequestMessage): Promise<RequestMessage> {
    return message;
  }
  async markAsRead(_id: MessageId): Promise<RequestMessage> {
    throw new Error('Not implemented');
  }
  async markAllAsRead(_consultationId: ConsultationId): Promise<number> {
    return 0;
  }
  async softDelete(_id: MessageId): Promise<boolean> {
    return true;
  }
  async softDeleteMany(ids: MessageId[]): Promise<number> {
    return ids.length;
  }
  async hardDelete(_id: MessageId): Promise<boolean> {
    return true;
  }
  async countUnread(_consultationId: ConsultationId): Promise<number> {
    return 0;
  }
  async getLastMessage(
    _consultationId: ConsultationId,
  ): Promise<RequestMessage | null> {
    return null;
  }
}

class TransactionalRatingRepository implements IRequestRatingRepository {
  constructor(_prisma: PrismaService | PrismaTransactionClient) {}
  async create(rating: RequestRating): Promise<RequestRating> {
    return rating;
  }
  async findById(_id: RatingId): Promise<RequestRating | null> {
    return null;
  }
  async findByConsultationId(
    _consultationId: ConsultationId,
  ): Promise<RequestRating | null> {
    return null;
  }
  async findBySubscriberId(
    _subscriberId: UserId,
    _pagination?: PaginationParams,
  ): Promise<PaginatedResult<RequestRating>> {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }
  async exists(_consultationId: ConsultationId): Promise<boolean> {
    return false;
  }
  async update(rating: RequestRating): Promise<RequestRating> {
    return rating;
  }
  async hardDelete(_id: RatingId): Promise<boolean> {
    return true;
  }
  async getAverageRatingForProvider(_providerId: UserId): Promise<number> {
    return 0;
  }
  async countRatingsByProvider(_providerId: UserId): Promise<number> {
    return 0;
  }
  async getRatingDistribution(
    _providerId: UserId,
  ): Promise<Record<number, number>> {
    return {};
  }
}

class TransactionalCollaboratorRepository
  implements IRequestCollaboratorRepository
{
  constructor(_prisma: PrismaService | PrismaTransactionClient) {}
  async create(
    collaborator: RequestCollaborator,
  ): Promise<RequestCollaborator> {
    return collaborator;
  }
  async createMany(
    collaborators: RequestCollaborator[],
  ): Promise<RequestCollaborator[]> {
    return collaborators;
  }
  async findById(_id: CollaboratorId): Promise<RequestCollaborator | null> {
    return null;
  }
  async findByConsultationId(
    _consultationId: ConsultationId,
  ): Promise<RequestCollaborator[]> {
    return [];
  }
  async findByProviderUserId(
    _providerUserId: ProviderUserId,
    _pagination?: PaginationParams,
  ): Promise<PaginatedResult<RequestCollaborator>> {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }
  async findAll(
    _filters?: CollaboratorFilters,
    _pagination?: PaginationParams,
  ): Promise<PaginatedResult<RequestCollaborator>> {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }
  async exists(
    _consultationId: ConsultationId,
    _providerUserId: ProviderUserId,
  ): Promise<boolean> {
    return false;
  }
  async update(
    collaborator: RequestCollaborator,
  ): Promise<RequestCollaborator> {
    return collaborator;
  }
  async accept(_id: CollaboratorId): Promise<RequestCollaborator> {
    throw new Error('Not implemented');
  }
  async reject(_id: CollaboratorId): Promise<RequestCollaborator> {
    throw new Error('Not implemented');
  }
  async hardDelete(_id: CollaboratorId): Promise<boolean> {
    return true;
  }
  async hardDeleteMany(ids: CollaboratorId[]): Promise<number> {
    return ids.length;
  }
  async countActiveCollaborators(
    _consultationId: ConsultationId,
  ): Promise<number> {
    return 0;
  }
  async getCollaboratorsByRole(
    _consultationId: ConsultationId,
    _role: string,
  ): Promise<RequestCollaborator[]> {
    return [];
  }
}

export { CONSULTATION_UNIT_OF_WORK };
