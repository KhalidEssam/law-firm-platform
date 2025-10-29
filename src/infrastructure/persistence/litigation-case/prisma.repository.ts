// ============================================
// LITIGATION CASE PRISMA REPOSITORY
// Infrastructure Layer - Database Adapter
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
    CourtName,
    CaseDetails,
    Money,
    QuoteDetails,
    PaymentStatus,
    PaymentReference,
} from '../../../core/domain/litigation-case/value-objects/litigation-case.vo';
import { LitigationCase as PrismaLitigationCase } from '@prisma/client';

@Injectable()
export class PrismaLitigationCaseRepository implements ILitigationCaseRepository {
    constructor(private readonly prisma: PrismaService) { }

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

        const where = {
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

        const where = {
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

        const where: any = {
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
                where.status = { in: filters.status };
            } else {
                where.status = filters.status;
            }
        }

        if (filters.paymentStatus) {
            where.paymentStatus = filters.paymentStatus;
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

        const where = {
            status: status.getValue(),
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
        const where: any = { deletedAt: null };

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
                where.status = { in: filters.status };
            } else {
                where.status = filters.status;
            }
        }

        if (filters?.paymentStatus) {
            where.paymentStatus = filters.paymentStatus;
        }

        return await this.prisma.litigationCase.count({ where });
    }

    async getStatistics(filters?: LitigationCaseFilters): Promise<LitigationCaseStatistics> {
        const where: any = { deletedAt: null };

        if (filters?.subscriberId) {
            where.subscriberId = filters.subscriberId;
        }

        if (filters?.assignedProviderId) {
            where.assignedProviderId = filters.assignedProviderId;
        }

        if (filters?.status) {
            if (Array.isArray(filters.status)) {
                where.status = { in: filters.status };
            } else {
                where.status = filters.status;
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

            if (c.quoteAmount && c.paymentStatus === 'paid') {
                totalRevenue += c.quoteAmount;
            }
        }

        const activeCount = byStatus['active'] || 0;
        const closedCount = byStatus['closed'] || 0;
        const paidCount = byPaymentStatus['paid'] || 0;
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

    private toPrisma(litigationCase: LitigationCase): any {
        const quoteAmount = litigationCase.quoteAmount;
        const caseDetails = litigationCase.caseDetails;
        const quoteDetails = litigationCase.quoteDetails;

        return {
            id: litigationCase.id.getValue(),
            caseNumber: litigationCase.caseNumber.toString(),
            subscriberId: litigationCase.subscriberId.getValue(),
            assignedProviderId: litigationCase.assignedProviderId?.getValue() || null,
            caseType: litigationCase.caseType.getValue(),
            caseSubtype: litigationCase.caseSubtype?.getValue() || null,
            title: litigationCase.title.getValue(),
            description: litigationCase.description.getValue(),
            courtName: litigationCase.courtName?.getValue() || null,
            caseDetails: caseDetails ? caseDetails.toJSON() : null,
            status: litigationCase.status.getValue(),
            quoteAmount: quoteAmount?.getAmount() || null,
            quoteCurrency: quoteAmount?.getCurrency() || null,
            quoteDetails: quoteDetails ? quoteDetails.toJSON() : null,
            quoteValidUntil: litigationCase.quoteValidUntil || null,
            quoteAcceptedAt: litigationCase.quoteAcceptedAt || null,
            paymentStatus: litigationCase.paymentStatus.getValue(),
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
            caseDetails: prisma.caseDetails ? CaseDetails.create(prisma.caseDetails as any) : undefined,
            status: CaseStatus.create(prisma.status),
            quoteAmount: prisma.quoteAmount && prisma.quoteCurrency
                ? Money.create(prisma.quoteAmount, prisma.quoteCurrency)
                : undefined,
            quoteDetails: prisma.quoteDetails ? QuoteDetails.create(prisma.quoteDetails as any) : undefined,
            quoteValidUntil: prisma.quoteValidUntil || undefined,
            quoteAcceptedAt: prisma.quoteAcceptedAt || undefined,
            paymentStatus: PaymentStatus.create(prisma.paymentStatus || 'pending'),
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