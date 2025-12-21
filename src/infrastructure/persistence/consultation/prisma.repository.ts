// ============================================
// CONSULTATION REQUEST PRISMA REPOSITORY
// Clean implementation for 13 core use cases
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Prisma 7 imports from generated path
import {
    Prisma,
    RequestStatus as PrismaRequestStatus,
    Priority as PrismaPriority,
    SLAStatus as PrismaSLAStatus,
    RequestType as PrismaRequestType,
    MessageType as PrismaMessageType,
} from '@prisma/client';
// Domain imports
import {
    ConsultationRequest,
    ConsultationId,
    UserId,
    RequestNumber,
    ConsultationTypeVO,
    ConsultationType,
    ConsultationStatusVO,
    ConsultationStatus,
    Urgency,
    UrgencyLevel,
    SLAStatus,
    // SLAStatusEnum,
    ConsultationCategory,
    Subject,
    Description,
} from '../../../core/domain/consultation/value-objects/consultation-request-domain';

import {
    Document,
    DocumentId,
    FileName,
    FileUrl,
    FileSize,
    RequestMessage,
    MessageId,
    MessageContent,
    MessageType,
    RequestRating,
    RatingId,
    RatingValue,
    RatingComment,
} from '../../../core/domain/consultation/entities/consultation-request-entities';

// ============================================
// ENUM MAPPERS
// ============================================

class ConsultationStatusMapper {
    private static readonly toPrismaMap: Record<ConsultationStatus, PrismaRequestStatus> = {
        [ConsultationStatus.PENDING]: PrismaRequestStatus.pending,
        [ConsultationStatus.ASSIGNED]: PrismaRequestStatus.assigned,
        [ConsultationStatus.IN_PROGRESS]: PrismaRequestStatus.in_progress,
        [ConsultationStatus.AWAITING_INFO]: PrismaRequestStatus.pending, // Map to closest
        // [ConsultationStatus.QUOTE_SENT]: PrismaRequestStatus.quote_sent,
        // [ConsultationStatus.QUOTE_ACCEPTED]: PrismaRequestStatus.quote_accepted,
        [ConsultationStatus.COMPLETED]: PrismaRequestStatus.completed,
        [ConsultationStatus.DISPUTED]: PrismaRequestStatus.disputed,
        [ConsultationStatus.CANCELLED]: PrismaRequestStatus.cancelled,
        [ConsultationStatus.RESPONDED]: PrismaRequestStatus.closed,
    };

    private static readonly toDomainMap: Record<PrismaRequestStatus, ConsultationStatus> = {
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

    static toPrisma(status: ConsultationStatusVO | ConsultationStatus): PrismaRequestStatus {
        const value = typeof status === 'string' ? status : status.getValue();
        return this.toPrismaMap[value as ConsultationStatus] || PrismaRequestStatus.pending;
    }

    static toDomain(prismaStatus: PrismaRequestStatus): ConsultationStatusVO {
        return ConsultationStatusVO.create(this.toDomainMap[prismaStatus]);
    }
}

class UrgencyMapper {
    private static readonly toPrismaMap: Record<string, PrismaPriority> = {
        'low': PrismaPriority.low,
        'normal': PrismaPriority.normal,
        'high': PrismaPriority.high,
        'urgent': PrismaPriority.urgent,
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
        'on_track': PrismaSLAStatus.on_track,
        'at_risk': PrismaSLAStatus.at_risk,
        'breached': PrismaSLAStatus.breached,
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

class ConsultationTypeMapper {
    private static readonly toPrismaMap: Record<string, PrismaRequestType> = {
        'consultation': PrismaRequestType.consultation,
        'legal_opinion': PrismaRequestType.legal_opinion,
        'service': PrismaRequestType.service,
        'litigation': PrismaRequestType.litigation,
        'call': PrismaRequestType.call,
    };

    private static readonly toDomainMap: Record<PrismaRequestType, string> = {
        [PrismaRequestType.consultation]: 'consultation',
        [PrismaRequestType.legal_opinion]: 'legal_opinion',
        [PrismaRequestType.service]: 'service',
        [PrismaRequestType.litigation]: 'litigation',
        [PrismaRequestType.call]: 'call',
    };

    static toPrisma(type: ConsultationTypeVO): PrismaRequestType {
        return this.toPrismaMap[type.getValue()] || PrismaRequestType.consultation;
    }

    static toDomain(prismaType: PrismaRequestType): ConsultationTypeVO {
        return ConsultationTypeVO.create(this.toDomainMap[prismaType]);
    }
}

class MessageTypeMapper {
    static toPrisma(type: MessageType): PrismaMessageType {
        const map: Record<string, PrismaMessageType> = {
            'text': PrismaMessageType.text,
            'info_request': PrismaMessageType.info_request,
            'document_request': PrismaMessageType.document_request,
            'system': PrismaMessageType.system,
        };
        return map[type] || PrismaMessageType.text;
    }

    static toDomain(prismaType: PrismaMessageType): MessageType {
        return prismaType as MessageType;
    }
}

// ============================================
// INTERFACES
// ============================================

export interface ConsultationFilters {
    subscriberId?: string;
    assignedProviderId?: string;
    status?: string | string[];
    consultationType?: string | string[];
    urgency?: string | string[];
    slaStatus?: string | string[];
    searchTerm?: string;
    submittedFrom?: Date;
    submittedTo?: Date;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

// ============================================
// MAIN REPOSITORY
// ============================================

@Injectable()
export class ConsultationRequestRepository {
    constructor(private readonly prisma: PrismaService) { }

    // ============================================
    // USE CASE 1: CREATE
    // ============================================

    async create(consultation: ConsultationRequest): Promise<ConsultationRequest> {
        const data: Prisma.ConsultationRequestCreateInput = {
            id: consultation.id.getValue(),
            requestNumber: consultation.requestNumber.getValue(),
            subscriber: { connect: { id: consultation.subscriberId?.getValue() || '' } },
            assignedProvider: consultation.assignedProviderId
                ? { connect: { id: consultation.assignedProviderId.getValue() } }
                : undefined,
            consultationType: ConsultationTypeMapper.toPrisma(consultation.consultationType),
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
            deletedAt: consultation.deletedAt,
        };

        const created = await this.prisma.consultationRequest.create({ data });
        return this.toDomain(created);
    }

    // ============================================
    // USE CASE 2: GET BY ID
    // ============================================

    async findById(id: ConsultationId): Promise<ConsultationRequest | null> {
        const result = await this.prisma.consultationRequest.findUnique({
            where: { id: id.getValue() },
        });

        return result ? this.toDomain(result) : null;
    }

    // ============================================
    // USE CASE 3: LIST WITH FILTERS & PAGINATION
    // ============================================

    async findAll(
        filters?: ConsultationFilters,
        pagination?: PaginationParams,
    ): Promise<PaginatedResult<ConsultationRequest>> {
        const where = this.buildWhereClause(filters);
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const skip = (page - 1) * limit;

        const orderBy = this.buildOrderBy(pagination);

        const [data, total] = await Promise.all([
            this.prisma.consultationRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy,
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

    // ============================================
    // USE CASE 4: ASSIGN TO PROVIDER
    // ============================================

    async assign(id: ConsultationId, providerId: UserId): Promise<ConsultationRequest> {
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

    // ============================================
    // USE CASE 5: MARK IN PROGRESS
    // USE CASE 6: COMPLETE
    // USE CASE 7: CANCEL
    // USE CASE 8: DISPUTE
    // ============================================

    async updateStatus(
        id: ConsultationId,
        status: ConsultationStatusVO,
        additionalData?: {
            respondedAt?: Date;
            completedAt?: Date;
        },
    ): Promise<ConsultationRequest> {
        const updated = await this.prisma.consultationRequest.update({
            where: { id: id.getValue() },
            data: {
                status: ConsultationStatusMapper.toPrisma(status),
                respondedAt: additionalData?.respondedAt,
                completedAt: additionalData?.completedAt,
                updatedAt: new Date(),
            },
        });

        return this.toDomain(updated);
    }

    // ============================================
    // USE CASE 9: UPLOAD DOCUMENT
    // ============================================

    async createDocument(document: Document): Promise<Document> {
        const created = await this.prisma.document.create({
            data: {
                id: document.id.getValue(),
                consultationId: document.consultationId.getValue(),
                uploadedBy: document.uploadedBy.getValue(), // Direct string assignment
                fileName: document.fileName.getValue(),
                fileUrl: document.fileUrl.getValue(),
                fileType: document.fileType,
                fileSize: document.fileSize.getBytes(),
                description: document.description,
                isVerified: document.isVerified,
                uploadedAt: document.uploadedAt,
                deletedAt: document.deletedAt,
            },
        });

        return this.toDocumentDomain(created);
    }
    // ============================================
    // USE CASE 10: SEND MESSAGE
    // ============================================

    async createMessage(message: RequestMessage): Promise<RequestMessage> {
        const created = await this.prisma.requestMessage.create({
            data: {
                id: message.id.getValue(),
                consultationId: message.consultationId.getValue(), // Direct string
                senderId: message.senderId.getValue(), // Direct string assignment
                message: message.message.getValue(),
                messageType: MessageTypeMapper.toPrisma(message.messageType),
                isRead: message.isRead,
                sentAt: message.sentAt,
                deletedAt: message.deletedAt,
            },
        });

        return this.toMessageDomain(created);
    }

    // ============================================
    // USE CASE 11: ADD RATING
    // ============================================

    async createRating(rating: RequestRating): Promise<RequestRating> {
        const created = await this.prisma.requestRating.create({
            data: {
                id: rating.id.getValue(),
                consultation: { connect: { id: rating.consultationId.getValue() } },
                subscriber: { connect: { id: rating.subscriberId.getValue() } },
                rating: rating.rating.getValue(),
                comment: rating.comment?.getValue(),
                createdAt: rating.createdAt,
            },
        });

        return this.toRatingDomain(created);
    }

    async findRatingByConsultationId(
        consultationId: ConsultationId,
    ): Promise<RequestRating | null> {
        const result = await this.prisma.requestRating.findUnique({
            where: { consultationId: consultationId.getValue() },
        });

        return result ? this.toRatingDomain(result) : null;
    }

    // ============================================
    // USE CASE 12: GET STATISTICS
    // ============================================

    async getStatistics(filters?: ConsultationFilters): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byUrgency: Record<string, number>;
        bySLAStatus: Record<string, number>;
        averageResponseTime: number;
        averageCompletionTime: number;
        slaBreachRate: number;
    }> {
        const where = this.buildWhereClause(filters);

        const total = await this.prisma.consultationRequest.count({ where });

        const statusGroups = await this.prisma.consultationRequest.groupBy({
            by: ['status'],
            where,
            _count: true,
        });

        const byStatus = statusGroups.reduce((acc, group) => {
            acc[group.status] = group._count;
            return acc;
        }, {} as Record<string, number>);

        const urgencyGroups = await this.prisma.consultationRequest.groupBy({
            by: ['urgency'],
            where,
            _count: true,
        });

        const byUrgency = urgencyGroups.reduce((acc, group) => {
            acc[group.urgency] = group._count;
            return acc;
        }, {} as Record<string, number>);

        const slaGroups = await this.prisma.consultationRequest.groupBy({
            by: ['slaStatus'],
            where,
            _count: true,
        });

        const bySLAStatus = slaGroups.reduce((acc, group) => {
            if (group.slaStatus) {
                acc[group.slaStatus] = group._count;
            }
            return acc;
        }, {} as Record<string, number>);

        const assignedRecords = await this.prisma.consultationRequest.findMany({
            where: {
                ...where,
                assignedAt: { not: null },
            },
            select: {
                submittedAt: true,
                assignedAt: true,
            },
        });

        const averageResponseTime =
            assignedRecords.length > 0
                ? assignedRecords.reduce((sum, record) => {
                    const diff = record.assignedAt!.getTime() - record.submittedAt.getTime();
                    return sum + diff / (1000 * 60 * 60);
                }, 0) / assignedRecords.length
                : 0;

        const completedRecords = await this.prisma.consultationRequest.findMany({
            where: {
                ...where,
                completedAt: { not: null },
            },
            select: {
                submittedAt: true,
                completedAt: true,
            },
        });

        const averageCompletionTime =
            completedRecords.length > 0
                ? completedRecords.reduce((sum, record) => {
                    const diff = record.completedAt!.getTime() - record.submittedAt.getTime();
                    return sum + diff / (1000 * 60 * 60);
                }, 0) / completedRecords.length
                : 0;

        const breachedCount = bySLAStatus[PrismaSLAStatus.breached] || 0;
        const slaBreachRate = total > 0 ? (breachedCount / total) * 100 : 0;

        return {
            total,
            byStatus,
            byUrgency,
            bySLAStatus,
            averageResponseTime: Math.round(averageResponseTime * 10) / 10,
            averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
            slaBreachRate: Math.round(slaBreachRate * 10) / 10,
        };
    }

    // ============================================
    // USE CASE 13: UPDATE SLA STATUSES (BATCH)
    // ============================================

    async findConsultationsNeedingSLAUpdate(): Promise<ConsultationRequest[]> {
        const records = await this.prisma.consultationRequest.findMany({
            where: {
                slaDeadline: { not: null },
                status: {
                    in: [
                        PrismaRequestStatus.pending,
                        PrismaRequestStatus.assigned,
                        PrismaRequestStatus.in_progress,
                    ],
                },
                deletedAt: null,
            },
        });

        return records.map((cr) => this.toDomain(cr));
    }

    async updateSLAStatus(
        id: ConsultationId,
        slaStatus: SLAStatus,
    ): Promise<ConsultationRequest> {
        const updated = await this.prisma.consultationRequest.update({
            where: { id: id.getValue() },
            data: {
                slaStatus: SLAStatusMapper.toPrisma(slaStatus),
                updatedAt: new Date(),
            },
        });

        return this.toDomain(updated);
    }

    // ============================================
    // HELPER METHODS FOR LIST/FILTERS
    // ============================================

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
        return this.findAll({ assignedProviderId: providerId.getValue() }, pagination);
    }

    // ============================================
    // PRIVATE MAPPING METHODS
    // ============================================

    private buildWhereClause(filters?: ConsultationFilters): Prisma.ConsultationRequestWhereInput {
        if (!filters) {
            return { deletedAt: null };
        }

        const where: Prisma.ConsultationRequestWhereInput = { deletedAt: null };

        if (filters.subscriberId) {
            where.subscriberId = filters.subscriberId;
        }

        if (filters.assignedProviderId) {
            where.assignedProviderId = filters.assignedProviderId;
        }

        if (filters.status) {
            where.status = Array.isArray(filters.status)
                ? { in: filters.status as PrismaRequestStatus[] }
                : (filters.status as PrismaRequestStatus);
        }

        if (filters.consultationType) {
            where.consultationType = Array.isArray(filters.consultationType)
                ? { in: filters.consultationType as PrismaRequestType[] }
                : (filters.consultationType as PrismaRequestType);
        }

        if (filters.urgency) {
            where.urgency = Array.isArray(filters.urgency)
                ? { in: filters.urgency as PrismaPriority[] }
                : (filters.urgency as PrismaPriority);
        }

        if (filters.slaStatus) {
            where.slaStatus = Array.isArray(filters.slaStatus)
                ? { in: filters.slaStatus as PrismaSLAStatus[] }
                : (filters.slaStatus as PrismaSLAStatus);
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

        if (filters.searchTerm) {
            where.OR = [
                { requestNumber: { contains: filters.searchTerm, mode: 'insensitive' } },
                { subject: { contains: filters.searchTerm, mode: 'insensitive' } },
                { description: { contains: filters.searchTerm, mode: 'insensitive' } },
            ];
        }

        return where;
    }

    private buildOrderBy(
        pagination?: PaginationParams,
    ): Prisma.ConsultationRequestOrderByWithRelationInput {
        if (!pagination?.sortBy) {
            return { createdAt: 'desc' };
        }

        const sortOrder = pagination.sortOrder || 'desc';
        return { [pagination.sortBy]: sortOrder };
    }

    private toDomain(data: any): ConsultationRequest {
        return ConsultationRequest.reconstitute({
            id: ConsultationId.create(data.id),
            requestNumber: RequestNumber.create(data.requestNumber),
            subscriberId: UserId.create(data.subscriberId),
            assignedProviderId: data.assignedProviderId
                ? UserId.create(data.assignedProviderId)
                : undefined,
            consultationType: ConsultationTypeMapper.toDomain(data.consultationType),
            category: data.category ? ConsultationCategory.create(data.category) : undefined,
            subject: Subject.create(data.subject),
            description: Description.create(data.description),
            urgency: UrgencyMapper.toDomain(data.urgency),
            status: ConsultationStatusMapper.toDomain(data.status),
            submittedAt: data.submittedAt,
            assignedAt: data.assignedAt,
            respondedAt: data.respondedAt,
            completedAt: data.completedAt,
            slaDeadline: data.slaDeadline,
            slaStatus: data.slaStatus ? SLAStatusMapper.toDomain(data.slaStatus) : undefined,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            deletedAt: data.deletedAt,
        });
    }

    private toDocumentDomain(data: any): Document {
        return Document.reconstitute({
            id: DocumentId.create(data.id),
            consultationId: ConsultationId.create(data.consultationId),
            uploadedBy: UserId.create(data.uploadedBy),
            fileName: FileName.create(data.fileName),
            fileUrl: FileUrl.create(data.fileUrl),
            fileType: data.fileType,
            fileSize: FileSize.create(data.fileSize),
            description: data.description,
            isVerified: data.isVerified,
            uploadedAt: data.uploadedAt,
            deletedAt: data.deletedAt,
        });
    }

    private toMessageDomain(data: any): RequestMessage {
        return RequestMessage.reconstitute({
            id: MessageId.create(data.id),
            consultationId: ConsultationId.create(data.consultationId),
            senderId: UserId.create(data.senderId),
            message: MessageContent.create(data.message),
            messageType: MessageTypeMapper.toDomain(data.messageType),
            isRead: data.isRead,
            sentAt: data.sentAt,
            deletedAt: data.deletedAt,
        });
    }

    private toRatingDomain(data: any): RequestRating {
        return RequestRating.reconstitute({
            id: RatingId.create(data.id),
            consultationId: ConsultationId.create(data.consultationId),
            subscriberId: UserId.create(data.subscriberId),
            rating: RatingValue.create(data.rating),
            comment: data.comment ? RatingComment.create(data.comment) : undefined,
            createdAt: data.createdAt,
        });
    }
}