// ============================================
// PRISMA DISPUTE REPOSITORY
// src/infrastructure/persistence/billing/prisma-dispute.repository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Dispute, DisputeResolutionData, DisputeEscalationData } from '../../../core/domain/billing/entities/dispute.entity';
import { DisputeStatusEnum } from '../../../core/domain/billing/value-objects/dispute-status.vo';
import { PriorityEnum } from '../../../core/domain/billing/value-objects/priority.vo';
import {
    IDisputeRepository,
    DisputeListOptions,
    DisputeCountOptions,
    DisputeStatistics,
} from '../../../core/domain/billing/ports/dispute.repository';
import { DisputeStatusMapper, PriorityMapper } from './billing-enum.mapper';

@Injectable()
export class PrismaDisputeRepository implements IDisputeRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ============================================
    // CREATE
    // ============================================
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

    // ============================================
    // READ
    // ============================================
    async findById(id: string): Promise<Dispute | null> {
        const found = await this.prisma.dispute.findUnique({
            where: { id },
        });
        return found ? this.toDomain(found) : null;
    }

    async findByUserId(userId: string): Promise<Dispute[]> {
        const found = await this.prisma.dispute.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return found.map(record => this.toDomain(record));
    }

    async findByConsultationId(consultationId: string): Promise<Dispute[]> {
        const found = await this.prisma.dispute.findMany({
            where: { consultationId },
            orderBy: { createdAt: 'desc' },
        });
        return found.map(record => this.toDomain(record));
    }

    async findByLegalOpinionId(legalOpinionId: string): Promise<Dispute[]> {
        const found = await this.prisma.dispute.findMany({
            where: { legalOpinionId },
            orderBy: { createdAt: 'desc' },
        });
        return found.map(record => this.toDomain(record));
    }

    async findByServiceRequestId(serviceRequestId: string): Promise<Dispute[]> {
        const found = await this.prisma.dispute.findMany({
            where: { serviceRequestId },
            orderBy: { createdAt: 'desc' },
        });
        return found.map(record => this.toDomain(record));
    }

    async findByLitigationCaseId(litigationCaseId: string): Promise<Dispute[]> {
        const found = await this.prisma.dispute.findMany({
            where: { litigationCaseId },
            orderBy: { createdAt: 'desc' },
        });
        return found.map(record => this.toDomain(record));
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
        return found.map(record => this.toDomain(record));
    }

    async count(options?: DisputeCountOptions): Promise<number> {
        return await this.prisma.dispute.count({
            where: this.buildWhereClause(options),
        });
    }

    // ============================================
    // UPDATE
    // ============================================
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

    async escalate(id: string, escalationData: DisputeEscalationData): Promise<Dispute> {
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

    async resolve(id: string, resolutionData: DisputeResolutionData): Promise<Dispute> {
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

    // ============================================
    // DELETE
    // ============================================
    async delete(id: string): Promise<void> {
        await this.prisma.dispute.delete({
            where: { id },
        });
    }

    // ============================================
    // BUSINESS QUERIES
    // ============================================
    async findOpenDisputes(): Promise<Dispute[]> {
        const found = await this.prisma.dispute.findMany({
            where: {
                status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.OPEN),
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' },
            ],
        });
        return found.map(record => this.toDomain(record));
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
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' },
            ],
        });
        return found.map(record => this.toDomain(record));
    }

    async findEscalatedDisputes(): Promise<Dispute[]> {
        const found = await this.prisma.dispute.findMany({
            where: {
                status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.ESCALATED),
            },
            orderBy: [
                { priority: 'desc' },
                { escalatedAt: 'asc' },
            ],
        });
        return found.map(record => this.toDomain(record));
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
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' },
            ],
        });
        return found.map(record => this.toDomain(record));
    }

    async findDisputesRequiringAttention(): Promise<Dispute[]> {
        const found = await this.prisma.dispute.findMany({
            where: {
                OR: [
                    // High priority and active
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
                    // Escalated
                    {
                        status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.ESCALATED),
                    },
                ],
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' },
            ],
        });
        return found.map(record => this.toDomain(record));
    }

    async findByResolver(resolvedBy: string): Promise<Dispute[]> {
        const found = await this.prisma.dispute.findMany({
            where: { resolvedBy },
            orderBy: { resolvedAt: 'desc' },
        });
        return found.map(record => this.toDomain(record));
    }

    async findByEscalatee(escalatedTo: string): Promise<Dispute[]> {
        const found = await this.prisma.dispute.findMany({
            where: { escalatedTo },
            orderBy: { escalatedAt: 'desc' },
        });
        return found.map(record => this.toDomain(record));
    }

    async getStatistics(fromDate?: Date, toDate?: Date): Promise<DisputeStatistics> {
        const dateFilter = fromDate || toDate ? {
            createdAt: {
                ...(fromDate && { gte: fromDate }),
                ...(toDate && { lte: toDate }),
            },
        } : {};

        const [open, underReview, escalated, resolved, closed, byPriority, avgResolutionTime] = await Promise.all([
            this.prisma.dispute.count({
                where: { status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.OPEN), ...dateFilter },
            }),
            this.prisma.dispute.count({
                where: { status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.UNDER_REVIEW), ...dateFilter },
            }),
            this.prisma.dispute.count({
                where: { status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.ESCALATED), ...dateFilter },
            }),
            this.prisma.dispute.count({
                where: { status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.RESOLVED), ...dateFilter },
            }),
            this.prisma.dispute.count({
                where: { status: DisputeStatusMapper.toPrisma(DisputeStatusEnum.CLOSED), ...dateFilter },
            }),
            Promise.all([
                this.prisma.dispute.count({ where: { priority: PriorityMapper.toPrisma(PriorityEnum.LOW), ...dateFilter } }),
                this.prisma.dispute.count({ where: { priority: PriorityMapper.toPrisma(PriorityEnum.NORMAL), ...dateFilter } }),
                this.prisma.dispute.count({ where: { priority: PriorityMapper.toPrisma(PriorityEnum.HIGH), ...dateFilter } }),
                this.prisma.dispute.count({ where: { priority: PriorityMapper.toPrisma(PriorityEnum.URGENT), ...dateFilter } }),
            ]),
            this.prisma.$queryRaw<{ avg: number }[]>`
                SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt"))) as avg
                FROM "Dispute"
                WHERE "resolvedAt" IS NOT NULL
                ${fromDate ? this.prisma.$queryRaw`AND "createdAt" >= ${fromDate}` : this.prisma.$queryRaw``}
                ${toDate ? this.prisma.$queryRaw`AND "createdAt" <= ${toDate}` : this.prisma.$queryRaw``}
            `.catch(() => [{ avg: null }]),
        ]);

        return {
            totalOpen: open,
            totalUnderReview: underReview,
            totalEscalated: escalated,
            totalResolved: resolved,
            totalClosed: closed,
            averageResolutionTime: avgResolutionTime[0]?.avg ?? null,
            byPriority: {
                low: byPriority[0],
                normal: byPriority[1],
                high: byPriority[2],
                urgent: byPriority[3],
            },
        };
    }

    async hasActiveDispute(
        relatedEntityType: 'consultation' | 'legal_opinion' | 'service_request' | 'litigation_case',
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

    // ============================================
    // PRIVATE HELPERS
    // ============================================
    private buildWhereClause(options?: DisputeListOptions | DisputeCountOptions) {
        const where: any = {};

        if (options?.userId) where.userId = options.userId;
        if (options?.status) where.status = DisputeStatusMapper.toPrisma(options.status);
        if (options?.priority) where.priority = PriorityMapper.toPrisma(options.priority);
        if (options?.resolvedBy) where.resolvedBy = options.resolvedBy;
        if (options?.escalatedTo) where.escalatedTo = options.escalatedTo;

        if ('consultationId' in (options ?? {}) && options?.consultationId) {
            where.consultationId = options.consultationId;
        }
        if ('legalOpinionId' in (options ?? {}) && options?.legalOpinionId) {
            where.legalOpinionId = options.legalOpinionId;
        }
        if ('serviceRequestId' in (options ?? {}) && options?.serviceRequestId) {
            where.serviceRequestId = options.serviceRequestId;
        }
        if ('litigationCaseId' in (options ?? {}) && options?.litigationCaseId) {
            where.litigationCaseId = options.litigationCaseId;
        }

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
