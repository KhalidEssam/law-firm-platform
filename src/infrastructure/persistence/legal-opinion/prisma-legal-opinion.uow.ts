// ============================================
// PRISMA LEGAL OPINION UNIT OF WORK
// src/infrastructure/persistence/legal-opinion/prisma-legal-opinion.uow.ts
// ============================================

import { Injectable } from '@nestjs/common';
import {
    Prisma,
    RequestStatus as PrismaRequestStatus,
    PaymentStatus as PrismaPaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    ILegalOpinionUnitOfWork,
    ILegalOpinionStatusHistoryRepository,
    LEGAL_OPINION_UNIT_OF_WORK,
} from '../../../core/domain/legal-opinion/port/legal-opinion.uow';
import {
    ILegalOpinionRequestRepository,
    OpinionRequestFilters,
    PaginationParams,
    PaginatedResult,
    OpinionStatistics,
} from '../../../core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from '../../../core/domain/legal-opinion/entities/legal-opinion-request.entity';
import {
    LegalOpinionStatusHistory,
    StatusHistoryId,
} from '../../../core/domain/legal-opinion/entities/legal-opinion-status-history.entity';
import { OpinionRequestId } from '../../../core/domain/legal-opinion/value-objects/opinion-requestid.vo';
import { OpinionNumber } from '../../../core/domain/legal-opinion/value-objects/opinion-number.vo';
import { UserId } from '../../../core/domain/consultation/value-objects/consultation-request-domain';
import { OpinionSubject } from '../../../core/domain/legal-opinion/value-objects/opinion-subject.vo';
import { LegalQuestion } from '../../../core/domain/legal-opinion/value-objects/legal-question.vo';
import { BackgroundContext } from '../../../core/domain/legal-opinion/value-objects/background-context.vo';
import { RelevantFacts } from '../../../core/domain/legal-opinion/value-objects/relevant-facts.vo';
import { SpecificIssues } from '../../../core/domain/legal-opinion/value-objects/specific-issues.vo';
import { Jurisdiction } from '../../../core/domain/legal-opinion/value-objects/jurisdiction.vo';
import { OpinionStatusVO, OpinionStatus } from '../../../core/domain/legal-opinion/value-objects/opinion-status.vo';
import { OpinionTypeVO, OpinionType } from '../../../core/domain/legal-opinion/value-objects/opinion-type.vo';
import { OpinionPriorityVO, OpinionPriority } from '../../../core/domain/legal-opinion/value-objects/opinion-priority.vo';
import { DeliveryFormatVO, DeliveryFormat } from '../../../core/domain/legal-opinion/value-objects/delivery-format.vo';
import { Money } from '../../../core/domain/legal-opinion/value-objects/money.vo';
import { ConfidentialityLevel } from '../../../core/domain/legal-opinion/value-objects/confidentiality-level.vo';
import {
    TransactionOptions,
    DEFAULT_TRANSACTION_OPTIONS,
} from '../../../core/domain/shared/ports/base-unit-of-work.interface';
import {
    toPrismaTransactionOptions,
    PrismaTransactionClient,
} from '../shared/prisma-transaction.helper';

// ============================================
// STATUS MAPPER
// ============================================

class OpinionStatusMapper {
    private static readonly toPrismaMap: Record<OpinionStatus, PrismaRequestStatus> = {
        [OpinionStatus.DRAFT]: PrismaRequestStatus.pending,
        [OpinionStatus.SUBMITTED]: PrismaRequestStatus.pending,
        [OpinionStatus.UNDER_REVIEW]: PrismaRequestStatus.pending,
        [OpinionStatus.ASSIGNED]: PrismaRequestStatus.quote_sent,
        [OpinionStatus.RESEARCH_PHASE]: PrismaRequestStatus.quote_accepted,
        [OpinionStatus.DRAFTING]: PrismaRequestStatus.in_progress,
        [OpinionStatus.INTERNAL_REVIEW]: PrismaRequestStatus.in_progress,
        [OpinionStatus.REVISION_REQUESTED]: PrismaRequestStatus.in_progress,
        [OpinionStatus.REVISING]: PrismaRequestStatus.in_progress,
        [OpinionStatus.COMPLETED]: PrismaRequestStatus.completed,
        [OpinionStatus.CANCELLED]: PrismaRequestStatus.cancelled,
        [OpinionStatus.REJECTED]: PrismaRequestStatus.cancelled,
    };

    private static readonly toDomainMap: Record<PrismaRequestStatus, OpinionStatus> = {
        [PrismaRequestStatus.pending]: OpinionStatus.SUBMITTED,
        [PrismaRequestStatus.assigned]: OpinionStatus.ASSIGNED,
        [PrismaRequestStatus.quote_sent]: OpinionStatus.ASSIGNED,
        [PrismaRequestStatus.quote_accepted]: OpinionStatus.RESEARCH_PHASE,
        [PrismaRequestStatus.scheduled]: OpinionStatus.DRAFTING,
        [PrismaRequestStatus.in_progress]: OpinionStatus.DRAFTING,
        [PrismaRequestStatus.completed]: OpinionStatus.COMPLETED,
        [PrismaRequestStatus.disputed]: OpinionStatus.REVISION_REQUESTED,
        [PrismaRequestStatus.cancelled]: OpinionStatus.CANCELLED,
        [PrismaRequestStatus.closed]: OpinionStatus.COMPLETED,
        [PrismaRequestStatus.no_show]: OpinionStatus.CANCELLED,
        [PrismaRequestStatus.rescheduled]: OpinionStatus.DRAFTING,
    };

    static toPrisma(status: OpinionStatus): PrismaRequestStatus {
        return this.toPrismaMap[status] || PrismaRequestStatus.pending;
    }

    static toDomain(prismaStatus: PrismaRequestStatus): OpinionStatus {
        return this.toDomainMap[prismaStatus] || OpinionStatus.SUBMITTED;
    }
}

/**
 * Prisma implementation of the Legal Opinion Unit of Work.
 */
@Injectable()
export class PrismaLegalOpinionUnitOfWork implements ILegalOpinionUnitOfWork {
    private _opinions: ILegalOpinionRequestRepository;
    private _statusHistories: ILegalOpinionStatusHistoryRepository;

    constructor(private readonly prisma: PrismaService) {
        this._opinions = new TransactionalLegalOpinionRepository(prisma);
        this._statusHistories = new TransactionalLegalOpinionStatusHistoryRepository(prisma);
    }

    get opinions(): ILegalOpinionRequestRepository {
        return this._opinions;
    }

    get statusHistories(): ILegalOpinionStatusHistoryRepository {
        return this._statusHistories;
    }

    async transaction<R>(
        work: (uow: ILegalOpinionUnitOfWork) => Promise<R>,
        options?: TransactionOptions,
    ): Promise<R> {
        const prismaOptions = toPrismaTransactionOptions(options ?? DEFAULT_TRANSACTION_OPTIONS);

        return await this.prisma.$transaction(async (tx) => {
            const transactionalUow = this.createTransactionalUow(tx);
            return await work(transactionalUow);
        }, prismaOptions);
    }

    private createTransactionalUow(tx: PrismaTransactionClient): ILegalOpinionUnitOfWork {
        return {
            opinions: new TransactionalLegalOpinionRepository(tx),
            statusHistories: new TransactionalLegalOpinionStatusHistoryRepository(tx),
            transaction: async <R>(work: (uow: ILegalOpinionUnitOfWork) => Promise<R>): Promise<R> => {
                return await work(this.createTransactionalUow(tx));
            },
        };
    }
}

// ============================================
// TRANSACTIONAL LEGAL OPINION REPOSITORY
// ============================================

class TransactionalLegalOpinionRepository implements ILegalOpinionRequestRepository {
    constructor(private readonly prisma: PrismaService | PrismaTransactionClient) {}

    private getIncludeRelations() {
        return {
            subscriber: true,
            assignedProvider: true,
            documents: true,
            messages: true,
            statusHistory: true,
            rating: true,
        };
    }

    async save(opinion: LegalOpinionRequest): Promise<LegalOpinionRequest> {
        const data = this.toPrisma(opinion);
        const created = await this.prisma.legalOpinionRequest.create({
            data,
            include: this.getIncludeRelations(),
        });
        return this.toDomain(created);
    }

    async update(opinion: LegalOpinionRequest): Promise<LegalOpinionRequest> {
        const data = this.toPrisma(opinion);
        const { id, ...updateData } = data;

        const updated = await this.prisma.legalOpinionRequest.update({
            where: { id: opinion.id.getValue() },
            data: updateData,
            include: this.getIncludeRelations(),
        });
        return this.toDomain(updated);
    }

    async findById(id: OpinionRequestId): Promise<LegalOpinionRequest | null> {
        const opinion = await this.prisma.legalOpinionRequest.findUnique({
            where: { id: id.getValue() },
            include: this.getIncludeRelations(),
        });
        return opinion ? this.toDomain(opinion) : null;
    }

    async findByOpinionNumber(opinionNumber: string): Promise<LegalOpinionRequest | null> {
        const opinion = await this.prisma.legalOpinionRequest.findUnique({
            where: { requestNumber: opinionNumber },
            include: this.getIncludeRelations(),
        });
        return opinion ? this.toDomain(opinion) : null;
    }

    async findAll(
        filters?: OpinionRequestFilters,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<LegalOpinionRequest>> {
        const where = this.buildWhereClause(filters);
        const { skip, take, orderBy } = this.buildPaginationClause(pagination);

        const [opinions, total] = await Promise.all([
            this.prisma.legalOpinionRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                include: this.getIncludeRelations(),
            }),
            this.prisma.legalOpinionRequest.count({ where }),
        ]);

        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;

        return {
            data: opinions.map((o) => this.toDomain(o)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrevious: page > 1,
            },
        };
    }

    async delete(id: OpinionRequestId): Promise<boolean> {
        try {
            await this.prisma.legalOpinionRequest.update({
                where: { id: id.getValue() },
                data: { deletedAt: new Date() },
            });
            return true;
        } catch {
            return false;
        }
    }

    async findByClientId(
        clientId: UserId,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<LegalOpinionRequest>> {
        return this.findAll({ clientId: clientId.getValue() }, pagination);
    }

    async findByLawyerId(
        lawyerId: UserId,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<LegalOpinionRequest>> {
        return this.findAll({ assignedLawyerId: lawyerId.getValue() }, pagination);
    }

    async findOverdue(pagination?: PaginationParams): Promise<PaginatedResult<LegalOpinionRequest>> {
        return this.findAll({ status: OpinionStatus.DRAFTING as any }, pagination);
    }

    async findUnpaid(pagination?: PaginationParams): Promise<PaginatedResult<LegalOpinionRequest>> {
        const where: Prisma.LegalOpinionRequestWhereInput = {
            status: PrismaRequestStatus.completed,
            paymentStatus: PrismaPaymentStatus.pending,
            deletedAt: null,
        };

        const { skip, take, orderBy } = this.buildPaginationClause(pagination);

        const [opinions, total] = await Promise.all([
            this.prisma.legalOpinionRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                include: this.getIncludeRelations(),
            }),
            this.prisma.legalOpinionRequest.count({ where }),
        ]);

        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;

        return {
            data: opinions.map((o) => this.toDomain(o)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrevious: page > 1,
            },
        };
    }

    async findByStatuses(
        statuses: OpinionStatus[],
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<LegalOpinionRequest>> {
        return this.findAll({ status: statuses as any }, pagination);
    }

    async findByPriority(
        priority: OpinionPriority,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<LegalOpinionRequest>> {
        return this.findAll({}, pagination);
    }

    async count(filters?: OpinionRequestFilters): Promise<number> {
        const where = this.buildWhereClause(filters);
        return this.prisma.legalOpinionRequest.count({ where });
    }

    async getStatistics(filters?: OpinionRequestFilters): Promise<OpinionStatistics> {
        const where = this.buildWhereClause(filters);
        const total = await this.prisma.legalOpinionRequest.count({ where });

        const statusCounts = await this.prisma.legalOpinionRequest.groupBy({
            by: ['status'],
            where,
            _count: true,
        });

        const byStatus: Record<string, number> = {};
        statusCounts.forEach((item) => {
            byStatus[item.status] = item._count;
        });

        const paidCount = await this.prisma.legalOpinionRequest.count({
            where: { ...where, paymentStatus: PrismaPaymentStatus.paid },
        });

        const unpaidCount = await this.prisma.legalOpinionRequest.count({
            where: { ...where, paymentStatus: PrismaPaymentStatus.pending },
        });

        const revenueStats = await this.prisma.legalOpinionRequest.aggregate({
            where: { ...where, quoteAmount: { not: null }, paymentStatus: PrismaPaymentStatus.paid },
            _sum: { quoteAmount: true },
            _avg: { quoteAmount: true },
        });

        return {
            total,
            byStatus,
            byType: {},
            byPriority: {},
            averageCompletionTime: 0,
            overdueCount: 0,
            paidCount,
            unpaidCount,
            totalRevenue: revenueStats._sum.quoteAmount || 0,
            averageRevenue: revenueStats._avg.quoteAmount || 0,
        };
    }

    async countByClientId(clientId: UserId): Promise<number> {
        return this.count({ clientId: clientId.getValue() });
    }

    async countByLawyerId(lawyerId: UserId): Promise<number> {
        return this.count({ assignedLawyerId: lawyerId.getValue() });
    }

    async getLawyerWorkload(lawyerId: UserId): Promise<number> {
        return this.prisma.legalOpinionRequest.count({
            where: {
                assignedProviderId: lawyerId.getValue(),
                status: { in: [PrismaRequestStatus.in_progress, PrismaRequestStatus.quote_accepted] },
                deletedAt: null,
            },
        });
    }

    async findNeedingSLAUpdate(): Promise<LegalOpinionRequest[]> {
        const opinions = await this.prisma.legalOpinionRequest.findMany({
            where: {
                status: { in: [PrismaRequestStatus.in_progress, PrismaRequestStatus.quote_accepted] },
                deletedAt: null,
            },
            include: this.getIncludeRelations(),
        });
        return opinions.map((o) => this.toDomain(o));
    }

    async batchUpdate(opinions: LegalOpinionRequest[]): Promise<LegalOpinionRequest[]> {
        const updates = opinions.map((opinion) => {
            const data = this.toPrisma(opinion);
            const { id, ...updateData } = data;

            return this.prisma.legalOpinionRequest.update({
                where: { id: opinion.id.getValue() },
                data: updateData,
                include: this.getIncludeRelations(),
            });
        });

        const updated = await Promise.all(updates);
        return updated.map((o) => this.toDomain(o));
    }

    async exists(id: OpinionRequestId): Promise<boolean> {
        const count = await this.prisma.legalOpinionRequest.count({
            where: { id: id.getValue() },
        });
        return count > 0;
    }

    async existsByOpinionNumber(opinionNumber: string): Promise<boolean> {
        const count = await this.prisma.legalOpinionRequest.count({
            where: { requestNumber: opinionNumber },
        });
        return count > 0;
    }

    private buildWhereClause(filters?: OpinionRequestFilters): Prisma.LegalOpinionRequestWhereInput {
        if (!filters) return { deletedAt: null };

        const where: Prisma.LegalOpinionRequestWhereInput = { deletedAt: null };

        if (filters.clientId) where.subscriberId = filters.clientId;
        if (filters.assignedLawyerId) where.assignedProviderId = filters.assignedLawyerId;

        if (filters.isPaid !== undefined) {
            where.paymentStatus = filters.isPaid
                ? PrismaPaymentStatus.paid
                : PrismaPaymentStatus.pending;
        }

        if (filters.searchTerm) {
            where.OR = [
                { subject: { contains: filters.searchTerm, mode: 'insensitive' } },
                { description: { contains: filters.searchTerm, mode: 'insensitive' } },
            ];
        }

        if (filters.submittedFrom || filters.submittedTo) {
            where.submittedAt = {};
            if (filters.submittedFrom) where.submittedAt.gte = filters.submittedFrom;
            if (filters.submittedTo) where.submittedAt.lte = filters.submittedTo;
        }

        if (filters.completedFrom || filters.completedTo) {
            where.completedAt = {};
            if (filters.completedFrom) where.completedAt.gte = filters.completedFrom;
            if (filters.completedTo) where.completedAt.lte = filters.completedTo;
        }

        return where;
    }

    private buildPaginationClause(pagination?: PaginationParams) {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const skip = (page - 1) * limit;
        const take = limit;
        const sortBy = pagination?.sortBy || 'createdAt';
        const sortOrder = pagination?.sortOrder || 'desc';
        const orderBy = { [sortBy]: sortOrder };

        return { skip, take, orderBy };
    }

    private toPrisma(opinion: LegalOpinionRequest): any {
        const caseDetails = {
            opinionType: opinion.opinionType.getValue(),
            backgroundContext: opinion.backgroundContext.getValue(),
            relevantFacts: opinion.relevantFacts.getValue(),
            specificIssues: opinion.specificIssues?.getValue(),
            jurisdiction: {
                country: opinion.jurisdiction.getCountry(),
                region: opinion.jurisdiction.getRegion(),
                city: opinion.jurisdiction.getCity(),
                legalSystem: opinion.jurisdiction.getLegalSystem(),
            },
            priority: opinion.priority.getValue(),
            deliveryFormat: opinion.deliveryFormat.getValue(),
            confidentialityLevel: opinion.confidentialityLevel.getValue(),
            includeExecutiveSummary: opinion.includeExecutiveSummary,
            includeCitations: opinion.includeCitations,
            includeRecommendations: opinion.includeRecommendations,
        };

        return {
            id: opinion.id.getValue(),
            requestNumber: opinion.opinionNumber.toString(),
            subscriberId: opinion.clientId.getValue(),
            assignedProviderId: opinion.assignedLawyerId?.getValue() || null,
            subject: opinion.subject.getValue(),
            description: opinion.legalQuestion.getValue(),
            caseDetails,
            status: OpinionStatusMapper.toPrisma(opinion.status.getValue() as OpinionStatus),
            quoteAmount: opinion.estimatedCost?.getAmount() || opinion.finalCost?.getAmount() || null,
            quoteCurrency: opinion.estimatedCost?.getCurrency() || opinion.finalCost?.getCurrency() || 'SAR',
            paymentStatus: opinion.isPaid ? PrismaPaymentStatus.paid : PrismaPaymentStatus.pending,
            paymentReference: opinion.paymentReference || null,
            submittedAt: opinion.submittedAt || new Date(),
            completedAt: opinion.completedAt || null,
            createdAt: opinion.createdAt,
            updatedAt: opinion.updatedAt,
            deletedAt: opinion.deletedAt || null,
        };
    }

    private toDomain(data: any): LegalOpinionRequest {
        const caseDetails = data.caseDetails || {};

        const jurisdiction = Jurisdiction.create({
            country: caseDetails.jurisdiction?.country || 'Saudi Arabia',
            region: caseDetails.jurisdiction?.region,
            city: caseDetails.jurisdiction?.city,
            legalSystem: caseDetails.jurisdiction?.legalSystem,
        });

        const estimatedCost = data.quoteAmount
            ? Money.create(data.quoteAmount, data.quoteCurrency || 'SAR')
            : undefined;

        const finalCost = data.paymentStatus === PrismaPaymentStatus.paid && data.quoteAmount
            ? Money.create(data.quoteAmount, data.quoteCurrency || 'SAR')
            : undefined;

        return LegalOpinionRequest.reconstitute({
            id: OpinionRequestId.create(data.id),
            opinionNumber: OpinionNumber.create(data.requestNumber),
            clientId: UserId.create(data.subscriberId),
            assignedLawyerId: data.assignedProviderId ? UserId.create(data.assignedProviderId) : undefined,
            reviewedBy: undefined,
            opinionType: OpinionTypeVO.create(caseDetails.opinionType || OpinionType.LEGAL_ANALYSIS),
            subject: OpinionSubject.create(data.subject),
            legalQuestion: LegalQuestion.create(data.description),
            backgroundContext: BackgroundContext.create(caseDetails.backgroundContext || data.description),
            relevantFacts: RelevantFacts.create(caseDetails.relevantFacts || 'See case details'),
            specificIssues: caseDetails.specificIssues ? SpecificIssues.create(caseDetails.specificIssues) : undefined,
            jurisdiction,
            priority: OpinionPriorityVO.create(caseDetails.priority || OpinionPriority.STANDARD),
            requestedDeliveryDate: undefined,
            actualDeliveryDate: data.deliveredAt,
            status: OpinionStatusVO.create(OpinionStatusMapper.toDomain(data.status)),
            draftVersion: 0,
            finalVersion: data.status === PrismaRequestStatus.completed ? 1 : undefined,
            deliveryFormat: DeliveryFormatVO.create(caseDetails.deliveryFormat || DeliveryFormat.PDF),
            includeExecutiveSummary: caseDetails.includeExecutiveSummary ?? true,
            includeCitations: caseDetails.includeCitations ?? true,
            includeRecommendations: caseDetails.includeRecommendations ?? true,
            estimatedCost,
            finalCost,
            isPaid: data.paymentStatus === PrismaPaymentStatus.paid,
            paymentReference: data.paymentReference,
            submittedAt: data.submittedAt,
            assignedAt: data.status === PrismaRequestStatus.quote_sent || data.status === PrismaRequestStatus.in_progress
                ? data.updatedAt
                : undefined,
            researchStartedAt: data.status === PrismaRequestStatus.in_progress ? data.updatedAt : undefined,
            draftCompletedAt: data.status === PrismaRequestStatus.completed ? data.completedAt : undefined,
            completedAt: data.completedAt,
            expectedCompletionDate: data.quoteValidUntil,
            confidentialityLevel: ConfidentialityLevel.create(caseDetails.confidentialityLevel || 'standard'),
            isUrgent: caseDetails.priority === OpinionPriority.URGENT,
            requiresCollaboration: false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            deletedAt: data.deletedAt,
        });
    }
}

// ============================================
// TRANSACTIONAL STATUS HISTORY REPOSITORY
// ============================================

class TransactionalLegalOpinionStatusHistoryRepository implements ILegalOpinionStatusHistoryRepository {
    constructor(private readonly prisma: PrismaService | PrismaTransactionClient) {}

    async create(history: LegalOpinionStatusHistory): Promise<LegalOpinionStatusHistory> {
        const created = await this.prisma.requestStatusHistory.create({
            data: {
                id: history.id.getValue(),
                legalOpinionId: history.legalOpinionId,
                fromStatus: history.fromStatus || null,
                toStatus: history.toStatus,
                reason: history.reason || null,
                changedBy: history.changedBy || null,
                changedAt: history.changedAt,
            },
        });
        return this.toDomain(created);
    }

    async createMany(histories: LegalOpinionStatusHistory[]): Promise<LegalOpinionStatusHistory[]> {
        const data = histories.map(h => ({
            id: h.id.getValue(),
            legalOpinionId: h.legalOpinionId,
            fromStatus: h.fromStatus || null,
            toStatus: h.toStatus,
            reason: h.reason || null,
            changedBy: h.changedBy || null,
            changedAt: h.changedAt,
        }));

        await this.prisma.requestStatusHistory.createMany({ data });

        const ids = histories.map(h => h.id.getValue());
        const created = await this.prisma.requestStatusHistory.findMany({
            where: { id: { in: ids } },
        });

        return created.map(c => this.toDomain(c));
    }

    async findById(id: StatusHistoryId): Promise<LegalOpinionStatusHistory | null> {
        const found = await this.prisma.requestStatusHistory.findUnique({
            where: { id: id.getValue() },
        });
        return found ? this.toDomain(found) : null;
    }

    async findByLegalOpinionId(
        legalOpinionId: string,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<LegalOpinionStatusHistory>> {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const skip = (page - 1) * limit;

        const where = { legalOpinionId };

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
            data: data.map(d => this.toDomain(d)),
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

    async findLatestByLegalOpinionId(legalOpinionId: string): Promise<LegalOpinionStatusHistory | null> {
        const found = await this.prisma.requestStatusHistory.findFirst({
            where: { legalOpinionId },
            orderBy: { changedAt: 'desc' },
        });
        return found ? this.toDomain(found) : null;
    }

    async countByLegalOpinionId(legalOpinionId: string): Promise<number> {
        return await this.prisma.requestStatusHistory.count({
            where: { legalOpinionId },
        });
    }

    async delete(id: StatusHistoryId): Promise<void> {
        await this.prisma.requestStatusHistory.delete({
            where: { id: id.getValue() },
        });
    }

    private toDomain(record: any): LegalOpinionStatusHistory {
        return LegalOpinionStatusHistory.rehydrate({
            id: record.id,
            legalOpinionId: record.legalOpinionId,
            fromStatus: record.fromStatus || undefined,
            toStatus: record.toStatus,
            reason: record.reason || undefined,
            changedBy: record.changedBy || undefined,
            changedAt: record.changedAt,
        });
    }
}

// Export the token for module registration
export { LEGAL_OPINION_UNIT_OF_WORK };
