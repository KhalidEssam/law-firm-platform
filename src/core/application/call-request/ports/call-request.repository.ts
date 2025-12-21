// ============================================
// CALL REQUEST REPOSITORY - RE-EXPORT FROM DOMAIN
// src/core/application/call-request/ports/call-request.repository.ts
// ============================================
// NOTE: Repository interface has been moved to domain layer.
// This file re-exports for backward compatibility.
// New code should import from '@core/domain/call-request/ports'
// ============================================

export type {
    ICallRequestRepository,
    CallRequestFilter,
    PaginationOptions,
    PaginatedResult,
} from '../../../domain/call-request/ports/call-request.repository';

export { CALL_REQUEST_REPOSITORY } from '../../../domain/call-request/ports/call-request.repository';
