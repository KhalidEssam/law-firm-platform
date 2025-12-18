// ============================================
// LITIGATION CASE PRISMA REPOSITORY
// Infrastructure Layer - Database Adapter
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
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

// Prisma 7 imports from generated path
import {
  LitigationCase as PrismaLitigationCase,
    RequestStatus as PrismaRequestStatus,
    PaymentStatus as PrismaPaymentStatus,
    Currency as PrismaCurrency,
    Prisma,
} from '@prisma/client';

// ============================================
// ENUM MAPPERS
// ============================================

class CaseStatusMapper {
    private static readonly toPrismaMap: Record<CaseStatusEnum, PrismaRequestStatus> = {
        [CaseStatusEnum.PENDING]: PrismaRequestStatus.pending,
        [CaseStatusEnum.QUOTE_SENT]: PrismaRequestStatus.quote_sent,
        [CaseStatusEnum.SCHEDULED]: PrismaRequestStatus.scheduled,
        [CaseStatusEnum.QUOTE_ACCEPTED]: PrismaRequestStatus.quote_accepted,
        [CaseStatusEnum.ACTIVE]: PrismaRequestStatus.in_progress,
        [CaseStatusEnum.CLOSED]: PrismaRequestStatus.closed,
        [CaseStatusEnum.CANCELLED]: PrismaRequestStatus.cancelled,
    };

    private static readonly toDomainMap: Record<PrismaRequestStatus, CaseStatusEnum> = {
        [PrismaRequestStatus.pending]: CaseStatusEnum.PENDING,
        [PrismaRequestStatus.assigned]: CaseStatusEnum.PENDING,
        [PrismaRequestStatus.scheduled]: CaseStatusEnum.SCHEDULED,
        [PrismaRequestStatus.in_progress]: CaseStatusEnum.ACTIVE,
        [PrismaRequestStatus.quote_sent]: CaseStatusEnum.QUOTE_SENT,
        [PrismaRequestStatus.quote_accepted]: CaseStatusEnum.QUOTE_ACCEPTED,
        [PrismaRequestStatus.completed]: CaseStatusEnum.CLOSED,
        [PrismaRequestStatus.disputed]: CaseStatusEnum.ACTIVE,
        [PrismaRequestStatus.cancelled]: CaseStatusEnum.CANCELLED,
        [PrismaRequestStatus.closed]: CaseStatusEnum.CLOSED,
    };

    static toPrisma(status: CaseStatus): PrismaRequestStatus {
        return this.toPrismaMap[status.getValue() as CaseStatusEnum];
    }

    static toDomain(prismaStatus: PrismaRequestStatus): CaseStatus {
        return CaseStatus.create(this.toDomainMap[prismaStatus]);
    }
}

class PaymentStatusMapper {
    private static readonly toPrismaMap: Record<PaymentStatusEnum, PrismaPaymentStatus> = {
        [PaymentStatusEnum.PENDING]: PrismaPaymentStatus.pending,
        [PaymentStatusEnum.PAID]: PrismaPaymentStatus.paid,
        [PaymentStatusEnum.REFUNDED]: PrismaPaymentStatus.refunded,
        [PaymentStatusEnum.PARTIALLY_PAID]: PrismaPaymentStatus.partially_refunded,
    };

    private static readonly toDomainMap: Record<PrismaPaymentStatus, PaymentStatusEnum> = {
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

@Injectable()
export class PrismaLitigationCaseRepository implements ILitigationCaseRepository {
    constructor(private readonly prisma: PrismaService) {}

    async save(litigationCase: LitigationCase): Promise<LitigationCase> {
        const data = this.toPrisma(litigationCase);

        const created = await this.prisma.litigationCase.create({
            data,
        });

        return this.toDomain(created);
    }

    async update(litigationCase: LitigationCase): Promise<LitigationCase> {
        const data = this.toPrisma(litigationCase);

        const updated = await this.prisma.litigationCase.update({
            where: { id: litigationCase.id.getValue() },
            data,
        });

        return this.toDomain(updated);
    }

    async findById(id: CaseId): Promise<LitigationCase | null> {
        const litigationCase = await this.prisma.litigationCase.findUnique({
            where: { id: id.getValue() },
        });

        if (!litigationCase) return null;

        return this.toDomain(litigationCase);
    }

    async findByCaseNumber(caseNumber: string): Promise<LitigationCase | null> {
        const litigationCase = await this.prisma.litigationCase.findUnique({
            where: { caseNumber },
        });

        if (!litigationCase) return null;

        return this.toDomain(litigationCase);
    }

    async findBySubscriberId(
        subscriberId: UserId,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<LitigationCase>> {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const skip = (page - 1) * limit;
        const sortBy = pagination?.sortBy || 'createdAt';
        const sortOrder = pagination?.sortOrder || 'desc';

        const where: Prisma.LitigationCaseWhereInput = {
            subscriberId: subscriberId.getValue(),
            deletedAt: null,
        };

        const [data, total] = await Promise.all([
            this.prisma.litigationCase.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.litigationCase.count({ where }),
        ]);

        return {
            data: data.map(c => this.toDomain(c)),
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
        const sortBy = pagination?.sortBy || 'createdAt';
        const sortOrder = pagination?.sortOrder || 'desc';

        const where: Prisma.LitigationCaseWhereInput = {
            assignedProviderId: providerId.getValue(),
            deletedAt: null,
        };

        const [data, total] = await Promise.all([
            this.prisma.litigationCase.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.litigationCase.count({ where }),
        ]);

        return {
            data: data.map(c => this.toDomain(c)),
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
        const sortBy = pagination.sortBy || 'createdAt';
        const sortOrder = pagination.sortOrder || 'desc';

        const where: Prisma.LitigationCaseWhereInput = {
            deletedAt: null,
        };

        if (filters.subscriberId) {
            where.subscriberId = filters.subscriberId;
        }

        if (filters.assignedProviderId) {
            where.assignedProviderId = filters.assignedProviderId;
        }

        if (filters.caseType) {
            where.caseType = filters.caseType;
        }

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                where.status = { in: filters.status as PrismaRequestStatus[] };
            } else {
                where.status = filters.status as PrismaRequestStatus;
            }
        }

        if (filters.paymentStatus) {
            where.paymentStatus = filters.paymentStatus as PrismaPaymentStatus;
        }

        if (filters.searchTerm) {
            where.OR = [
                { title: { contains: filters.searchTerm, mode: 'insensitive' } },
                { description: { contains: filters.searchTerm, mode: 'insensitive' } },
                { caseNumber: { contains: filters.searchTerm, mode: 'insensitive' } },
            ];
        }

        if (filters.submittedFrom || filters.submittedTo) {
            where.submittedAt = {};
            if (filters.submittedFrom) {
                where.submittedAt.gte = filters.submittedFrom;
            }
            if (filters.submittedTo) {
                where.submittedAt.lte = filters.submittedTo;
            }
        }

        if (filters.closedFrom || filters.closedTo) {
            where.closedAt = {};
            if (filters.closedFrom) {
                where.closedAt.gte = filters.closedFrom;
            }
            if (filters.closedTo) {
                where.closedAt.lte = filters.closedTo;
            }
        }

        const [data, total] = await Promise.all([
            this.prisma.litigationCase.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.litigationCase.count({ where }),
        ]);

        return {
            data: data.map(c => this.toDomain(c)),
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
        const sortBy = pagination?.sortBy || 'createdAt';
        const sortOrder = pagination?.sortOrder || 'desc';

        const where: Prisma.LitigationCaseWhereInput = {
            status: CaseStatusMapper.toPrisma(status),
            deletedAt: null,
        };

        const [data, total] = await Promise.all([
            this.prisma.litigationCase.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.litigationCase.count({ where }),
        ]);

        return {
            data: data.map(c => this.toDomain(c)),
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
        } catch (error) {
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
        const where: Prisma.LitigationCaseWhereInput = { deletedAt: null };

        if (filters?.subscriberId) {
            where.subscriberId = filters.subscriberId;
        }

        if (filters?.assignedProviderId) {
            where.assignedProviderId = filters.assignedProviderId;
        }

        if (filters?.caseType) {
            where.caseType = filters.caseType;
        }

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

        return await this.prisma.litigationCase.count({ where });
    }

    async getStatistics(filters?: LitigationCaseFilters): Promise<LitigationCaseStatistics> {
        const where: Prisma.LitigationCaseWhereInput = { deletedAt: null };

        if (filters?.subscriberId) {
            where.subscriberId = filters.subscriberId;
        }

        if (filters?.assignedProviderId) {
            where.assignedProviderId = filters.assignedProviderId;
        }

        if (filters?.status) {
            if (Array.isArray(filters.status)) {
                where.status = { in: filters.status as PrismaRequestStatus[] };
            } else {
                where.status = filters.status as PrismaRequestStatus;
            }
        }

        const [total, cases] = await Promise.all([
            this.prisma.litigationCase.count({ where }),
            this.prisma.litigationCase.findMany({
                where,
                select: {
                    status: true,
                    caseType: true,
                    paymentStatus: true,
                    quoteAmount: true,
                    quoteCurrency: true,
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
                byPaymentStatus[c.paymentStatus] = (byPaymentStatus[c.paymentStatus] || 0) + 1;
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

    // ============================================
    // MAPPING METHODS
    // ============================================

    private toPrisma(litigationCase: LitigationCase): Prisma.LitigationCaseCreateInput {
        const quoteAmount = litigationCase.quoteAmount;
        const caseDetails = litigationCase.caseDetails;
        const quoteDetails = litigationCase.quoteDetails;

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
            caseDetails: caseDetails ? (caseDetails.toJSON() as Prisma.InputJsonValue) : Prisma.JsonNull,
            status: CaseStatusMapper.toPrisma(litigationCase.status),
            quoteAmount: quoteAmount?.getAmount() || null,
            quoteCurrency: (quoteAmount?.getCurrency() as PrismaCurrency) || null,
            quoteDetails: quoteDetails ? (quoteDetails.toJSON() as Prisma.InputJsonValue) : Prisma.JsonNull,
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

    private toDomain(prisma: PrismaLitigationCase): LitigationCase {
        return LitigationCase.reconstitute({
            id: CaseId.create(prisma.id),
            caseNumber: CaseNumber.create(prisma.caseNumber),
            subscriberId: UserId.create(prisma.subscriberId),
            assignedProviderId: prisma.assignedProviderId
                ? UserId.create(prisma.assignedProviderId)
                : undefined,
            caseType: CaseType.create(prisma.caseType),
            caseSubtype: prisma.caseSubtype ? CaseSubtype.create(prisma.caseSubtype) : undefined,
            title: CaseTitle.create(prisma.title),
            description: CaseDescription.create(prisma.description),
            courtName: prisma.courtName ? CourtName.create(prisma.courtName) : undefined,
            caseDetails: prisma.caseDetails 
                ? CaseDetails.create(prisma.caseDetails as Record<string, any>) 
                : undefined,
            status: CaseStatusMapper.toDomain(prisma.status),
            quoteAmount: prisma.quoteAmount && prisma.quoteCurrency
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

    private buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
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