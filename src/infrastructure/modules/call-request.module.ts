// src/infrastructure/modules/call-request.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

// Controller
import { CallRequestController } from '../../interface/http/call-request.controller';

// Repository Implementation
import { PrismaCallRequestRepository } from '../persistence/call-request/prisma-call-request.repository';

// Use Cases
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

// Integration modules (to be added)
// import { NotificationModule } from '../../interface/notification/notification.module';
// import { MembershipModule } from './membership.module';

@Module({
    imports: [
        PrismaModule,
        // forwardRef(() => NotificationModule), // For sending notifications
        // forwardRef(() => MembershipModule),   // For quota checking/consumption
    ],
    controllers: [CallRequestController],
    providers: [
        // Repository
        {
            provide: 'ICallRequestRepository',
            useClass: PrismaCallRequestRepository,
        },

        // Use Cases
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
    ],
    exports: [
        'ICallRequestRepository',
        CreateCallRequestUseCase,
        GetCallRequestByIdUseCase,
        GetCallRequestsUseCase,
        ScheduleCallUseCase,
        StartCallUseCase,
        EndCallUseCase,
        GetCallMinutesSummaryUseCase,
    ],
})
export class CallRequestModule {}
