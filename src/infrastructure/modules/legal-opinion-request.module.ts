// ============================================
// LEGAL OPINION REQUEST MODULE
// Complete NestJS Module Configuration
// ============================================

import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MembershipModule } from './membership.module';
import { NotificationModule } from '../../interface/notification/notification.module';

// Controller
import { LegalOpinionRequestController } from 'src/interface/http/legal-opinion-request.controller';

// Repository
import { PrismaLegalOpinionRequestRepository } from '../persistence/legal-opinion/prisma.repository';

// Unit of Work
import {
  PrismaLegalOpinionUnitOfWork,
  LEGAL_OPINION_UNIT_OF_WORK,
} from '../persistence/legal-opinion/prisma-legal-opinion.uow';

// Use Cases
import { CreateOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/create-opinion-request.use-case';
import { UpdateOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/update-opinion-request.use-case';
import { SubmitOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/submit-opinion-request.use-case';
import { AssignToLawyerUseCase } from '../../core/application/legal-opinion/use-cases/assign-to-lawyer.use-case';
import { StartResearchUseCase } from '../../core/application/legal-opinion/use-cases/start-research.use-case';
import { StartDraftingUseCase } from '../../core/application/legal-opinion/use-cases/start-drafting.use-case';
import { SubmitForReviewUseCase } from '../../core/application/legal-opinion/use-cases/submit-for-review.use-case';
import { RequestRevisionUseCase } from '../../core/application/legal-opinion/use-cases/request-revision.use-case';
import { StartRevisingUseCase } from '../../core/application/legal-opinion/use-cases/start-revising.use-case';
import { CompleteOpinionUseCase } from '../../core/application/legal-opinion/use-cases/complete-opinion.use-case';
import { SetEstimatedCostUseCase } from '../../core/application/legal-opinion/use-cases/set-estimated-cost.use-case';
import { MarkAsPaidUseCase } from '../../core/application/legal-opinion/use-cases/mark-as-paid.use-case';
import { CancelOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/cancel-opinion-request.use-case';
import { RejectOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/reject-opinion-request.use-case';
import { GetOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/get-opinion-request.use-case';
import { ListOpinionRequestsUseCase } from '../../core/application/legal-opinion/use-cases/list-opinion-requests.use-case';
import { GetMyOpinionRequestsUseCase } from '../../core/application/legal-opinion/use-cases/get-my-opinion-requests.use-case';
import { GetLawyerOpinionRequestsUseCase } from '../../core/application/legal-opinion/use-cases/get-lawyer-opinion-requests.use-case';
import { GetOpinionStatisticsUseCase } from '../../core/application/legal-opinion/use-cases/get-opinion-statistics.use-case';
import { DeleteOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/delete-opinion-request.use-case';

// Membership-Aware Use Cases
import {
  CreateLegalOpinionWithMembershipUseCase,
  CheckLegalOpinionQuotaUseCase,
  CompleteLegalOpinionWithUsageTrackingUseCase,
} from '../../core/application/legal-opinion/use-cases/membership-aware-legal-opinion.use-cases';

/**
 * Legal Opinion Request Module
 *
 * This module encapsulates all functionality related to legal opinion requests:
 * - Domain entities and value objects
 * - Use cases (application logic)
 * - Repository (data persistence)
 * - Controller (HTTP endpoints)
 * - DTOs (data transfer objects)
 *
 * Architecture:
 * - Clean Architecture / Hexagonal Architecture
 * - Domain-Driven Design (DDD)
 * - CQRS pattern (separate read/write operations)
 * - Repository pattern (abstraction over data layer)
 *
 * Dependencies:
 * - PrismaModule: For database access
 * - MembershipModule: For quota/usage integration
 * - AuthModule: For authentication and authorization (imported in app.module)
 */
@Module({
  imports: [
    PrismaModule, // Database access
    forwardRef(() => MembershipModule), // Membership quota/usage integration
    NotificationModule, // Notification integration
  ],
  controllers: [
    LegalOpinionRequestController, // HTTP endpoints
  ],
  providers: [
    // ============================================
    // REPOSITORY (Infrastructure Layer)
    // ============================================
    {
      provide: 'ILegalOpinionRequestRepository',
      useClass: PrismaLegalOpinionRequestRepository,
    },

    // ============================================
    // UNIT OF WORK (Infrastructure Layer)
    // ============================================
    {
      provide: LEGAL_OPINION_UNIT_OF_WORK,
      useClass: PrismaLegalOpinionUnitOfWork,
    },

    // ============================================
    // USE CASES (Application Layer)
    // ============================================

    // Creation & Update
    CreateOpinionRequestUseCase,
    UpdateOpinionRequestUseCase,
    DeleteOpinionRequestUseCase,

    // Workflow Transitions
    SubmitOpinionRequestUseCase,
    AssignToLawyerUseCase,
    StartResearchUseCase,
    StartDraftingUseCase,
    SubmitForReviewUseCase,
    RequestRevisionUseCase,
    StartRevisingUseCase,
    CompleteOpinionUseCase,
    CancelOpinionRequestUseCase,
    RejectOpinionRequestUseCase,

    // Pricing & Payment
    SetEstimatedCostUseCase,
    MarkAsPaidUseCase,

    // Queries
    GetOpinionRequestUseCase,
    ListOpinionRequestsUseCase,
    GetMyOpinionRequestsUseCase,
    GetLawyerOpinionRequestsUseCase,
    GetOpinionStatisticsUseCase,

    // ============================================
    // MEMBERSHIP-AWARE USE CASES
    // ============================================
    CreateLegalOpinionWithMembershipUseCase,
    CheckLegalOpinionQuotaUseCase,
    CompleteLegalOpinionWithUsageTrackingUseCase,
  ],
  exports: [
    // Export repository interface for other modules
    'ILegalOpinionRequestRepository',

    // Export Unit of Work for other modules
    LEGAL_OPINION_UNIT_OF_WORK,

    // Export use cases that might be needed by other modules
    GetOpinionRequestUseCase,
    ListOpinionRequestsUseCase,
    GetOpinionStatisticsUseCase,

    // Export membership-aware use cases
    CreateLegalOpinionWithMembershipUseCase,
    CheckLegalOpinionQuotaUseCase,
    CompleteLegalOpinionWithUsageTrackingUseCase,
  ],
})
export class LegalOpinionRequestModule {}
