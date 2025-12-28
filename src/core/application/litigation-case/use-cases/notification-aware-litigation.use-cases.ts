// ============================================
// NOTIFICATION-AWARE LITIGATION USE CASES
// Wraps litigation use cases with notification triggers
// ============================================

import { Injectable, Logger, Optional } from '@nestjs/common';
import { NotificationIntegrationService } from '../../notification/notification-integration.service';
import {
  CreateLitigationCaseUseCase,
  CreateLitigationCaseCommand,
  AssignProviderUseCase,
  AssignProviderCommand,
  SendQuoteUseCase,
  SendQuoteCommand,
  AcceptQuoteUseCase,
  AcceptQuoteCommand,
  MarkAsPaidUseCase,
  MarkAsPaidCommand,
  ActivateCaseUseCase,
  ActivateCaseCommand,
  CloseCaseUseCase,
  CloseCaseCommand,
  CancelCaseUseCase,
  CancelCaseCommand,
  ProcessRefundUseCase,
  ProcessRefundCommand,
} from './litigation-case.use-cases';

// ============================================
// CREATE CASE WITH NOTIFICATION
// ============================================

@Injectable()
export class CreateLitigationWithNotificationUseCase {
  private readonly logger = new Logger(
    CreateLitigationWithNotificationUseCase.name,
  );

  constructor(
    private readonly createCaseUseCase: CreateLitigationCaseUseCase,
    @Optional()
    private readonly notificationService?: NotificationIntegrationService,
  ) {}

  async execute(command: CreateLitigationCaseCommand): Promise<any> {
    // 1. Create the case
    const result = await this.createCaseUseCase.execute(command);

    // 2. Send notification
    if (this.notificationService) {
      try {
        await this.notificationService.notifyLitigationCaseCreated({
          caseId: result.id,
          caseNumber: result.caseNumber,
          subscriberId: result.subscriberId,
          caseType: result.caseType,
          title: result.title,
        });
      } catch (error) {
        this.logger.error('Failed to send case created notification:', error);
      }
    }

    return result;
  }
}

// ============================================
// ASSIGN PROVIDER WITH NOTIFICATION
// ============================================

@Injectable()
export class AssignProviderWithNotificationUseCase {
  private readonly logger = new Logger(
    AssignProviderWithNotificationUseCase.name,
  );

  constructor(
    private readonly assignProviderUseCase: AssignProviderUseCase,
    @Optional()
    private readonly notificationService?: NotificationIntegrationService,
  ) {}

  async execute(
    command: AssignProviderCommand,
    caseDetails: {
      subscriberId: string;
      caseType: string;
      title: string;
    },
  ): Promise<any> {
    // 1. Assign the provider
    const result = await this.assignProviderUseCase.execute(command);

    // 2. Send notifications to both subscriber and provider
    if (this.notificationService) {
      try {
        const payload = {
          caseId: command.caseId,
          caseNumber: result.caseNumber,
          subscriberId: caseDetails.subscriberId,
          providerId: command.providerId,
          caseType: caseDetails.caseType,
          title: caseDetails.title,
        };

        await Promise.all([
          this.notificationService.notifyLitigationCaseAssignedToSubscriber(
            payload,
          ),
          this.notificationService.notifyLitigationCaseAssignedToProvider(
            payload,
          ),
        ]);
      } catch (error) {
        this.logger.error(
          'Failed to send case assignment notifications:',
          error,
        );
      }
    }

    return result;
  }
}

// ============================================
// SEND QUOTE WITH NOTIFICATION
// ============================================

@Injectable()
export class SendQuoteWithNotificationUseCase {
  private readonly logger = new Logger(SendQuoteWithNotificationUseCase.name);

  constructor(
    private readonly sendQuoteUseCase: SendQuoteUseCase,
    @Optional()
    private readonly notificationService?: NotificationIntegrationService,
  ) {}

  async execute(
    command: SendQuoteCommand,
    subscriberId: string,
    title: string,
    caseType: string,
  ): Promise<any> {
    // 1. Send the quote
    const result = await this.sendQuoteUseCase.execute(command);

    // 2. Notify subscriber about the quote
    if (this.notificationService && result.quoteAmount) {
      try {
        await this.notificationService.notifyLitigationQuoteSent({
          caseId: command.caseId,
          caseNumber: result.caseNumber,
          subscriberId,
          caseType,
          title,
          quoteAmount: result.quoteAmount.amount,
          currency: result.quoteAmount.currency,
          validUntil: new Date(result.quoteValidUntil),
        });
      } catch (error) {
        this.logger.error('Failed to send quote notification:', error);
      }
    }

    return result;
  }
}

// ============================================
// ACCEPT QUOTE WITH NOTIFICATION
// ============================================

@Injectable()
export class AcceptQuoteWithNotificationUseCase {
  private readonly logger = new Logger(AcceptQuoteWithNotificationUseCase.name);

  constructor(
    private readonly acceptQuoteUseCase: AcceptQuoteUseCase,
    @Optional()
    private readonly notificationService?: NotificationIntegrationService,
  ) {}

  async execute(
    command: AcceptQuoteCommand,
    caseDetails: {
      providerId: string;
      caseType: string;
      title: string;
      quoteAmount: number;
      currency: string;
    },
  ): Promise<any> {
    // 1. Accept the quote
    const result = await this.acceptQuoteUseCase.execute(command);

    // 2. Notify provider about quote acceptance
    if (this.notificationService) {
      try {
        await this.notificationService.notifyLitigationQuoteAccepted({
          caseId: command.caseId,
          caseNumber: result.caseNumber,
          providerId: caseDetails.providerId,
          caseType: caseDetails.caseType,
          title: caseDetails.title,
          quoteAmount: caseDetails.quoteAmount,
          currency: caseDetails.currency,
        });
      } catch (error) {
        this.logger.error('Failed to send quote accepted notification:', error);
      }
    }

    return result;
  }
}

// ============================================
// MARK AS PAID WITH NOTIFICATION
// ============================================

@Injectable()
export class MarkAsPaidWithNotificationUseCase {
  private readonly logger = new Logger(MarkAsPaidWithNotificationUseCase.name);

  constructor(
    private readonly markAsPaidUseCase: MarkAsPaidUseCase,
    @Optional()
    private readonly notificationService?: NotificationIntegrationService,
  ) {}

  async execute(
    command: MarkAsPaidCommand,
    caseDetails: {
      subscriberId: string;
      providerId?: string;
    },
  ): Promise<any> {
    // 1. Mark as paid
    const result = await this.markAsPaidUseCase.execute(command);

    // 2. Notify subscriber and provider about payment
    if (this.notificationService && command.amount) {
      try {
        await this.notificationService.notifyLitigationPaymentReceived({
          caseId: command.caseId,
          caseNumber: result.caseNumber,
          subscriberId: caseDetails.subscriberId,
          providerId: caseDetails.providerId,
          amount: command.amount,
          currency: command.currency || 'SAR',
        });
      } catch (error) {
        this.logger.error('Failed to send payment notification:', error);
      }
    }

    return result;
  }
}

// ============================================
// ACTIVATE CASE WITH NOTIFICATION
// ============================================

@Injectable()
export class ActivateCaseWithNotificationUseCase {
  private readonly logger = new Logger(
    ActivateCaseWithNotificationUseCase.name,
  );

  constructor(
    private readonly activateCaseUseCase: ActivateCaseUseCase,
    @Optional()
    private readonly notificationService?: NotificationIntegrationService,
  ) {}

  async execute(
    command: ActivateCaseCommand,
    caseDetails: {
      subscriberId: string;
      caseType: string;
      title: string;
    },
  ): Promise<any> {
    // 1. Activate the case
    const result = await this.activateCaseUseCase.execute(command);

    // 2. Notify subscriber about activation
    if (this.notificationService) {
      try {
        await this.notificationService.notifyLitigationCaseActivated({
          caseId: command.caseId,
          caseNumber: result.caseNumber,
          subscriberId: caseDetails.subscriberId,
          caseType: caseDetails.caseType,
          title: caseDetails.title,
        });
      } catch (error) {
        this.logger.error(
          'Failed to send case activation notification:',
          error,
        );
      }
    }

    return result;
  }
}

// ============================================
// CLOSE CASE WITH NOTIFICATION
// ============================================

@Injectable()
export class CloseCaseWithNotificationUseCase {
  private readonly logger = new Logger(CloseCaseWithNotificationUseCase.name);

  constructor(
    private readonly closeCaseUseCase: CloseCaseUseCase,
    @Optional()
    private readonly notificationService?: NotificationIntegrationService,
  ) {}

  async execute(
    command: CloseCaseCommand,
    caseDetails: {
      subscriberId: string;
      caseType: string;
      title: string;
    },
  ): Promise<any> {
    // 1. Close the case
    const result = await this.closeCaseUseCase.execute(command);

    // 2. Notify subscriber about closure
    if (this.notificationService) {
      try {
        await this.notificationService.notifyLitigationCaseClosed({
          caseId: command.caseId,
          caseNumber: result.caseNumber,
          subscriberId: caseDetails.subscriberId,
          caseType: caseDetails.caseType,
          title: caseDetails.title,
        });
      } catch (error) {
        this.logger.error('Failed to send case closed notification:', error);
      }
    }

    return result;
  }
}

// ============================================
// CANCEL CASE WITH NOTIFICATION
// ============================================

@Injectable()
export class CancelCaseWithNotificationUseCase {
  private readonly logger = new Logger(CancelCaseWithNotificationUseCase.name);

  constructor(
    private readonly cancelCaseUseCase: CancelCaseUseCase,
    @Optional()
    private readonly notificationService?: NotificationIntegrationService,
  ) {}

  async execute(
    command: CancelCaseCommand,
    caseDetails: {
      subscriberId: string;
      providerId?: string;
    },
  ): Promise<any> {
    // 1. Cancel the case
    const result = await this.cancelCaseUseCase.execute(command);

    // 2. Notify subscriber and provider about cancellation
    if (this.notificationService) {
      try {
        await this.notificationService.notifyLitigationCaseCancelled({
          caseId: command.caseId,
          caseNumber: result.caseNumber,
          subscriberId: caseDetails.subscriberId,
          providerId: caseDetails.providerId,
          reason: command.reason,
        });
      } catch (error) {
        this.logger.error(
          'Failed to send case cancellation notification:',
          error,
        );
      }
    }

    return result;
  }
}

// ============================================
// PROCESS REFUND WITH NOTIFICATION
// ============================================

@Injectable()
export class ProcessRefundWithNotificationUseCase {
  private readonly logger = new Logger(
    ProcessRefundWithNotificationUseCase.name,
  );

  constructor(
    private readonly processRefundUseCase: ProcessRefundUseCase,
    @Optional()
    private readonly notificationService?: NotificationIntegrationService,
  ) {}

  async execute(
    command: ProcessRefundCommand,
    caseDetails: {
      subscriberId: string;
      refundAmount: number;
      currency: string;
    },
  ): Promise<any> {
    // 1. Process the refund
    const result = await this.processRefundUseCase.execute(command);

    // 2. Notify subscriber about refund
    if (this.notificationService) {
      try {
        await this.notificationService.notifyLitigationRefundProcessed({
          caseId: command.caseId,
          caseNumber: result.caseNumber,
          subscriberId: caseDetails.subscriberId,
          refundAmount: caseDetails.refundAmount,
          currency: caseDetails.currency,
        });
      } catch (error) {
        this.logger.error('Failed to send refund notification:', error);
      }
    }

    return result;
  }
}
