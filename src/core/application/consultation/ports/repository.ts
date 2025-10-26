// ============================================
// CONSULTATION REQUEST - REPOSITORY INTERFACE (PORT)
// Domain Layer - Defines contracts for data access
// ============================================

import {
    ConsultationRequest,
    ConsultationId,
    UserId,
    RequestNumber,
    ConsultationStatusVO,
    ConsultationStatus,
    Urgency,
    SLAStatus,
} from '../../../domain/consultation/valeo-objects/consultation-request-domain';

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
} from '../../../domain/consultation/entities/consultation-request-entities';

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
    status?: string | string[];              // ✅ Accepts strings from API
    consultationType?: string | string[];    // ✅ Accepts strings from API
    urgency?: string | string[];             // ✅ Accepts strings from API
    slaStatus?: string | string[];           // ✅ Accepts strings from API 
    submittedFrom?: Date;
    submittedTo?: Date;
    assignedFrom?: Date;
    assignedTo?: Date;
    completedFrom?: Date;
    completedTo?: Date;
    slaDeadlineFrom?: Date;
    slaDeadlineTo?: Date;
    isDeleted?: boolean;
    searchTerm?: string; // Search in subject, description, requestNumber
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

    /**
     * Save a new consultation request
     * @param consultationRequest - The consultation request to create
     * @returns Promise resolving to the created consultation request
     */
    create(consultationRequest: ConsultationRequest): Promise<ConsultationRequest>;

    /**
     * Save multiple consultation requests in bulk
     * @param consultationRequests - Array of consultation requests to create
     * @returns Promise resolving to array of created consultation requests
     */
    createMany(consultationRequests: ConsultationRequest[]): Promise<ConsultationRequest[]>;

    // ============================================
    // READ OPERATIONS
    // ============================================

    /**
     * Find a consultation request by its ID
     * @param id - The consultation ID
     * @returns Promise resolving to the consultation request or null if not found
     */
    findById(id: ConsultationId): Promise<ConsultationRequest | null>;

    /**
     * Find a consultation request by request number
     * @param requestNumber - The request number (e.g., CR-20250123-0001)
     * @returns Promise resolving to the consultation request or null if not found
     */
    findByRequestNumber(requestNumber: RequestNumber): Promise<ConsultationRequest | null>;

    /**
     * Find all consultation requests by subscriber ID
     * @param subscriberId - The subscriber user ID
     * @param pagination - Pagination parameters
     * @returns Promise resolving to paginated consultation requests
     */
    findBySubscriberId(
        subscriberId: UserId,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequest>>;

    /**
     * Find all consultation requests assigned to a provider
     * @param providerId - The provider user ID
     * @param pagination - Pagination parameters
     * @returns Promise resolving to paginated consultation requests
     */
    findByProviderId(
        providerId: UserId,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequest>>;

    /**
     * Find consultation requests by status
     * @param status - The consultation status
     * @param pagination - Pagination parameters
     * @returns Promise resolving to paginated consultation requests
     */
    findByStatus(
        status: ConsultationStatusVO,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequest>>;

    /**
     * Find consultation requests with SLA breach
     * @param pagination - Pagination parameters
     * @returns Promise resolving to paginated consultation requests
     */
    findSLABreached(
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequest>>;

    /**
     * Find consultation requests at risk of SLA breach
     * @param pagination - Pagination parameters
     * @returns Promise resolving to paginated consultation requests
     */
    findSLAAtRisk(
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequest>>;

    /**
     * Find all consultation requests matching the filters
     * @param filters - Query filters
     * @param pagination - Pagination parameters
     * @returns Promise resolving to paginated consultation requests
     */
    findAll(
        filters?: ConsultationRequestFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequest>>;

    /**
     * Get all consultation requests (without pagination)
     * Warning: Use with caution on large datasets
     * @param filters - Query filters
     * @returns Promise resolving to array of consultation requests
     */
    getAll(filters?: ConsultationRequestFilters): Promise<ConsultationRequest[]>;

    /**
     * Count consultation requests matching filters
     * @param filters - Query filters
     * @returns Promise resolving to the count
     */
    count(filters?: ConsultationRequestFilters): Promise<number>;

    /**
     * Check if a consultation request exists by ID
     * @param id - The consultation ID
     * @returns Promise resolving to boolean
     */
    exists(id: ConsultationId): Promise<boolean>;

    /**
     * Check if a request number already exists
     * @param requestNumber - The request number to check
     * @returns Promise resolving to boolean
     */
    existsByRequestNumber(requestNumber: RequestNumber): Promise<boolean>;

    // ============================================
    // UPDATE OPERATIONS
    // ============================================

    /**
     * Update an existing consultation request
     * @param consultationRequest - The consultation request to update
     * @returns Promise resolving to the updated consultation request
     */
    update(consultationRequest: ConsultationRequest): Promise<ConsultationRequest>;

    /**
     * Update multiple consultation requests in bulk
     * @param consultationRequests - Array of consultation requests to update
     * @returns Promise resolving to array of updated consultation requests
     */
    updateMany(consultationRequests: ConsultationRequest[]): Promise<ConsultationRequest[]>;

    /**
     * Assign a consultation request to a provider
     * @param id - The consultation ID
     * @param providerId - The provider user ID
     * @returns Promise resolving to the updated consultation request
     */
    assign(id: ConsultationId, providerId: UserId): Promise<ConsultationRequest>;

    /**
     * Update the status of a consultation request
     * @param id - The consultation ID
     * @param status - The new status
     * @returns Promise resolving to the updated consultation request
     */
    updateStatus(id: ConsultationId, status: ConsultationStatusVO): Promise<ConsultationRequest>;

    /**
     * Update SLA status for consultation requests
     * @param ids - Array of consultation IDs to update
     * @returns Promise resolving to number of updated records
     */
    updateSLAStatuses(ids: ConsultationId[]): Promise<number>;

    // ============================================
    // DELETE OPERATIONS
    // ============================================

    /**
     * Soft delete a consultation request
     * @param id - The consultation ID
     * @returns Promise resolving to boolean indicating success
     */
    softDelete(id: ConsultationId): Promise<boolean>;

    /**
     * Soft delete multiple consultation requests
     * @param ids - Array of consultation IDs
     * @returns Promise resolving to number of deleted records
     */
    softDeleteMany(ids: ConsultationId[]): Promise<number>;

    /**
     * Restore a soft-deleted consultation request
     * @param id - The consultation ID
     * @returns Promise resolving to the restored consultation request
     */
    restore(id: ConsultationId): Promise<ConsultationRequest>;

    /**
     * Permanently delete a consultation request (hard delete)
     * Warning: This cannot be undone
     * @param id - The consultation ID
     * @returns Promise resolving to boolean indicating success
     */
    hardDelete(id: ConsultationId): Promise<boolean>;

    /**
     * Permanently delete multiple consultation requests (hard delete)
     * Warning: This cannot be undone
     * @param ids - Array of consultation IDs
     * @returns Promise resolving to number of deleted records
     */
    hardDeleteMany(ids: ConsultationId[]): Promise<number>;

    // ============================================
    // AGGREGATE QUERIES
    // ============================================

    /**
     * Get statistics for consultation requests
     * @param filters - Query filters
     * @returns Promise resolving to statistics object
     */
    getStatistics(filters?: ConsultationRequestFilters): Promise<{
        total: number;
        byStatus: Record<ConsultationStatus, number>;
        byUrgency: Record<string, number>;
        bySLAStatus: Record<string, number>;
        averageResponseTime: number; // in hours
        averageCompletionTime: number; // in hours
        slaBreachRate: number; // percentage
    }>;

    /**
     * Get consultation requests grouped by status
     * @param filters - Query filters
     * @returns Promise resolving to grouped results
     */
    groupByStatus(
        filters?: ConsultationRequestFilters
    ): Promise<Record<ConsultationStatus, ConsultationRequest[]>>;

    /**
     * Get pending requests older than X hours
     * @param hours - Number of hours
     * @returns Promise resolving to array of consultation requests
     */
    findPendingOlderThan(hours: number): Promise<ConsultationRequest[]>;

    /**
     * Get provider workload (number of active requests)
     * @param providerId - The provider user ID
     * @returns Promise resolving to workload count
     */
    getProviderWorkload(providerId: UserId): Promise<number>;
}

// ============================================
// DOCUMENT REPOSITORY INTERFACE
// ============================================

export interface IDocumentRepository {
    // CREATE
    create(document: Document): Promise<Document>;
    createMany(documents: Document[]): Promise<Document[]>;

    // READ
    findById(id: DocumentId): Promise<Document | null>;
    findByConsultationId(consultationId: ConsultationId): Promise<Document[]>;
    findAll(
        filters?: DocumentFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<Document>>;
    count(filters?: DocumentFilters): Promise<number>;
    exists(id: DocumentId): Promise<boolean>;

    // UPDATE
    update(document: Document): Promise<Document>;
    verify(id: DocumentId): Promise<Document>;

    // DELETE
    softDelete(id: DocumentId): Promise<boolean>;
    softDeleteMany(ids: DocumentId[]): Promise<number>;
    hardDelete(id: DocumentId): Promise<boolean>;
    hardDeleteMany(ids: DocumentId[]): Promise<number>;

    // AGGREGATE
    getTotalSize(consultationId: ConsultationId): Promise<number>;
    countByConsultation(consultationId: ConsultationId): Promise<number>;
}

// ============================================
// MESSAGE REPOSITORY INTERFACE
// ============================================

export interface IRequestMessageRepository {
    // CREATE
    create(message: RequestMessage): Promise<RequestMessage>;
    createMany(messages: RequestMessage[]): Promise<RequestMessage[]>;

    // READ
    findById(id: MessageId): Promise<RequestMessage | null>;
    findByConsultationId(
        consultationId: ConsultationId,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<RequestMessage>>;
    findUnreadByConsultation(consultationId: ConsultationId): Promise<RequestMessage[]>;
    findAll(
        filters?: MessageFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<RequestMessage>>;
    count(filters?: MessageFilters): Promise<number>;

    // UPDATE
    update(message: RequestMessage): Promise<RequestMessage>;
    markAsRead(id: MessageId): Promise<RequestMessage>;
    markAllAsRead(consultationId: ConsultationId): Promise<number>;

    // DELETE
    softDelete(id: MessageId): Promise<boolean>;
    softDeleteMany(ids: MessageId[]): Promise<number>;
    hardDelete(id: MessageId): Promise<boolean>;

    // AGGREGATE
    countUnread(consultationId: ConsultationId): Promise<number>;
    getLastMessage(consultationId: ConsultationId): Promise<RequestMessage | null>;
}

// ============================================
// STATUS HISTORY REPOSITORY INTERFACE
// ============================================

export interface IRequestStatusHistoryRepository {
    // CREATE
    create(history: RequestStatusHistory): Promise<RequestStatusHistory>;
    createMany(histories: RequestStatusHistory[]): Promise<RequestStatusHistory[]>;

    // READ
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

    // AGGREGATE
    getStatusTimeline(consultationId: ConsultationId): Promise<RequestStatusHistory[]>;
    getAverageTimeInStatus(status: ConsultationStatus): Promise<number>; // in hours
}

// ============================================
// RATING REPOSITORY INTERFACE
// ============================================

export interface IRequestRatingRepository {
    // CREATE
    create(rating: RequestRating): Promise<RequestRating>;

    // READ
    findById(id: RatingId): Promise<RequestRating | null>;
    findByConsultationId(consultationId: ConsultationId): Promise<RequestRating | null>;
    findBySubscriberId(
        subscriberId: UserId,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<RequestRating>>;
    exists(consultationId: ConsultationId): Promise<boolean>;

    // UPDATE
    update(rating: RequestRating): Promise<RequestRating>;

    // DELETE
    hardDelete(id: RatingId): Promise<boolean>;

    // AGGREGATE
    getAverageRatingForProvider(providerId: UserId): Promise<number>;
    countRatingsByProvider(providerId: UserId): Promise<number>;
    getRatingDistribution(providerId: UserId): Promise<Record<number, number>>;
}

// ============================================
// COLLABORATOR REPOSITORY INTERFACE
// ============================================

export interface IRequestCollaboratorRepository {
    // CREATE
    create(collaborator: RequestCollaborator): Promise<RequestCollaborator>;
    createMany(collaborators: RequestCollaborator[]): Promise<RequestCollaborator[]>;

    // READ
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

    // UPDATE
    update(collaborator: RequestCollaborator): Promise<RequestCollaborator>;
    accept(id: CollaboratorId): Promise<RequestCollaborator>;
    reject(id: CollaboratorId): Promise<RequestCollaborator>;

    // DELETE
    hardDelete(id: CollaboratorId): Promise<boolean>;
    hardDeleteMany(ids: CollaboratorId[]): Promise<number>;

    // AGGREGATE
    countActiveCollaborators(consultationId: ConsultationId): Promise<number>;
    getCollaboratorsByRole(
        consultationId: ConsultationId,
        role: string
    ): Promise<RequestCollaborator[]>;
}

// ============================================
// UNIT OF WORK PATTERN (Optional but Recommended)
// ============================================

/**
 * IConsultationRequestUnitOfWork
 * 
 * Implements Unit of Work pattern for transaction management.
 * Ensures all operations within a transaction succeed or fail together.
 */
export interface IConsultationRequestUnitOfWork {
    consultationRequests: IConsultationRequestRepository;
    documents: IDocumentRepository;
    messages: IRequestMessageRepository;
    statusHistories: IRequestStatusHistoryRepository;
    ratings: IRequestRatingRepository;
    collaborators: IRequestCollaboratorRepository;

    /**
     * Begin a new transaction
     */
    begin(): Promise<void>;

    /**
     * Commit the current transaction
     */
    commit(): Promise<void>;

    /**
     * Rollback the current transaction
     */
    rollback(): Promise<void>;

    /**
     * Execute operations within a transaction
     * @param work - Function containing the operations to execute
     * @returns Promise resolving to the result of the work function
     */
    transaction<T>(work: (uow: IConsultationRequestUnitOfWork) => Promise<T>): Promise<T>;
}