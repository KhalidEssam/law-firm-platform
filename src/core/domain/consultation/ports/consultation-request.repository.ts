// ============================================
// CONSULTATION REQUEST - REPOSITORY INTERFACE (DOMAIN PORT)
// src/core/domain/consultation/ports/consultation-request.repository.ts
// ============================================

import {
    ConsultationRequest,
    ConsultationId,
    UserId,
    RequestNumber,
    ConsultationStatusVO,
    ConsultationStatus,
} from '../value-objects/consultation-request-domain';

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
} from '../entities/consultation-request-entities';

// ============================================
// QUERY FILTERS & PAGINATION
// ============================================

export interface PaginationParams {
    page: number;
    limit: number;
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

export interface ConsultationRequestFilters {
    subscriberId?: string;
    assignedProviderId?: string;
    category?: string;
    status?: string | string[];
    consultationType?: string | string[];
    urgency?: string | string[];
    slaStatus?: string | string[];
    submittedFrom?: Date;
    submittedTo?: Date;
    assignedFrom?: Date;
    assignedTo?: Date;
    completedFrom?: Date;
    completedTo?: Date;
    slaDeadlineFrom?: Date;
    slaDeadlineTo?: Date;
    isDeleted?: boolean;
    searchTerm?: string;
}

export interface DocumentFilters {
    consultationId?: string;
    uploadedBy?: string;
    fileType?: string;
    isVerified?: boolean;
    uploadedFrom?: Date;
    uploadedTo?: Date;
}

export interface MessageFilters {
    consultationId?: string;
    senderId?: string;
    isRead?: boolean;
    messageType?: string;
    sentFrom?: Date;
    sentTo?: Date;
}

export interface StatusHistoryFilters {
    consultationId?: string;
    toStatus?: string | string[];
    fromStatus?: string | string[];
    changedBy?: string;
    changedFrom?: Date;
    changedTo?: Date;
}

export interface CollaboratorFilters {
    consultationId?: string;
    providerUserId?: string;
    role?: string;
    status?: string;
    invitedFrom?: Date;
    invitedTo?: Date;
}

// ============================================
// MAIN REPOSITORY INTERFACE
// ============================================

/**
 * IConsultationRequestRepository
 *
 * Repository pattern interface for ConsultationRequest aggregate.
 * Defines all data access operations without implementation details.
 *
 * This is a PORT in Clean Architecture (Hexagonal Architecture)
 */
export interface IConsultationRequestRepository {
    // ============================================
    // CREATE OPERATIONS
    // ============================================

    create(consultationRequest: ConsultationRequest): Promise<ConsultationRequest>;
    createMany(consultationRequests: ConsultationRequest[]): Promise<ConsultationRequest[]>;

    // ============================================
    // READ OPERATIONS
    // ============================================

    findById(id: ConsultationId): Promise<ConsultationRequest | null>;
    findByRequestNumber(requestNumber: RequestNumber): Promise<ConsultationRequest | null>;
    findBySubscriberId(
        subscriberId: UserId,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequest>>;
    findByProviderId(
        providerId: UserId,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequest>>;
    findByStatus(
        status: ConsultationStatusVO,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequest>>;
    findSLABreached(pagination?: PaginationParams): Promise<PaginatedResult<ConsultationRequest>>;
    findSLAAtRisk(pagination?: PaginationParams): Promise<PaginatedResult<ConsultationRequest>>;
    findAll(
        filters?: ConsultationRequestFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequest>>;
    getAll(filters?: ConsultationRequestFilters): Promise<ConsultationRequest[]>;
    count(filters?: ConsultationRequestFilters): Promise<number>;
    exists(id: ConsultationId): Promise<boolean>;
    existsByRequestNumber(requestNumber: RequestNumber): Promise<boolean>;

    // ============================================
    // UPDATE OPERATIONS
    // ============================================

    update(consultationRequest: ConsultationRequest): Promise<ConsultationRequest>;
    updateMany(consultationRequests: ConsultationRequest[]): Promise<ConsultationRequest[]>;
    assign(id: ConsultationId, providerId: UserId): Promise<ConsultationRequest>;
    updateStatus(id: ConsultationId, status: ConsultationStatusVO): Promise<ConsultationRequest>;
    updateSLAStatuses(ids: ConsultationId[]): Promise<number>;

    // ============================================
    // DELETE OPERATIONS
    // ============================================

    softDelete(id: ConsultationId): Promise<boolean>;
    softDeleteMany(ids: ConsultationId[]): Promise<number>;
    restore(id: ConsultationId): Promise<ConsultationRequest>;
    hardDelete(id: ConsultationId): Promise<boolean>;
    hardDeleteMany(ids: ConsultationId[]): Promise<number>;

    // ============================================
    // AGGREGATE QUERIES
    // ============================================

    getStatistics(filters?: ConsultationRequestFilters): Promise<{
        total: number;
        byStatus: Record<ConsultationStatus, number>;
        byUrgency: Record<string, number>;
        bySLAStatus: Record<string, number>;
        averageResponseTime: number;
        averageCompletionTime: number;
        slaBreachRate: number;
    }>;
    groupByStatus(filters?: ConsultationRequestFilters): Promise<Record<ConsultationStatus, ConsultationRequest[]>>;
    findPendingOlderThan(hours: number): Promise<ConsultationRequest[]>;
    getProviderWorkload(providerId: UserId): Promise<number>;
}

// ============================================
// DOCUMENT REPOSITORY INTERFACE
// ============================================

export interface IDocumentRepository {
    create(document: Document): Promise<Document>;
    createMany(documents: Document[]): Promise<Document[]>;
    findById(id: DocumentId): Promise<Document | null>;
    findByConsultationId(consultationId: ConsultationId): Promise<Document[]>;
    findAll(filters?: DocumentFilters, pagination?: PaginationParams): Promise<PaginatedResult<Document>>;
    count(filters?: DocumentFilters): Promise<number>;
    exists(id: DocumentId): Promise<boolean>;
    update(document: Document): Promise<Document>;
    verify(id: DocumentId): Promise<Document>;
    softDelete(id: DocumentId): Promise<boolean>;
    softDeleteMany(ids: DocumentId[]): Promise<number>;
    hardDelete(id: DocumentId): Promise<boolean>;
    hardDeleteMany(ids: DocumentId[]): Promise<number>;
    getTotalSize(consultationId: ConsultationId): Promise<number>;
    countByConsultation(consultationId: ConsultationId): Promise<number>;
}

// ============================================
// MESSAGE REPOSITORY INTERFACE
// ============================================

export interface IRequestMessageRepository {
    create(message: RequestMessage): Promise<RequestMessage>;
    createMany(messages: RequestMessage[]): Promise<RequestMessage[]>;
    findById(id: MessageId): Promise<RequestMessage | null>;
    findByConsultationId(
        consultationId: ConsultationId,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<RequestMessage>>;
    findUnreadByConsultation(consultationId: ConsultationId): Promise<RequestMessage[]>;
    findAll(filters?: MessageFilters, pagination?: PaginationParams): Promise<PaginatedResult<RequestMessage>>;
    count(filters?: MessageFilters): Promise<number>;
    update(message: RequestMessage): Promise<RequestMessage>;
    markAsRead(id: MessageId): Promise<RequestMessage>;
    markAllAsRead(consultationId: ConsultationId): Promise<number>;
    softDelete(id: MessageId): Promise<boolean>;
    softDeleteMany(ids: MessageId[]): Promise<number>;
    hardDelete(id: MessageId): Promise<boolean>;
    countUnread(consultationId: ConsultationId): Promise<number>;
    getLastMessage(consultationId: ConsultationId): Promise<RequestMessage | null>;
}

// ============================================
// STATUS HISTORY REPOSITORY INTERFACE
// ============================================

export interface IRequestStatusHistoryRepository {
    create(history: RequestStatusHistory): Promise<RequestStatusHistory>;
    createMany(histories: RequestStatusHistory[]): Promise<RequestStatusHistory[]>;
    findById(id: StatusHistoryId): Promise<RequestStatusHistory | null>;
    findByConsultationId(
        consultationId: ConsultationId,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<RequestStatusHistory>>;
    findAll(
        filters?: StatusHistoryFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<RequestStatusHistory>>;
    count(filters?: StatusHistoryFilters): Promise<number>;
    getStatusTimeline(consultationId: ConsultationId): Promise<RequestStatusHistory[]>;
    getAverageTimeInStatus(status: ConsultationStatus): Promise<number>;
}

// ============================================
// RATING REPOSITORY INTERFACE
// ============================================

export interface IRequestRatingRepository {
    create(rating: RequestRating): Promise<RequestRating>;
    findById(id: RatingId): Promise<RequestRating | null>;
    findByConsultationId(consultationId: ConsultationId): Promise<RequestRating | null>;
    findBySubscriberId(
        subscriberId: UserId,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<RequestRating>>;
    exists(consultationId: ConsultationId): Promise<boolean>;
    update(rating: RequestRating): Promise<RequestRating>;
    hardDelete(id: RatingId): Promise<boolean>;
    getAverageRatingForProvider(providerId: UserId): Promise<number>;
    countRatingsByProvider(providerId: UserId): Promise<number>;
    getRatingDistribution(providerId: UserId): Promise<Record<number, number>>;
}

// ============================================
// COLLABORATOR REPOSITORY INTERFACE
// ============================================

export interface IRequestCollaboratorRepository {
    create(collaborator: RequestCollaborator): Promise<RequestCollaborator>;
    createMany(collaborators: RequestCollaborator[]): Promise<RequestCollaborator[]>;
    findById(id: CollaboratorId): Promise<RequestCollaborator | null>;
    findByConsultationId(consultationId: ConsultationId): Promise<RequestCollaborator[]>;
    findByProviderUserId(
        providerUserId: ProviderUserId,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<RequestCollaborator>>;
    findAll(
        filters?: CollaboratorFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<RequestCollaborator>>;
    exists(consultationId: ConsultationId, providerUserId: ProviderUserId): Promise<boolean>;
    update(collaborator: RequestCollaborator): Promise<RequestCollaborator>;
    accept(id: CollaboratorId): Promise<RequestCollaborator>;
    reject(id: CollaboratorId): Promise<RequestCollaborator>;
    hardDelete(id: CollaboratorId): Promise<boolean>;
    hardDeleteMany(ids: CollaboratorId[]): Promise<number>;
    countActiveCollaborators(consultationId: ConsultationId): Promise<number>;
    getCollaboratorsByRole(consultationId: ConsultationId, role: string): Promise<RequestCollaborator[]>;
}

// ============================================
// UNIT OF WORK PATTERN
// ============================================

export interface IConsultationRequestUnitOfWork {
    consultationRequests: IConsultationRequestRepository;
    documents: IDocumentRepository;
    messages: IRequestMessageRepository;
    statusHistories: IRequestStatusHistoryRepository;
    ratings: IRequestRatingRepository;
    collaborators: IRequestCollaboratorRepository;

    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    transaction<T>(work: (uow: IConsultationRequestUnitOfWork) => Promise<T>): Promise<T>;
}

// ============================================
// REPOSITORY TOKENS FOR DI
// ============================================

export const CONSULTATION_REQUEST_REPOSITORY = Symbol('CONSULTATION_REQUEST_REPOSITORY');
export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');
export const REQUEST_MESSAGE_REPOSITORY = Symbol('REQUEST_MESSAGE_REPOSITORY');
export const REQUEST_STATUS_HISTORY_REPOSITORY = Symbol('REQUEST_STATUS_HISTORY_REPOSITORY');
export const REQUEST_RATING_REPOSITORY = Symbol('REQUEST_RATING_REPOSITORY');
export const REQUEST_COLLABORATOR_REPOSITORY = Symbol('REQUEST_COLLABORATOR_REPOSITORY');
export const CONSULTATION_UNIT_OF_WORK = Symbol('CONSULTATION_UNIT_OF_WORK');
