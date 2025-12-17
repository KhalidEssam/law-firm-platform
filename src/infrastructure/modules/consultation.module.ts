// ============================================
// CONSULTATION REQUEST MODULE (NestJS)
// Dependency Injection Configuration
// ============================================

import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MembershipModule } from './membership.module';
import { NotificationModule } from '../../interface/notification/notification.module';

// Repository
import { ConsultationRequestRepository } from '../persistence/consultation/prisma.repository';

// Use Cases - 13 Core Use Cases
import {
    CreateConsultationRequestUseCase,
    GetConsultationRequestUseCase,
    ListConsultationRequestsUseCase,
    AssignConsultationToProviderUseCase,
    MarkConsultationAsInProgressUseCase,
    CompleteConsultationRequestUseCase,
    CancelConsultationRequestUseCase,
    DisputeConsultationRequestUseCase,
    UploadDocumentUseCase,
    SendMessageUseCase,
    AddRatingUseCase,
    GetConsultationStatisticsUseCase,
    UpdateSLAStatusesUseCase,
} from '../../core/application/consultation/use-cases/consultation.use-cases';

// Membership-Aware Use Cases
import {
    CreateConsultationWithMembershipUseCase,
    CompleteConsultationWithUsageTrackingUseCase,
    CheckConsultationQuotaUseCase,
} from '../../core/application/consultation/use-cases/membership-aware-consultation.use-cases';

// Controller
import { ConsultationRequestController } from '../../interface/http/consultation.controller';

@Module({
    imports: [
        PrismaModule, // Import PrismaModule for database access
        forwardRef(() => MembershipModule), // Import MembershipModule for quota/usage integration
        NotificationModule, // Import NotificationModule for sending notifications
    ],
    controllers: [
        ConsultationRequestController, // REST API endpoints
    ],
    providers: [
        // ============================================
        // REPOSITORY
        // ============================================
        ConsultationRequestRepository,

        // ============================================
        // USE CASES (13 Core)
        // ============================================

        // USE CASE 1: Create
        CreateConsultationRequestUseCase,

        // USE CASE 2: Get by ID
        GetConsultationRequestUseCase,

        // USE CASE 3: List with filters
        ListConsultationRequestsUseCase,

        // USE CASE 4: Assign to provider
        AssignConsultationToProviderUseCase,

        // USE CASE 5: Mark as in progress
        MarkConsultationAsInProgressUseCase,

        // USE CASE 6: Complete
        CompleteConsultationRequestUseCase,

        // USE CASE 7: Cancel
        CancelConsultationRequestUseCase,

        // USE CASE 8: Dispute
        DisputeConsultationRequestUseCase,

        // USE CASE 9: Upload document
        UploadDocumentUseCase,

        // USE CASE 10: Send message
        SendMessageUseCase,

        // USE CASE 11: Add rating
        AddRatingUseCase,

        // USE CASE 12: Get statistics
        GetConsultationStatisticsUseCase,

        // USE CASE 13: Update SLA statuses (background job)
        UpdateSLAStatusesUseCase,

        // ============================================
        // MEMBERSHIP-AWARE USE CASES
        // ============================================
        CreateConsultationWithMembershipUseCase,
        CompleteConsultationWithUsageTrackingUseCase,
        CheckConsultationQuotaUseCase,
    ],
    exports: [
        // Export repository if other modules need it
        ConsultationRequestRepository,

        // Export use cases if other modules need to use them
        CreateConsultationRequestUseCase,
        GetConsultationRequestUseCase,
        ListConsultationRequestsUseCase,
        AssignConsultationToProviderUseCase,
        CompleteConsultationRequestUseCase,
        GetConsultationStatisticsUseCase,

        // Export membership-aware use cases
        CreateConsultationWithMembershipUseCase,
        CompleteConsultationWithUsageTrackingUseCase,
        CheckConsultationQuotaUseCase,
    ],
})
export class ConsultationRequestModule { }
