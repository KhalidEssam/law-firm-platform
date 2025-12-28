// ============================================
// AUDIT LOG REPOSITORY INTERFACE
// src/core/domain/audit/ports/audit-log.repository.ts
// ============================================

import { AuditLog, AuditEntityType } from '../entities/audit-log.entity';

/**
 * Filter options for querying audit logs
 */
export interface AuditLogFilters {
  userId?: string;
  action?: string;
  actionCategory?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  fromDate?: Date;
  toDate?: Date;
  ipAddress?: string;
}

/**
 * Pagination options
 */
export interface AuditLogPaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'action';
  orderDir?: 'asc' | 'desc';
}

/**
 * Statistics for audit logs
 */
export interface AuditLogStatistics {
  totalCount: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  byUser: { userId: string; count: number }[];
  recentActivity: {
    date: string;
    count: number;
  }[];
}

/**
 * IAuditLogRepository
 *
 * Repository interface for audit log operations.
 * Audit logs are append-only for compliance.
 */
export interface IAuditLogRepository {
  /**
   * Create a new audit log entry
   */
  create(auditLog: AuditLog): Promise<AuditLog>;

  /**
   * Create multiple audit log entries (batch)
   */
  createMany(auditLogs: AuditLog[]): Promise<AuditLog[]>;

  /**
   * Find audit log by ID
   */
  findById(id: string): Promise<AuditLog | null>;

  /**
   * Find audit logs by user ID
   */
  findByUserId(
    userId: string,
    options?: AuditLogPaginationOptions,
  ): Promise<AuditLog[]>;

  /**
   * Find audit logs by entity
   */
  findByEntity(
    entityType: AuditEntityType,
    entityId: string,
    options?: AuditLogPaginationOptions,
  ): Promise<AuditLog[]>;

  /**
   * Find audit logs by action
   */
  findByAction(
    action: string,
    options?: AuditLogPaginationOptions,
  ): Promise<AuditLog[]>;

  /**
   * List audit logs with filters and pagination
   */
  list(
    filters?: AuditLogFilters,
    options?: AuditLogPaginationOptions,
  ): Promise<{ data: AuditLog[]; total: number }>;

  /**
   * Count audit logs matching filters
   */
  count(filters?: AuditLogFilters): Promise<number>;

  /**
   * Get audit log statistics
   */
  getStatistics(filters?: AuditLogFilters): Promise<AuditLogStatistics>;

  /**
   * Get recent activity for an entity
   */
  getRecentActivityForEntity(
    entityType: AuditEntityType,
    entityId: string,
    limit?: number,
  ): Promise<AuditLog[]>;

  /**
   * Delete audit logs older than a certain date (for retention policies)
   * Returns number of deleted records
   */
  deleteOlderThan(date: Date): Promise<number>;
}

/**
 * DI Token for AuditLogRepository
 */
export const AUDIT_LOG_REPOSITORY = Symbol('IAuditLogRepository');
