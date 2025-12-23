// src/infrastructure/modules/call-request.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

// Controller
import { CallRequestController } from '../../interface/http/call-request.controller';

// Repository Implementation
import { PrismaCallRequestRepository } from '../persistence/call-request/prisma-call-request.repository';

// Provider Validation Service
import { ProviderValidationService } from '../services/provider-validation.service';

// Provider Module (for provider repositories)
import { ProviderModule } from './provider.module';

// Integration Modules
import { NotificationModule } from '../../interface/notification/notification.module';
import { MembershipModule } from './membership.module';
import { RoutingModule } from './routing.module';

// Core Use Cases
import {
    CreateCallRequestUseCase,
    GetCallRequestByIdUseCase,
    GetCallRequestsUseCase,
    AssignProviderUseCase,
    ScheduleCallUseCase,
    RescheduleCallUseCase,
    StartCallUseCase,
    EndCallUseCase,
    CancelCallUseCase,
    MarkNoShowUseCase,
    UpdateCallLinkUseCase,
    GetSubscriberCallsUseCase,
    GetProviderCallsUseCase,
    GetUpcomingCallsUseCase,
    GetOverdueCallsUseCase,
    GetCallMinutesSummaryUseCase,
    CheckProviderAvailabilityUseCase,
    GetScheduledCallsUseCase,
} from '../../core/application/call-request/use-cases/call-request.use-cases';

// Membership-Aware Use Cases
import {
    CreateCallRequestWithMembershipUseCase,
    EndCallWithUsageTrackingUseCase,
    CheckCallQuotaUseCase,
} from '../../core/application/call-request/use-cases/membership';

// Routing-Aware Use Cases
import {
    CreateCallRequestWithRoutingUseCase,
} from '../../core/application/call-request/use-cases/routing';

@Module({
    imports: [
        PrismaModule,
        ProviderModule, // For provider validation (ProviderUser/ProviderProfile repositories)
        forwardRef(() => NotificationModule), // For sending notifications
        forwardRef(() => MembershipModule), // For quota checking/consumption
        forwardRef(() => RoutingModule), // For auto-assignment
    ],
    controllers: [CallRequestController],
    providers: [
        // Repository
        {
            provide: 'ICallRequestRepository',
            useClass: PrismaCallRequestRepository,
        },

        // Provider Validation Service
        {
            provide: 'IProviderValidationService',
            useClass: ProviderValidationService,
        },

        // ============================================
        // CORE USE CASES
        // ============================================
        CreateCallRequestUseCase,
        GetCallRequestByIdUseCase,
        GetCallRequestsUseCase,
        AssignProviderUseCase,
        ScheduleCallUseCase,
        RescheduleCallUseCase,
        StartCallUseCase,
        EndCallUseCase,
        CancelCallUseCase,
        MarkNoShowUseCase,
        UpdateCallLinkUseCase,
        GetSubscriberCallsUseCase,
        GetProviderCallsUseCase,
        GetUpcomingCallsUseCase,
        GetOverdueCallsUseCase,
        GetCallMinutesSummaryUseCase,
        CheckProviderAvailabilityUseCase,
        GetScheduledCallsUseCase,

        // ============================================
        // MEMBERSHIP-AWARE USE CASES
        // ============================================
        CreateCallRequestWithMembershipUseCase,
        EndCallWithUsageTrackingUseCase,
        CheckCallQuotaUseCase,

        // ============================================
        // ROUTING-AWARE USE CASES
        // ============================================
        CreateCallRequestWithRoutingUseCase,
    ],
    exports: [
        'ICallRequestRepository',
        'IProviderValidationService',
        // Core Use Cases
        CreateCallRequestUseCase,
        GetCallRequestByIdUseCase,
        GetCallRequestsUseCase,
        ScheduleCallUseCase,
        StartCallUseCase,
        EndCallUseCase,
        GetCallMinutesSummaryUseCase,
        // Membership-Aware Use Cases
        CreateCallRequestWithMembershipUseCase,
        EndCallWithUsageTrackingUseCase,
        CheckCallQuotaUseCase,
        // Routing-Aware Use Cases
        CreateCallRequestWithRoutingUseCase,
    ],
})
export class CallRequestModule {}
