// ============================================
// AUDIT LOGGING SERVICE
// src/core/application/audit/audit-logging.service.ts
// ============================================

import { Injectable, Inject, Logger } from '@nestjs/common';
import {
    AuditLog,
    AuditActionType,
    AuditEntityType,
    type IAuditLogRepository,
    AUDIT_LOG_REPOSITORY,
    AuditLogFilters,
    AuditLogPaginationOptions,
    AuditLogStatistics,
} from '../../domain/audit';

/**
 * Context information for audit logging
 */
export interface AuditContext {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Options for creating an audit log entry
 */
export interface LogAuditOptions {
    action: AuditActionType | string;
    entityType?: AuditEntityType;
    entityId?: string;
    details?: Record<string, unknown>;
    context?: AuditContext;
}

/**
 * AuditLoggingService
 *
 * Provides a convenient interface for logging audit events across the application.
 * Handles async logging to avoid blocking main operations.
 */
@Injectable()
export class AuditLoggingService {
    private readonly logger = new Logger(AuditLoggingService.name);

    constructor(
        @Inject(AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: IAuditLogRepository,
    ) {}

    // ============================================
    // LOGGING METHODS
    // ============================================

    /**
     * Log an audit event (fire-and-forget, non-blocking)
     */
    log(options: LogAuditOptions): void {
        this.logAsync(options).catch(error => {
            this.logger.error(`Failed to log audit event: ${error.message}`, error.stack);
        });
    }

    /**
     * Log an audit event and wait for completion
     */
    async logAsync(options: LogAuditOptions): Promise<AuditLog> {
        const auditLog = AuditLog.create({
            userId: options.context?.userId,
            action: options.action,
            entityType: options.entityType,
            entityId: options.entityId,
            details: options.details,
            ipAddress: options.context?.ipAddress,
            userAgent: options.context?.userAgent,
        });

        return await this.auditLogRepository.create(auditLog);
    }

    /**
     * Log multiple audit events in batch
     */
    async logBatch(events: LogAuditOptions[]): Promise<AuditLog[]> {
        const auditLogs = events.map(options =>
            AuditLog.create({
                userId: options.context?.userId,
                action: options.action,
                entityType: options.entityType,
                entityId: options.entityId,
                details: options.details,
                ipAddress: options.context?.ipAddress,
                userAgent: options.context?.userAgent,
            }),
        );

        return await this.auditLogRepository.createMany(auditLogs);
    }

    // ============================================
    // CONVENIENCE METHODS FOR COMMON OPERATIONS
    // ============================================

    /**
     * Log a request creation
     */
    logRequestCreate(
        entityType: AuditEntityType,
        entityId: string,
        details: Record<string, unknown>,
        context?: AuditContext,
    ): void {
        this.log({
            action: AuditActionType.REQUEST_CREATE,
            entityType,
            entityId,
            details,
            context,
        });
    }

    /**
     * Log a request status change
     */
    logStatusChange(
        entityType: AuditEntityType,
        entityId: string,
        fromStatus: string,
        toStatus: string,
        reason?: string,
        context?: AuditContext,
    ): void {
        this.log({
            action: AuditActionType.REQUEST_STATUS_CHANGE,
            entityType,
            entityId,
            details: { fromStatus, toStatus, reason },
            context,
        });
    }

    /**
     * Log a payment operation
     */
    logPayment(
        action: 'initiate' | 'complete' | 'fail',
        entityType: AuditEntityType,
        entityId: string,
        amount: number,
        details?: Record<string, unknown>,
        context?: AuditContext,
    ): void {
        const actionMap = {
            initiate: AuditActionType.PAYMENT_INITIATE,
            complete: AuditActionType.PAYMENT_COMPLETE,
            fail: AuditActionType.PAYMENT_FAIL,
        };

        this.log({
            action: actionMap[action],
            entityType,
            entityId,
            details: { amount, ...details },
            context,
        });
    }

    /**
     * Log a refund operation
     */
    logRefund(
        action: 'request' | 'approve' | 'reject' | 'process',
        refundId: string,
        amount: number,
        details?: Record<string, unknown>,
        context?: AuditContext,
    ): void {
        const actionMap = {
            request: AuditActionType.REFUND_REQUEST,
            approve: AuditActionType.REFUND_APPROVE,
            reject: AuditActionType.REFUND_REJECT,
            process: AuditActionType.REFUND_PROCESS,
        };

        this.log({
            action: actionMap[action],
            entityType: 'refund',
            entityId: refundId,
            details: { amount, ...details },
            context,
        });
    }

    /**
     * Log a user role change
     */
    logRoleChange(
        action: 'assign' | 'revoke',
        userId: string,
        role: string,
        details?: Record<string, unknown>,
        context?: AuditContext,
    ): void {
        this.log({
            action: action === 'assign'
                ? AuditActionType.USER_ROLE_ASSIGN
                : AuditActionType.USER_ROLE_REVOKE,
            entityType: 'user',
            entityId: userId,
            details: { role, ...details },
            context,
        });
    }

    /**
     * Log a membership operation
     */
    logMembership(
        action: 'create' | 'upgrade' | 'downgrade' | 'cancel' | 'renew',
        membershipId: string,
        details?: Record<string, unknown>,
        context?: AuditContext,
    ): void {
        const actionMap = {
            create: AuditActionType.MEMBERSHIP_CREATE,
            upgrade: AuditActionType.MEMBERSHIP_UPGRADE,
            downgrade: AuditActionType.MEMBERSHIP_DOWNGRADE,
            cancel: AuditActionType.MEMBERSHIP_CANCEL,
            renew: AuditActionType.MEMBERSHIP_RENEW,
        };

        this.log({
            action: actionMap[action],
            entityType: 'membership',
            entityId: membershipId,
            details,
            context,
        });
    }

    /**
     * Log an SLA event
     */
    logSLAEvent(
        event: 'breach' | 'at_risk' | 'resolved',
        entityType: AuditEntityType,
        entityId: string,
        details?: Record<string, unknown>,
        context?: AuditContext,
    ): void {
        const actionMap = {
            breach: AuditActionType.SLA_BREACH,
            at_risk: AuditActionType.SLA_AT_RISK,
            resolved: AuditActionType.SLA_RESOLVED,
        };

        this.log({
            action: actionMap[event],
            entityType,
            entityId,
            details,
            context,
        });
    }

    /**
     * Log an admin operation
     */
    logAdminAction(
        action: 'config_change' | 'data_export' | 'report_generate',
        details: Record<string, unknown>,
        context?: AuditContext,
    ): void {
        const actionMap = {
            config_change: AuditActionType.ADMIN_CONFIG_CHANGE,
            data_export: AuditActionType.ADMIN_DATA_EXPORT,
            report_generate: AuditActionType.ADMIN_REPORT_GENERATE,
        };

        this.log({
            action: actionMap[action],
            entityType: 'system',
            details,
            context,
        });
    }

    // ============================================
    // QUERY METHODS
    // ============================================

    /**
     * Get audit logs for an entity
     */
    async getEntityAuditTrail(
        entityType: AuditEntityType,
        entityId: string,
        options?: AuditLogPaginationOptions,
    ): Promise<AuditLog[]> {
        return this.auditLogRepository.findByEntity(entityType, entityId, options);
    }

    /**
     * Get audit logs for a user
     */
    async getUserAuditTrail(
        userId: string,
        options?: AuditLogPaginationOptions,
    ): Promise<AuditLog[]> {
        return this.auditLogRepository.findByUserId(userId, options);
    }

    /**
     * Search audit logs
     */
    async search(
        filters: AuditLogFilters,
        options?: AuditLogPaginationOptions,
    ): Promise<{ data: AuditLog[]; total: number }> {
        return this.auditLogRepository.list(filters, options);
    }

    /**
     * Get audit statistics
     */
    async getStatistics(filters?: AuditLogFilters): Promise<AuditLogStatistics> {
        return this.auditLogRepository.getStatistics(filters);
    }
}

/**
 * DI Token for AuditLoggingService
 */
export const AUDIT_LOGGING_SERVICE = Symbol('AuditLoggingService');
