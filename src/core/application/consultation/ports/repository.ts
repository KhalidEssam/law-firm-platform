// ============================================
// CONSULTATION REQUEST REPOSITORY - RE-EXPORT FROM DOMAIN
// src/core/application/consultation/ports/repository.ts
// ============================================
// NOTE: Repository interfaces have been moved to domain layer.
// This file re-exports for backward compatibility.
// New code should import from '@core/domain/consultation/ports'
// ============================================

export type {
    // Pagination & Filters
    PaginationParams,
    PaginatedResult,
    ConsultationRequestFilters,
    DocumentFilters,
    MessageFilters,
    StatusHistoryFilters,
    CollaboratorFilters,

    // Repository Interfaces
    IConsultationRequestRepository,
    IDocumentRepository,
    IRequestMessageRepository,
    IRequestStatusHistoryRepository,
    IRequestRatingRepository,
    IRequestCollaboratorRepository,
    IConsultationRequestUnitOfWork,
} from '../../../domain/consultation/ports/consultation-request.repository';

export {
    // DI Tokens
    CONSULTATION_REQUEST_REPOSITORY,
    DOCUMENT_REPOSITORY,
    REQUEST_MESSAGE_REPOSITORY,
    REQUEST_STATUS_HISTORY_REPOSITORY,
    REQUEST_RATING_REPOSITORY,
    REQUEST_COLLABORATOR_REPOSITORY,
    CONSULTATION_UNIT_OF_WORK,
} from '../../../domain/consultation/ports/consultation-request.repository';
