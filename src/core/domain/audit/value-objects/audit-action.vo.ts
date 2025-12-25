// ============================================
// AUDIT ACTION VALUE OBJECT
// src/core/domain/audit/value-objects/audit-action.vo.ts
// ============================================

/**
 * Predefined audit action types for consistency
 */
export enum AuditActionType {
    // Authentication
    LOGIN = 'auth.login',
    LOGOUT = 'auth.logout',
    PASSWORD_CHANGE = 'auth.password_change',
    PASSWORD_RESET = 'auth.password_reset',

    // User Management
    USER_CREATE = 'user.create',
    USER_UPDATE = 'user.update',
    USER_DELETE = 'user.delete',
    USER_ROLE_ASSIGN = 'user.role_assign',
    USER_ROLE_REVOKE = 'user.role_revoke',

    // Request Operations
    REQUEST_CREATE = 'request.create',
    REQUEST_UPDATE = 'request.update',
    REQUEST_ASSIGN = 'request.assign',
    REQUEST_STATUS_CHANGE = 'request.status_change',
    REQUEST_COMPLETE = 'request.complete',
    REQUEST_CANCEL = 'request.cancel',
    REQUEST_DELETE = 'request.delete',

    // Financial Operations
    PAYMENT_INITIATE = 'payment.initiate',
    PAYMENT_COMPLETE = 'payment.complete',
    PAYMENT_FAIL = 'payment.fail',
    REFUND_REQUEST = 'refund.request',
    REFUND_APPROVE = 'refund.approve',
    REFUND_REJECT = 'refund.reject',
    REFUND_PROCESS = 'refund.process',

    // Dispute Operations
    DISPUTE_CREATE = 'dispute.create',
    DISPUTE_ESCALATE = 'dispute.escalate',
    DISPUTE_RESOLVE = 'dispute.resolve',

    // Membership Operations
    MEMBERSHIP_CREATE = 'membership.create',
    MEMBERSHIP_UPGRADE = 'membership.upgrade',
    MEMBERSHIP_DOWNGRADE = 'membership.downgrade',
    MEMBERSHIP_CANCEL = 'membership.cancel',
    MEMBERSHIP_RENEW = 'membership.renew',
    QUOTA_CONSUME = 'membership.quota_consume',
    COUPON_APPLY = 'membership.coupon_apply',

    // Provider Operations
    PROVIDER_REGISTER = 'provider.register',
    PROVIDER_VERIFY = 'provider.verify',
    PROVIDER_SUSPEND = 'provider.suspend',
    PROVIDER_ACTIVATE = 'provider.activate',

    // SLA Operations
    SLA_BREACH = 'sla.breach',
    SLA_AT_RISK = 'sla.at_risk',
    SLA_RESOLVED = 'sla.resolved',

    // Admin Operations
    ADMIN_CONFIG_CHANGE = 'admin.config_change',
    ADMIN_DATA_EXPORT = 'admin.data_export',
    ADMIN_REPORT_GENERATE = 'admin.report_generate',

    // Generic
    CUSTOM = 'custom',
}

/**
 * AuditAction Value Object
 */
export class AuditAction {
    private constructor(private readonly value: string) {}

    static create(action: AuditActionType | string): AuditAction {
        if (!action || action.trim() === '') {
            throw new Error('Audit action cannot be empty');
        }
        return new AuditAction(action);
    }

    static fromType(type: AuditActionType): AuditAction {
        return new AuditAction(type);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: AuditAction): boolean {
        return this.value === other.value;
    }

    isType(type: AuditActionType): boolean {
        return this.value === type;
    }

    getCategory(): string {
        const parts = this.value.split('.');
        return parts[0] || 'unknown';
    }
}
