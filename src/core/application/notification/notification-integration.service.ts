// ============================================
// NOTIFICATION INTEGRATION SERVICE
// src/core/application/notification/notification-integration.service.ts
// ============================================
// This service provides an easy-to-use interface for triggering notifications
// from other modules. It wraps the notification use cases and provides
// domain-specific methods for common notification scenarios.
// ============================================

import { Injectable, Inject, Optional } from '@nestjs/common';
import { SendNotificationUseCase, SendTemplatedNotificationUseCase } from './use-cases/notification.use-cases';
import { NotificationType } from '../../domain/notification/value-objects/notification-type.enum';
import { NotificationChannel } from '../../domain/notification/value-objects/notification-channel.enum';
import { Notification } from '../../domain/notification/entities/notification.entity';

// ============================================
// NOTIFICATION PAYLOADS
// ============================================

export interface RoleAssignmentNotificationPayload {
    userId: string;
    userEmail?: string;
    roleName: string;
    assignedBy?: string;
}

export interface RoleRemovalNotificationPayload {
    userId: string;
    userEmail?: string;
    roleName: string;
    removedBy?: string;
}

export interface ProfileUpdateNotificationPayload {
    userId: string;
    userEmail?: string;
    updatedFields: string[];
}

export interface ConsultationAssignedNotificationPayload {
    consultationId: string;
    consultationNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId: string;
    providerEmail?: string;
    subject: string;
}

export interface ConsultationCompletedNotificationPayload {
    consultationId: string;
    consultationNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    subject: string;
}

export interface ConsultationStatusChangeNotificationPayload {
    consultationId: string;
    consultationNumber: string;
    userId: string;
    userEmail?: string;
    oldStatus: string;
    newStatus: string;
    subject: string;
}

export interface LegalOpinionAssignedNotificationPayload {
    opinionId: string;
    opinionNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    lawyerId: string;
    lawyerEmail?: string;
    subject: string;
}

export interface LegalOpinionCompletedNotificationPayload {
    opinionId: string;
    opinionNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    subject: string;
}

export interface LegalOpinionStatusChangeNotificationPayload {
    opinionId: string;
    opinionNumber: string;
    userId: string;
    userEmail?: string;
    oldStatus: string;
    newStatus: string;
    subject: string;
}

// ============================================
// LITIGATION CASE NOTIFICATION PAYLOADS
// ============================================

export interface LitigationCaseCreatedNotificationPayload {
    caseId: string;
    caseNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    caseType: string;
    title: string;
}

export interface LitigationCaseAssignedNotificationPayload {
    caseId: string;
    caseNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId: string;
    providerEmail?: string;
    caseType: string;
    title: string;
}

export interface LitigationCaseQuoteSentNotificationPayload {
    caseId: string;
    caseNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    caseType: string;
    title: string;
    quoteAmount: number;
    currency: string;
    validUntil: Date;
}

export interface LitigationCaseQuoteAcceptedNotificationPayload {
    caseId: string;
    caseNumber: string;
    providerId: string;
    providerEmail?: string;
    caseType: string;
    title: string;
    quoteAmount: number;
    currency: string;
}

export interface LitigationCasePaymentReceivedNotificationPayload {
    caseId: string;
    caseNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId?: string;
    providerEmail?: string;
    amount: number;
    currency: string;
}

export interface LitigationCaseActivatedNotificationPayload {
    caseId: string;
    caseNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    caseType: string;
    title: string;
}

export interface LitigationCaseClosedNotificationPayload {
    caseId: string;
    caseNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    caseType: string;
    title: string;
}

export interface LitigationCaseCancelledNotificationPayload {
    caseId: string;
    caseNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId?: string;
    providerEmail?: string;
    reason?: string;
}

export interface LitigationCaseRefundNotificationPayload {
    caseId: string;
    caseNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    refundAmount: number;
    currency: string;
}

// ============================================
// CALL REQUEST NOTIFICATION PAYLOADS
// ============================================

export interface CallRequestCreatedNotificationPayload {
    callRequestId: string;
    requestNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    purpose: string;
    preferredDate?: Date;
}

export interface CallRequestAssignedNotificationPayload {
    callRequestId: string;
    requestNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId: string;
    providerEmail?: string;
    purpose: string;
}

export interface CallScheduledNotificationPayload {
    callRequestId: string;
    requestNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId: string;
    providerEmail?: string;
    scheduledAt: Date;
    durationMinutes: number;
    callLink?: string;
}

export interface CallRescheduledNotificationPayload {
    callRequestId: string;
    requestNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId: string;
    providerEmail?: string;
    oldScheduledAt: Date;
    newScheduledAt: Date;
    reason?: string;
}

export interface CallReminderNotificationPayload {
    callRequestId: string;
    requestNumber: string;
    userId: string;
    userEmail?: string;
    scheduledAt: Date;
    minutesUntilCall: number;
    callLink?: string;
}

export interface CallCompletedNotificationPayload {
    callRequestId: string;
    requestNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    durationMinutes: number;
}

export interface CallCancelledNotificationPayload {
    callRequestId: string;
    requestNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId?: string;
    providerEmail?: string;
    cancelledBy: 'subscriber' | 'provider' | 'system';
    reason?: string;
}

export interface CallNoShowNotificationPayload {
    callRequestId: string;
    requestNumber: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId: string;
    providerEmail?: string;
    scheduledAt: Date;
}

export interface QuotaWarningNotificationPayload {
    userId: string;
    userEmail?: string;
    resourceType: string;
    currentUsage: number;
    limit: number;
    percentageUsed: number;
}

export interface QuotaExceededNotificationPayload {
    userId: string;
    userEmail?: string;
    resourceType: string;
    limit: number;
}

export interface MembershipExpiringNotificationPayload {
    userId: string;
    userEmail?: string;
    membershipId: string;
    tierName: string;
    expirationDate: Date;
    daysRemaining: number;
}

export interface MembershipExpiredNotificationPayload {
    userId: string;
    userEmail?: string;
    membershipId: string;
    tierName: string;
}

export interface MembershipTierChangeNotificationPayload {
    userId: string;
    userEmail?: string;
    membershipId: string;
    oldTierName: string;
    newTierName: string;
    isUpgrade: boolean;
}

export interface InvoiceCreatedNotificationPayload {
    userId: string;
    userEmail?: string;
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: Date;
}

export interface InvoicePaidNotificationPayload {
    userId: string;
    userEmail?: string;
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    paidAt: Date;
}

export interface InvoiceOverdueNotificationPayload {
    userId: string;
    userEmail?: string;
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: Date;
    daysOverdue: number;
}

export interface PaymentSuccessNotificationPayload {
    userId: string;
    userEmail?: string;
    transactionId: string;
    amount: number;
    currency: string;
    description?: string;
}

export interface PaymentFailedNotificationPayload {
    userId: string;
    userEmail?: string;
    transactionId?: string;
    amount: number;
    currency: string;
    reason?: string;
}

export interface RefundProcessedNotificationPayload {
    userId: string;
    userEmail?: string;
    refundId: string;
    originalTransactionId: string;
    amount: number;
    currency: string;
    reason?: string;
}

// ============================================
// SLA NOTIFICATION PAYLOADS
// ============================================

export interface SLABreachNotificationPayload {
    requestId: string;
    requestNumber: string;
    requestType: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId?: string;
    providerEmail?: string;
    slaDeadline: Date;
    breachedAt: Date;
}

export interface SLAAtRiskNotificationPayload {
    requestId: string;
    requestNumber: string;
    requestType: string;
    subscriberId: string;
    subscriberEmail?: string;
    providerId?: string;
    providerEmail?: string;
    slaDeadline: Date;
    hoursRemaining: number;
}

export interface SLADailyReportNotificationPayload {
    adminUserId: string;
    adminEmail?: string;
    reportDate: Date;
    summary: {
        totalActive: number;
        breached: number;
        atRisk: number;
        onTrack: number;
    };
    byRequestType: Record<string, {
        total: number;
        breached: number;
        atRisk: number;
        onTrack: number;
    }>;
}

// ============================================
// NOTIFICATION INTEGRATION SERVICE
// ============================================

@Injectable()
export class NotificationIntegrationService {
    constructor(
        @Optional()
        private readonly sendNotificationUseCase: SendNotificationUseCase,
        @Optional()
        private readonly sendTemplatedNotificationUseCase: SendTemplatedNotificationUseCase,
    ) {}

    // ============================================
    // USER & ROLE NOTIFICATIONS
    // ============================================

    async notifyRoleAssigned(payload: RoleAssignmentNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.ROLE_ASSIGNED,
                title: 'New Role Assigned',
                titleAr: 'تم تعيين دور جديد',
                message: `You have been assigned the role "${payload.roleName}"${payload.assignedBy ? ` by ${payload.assignedBy}` : ''}.`,
                messageAr: `تم تعيين دور "${payload.roleName}" لك${payload.assignedBy ? ` بواسطة ${payload.assignedBy}` : ''}.`,
                relatedEntityType: 'Role',
                relatedEntityId: payload.roleName,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send role assignment notification:', error);
            return null;
        }
    }

    async notifyRoleRemoved(payload: RoleRemovalNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.ROLE_REMOVED,
                title: 'Role Removed',
                titleAr: 'تم إزالة الدور',
                message: `The role "${payload.roleName}" has been removed from your account${payload.removedBy ? ` by ${payload.removedBy}` : ''}.`,
                messageAr: `تم إزالة دور "${payload.roleName}" من حسابك${payload.removedBy ? ` بواسطة ${payload.removedBy}` : ''}.`,
                relatedEntityType: 'Role',
                relatedEntityId: payload.roleName,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send role removal notification:', error);
            return null;
        }
    }

    async notifyProfileUpdated(payload: ProfileUpdateNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const fieldsText = payload.updatedFields.join(', ');
            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.PROFILE_UPDATED,
                title: 'Profile Updated',
                titleAr: 'تم تحديث الملف الشخصي',
                message: `Your profile has been updated. Updated fields: ${fieldsText}.`,
                messageAr: `تم تحديث ملفك الشخصي. الحقول المحدثة: ${fieldsText}.`,
                relatedEntityType: 'User',
                relatedEntityId: payload.userId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send profile update notification:', error);
            return null;
        }
    }

    // ============================================
    // CONSULTATION NOTIFICATIONS
    // ============================================

    async notifyConsultationAssignedToSubscriber(payload: ConsultationAssignedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CONSULTATION_ASSIGNED,
                title: 'Consultation Assigned',
                titleAr: 'تم تعيين الاستشارة',
                message: `Your consultation request #${payload.consultationNumber} "${payload.subject}" has been assigned to a provider.`,
                messageAr: `تم تعيين طلب الاستشارة #${payload.consultationNumber} "${payload.subject}" إلى مقدم خدمة.`,
                relatedEntityType: 'ConsultationRequest',
                relatedEntityId: payload.consultationId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send consultation assigned notification to subscriber:', error);
            return null;
        }
    }

    async notifyConsultationAssignedToProvider(payload: ConsultationAssignedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.providerId,
                type: NotificationType.NEW_CONSULTATION_REQUEST,
                title: 'New Consultation Assigned',
                titleAr: 'استشارة جديدة معينة لك',
                message: `You have been assigned consultation request #${payload.consultationNumber}: "${payload.subject}".`,
                messageAr: `تم تعيين طلب الاستشارة #${payload.consultationNumber}: "${payload.subject}" لك.`,
                relatedEntityType: 'ConsultationRequest',
                relatedEntityId: payload.consultationId,
                email: payload.providerEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send consultation assigned notification to provider:', error);
            return null;
        }
    }

    async notifyConsultationCompleted(payload: ConsultationCompletedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CONSULTATION_COMPLETED,
                title: 'Consultation Completed',
                titleAr: 'تم إكمال الاستشارة',
                message: `Your consultation request #${payload.consultationNumber} "${payload.subject}" has been completed. You can now rate the service.`,
                messageAr: `تم إكمال طلب الاستشارة #${payload.consultationNumber} "${payload.subject}". يمكنك الآن تقييم الخدمة.`,
                relatedEntityType: 'ConsultationRequest',
                relatedEntityId: payload.consultationId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send consultation completed notification:', error);
            return null;
        }
    }

    async notifyConsultationStatusChange(payload: ConsultationStatusChangeNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.CONSULTATION_STATUS_CHANGE,
                title: 'Consultation Status Updated',
                titleAr: 'تم تحديث حالة الاستشارة',
                message: `Consultation #${payload.consultationNumber} "${payload.subject}" status changed from "${payload.oldStatus}" to "${payload.newStatus}".`,
                messageAr: `تم تغيير حالة الاستشارة #${payload.consultationNumber} "${payload.subject}" من "${payload.oldStatus}" إلى "${payload.newStatus}".`,
                relatedEntityType: 'ConsultationRequest',
                relatedEntityId: payload.consultationId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send consultation status change notification:', error);
            return null;
        }
    }

    // ============================================
    // LEGAL OPINION NOTIFICATIONS
    // ============================================

    async notifyLegalOpinionAssignedToSubscriber(payload: LegalOpinionAssignedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.LEGAL_OPINION_ASSIGNED,
                title: 'Legal Opinion Assigned',
                titleAr: 'تم تعيين الرأي القانوني',
                message: `Your legal opinion request #${payload.opinionNumber} "${payload.subject}" has been assigned to a lawyer.`,
                messageAr: `تم تعيين طلب الرأي القانوني #${payload.opinionNumber} "${payload.subject}" إلى محامٍ.`,
                relatedEntityType: 'LegalOpinionRequest',
                relatedEntityId: payload.opinionId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send legal opinion assigned notification to subscriber:', error);
            return null;
        }
    }

    async notifyLegalOpinionAssignedToLawyer(payload: LegalOpinionAssignedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.lawyerId,
                type: NotificationType.NEW_LEGAL_OPINION_REQUEST,
                title: 'New Legal Opinion Assigned',
                titleAr: 'طلب رأي قانوني جديد معين لك',
                message: `You have been assigned legal opinion request #${payload.opinionNumber}: "${payload.subject}".`,
                messageAr: `تم تعيين طلب الرأي القانوني #${payload.opinionNumber}: "${payload.subject}" لك.`,
                relatedEntityType: 'LegalOpinionRequest',
                relatedEntityId: payload.opinionId,
                email: payload.lawyerEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send legal opinion assigned notification to lawyer:', error);
            return null;
        }
    }

    async notifyLegalOpinionCompleted(payload: LegalOpinionCompletedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.LEGAL_OPINION_COMPLETED,
                title: 'Legal Opinion Completed',
                titleAr: 'تم إكمال الرأي القانوني',
                message: `Your legal opinion request #${payload.opinionNumber} "${payload.subject}" has been completed. You can now view and download the final opinion.`,
                messageAr: `تم إكمال طلب الرأي القانوني #${payload.opinionNumber} "${payload.subject}". يمكنك الآن عرض وتنزيل الرأي النهائي.`,
                relatedEntityType: 'LegalOpinionRequest',
                relatedEntityId: payload.opinionId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send legal opinion completed notification:', error);
            return null;
        }
    }

    async notifyLegalOpinionStatusChange(payload: LegalOpinionStatusChangeNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.LEGAL_OPINION_STATUS_CHANGE,
                title: 'Legal Opinion Status Updated',
                titleAr: 'تم تحديث حالة الرأي القانوني',
                message: `Legal opinion #${payload.opinionNumber} "${payload.subject}" status changed from "${payload.oldStatus}" to "${payload.newStatus}".`,
                messageAr: `تم تغيير حالة الرأي القانوني #${payload.opinionNumber} "${payload.subject}" من "${payload.oldStatus}" إلى "${payload.newStatus}".`,
                relatedEntityType: 'LegalOpinionRequest',
                relatedEntityId: payload.opinionId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send legal opinion status change notification:', error);
            return null;
        }
    }

    // ============================================
    // LITIGATION CASE NOTIFICATIONS
    // ============================================

    async notifyLitigationCaseCreated(payload: LitigationCaseCreatedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CASE_CREATED,
                title: 'Litigation Case Submitted',
                titleAr: 'تم تقديم القضية',
                message: `Your litigation case #${payload.caseNumber} "${payload.title}" (${payload.caseType}) has been submitted successfully. We will assign a lawyer shortly.`,
                messageAr: `تم تقديم قضيتك #${payload.caseNumber} "${payload.title}" (${payload.caseType}) بنجاح. سنقوم بتعيين محامٍ قريباً.`,
                relatedEntityType: 'LitigationCase',
                relatedEntityId: payload.caseId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send litigation case created notification:', error);
            return null;
        }
    }

    async notifyLitigationCaseAssignedToSubscriber(payload: LitigationCaseAssignedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CASE_ASSIGNED,
                title: 'Lawyer Assigned to Your Case',
                titleAr: 'تم تعيين محامٍ لقضيتك',
                message: `A lawyer has been assigned to your case #${payload.caseNumber} "${payload.title}". You will receive a quote shortly.`,
                messageAr: `تم تعيين محامٍ لقضيتك #${payload.caseNumber} "${payload.title}". ستتلقى عرض سعر قريباً.`,
                relatedEntityType: 'LitigationCase',
                relatedEntityId: payload.caseId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send case assigned notification to subscriber:', error);
            return null;
        }
    }

    async notifyLitigationCaseAssignedToProvider(payload: LitigationCaseAssignedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.providerId,
                type: NotificationType.CASE_ASSIGNED,
                title: 'New Case Assigned',
                titleAr: 'قضية جديدة معينة لك',
                message: `You have been assigned litigation case #${payload.caseNumber}: "${payload.title}" (${payload.caseType}). Please review and send a quote.`,
                messageAr: `تم تعيين القضية #${payload.caseNumber}: "${payload.title}" (${payload.caseType}) لك. يرجى المراجعة وإرسال عرض سعر.`,
                relatedEntityType: 'LitigationCase',
                relatedEntityId: payload.caseId,
                email: payload.providerEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send case assigned notification to provider:', error);
            return null;
        }
    }

    async notifyLitigationQuoteSent(payload: LitigationCaseQuoteSentNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const amountStr = `${payload.currency} ${payload.quoteAmount.toFixed(2)}`;
            const validUntilStr = payload.validUntil.toLocaleDateString();

            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CASE_QUOTE_SENT,
                title: 'Quote Received for Your Case',
                titleAr: 'تم استلام عرض سعر لقضيتك',
                message: `A quote of ${amountStr} has been sent for case #${payload.caseNumber} "${payload.title}". Valid until: ${validUntilStr}. Please review and accept to proceed.`,
                messageAr: `تم إرسال عرض سعر بمبلغ ${amountStr} للقضية #${payload.caseNumber} "${payload.title}". صالح حتى: ${validUntilStr}. يرجى المراجعة والقبول للمتابعة.`,
                relatedEntityType: 'LitigationCase',
                relatedEntityId: payload.caseId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send quote sent notification:', error);
            return null;
        }
    }

    async notifyLitigationQuoteAccepted(payload: LitigationCaseQuoteAcceptedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const amountStr = `${payload.currency} ${payload.quoteAmount.toFixed(2)}`;

            return await this.sendNotificationUseCase.execute({
                userId: payload.providerId,
                type: NotificationType.CASE_QUOTE_ACCEPTED,
                title: 'Quote Accepted',
                titleAr: 'تم قبول عرض السعر',
                message: `Your quote of ${amountStr} for case #${payload.caseNumber} "${payload.title}" has been accepted. Awaiting payment.`,
                messageAr: `تم قبول عرض السعر الخاص بك بمبلغ ${amountStr} للقضية #${payload.caseNumber} "${payload.title}". في انتظار الدفع.`,
                relatedEntityType: 'LitigationCase',
                relatedEntityId: payload.caseId,
                email: payload.providerEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send quote accepted notification:', error);
            return null;
        }
    }

    async notifyLitigationPaymentReceived(payload: LitigationCasePaymentReceivedNotificationPayload): Promise<void> {
        if (!this.sendNotificationUseCase) return;

        const amountStr = `${payload.currency} ${payload.amount.toFixed(2)}`;

        // Notify subscriber
        try {
            await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CASE_PAYMENT_RECEIVED,
                title: 'Payment Confirmed',
                titleAr: 'تم تأكيد الدفع',
                message: `Your payment of ${amountStr} for case #${payload.caseNumber} has been received. The case will be activated shortly.`,
                messageAr: `تم استلام دفعتك بمبلغ ${amountStr} للقضية #${payload.caseNumber}. سيتم تفعيل القضية قريباً.`,
                relatedEntityType: 'LitigationCase',
                relatedEntityId: payload.caseId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send payment received notification to subscriber:', error);
        }

        // Notify provider if assigned
        if (payload.providerId) {
            try {
                await this.sendNotificationUseCase.execute({
                    userId: payload.providerId,
                    type: NotificationType.CASE_PAYMENT_RECEIVED,
                    title: 'Case Payment Confirmed',
                    titleAr: 'تم تأكيد دفع القضية',
                    message: `Payment of ${amountStr} has been received for case #${payload.caseNumber}. The case is ready to be activated.`,
                    messageAr: `تم استلام دفعة بمبلغ ${amountStr} للقضية #${payload.caseNumber}. القضية جاهزة للتفعيل.`,
                    relatedEntityType: 'LitigationCase',
                    relatedEntityId: payload.caseId,
                    email: payload.providerEmail,
                });
            } catch (error) {
                console.error('[NotificationIntegration] Failed to send payment received notification to provider:', error);
            }
        }
    }

    async notifyLitigationCaseActivated(payload: LitigationCaseActivatedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CASE_ACTIVATED,
                title: 'Case Activated',
                titleAr: 'تم تفعيل القضية',
                message: `Your litigation case #${payload.caseNumber} "${payload.title}" is now active. Your assigned lawyer will begin working on it.`,
                messageAr: `قضيتك #${payload.caseNumber} "${payload.title}" نشطة الآن. سيبدأ المحامي المعين بالعمل عليها.`,
                relatedEntityType: 'LitigationCase',
                relatedEntityId: payload.caseId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send case activated notification:', error);
            return null;
        }
    }

    async notifyLitigationCaseClosed(payload: LitigationCaseClosedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CASE_CLOSED,
                title: 'Case Closed',
                titleAr: 'تم إغلاق القضية',
                message: `Your litigation case #${payload.caseNumber} "${payload.title}" has been closed. Thank you for using our services.`,
                messageAr: `تم إغلاق قضيتك #${payload.caseNumber} "${payload.title}". شكراً لاستخدامك خدماتنا.`,
                relatedEntityType: 'LitigationCase',
                relatedEntityId: payload.caseId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send case closed notification:', error);
            return null;
        }
    }

    async notifyLitigationCaseCancelled(payload: LitigationCaseCancelledNotificationPayload): Promise<void> {
        if (!this.sendNotificationUseCase) return;

        const reasonText = payload.reason ? ` Reason: ${payload.reason}` : '';
        const reasonTextAr = payload.reason ? ` السبب: ${payload.reason}` : '';

        // Notify subscriber
        try {
            await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CASE_CANCELLED,
                title: 'Case Cancelled',
                titleAr: 'تم إلغاء القضية',
                message: `Your litigation case #${payload.caseNumber} has been cancelled.${reasonText}`,
                messageAr: `تم إلغاء قضيتك #${payload.caseNumber}.${reasonTextAr}`,
                relatedEntityType: 'LitigationCase',
                relatedEntityId: payload.caseId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send case cancelled notification to subscriber:', error);
        }

        // Notify provider if assigned
        if (payload.providerId) {
            try {
                await this.sendNotificationUseCase.execute({
                    userId: payload.providerId,
                    type: NotificationType.CASE_CANCELLED,
                    title: 'Assigned Case Cancelled',
                    titleAr: 'تم إلغاء القضية المعينة',
                    message: `Case #${payload.caseNumber} assigned to you has been cancelled.${reasonText}`,
                    messageAr: `تم إلغاء القضية #${payload.caseNumber} المعينة لك.${reasonTextAr}`,
                    relatedEntityType: 'LitigationCase',
                    relatedEntityId: payload.caseId,
                    email: payload.providerEmail,
                });
            } catch (error) {
                console.error('[NotificationIntegration] Failed to send case cancelled notification to provider:', error);
            }
        }
    }

    async notifyLitigationRefundProcessed(payload: LitigationCaseRefundNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const amountStr = `${payload.currency} ${payload.refundAmount.toFixed(2)}`;

            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CASE_REFUND_PROCESSED,
                title: 'Refund Processed for Case',
                titleAr: 'تم معالجة الاسترداد للقضية',
                message: `A refund of ${amountStr} has been processed for case #${payload.caseNumber}. It may take 5-10 business days to appear in your account.`,
                messageAr: `تم معالجة استرداد بمبلغ ${amountStr} للقضية #${payload.caseNumber}. قد يستغرق 5-10 أيام عمل ليظهر في حسابك.`,
                relatedEntityType: 'LitigationCase',
                relatedEntityId: payload.caseId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send refund processed notification:', error);
            return null;
        }
    }

    // ============================================
    // CALL REQUEST NOTIFICATIONS
    // ============================================

    async notifyCallRequestCreated(payload: CallRequestCreatedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const dateStr = payload.preferredDate?.toLocaleDateString() || 'Not specified';
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CALL_REQUEST_CREATED,
                title: 'Call Request Submitted',
                titleAr: 'تم تقديم طلب المكالمة',
                message: `Your call request #${payload.requestNumber} has been submitted. Purpose: ${payload.purpose}. Preferred date: ${dateStr}. We will assign a provider shortly.`,
                messageAr: `تم تقديم طلب المكالمة #${payload.requestNumber}. الغرض: ${payload.purpose}. التاريخ المفضل: ${dateStr}. سنقوم بتعيين مقدم خدمة قريباً.`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send call request created notification:', error);
            return null;
        }
    }

    async notifyCallRequestAssignedToSubscriber(payload: CallRequestAssignedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CALL_REQUEST_ASSIGNED,
                title: 'Provider Assigned to Your Call',
                titleAr: 'تم تعيين مقدم خدمة لمكالمتك',
                message: `A provider has been assigned to your call request #${payload.requestNumber}. You will receive scheduling details shortly.`,
                messageAr: `تم تعيين مقدم خدمة لطلب المكالمة #${payload.requestNumber}. ستتلقى تفاصيل الجدولة قريباً.`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send call assigned notification to subscriber:', error);
            return null;
        }
    }

    async notifyCallRequestAssignedToProvider(payload: CallRequestAssignedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.providerId,
                type: NotificationType.CALL_REQUEST_ASSIGNED,
                title: 'New Call Assigned',
                titleAr: 'مكالمة جديدة معينة لك',
                message: `You have been assigned call request #${payload.requestNumber}. Purpose: ${payload.purpose}. Please schedule the call.`,
                messageAr: `تم تعيين طلب المكالمة #${payload.requestNumber} لك. الغرض: ${payload.purpose}. يرجى جدولة المكالمة.`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.providerEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send call assigned notification to provider:', error);
            return null;
        }
    }

    async notifyCallScheduled(payload: CallScheduledNotificationPayload): Promise<void> {
        if (!this.sendNotificationUseCase) return;

        const scheduledDateStr = payload.scheduledAt.toLocaleString();
        const callLinkInfo = payload.callLink ? ` Join link: ${payload.callLink}` : '';
        const callLinkInfoAr = payload.callLink ? ` رابط الانضمام: ${payload.callLink}` : '';

        // Notify subscriber
        try {
            await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CALL_SCHEDULED,
                title: 'Call Scheduled',
                titleAr: 'تم جدولة المكالمة',
                message: `Your call #${payload.requestNumber} has been scheduled for ${scheduledDateStr} (${payload.durationMinutes} minutes).${callLinkInfo}`,
                messageAr: `تم جدولة مكالمتك #${payload.requestNumber} في ${scheduledDateStr} (${payload.durationMinutes} دقيقة).${callLinkInfoAr}`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send call scheduled notification to subscriber:', error);
        }

        // Notify provider
        try {
            await this.sendNotificationUseCase.execute({
                userId: payload.providerId,
                type: NotificationType.CALL_SCHEDULED,
                title: 'Call Confirmed',
                titleAr: 'تم تأكيد المكالمة',
                message: `Call #${payload.requestNumber} confirmed for ${scheduledDateStr} (${payload.durationMinutes} minutes).${callLinkInfo}`,
                messageAr: `تم تأكيد المكالمة #${payload.requestNumber} في ${scheduledDateStr} (${payload.durationMinutes} دقيقة).${callLinkInfoAr}`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.providerEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send call scheduled notification to provider:', error);
        }
    }

    async notifyCallRescheduled(payload: CallRescheduledNotificationPayload): Promise<void> {
        if (!this.sendNotificationUseCase) return;

        const oldDateStr = payload.oldScheduledAt.toLocaleString();
        const newDateStr = payload.newScheduledAt.toLocaleString();
        const reasonText = payload.reason ? ` Reason: ${payload.reason}` : '';
        const reasonTextAr = payload.reason ? ` السبب: ${payload.reason}` : '';

        // Notify subscriber
        try {
            await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CALL_RESCHEDULED,
                title: 'Call Rescheduled',
                titleAr: 'تم إعادة جدولة المكالمة',
                message: `Your call #${payload.requestNumber} has been rescheduled from ${oldDateStr} to ${newDateStr}.${reasonText}`,
                messageAr: `تم إعادة جدولة مكالمتك #${payload.requestNumber} من ${oldDateStr} إلى ${newDateStr}.${reasonTextAr}`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send reschedule notification to subscriber:', error);
        }

        // Notify provider
        try {
            await this.sendNotificationUseCase.execute({
                userId: payload.providerId,
                type: NotificationType.CALL_RESCHEDULED,
                title: 'Call Rescheduled',
                titleAr: 'تم إعادة جدولة المكالمة',
                message: `Call #${payload.requestNumber} has been rescheduled from ${oldDateStr} to ${newDateStr}.${reasonText}`,
                messageAr: `تم إعادة جدولة المكالمة #${payload.requestNumber} من ${oldDateStr} إلى ${newDateStr}.${reasonTextAr}`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.providerEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send reschedule notification to provider:', error);
        }
    }

    async notifyCallReminder(payload: CallReminderNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const scheduledDateStr = payload.scheduledAt.toLocaleString();
            const callLinkInfo = payload.callLink ? ` Join link: ${payload.callLink}` : '';
            const callLinkInfoAr = payload.callLink ? ` رابط الانضمام: ${payload.callLink}` : '';

            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.CALL_REMINDER,
                title: 'Upcoming Call Reminder',
                titleAr: 'تذكير بالمكالمة القادمة',
                message: `Reminder: Your call #${payload.requestNumber} is scheduled in ${payload.minutesUntilCall} minutes (${scheduledDateStr}).${callLinkInfo}`,
                messageAr: `تذكير: مكالمتك #${payload.requestNumber} مجدولة بعد ${payload.minutesUntilCall} دقيقة (${scheduledDateStr}).${callLinkInfoAr}`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send call reminder notification:', error);
            return null;
        }
    }

    async notifyCallCompleted(payload: CallCompletedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CALL_COMPLETED,
                title: 'Call Completed',
                titleAr: 'تم إكمال المكالمة',
                message: `Your call #${payload.requestNumber} has been completed (${payload.durationMinutes} minutes). Thank you for using our service.`,
                messageAr: `تم إكمال مكالمتك #${payload.requestNumber} (${payload.durationMinutes} دقيقة). شكراً لاستخدامك خدماتنا.`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send call completed notification:', error);
            return null;
        }
    }

    async notifyCallCancelled(payload: CallCancelledNotificationPayload): Promise<void> {
        if (!this.sendNotificationUseCase) return;

        const cancelledByText = payload.cancelledBy === 'subscriber' ? 'you' : payload.cancelledBy === 'provider' ? 'the provider' : 'the system';
        const cancelledByTextAr = payload.cancelledBy === 'subscriber' ? 'أنت' : payload.cancelledBy === 'provider' ? 'مقدم الخدمة' : 'النظام';
        const reasonText = payload.reason ? ` Reason: ${payload.reason}` : '';
        const reasonTextAr = payload.reason ? ` السبب: ${payload.reason}` : '';

        // Notify subscriber
        try {
            await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CALL_CANCELLED,
                title: 'Call Cancelled',
                titleAr: 'تم إلغاء المكالمة',
                message: `Your call #${payload.requestNumber} has been cancelled by ${cancelledByText}.${reasonText}`,
                messageAr: `تم إلغاء مكالمتك #${payload.requestNumber} بواسطة ${cancelledByTextAr}.${reasonTextAr}`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send cancellation notification to subscriber:', error);
        }

        // Notify provider if assigned
        if (payload.providerId) {
            try {
                await this.sendNotificationUseCase.execute({
                    userId: payload.providerId,
                    type: NotificationType.CALL_CANCELLED,
                    title: 'Assigned Call Cancelled',
                    titleAr: 'تم إلغاء المكالمة المعينة',
                    message: `Call #${payload.requestNumber} assigned to you has been cancelled.${reasonText}`,
                    messageAr: `تم إلغاء المكالمة #${payload.requestNumber} المعينة لك.${reasonTextAr}`,
                    relatedEntityType: 'CallRequest',
                    relatedEntityId: payload.callRequestId,
                    email: payload.providerEmail,
                });
            } catch (error) {
                console.error('[NotificationIntegration] Failed to send cancellation notification to provider:', error);
            }
        }
    }

    async notifyCallNoShow(payload: CallNoShowNotificationPayload): Promise<void> {
        if (!this.sendNotificationUseCase) return;

        const scheduledDateStr = payload.scheduledAt.toLocaleString();

        // Notify subscriber
        try {
            await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.CALL_NO_SHOW,
                title: 'Call Marked as No-Show',
                titleAr: 'تم تسجيل غياب عن المكالمة',
                message: `Your call #${payload.requestNumber} scheduled for ${scheduledDateStr} has been marked as no-show. Please contact support if this was an error.`,
                messageAr: `تم تسجيل غيابك عن المكالمة #${payload.requestNumber} المجدولة في ${scheduledDateStr}. يرجى التواصل مع الدعم إذا كان هذا خطأ.`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send no-show notification to subscriber:', error);
        }

        // Notify provider
        try {
            await this.sendNotificationUseCase.execute({
                userId: payload.providerId,
                type: NotificationType.CALL_NO_SHOW,
                title: 'Call No-Show Recorded',
                titleAr: 'تم تسجيل غياب عن المكالمة',
                message: `Call #${payload.requestNumber} scheduled for ${scheduledDateStr} has been marked as no-show.`,
                messageAr: `تم تسجيل غياب عن المكالمة #${payload.requestNumber} المجدولة في ${scheduledDateStr}.`,
                relatedEntityType: 'CallRequest',
                relatedEntityId: payload.callRequestId,
                email: payload.providerEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send no-show notification to provider:', error);
        }
    }

    // ============================================
    // MEMBERSHIP & QUOTA NOTIFICATIONS
    // ============================================

    async notifyQuotaWarning(payload: QuotaWarningNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.QUOTA_WARNING,
                title: 'Quota Warning',
                titleAr: 'تحذير الحصة',
                message: `You have used ${payload.percentageUsed}% of your ${payload.resourceType} quota (${payload.currentUsage}/${payload.limit}). Consider upgrading your membership.`,
                messageAr: `لقد استخدمت ${payload.percentageUsed}% من حصتك لـ ${payload.resourceType} (${payload.currentUsage}/${payload.limit}). فكر في ترقية عضويتك.`,
                relatedEntityType: 'Membership',
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send quota warning notification:', error);
            return null;
        }
    }

    async notifyQuotaExceeded(payload: QuotaExceededNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.QUOTA_EXCEEDED,
                title: 'Quota Exceeded',
                titleAr: 'تجاوز الحصة',
                message: `You have exceeded your ${payload.resourceType} quota (limit: ${payload.limit}). Please upgrade your membership to continue using this feature.`,
                messageAr: `لقد تجاوزت حصتك لـ ${payload.resourceType} (الحد: ${payload.limit}). يرجى ترقية عضويتك لمواصلة استخدام هذه الميزة.`,
                relatedEntityType: 'Membership',
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send quota exceeded notification:', error);
            return null;
        }
    }

    async notifyMembershipExpiring(payload: MembershipExpiringNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const dateStr = payload.expirationDate.toLocaleDateString();
            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.MEMBERSHIP_EXPIRING,
                title: 'Membership Expiring Soon',
                titleAr: 'تنتهي العضوية قريباً',
                message: `Your ${payload.tierName} membership will expire in ${payload.daysRemaining} days (${dateStr}). Renew now to maintain your benefits.`,
                messageAr: `ستنتهي عضويتك ${payload.tierName} خلال ${payload.daysRemaining} يوم (${dateStr}). جدد الآن للحفاظ على مزاياك.`,
                relatedEntityType: 'Membership',
                relatedEntityId: payload.membershipId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send membership expiring notification:', error);
            return null;
        }
    }

    async notifyMembershipExpired(payload: MembershipExpiredNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.MEMBERSHIP_EXPIRED,
                title: 'Membership Expired',
                titleAr: 'انتهت العضوية',
                message: `Your ${payload.tierName} membership has expired. Renew now to restore your benefits and access.`,
                messageAr: `انتهت عضويتك ${payload.tierName}. جدد الآن لاستعادة مزاياك وصلاحياتك.`,
                relatedEntityType: 'Membership',
                relatedEntityId: payload.membershipId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send membership expired notification:', error);
            return null;
        }
    }

    async notifyMembershipTierChange(payload: MembershipTierChangeNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const actionText = payload.isUpgrade ? 'upgraded' : 'changed';
            const actionTextAr = payload.isUpgrade ? 'ترقيتها' : 'تغييرها';

            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: payload.isUpgrade ? NotificationType.MEMBERSHIP_UPGRADED : NotificationType.MEMBERSHIP_DOWNGRADED,
                title: payload.isUpgrade ? 'Membership Upgraded' : 'Membership Changed',
                titleAr: payload.isUpgrade ? 'تمت ترقية العضوية' : 'تم تغيير العضوية',
                message: `Your membership has been ${actionText} from ${payload.oldTierName} to ${payload.newTierName}.`,
                messageAr: `تمت ${actionTextAr} عضويتك من ${payload.oldTierName} إلى ${payload.newTierName}.`,
                relatedEntityType: 'Membership',
                relatedEntityId: payload.membershipId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send membership tier change notification:', error);
            return null;
        }
    }

    // ============================================
    // BILLING & PAYMENT NOTIFICATIONS
    // ============================================

    async notifyInvoiceCreated(payload: InvoiceCreatedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const amountStr = `${payload.currency} ${payload.amount.toFixed(2)}`;
            const dueDateStr = payload.dueDate.toLocaleDateString();

            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.INVOICE_CREATED,
                title: 'New Invoice',
                titleAr: 'فاتورة جديدة',
                message: `Invoice #${payload.invoiceNumber} has been created for ${amountStr}. Due date: ${dueDateStr}.`,
                messageAr: `تم إنشاء الفاتورة #${payload.invoiceNumber} بمبلغ ${amountStr}. تاريخ الاستحقاق: ${dueDateStr}.`,
                relatedEntityType: 'MembershipInvoice',
                relatedEntityId: payload.invoiceId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send invoice created notification:', error);
            return null;
        }
    }

    async notifyInvoicePaid(payload: InvoicePaidNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const amountStr = `${payload.currency} ${payload.amount.toFixed(2)}`;

            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.INVOICE_PAID,
                title: 'Invoice Paid',
                titleAr: 'تم دفع الفاتورة',
                message: `Invoice #${payload.invoiceNumber} for ${amountStr} has been paid successfully. Thank you!`,
                messageAr: `تم دفع الفاتورة #${payload.invoiceNumber} بمبلغ ${amountStr} بنجاح. شكراً لك!`,
                relatedEntityType: 'MembershipInvoice',
                relatedEntityId: payload.invoiceId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send invoice paid notification:', error);
            return null;
        }
    }

    async notifyInvoiceOverdue(payload: InvoiceOverdueNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const amountStr = `${payload.currency} ${payload.amount.toFixed(2)}`;

            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.INVOICE_OVERDUE,
                title: 'Invoice Overdue',
                titleAr: 'فاتورة متأخرة',
                message: `Invoice #${payload.invoiceNumber} for ${amountStr} is ${payload.daysOverdue} days overdue. Please pay immediately to avoid service interruption.`,
                messageAr: `الفاتورة #${payload.invoiceNumber} بمبلغ ${amountStr} متأخرة ${payload.daysOverdue} يوم. يرجى الدفع فوراً لتجنب انقطاع الخدمة.`,
                relatedEntityType: 'MembershipInvoice',
                relatedEntityId: payload.invoiceId,
                email: payload.userEmail,
                channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send invoice overdue notification:', error);
            return null;
        }
    }

    async notifyPaymentSuccess(payload: PaymentSuccessNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const amountStr = `${payload.currency} ${payload.amount.toFixed(2)}`;

            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.PAYMENT_RECEIVED,
                title: 'Payment Successful',
                titleAr: 'تم الدفع بنجاح',
                message: `Your payment of ${amountStr} has been processed successfully.${payload.description ? ` (${payload.description})` : ''}`,
                messageAr: `تم معالجة دفعتك بمبلغ ${amountStr} بنجاح.${payload.description ? ` (${payload.description})` : ''}`,
                relatedEntityType: 'Transaction',
                relatedEntityId: payload.transactionId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send payment success notification:', error);
            return null;
        }
    }

    async notifyPaymentFailed(payload: PaymentFailedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const amountStr = `${payload.currency} ${payload.amount.toFixed(2)}`;

            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.PAYMENT_FAILED,
                title: 'Payment Failed',
                titleAr: 'فشل الدفع',
                message: `Your payment of ${amountStr} could not be processed.${payload.reason ? ` Reason: ${payload.reason}` : ''} Please try again or use a different payment method.`,
                messageAr: `تعذر معالجة دفعتك بمبلغ ${amountStr}.${payload.reason ? ` السبب: ${payload.reason}` : ''} يرجى المحاولة مرة أخرى أو استخدام طريقة دفع مختلفة.`,
                relatedEntityType: 'Transaction',
                relatedEntityId: payload.transactionId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send payment failed notification:', error);
            return null;
        }
    }

    async notifyRefundProcessed(payload: RefundProcessedNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const amountStr = `${payload.currency} ${payload.amount.toFixed(2)}`;

            return await this.sendNotificationUseCase.execute({
                userId: payload.userId,
                type: NotificationType.REFUND_PROCESSED,
                title: 'Refund Processed',
                titleAr: 'تم معالجة الاسترداد',
                message: `A refund of ${amountStr} has been processed for your account.${payload.reason ? ` Reason: ${payload.reason}` : ''} It may take 5-10 business days to appear in your account.`,
                messageAr: `تم معالجة استرداد بمبلغ ${amountStr} لحسابك.${payload.reason ? ` السبب: ${payload.reason}` : ''} قد يستغرق 5-10 أيام عمل ليظهر في حسابك.`,
                relatedEntityType: 'Refund',
                relatedEntityId: payload.refundId,
                email: payload.userEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send refund processed notification:', error);
            return null;
        }
    }

    // ============================================
    // GENERIC NOTIFICATION METHOD
    // ============================================

    async sendCustomNotification(
        userId: string,
        type: NotificationType | string,
        title: string,
        message: string,
        options?: {
            titleAr?: string;
            messageAr?: string;
            email?: string;
            relatedEntityType?: string;
            relatedEntityId?: string;
            channels?: NotificationChannel[];
        }
    ): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            return await this.sendNotificationUseCase.execute({
                userId,
                type,
                title,
                titleAr: options?.titleAr,
                message,
                messageAr: options?.messageAr,
                email: options?.email,
                relatedEntityType: options?.relatedEntityType,
                relatedEntityId: options?.relatedEntityId,
                channels: options?.channels,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send custom notification:', error);
            return null;
        }
    }

    // ============================================
    // TEMPLATED NOTIFICATION METHOD
    // ============================================

    async sendTemplatedNotification(
        userId: string,
        templateCode: string,
        variables: Record<string, string>,
        options?: {
            email?: string;
            relatedEntityType?: string;
            relatedEntityId?: string;
            channels?: NotificationChannel[];
        }
    ): Promise<Notification | null> {
        if (!this.sendTemplatedNotificationUseCase) return null;

        try {
            return await this.sendTemplatedNotificationUseCase.execute({
                userId,
                templateCode,
                variables,
                email: options?.email,
                relatedEntityType: options?.relatedEntityType,
                relatedEntityId: options?.relatedEntityId,
                channels: options?.channels,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send templated notification:', error);
            return null;
        }
    }

    // ============================================
    // SLA NOTIFICATIONS
    // ============================================

    /**
     * Notify about SLA breach - sent to subscriber and provider
     */
    async notifySLABreach(payload: SLABreachNotificationPayload): Promise<void> {
        if (!this.sendNotificationUseCase) return;

        const requestTypeLabel = this.formatRequestType(payload.requestType);

        // Notify subscriber
        try {
            await this.sendNotificationUseCase.execute({
                userId: payload.subscriberId,
                type: NotificationType.SLA_BREACH,
                title: 'SLA Breach Alert',
                titleAr: 'تنبيه انتهاك اتفاقية مستوى الخدمة',
                message: `Your ${requestTypeLabel} #${payload.requestNumber} has exceeded the SLA deadline. Our team is prioritizing this request.`,
                messageAr: `تجاوز ${requestTypeLabel} #${payload.requestNumber} الموعد النهائي لاتفاقية مستوى الخدمة. فريقنا يعطي الأولوية لهذا الطلب.`,
                relatedEntityType: this.getEntityType(payload.requestType),
                relatedEntityId: payload.requestId,
                email: payload.subscriberEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send SLA breach notification to subscriber:', error);
        }

        // Notify provider if assigned
        if (payload.providerId) {
            try {
                await this.sendNotificationUseCase.execute({
                    userId: payload.providerId,
                    type: NotificationType.SLA_BREACH,
                    title: 'URGENT: SLA Breach',
                    titleAr: 'عاجل: انتهاك اتفاقية مستوى الخدمة',
                    message: `${requestTypeLabel} #${payload.requestNumber} has breached SLA. Immediate attention required.`,
                    messageAr: `${requestTypeLabel} #${payload.requestNumber} انتهك اتفاقية مستوى الخدمة. مطلوب اهتمام فوري.`,
                    relatedEntityType: this.getEntityType(payload.requestType),
                    relatedEntityId: payload.requestId,
                    email: payload.providerEmail,
                });
            } catch (error) {
                console.error('[NotificationIntegration] Failed to send SLA breach notification to provider:', error);
            }
        }
    }

    /**
     * Notify about SLA at-risk status - sent to provider
     */
    async notifySLAAtRisk(payload: SLAAtRiskNotificationPayload): Promise<void> {
        if (!this.sendNotificationUseCase) return;

        const requestTypeLabel = this.formatRequestType(payload.requestType);

        // Notify provider if assigned
        if (payload.providerId) {
            try {
                await this.sendNotificationUseCase.execute({
                    userId: payload.providerId,
                    type: NotificationType.SLA_WARNING,
                    title: 'SLA Warning',
                    titleAr: 'تحذير اتفاقية مستوى الخدمة',
                    message: `${requestTypeLabel} #${payload.requestNumber} is at risk of SLA breach. ${payload.hoursRemaining} hours remaining until deadline.`,
                    messageAr: `${requestTypeLabel} #${payload.requestNumber} معرض لخطر انتهاك اتفاقية مستوى الخدمة. ${payload.hoursRemaining} ساعات متبقية حتى الموعد النهائي.`,
                    relatedEntityType: this.getEntityType(payload.requestType),
                    relatedEntityId: payload.requestId,
                    email: payload.providerEmail,
                });
            } catch (error) {
                console.error('[NotificationIntegration] Failed to send SLA at-risk notification to provider:', error);
            }
        }
    }

    /**
     * Send daily SLA report to admin
     */
    async notifySLADailyReport(payload: SLADailyReportNotificationPayload): Promise<Notification | null> {
        if (!this.sendNotificationUseCase) return null;

        try {
            const reportSummary = `Total Active: ${payload.summary.totalActive}, ` +
                `Breached: ${payload.summary.breached}, ` +
                `At Risk: ${payload.summary.atRisk}, ` +
                `On Track: ${payload.summary.onTrack}`;

            return await this.sendNotificationUseCase.execute({
                userId: payload.adminUserId,
                type: NotificationType.ADMIN_ALERT,
                title: `Daily SLA Report - ${payload.reportDate.toISOString().split('T')[0]}`,
                titleAr: `تقرير اتفاقية مستوى الخدمة اليومي - ${payload.reportDate.toISOString().split('T')[0]}`,
                message: `SLA Summary: ${reportSummary}`,
                messageAr: `ملخص اتفاقية مستوى الخدمة: ${reportSummary}`,
                email: payload.adminEmail,
            });
        } catch (error) {
            console.error('[NotificationIntegration] Failed to send SLA daily report notification:', error);
            return null;
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private formatRequestType(requestType: string): string {
        const typeMap: Record<string, string> = {
            consultation: 'Consultation Request',
            legal_opinion: 'Legal Opinion Request',
            service: 'Service Request',
            litigation: 'Litigation Case',
            call: 'Call Request',
        };
        return typeMap[requestType] || requestType;
    }

    private getEntityType(requestType: string): string {
        const entityMap: Record<string, string> = {
            consultation: 'ConsultationRequest',
            legal_opinion: 'LegalOpinionRequest',
            service: 'ServiceRequest',
            litigation: 'LitigationCase',
            call: 'CallRequest',
        };
        return entityMap[requestType] || requestType;
    }
}
