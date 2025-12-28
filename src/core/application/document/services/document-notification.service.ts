// ============================================
// DOCUMENT NOTIFICATION SERVICE
// Sends notifications for document events
// ============================================

import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { Document } from '../../../domain/document/entities/document.entity';
import {
  DocumentRequestType,
  formatFileSize,
} from '../../../domain/document/value-objects/document.vo';

// Import notification integration if available
import type { NotificationIntegrationService } from '../../notification/notification-integration.service';

/**
 * DI Token for notification service
 */
export const NOTIFICATION_SERVICE = Symbol('NOTIFICATION_SERVICE');

/**
 * Document notification types
 */
export enum DocumentNotificationType {
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_VERIFIED = 'document_verified',
  DOCUMENT_REJECTED = 'document_rejected',
  DOCUMENT_DELETED = 'document_deleted',
  DOCUMENT_REQUIRED = 'document_required',
  VERIFICATION_PENDING = 'verification_pending',
}

/**
 * Notification recipient
 */
export interface NotificationRecipient {
  userId: string;
  email?: string;
  phone?: string;
}

/**
 * Document notification payload
 */
export interface DocumentNotificationPayload {
  documentId: string;
  documentName: string;
  documentType: string;
  documentSize: string;
  requestType?: DocumentRequestType;
  requestId?: string;
  uploadedBy?: string;
  verifiedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

@Injectable()
export class DocumentNotificationService {
  private readonly logger = new Logger(DocumentNotificationService.name);

  constructor(
    @Optional()
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService?: NotificationIntegrationService,
  ) {}

  /**
   * Notify when a document is uploaded
   */
  async notifyDocumentUploaded(
    document: Document,
    recipients: NotificationRecipient[],
  ): Promise<void> {
    if (!this.notificationService) {
      this.logger.log(
        'Notification service not available, skipping document upload notification',
      );
      return;
    }

    try {
      const payload = this.createPayload(document);

      for (const recipient of recipients) {
        this.logger.log(
          `Notifying ${recipient.userId} of document upload: ${document.fileName}`,
        );

        // Call notification service
        // This would integrate with the NotificationIntegrationService
      }
    } catch (error) {
      this.logger.error('Failed to send document upload notification:', error);
    }
  }

  /**
   * Notify when a document is verified
   */
  async notifyDocumentVerified(
    document: Document,
    verifiedBy: string,
    recipients: NotificationRecipient[],
  ): Promise<void> {
    if (!this.notificationService) {
      this.logger.log(
        'Notification service not available, skipping verification notification',
      );
      return;
    }

    try {
      const payload = this.createPayload(document, { verifiedBy });

      for (const recipient of recipients) {
        this.logger.log(
          `Notifying ${recipient.userId} of document verification: ${document.fileName}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to send document verification notification:',
        error,
      );
    }
  }

  /**
   * Notify when a document is rejected
   */
  async notifyDocumentRejected(
    document: Document,
    rejectedBy: string,
    reason: string,
    recipients: NotificationRecipient[],
  ): Promise<void> {
    if (!this.notificationService) {
      this.logger.log(
        'Notification service not available, skipping rejection notification',
      );
      return;
    }

    try {
      const payload = this.createPayload(document, {
        rejectedBy,
        rejectionReason: reason,
      });

      for (const recipient of recipients) {
        this.logger.log(
          `Notifying ${recipient.userId} of document rejection: ${document.fileName}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to send document rejection notification:',
        error,
      );
    }
  }

  /**
   * Notify when document verification is pending (for admin/verifiers)
   */
  async notifyVerificationPending(
    document: Document,
    verifiers: NotificationRecipient[],
  ): Promise<void> {
    if (!this.notificationService) {
      this.logger.log(
        'Notification service not available, skipping pending verification notification',
      );
      return;
    }

    try {
      const payload = this.createPayload(document);

      for (const verifier of verifiers) {
        this.logger.log(
          `Notifying verifier ${verifier.userId} of pending document: ${document.fileName}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to send pending verification notification:',
        error,
      );
    }
  }

  /**
   * Notify when a document is required for a request
   */
  async notifyDocumentRequired(
    requestType: DocumentRequestType,
    requestId: string,
    documentDescription: string,
    recipients: NotificationRecipient[],
  ): Promise<void> {
    if (!this.notificationService) {
      this.logger.log(
        'Notification service not available, skipping document required notification',
      );
      return;
    }

    try {
      for (const recipient of recipients) {
        this.logger.log(
          `Notifying ${recipient.userId} that document is required for ${requestType} ${requestId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to send document required notification:',
        error,
      );
    }
  }

  /**
   * Create notification payload from document
   */
  private createPayload(
    document: Document,
    extra?: Partial<DocumentNotificationPayload>,
  ): DocumentNotificationPayload {
    return {
      documentId: document.id,
      documentName: document.fileName,
      documentType: document.fileType,
      documentSize: formatFileSize(document.fileSize),
      requestType: document.requestType || undefined,
      requestId: document.requestId || undefined,
      uploadedBy: document.uploadedBy,
      ...extra,
    };
  }
}
