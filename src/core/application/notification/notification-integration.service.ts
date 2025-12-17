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
}
