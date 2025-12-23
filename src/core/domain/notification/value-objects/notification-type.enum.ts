// ============================================
// NOTIFICATION TYPE ENUM
// src/core/domain/notification/value-objects/notification-type.enum.ts
// ============================================

/**
 * Notification event types for the legal platform
 */
export enum NotificationType {
    // Authentication
    LOGIN = 'LOGIN',
    PASSWORD_RESET = 'PASSWORD_RESET',
    ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',

    // User & Role Management
    ROLE_ASSIGNED = 'ROLE_ASSIGNED',
    ROLE_REMOVED = 'ROLE_REMOVED',
    PROFILE_UPDATED = 'PROFILE_UPDATED',

    // Membership
    SUBSCRIPTION_DUE = 'SUBSCRIPTION_DUE',
    SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
    SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
    QUOTA_WARNING = 'QUOTA_WARNING',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    MEMBERSHIP_EXPIRING = 'MEMBERSHIP_EXPIRING',
    MEMBERSHIP_EXPIRED = 'MEMBERSHIP_EXPIRED',
    MEMBERSHIP_UPGRADED = 'MEMBERSHIP_UPGRADED',
    MEMBERSHIP_DOWNGRADED = 'MEMBERSHIP_DOWNGRADED',

    // Consultation
    CONSULTATION_CREATED = 'CONSULTATION_CREATED',
    CONSULTATION_ASSIGNED = 'CONSULTATION_ASSIGNED',
    CONSULTATION_UPDATED = 'CONSULTATION_UPDATED',
    CONSULTATION_COMPLETED = 'CONSULTATION_COMPLETED',
    CONSULTATION_STATUS_CHANGE = 'CONSULTATION_STATUS_CHANGE',
    NEW_CONSULTATION_REQUEST = 'NEW_CONSULTATION_REQUEST',

    // Legal Opinion
    OPINION_CREATED = 'OPINION_CREATED',
    OPINION_ASSIGNED = 'OPINION_ASSIGNED',
    OPINION_STATUS_CHANGED = 'OPINION_STATUS_CHANGED',
    OPINION_COMPLETED = 'OPINION_COMPLETED',
    OPINION_REVISION_REQUESTED = 'OPINION_REVISION_REQUESTED',
    LEGAL_OPINION_ASSIGNED = 'LEGAL_OPINION_ASSIGNED',
    LEGAL_OPINION_COMPLETED = 'LEGAL_OPINION_COMPLETED',
    LEGAL_OPINION_STATUS_CHANGE = 'LEGAL_OPINION_STATUS_CHANGE',
    NEW_LEGAL_OPINION_REQUEST = 'NEW_LEGAL_OPINION_REQUEST',

    // Litigation Case
    CASE_CREATED = 'CASE_CREATED',
    CASE_ASSIGNED = 'CASE_ASSIGNED',
    CASE_HEARING_SCHEDULED = 'CASE_HEARING_SCHEDULED',
    CASE_UPDATED = 'CASE_UPDATED',
    CASE_QUOTE_SENT = 'CASE_QUOTE_SENT',
    CASE_QUOTE_ACCEPTED = 'CASE_QUOTE_ACCEPTED',
    CASE_PAYMENT_RECEIVED = 'CASE_PAYMENT_RECEIVED',
    CASE_ACTIVATED = 'CASE_ACTIVATED',
    CASE_CLOSED = 'CASE_CLOSED',
    CASE_CANCELLED = 'CASE_CANCELLED',
    CASE_REFUND_PROCESSED = 'CASE_REFUND_PROCESSED',

    // Billing
    INVOICE_GENERATED = 'INVOICE_GENERATED',
    INVOICE_CREATED = 'INVOICE_CREATED',
    INVOICE_PAID = 'INVOICE_PAID',
    INVOICE_OVERDUE = 'INVOICE_OVERDUE',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    REFUND_PROCESSED = 'REFUND_PROCESSED',

    // Support
    TICKET_CREATED = 'TICKET_CREATED',
    TICKET_ASSIGNED = 'TICKET_ASSIGNED',
    TICKET_RESOLVED = 'TICKET_RESOLVED',
    TICKET_REPLY = 'TICKET_REPLY',

    // Provider
    PROVIDER_VERIFIED = 'PROVIDER_VERIFIED',
    NEW_REQUEST_AVAILABLE = 'NEW_REQUEST_AVAILABLE',
    REQUEST_MESSAGE = 'REQUEST_MESSAGE',

    // Call Request
    CALL_REQUEST_CREATED = 'CALL_REQUEST_CREATED',
    CALL_REQUEST_ASSIGNED = 'CALL_REQUEST_ASSIGNED',
    CALL_SCHEDULED = 'CALL_SCHEDULED',
    CALL_RESCHEDULED = 'CALL_RESCHEDULED',
    CALL_REMINDER = 'CALL_REMINDER',
    CALL_STARTED = 'CALL_STARTED',
    CALL_COMPLETED = 'CALL_COMPLETED',
    CALL_CANCELLED = 'CALL_CANCELLED',
    CALL_NO_SHOW = 'CALL_NO_SHOW',

    // SLA
    SLA_BREACH = 'SLA_BREACH',
    SLA_WARNING = 'SLA_WARNING',
    SLA_AT_RISK = 'SLA_AT_RISK',

    // Admin
    ADMIN_ALERT = 'ADMIN_ALERT',
    ADMIN_REPORT = 'ADMIN_REPORT',

    // System
    SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
    MAINTENANCE_SCHEDULED = 'MAINTENANCE_SCHEDULED',
    EVENT = 'EVENT',
}

/**
 * Get related entity type for a notification type
 */
export function getRelatedEntityType(type: NotificationType): string | null {
    const consultationTypes = [
        NotificationType.CONSULTATION_CREATED,
        NotificationType.CONSULTATION_ASSIGNED,
        NotificationType.CONSULTATION_UPDATED,
        NotificationType.CONSULTATION_COMPLETED,
    ];

    const opinionTypes = [
        NotificationType.OPINION_CREATED,
        NotificationType.OPINION_ASSIGNED,
        NotificationType.OPINION_STATUS_CHANGED,
        NotificationType.OPINION_COMPLETED,
        NotificationType.OPINION_REVISION_REQUESTED,
    ];

    const litigationTypes = [
        NotificationType.CASE_CREATED,
        NotificationType.CASE_ASSIGNED,
        NotificationType.CASE_HEARING_SCHEDULED,
        NotificationType.CASE_UPDATED,
        NotificationType.CASE_QUOTE_SENT,
        NotificationType.CASE_QUOTE_ACCEPTED,
        NotificationType.CASE_PAYMENT_RECEIVED,
        NotificationType.CASE_ACTIVATED,
        NotificationType.CASE_CLOSED,
        NotificationType.CASE_CANCELLED,
        NotificationType.CASE_REFUND_PROCESSED,
    ];

    const callRequestTypes = [
        NotificationType.CALL_REQUEST_CREATED,
        NotificationType.CALL_REQUEST_ASSIGNED,
        NotificationType.CALL_SCHEDULED,
        NotificationType.CALL_RESCHEDULED,
        NotificationType.CALL_REMINDER,
        NotificationType.CALL_STARTED,
        NotificationType.CALL_COMPLETED,
        NotificationType.CALL_CANCELLED,
        NotificationType.CALL_NO_SHOW,
    ];

    if (consultationTypes.includes(type)) return 'consultation';
    if (opinionTypes.includes(type)) return 'legal_opinion';
    if (litigationTypes.includes(type)) return 'litigation';
    if (callRequestTypes.includes(type)) return 'call_request';

    return null;
}
