// ============================================
// AUDIT DOMAIN - PUBLIC API
// src/core/domain/audit/index.ts
// ============================================

// Entities
export { AuditLog, type CreateAuditLogInput, type AuditEntityType } from './entities/audit-log.entity';

// Value Objects
export { AuditAction, AuditActionType } from './value-objects/audit-action.vo';

// Ports
export {
    type IAuditLogRepository,
    type AuditLogFilters,
    type AuditLogPaginationOptions,
    type AuditLogStatistics,
    AUDIT_LOG_REPOSITORY,
} from './ports/audit-log.repository';
