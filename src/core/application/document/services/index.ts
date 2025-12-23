// ============================================
// DOCUMENT SERVICES BARREL EXPORT
// ============================================

// Storage services
export * from './storage';

// Notification service
export {
    DocumentNotificationService,
    DocumentNotificationType,
    NOTIFICATION_SERVICE,
    type NotificationRecipient,
    type DocumentNotificationPayload,
} from './document-notification.service';
