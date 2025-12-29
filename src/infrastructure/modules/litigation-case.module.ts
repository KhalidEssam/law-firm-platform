// ============================================
// LITIGATION CASE MODULE
// Module Registration with All Dependencies
// ============================================

import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MembershipModule } from './membership.module';
import { NotificationModule } from '../../interface/notification/notification.module';

// Controller
import { LitigationCaseController } from '../../interface/http/litigation-case.controller';

// Repository
import { PrismaLitigationCaseRepository } from '../persistence/litigation-case/prisma.repository';

// Unit of Work
import {
  PrismaLitigationUnitOfWork,
  LITIGATION_UNIT_OF_WORK,
} from '../persistence/litigation-case/prisma-litigation.uow';

// Use Cases
import {
  CreateLitigationCaseUseCase,
  UpdateLitigationCaseUseCase,
  AssignProviderUseCase,
  SendQuoteUseCase,
  AcceptQuoteUseCase,
  MarkAsPaidUseCase,
  ActivateCaseUseCase,
  CloseCaseUseCase,
  CancelCaseUseCase,
  ProcessRefundUseCase,
  GetLitigationCaseUseCase,
  ListLitigationCasesUseCase,
  GetMyCasesUseCase,
  GetProviderCasesUseCase,
  GetLitigationStatisticsUseCase,
  DeleteLitigationCaseUseCase,
} from '../../core/application/litigation-case/use-cases/litigation-case.use-cases';

// Membership-Aware Use Cases
import {
  CreateLitigationWithMembershipUseCase,
  CheckLitigationQuotaUseCase,
  CloseLitigationWithUsageTrackingUseCase,
} from '../../core/application/litigation-case/use-cases/membership-aware-litigation.use-cases';

// Notification-Aware Use Cases
import {
  CreateLitigationWithNotificationUseCase,
  AssignProviderWithNotificationUseCase,
  SendQuoteWithNotificationUseCase,
  AcceptQuoteWithNotificationUseCase,
  MarkAsPaidWithNotificationUseCase,
  ActivateCaseWithNotificationUseCase,
  CloseCaseWithNotificationUseCase,
  CancelCaseWithNotificationUseCase,
  ProcessRefundWithNotificationUseCase,
} from '../../core/application/litigation-case/use-cases/notification-aware-litigation.use-cases';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => MembershipModule), // Membership quota/usage integration
    forwardRef(() => NotificationModule), // Notification triggers integration
  ],
  controllers: [LitigationCaseController],
  providers: [
    // Repository
    {
      provide: 'ILitigationCaseRepository',
      useClass: PrismaLitigationCaseRepository,
    },

    // Unit of Work
    {
      provide: LITIGATION_UNIT_OF_WORK,
      useClass: PrismaLitigationUnitOfWork,
    },

    // Use Cases
    CreateLitigationCaseUseCase,
    UpdateLitigationCaseUseCase,
    AssignProviderUseCase,
    SendQuoteUseCase,
    AcceptQuoteUseCase,
    MarkAsPaidUseCase,
    ActivateCaseUseCase,
    CloseCaseUseCase,
    CancelCaseUseCase,
    ProcessRefundUseCase,
    GetLitigationCaseUseCase,
    ListLitigationCasesUseCase,
    GetMyCasesUseCase,
    GetProviderCasesUseCase,
    GetLitigationStatisticsUseCase,
    DeleteLitigationCaseUseCase,

    // Membership-Aware Use Cases
    CreateLitigationWithMembershipUseCase,
    CheckLitigationQuotaUseCase,
    CloseLitigationWithUsageTrackingUseCase,

    // Notification-Aware Use Cases
    CreateLitigationWithNotificationUseCase,
    AssignProviderWithNotificationUseCase,
    SendQuoteWithNotificationUseCase,
    AcceptQuoteWithNotificationUseCase,
    MarkAsPaidWithNotificationUseCase,
    ActivateCaseWithNotificationUseCase,
    CloseCaseWithNotificationUseCase,
    CancelCaseWithNotificationUseCase,
    ProcessRefundWithNotificationUseCase,
  ],
  exports: [
    'ILitigationCaseRepository',
    LITIGATION_UNIT_OF_WORK,
    CreateLitigationCaseUseCase,
    UpdateLitigationCaseUseCase,
    AssignProviderUseCase,
    SendQuoteUseCase,
    AcceptQuoteUseCase,
    MarkAsPaidUseCase,
    ActivateCaseUseCase,
    CloseCaseUseCase,
    CancelCaseUseCase,
    ProcessRefundUseCase,
    GetLitigationCaseUseCase,
    ListLitigationCasesUseCase,
    GetMyCasesUseCase,
    GetProviderCasesUseCase,
    GetLitigationStatisticsUseCase,
    DeleteLitigationCaseUseCase,

    // Export membership-aware use cases
    CreateLitigationWithMembershipUseCase,
    CheckLitigationQuotaUseCase,
    CloseLitigationWithUsageTrackingUseCase,

    // Export notification-aware use cases
    CreateLitigationWithNotificationUseCase,
    AssignProviderWithNotificationUseCase,
    SendQuoteWithNotificationUseCase,
    AcceptQuoteWithNotificationUseCase,
    MarkAsPaidWithNotificationUseCase,
    ActivateCaseWithNotificationUseCase,
    CloseCaseWithNotificationUseCase,
    CancelCaseWithNotificationUseCase,
    ProcessRefundWithNotificationUseCase,
  ],
})
export class LitigationCaseModule {}
