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

    // Membership
    SUBSCRIPTION_DUE = 'SUBSCRIPTION_DUE',
    SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
    SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
    QUOTA_WARNING = 'QUOTA_WARNING',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

    // Consultation
    CONSULTATION_CREATED = 'CONSULTATION_CREATED',
    CONSULTATION_ASSIGNED = 'CONSULTATION_ASSIGNED',
    CONSULTATION_UPDATED = 'CONSULTATION_UPDATED',
    CONSULTATION_COMPLETED = 'CONSULTATION_COMPLETED',

    // Legal Opinion
    OPINION_CREATED = 'OPINION_CREATED',
    OPINION_ASSIGNED = 'OPINION_ASSIGNED',
    OPINION_STATUS_CHANGED = 'OPINION_STATUS_CHANGED',
    OPINION_COMPLETED = 'OPINION_COMPLETED',
    OPINION_REVISION_REQUESTED = 'OPINION_REVISION_REQUESTED',

    // Litigation
    CASE_CREATED = 'CASE_CREATED',
    CASE_ASSIGNED = 'CASE_ASSIGNED',
    CASE_HEARING_SCHEDULED = 'CASE_HEARING_SCHEDULED',
    CASE_UPDATED = 'CASE_UPDATED',

    // Billing
    INVOICE_GENERATED = 'INVOICE_GENERATED',
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
    ];

    if (consultationTypes.includes(type)) return 'consultation';
    if (opinionTypes.includes(type)) return 'legal_opinion';
    if (litigationTypes.includes(type)) return 'litigation';

    return null;
}
