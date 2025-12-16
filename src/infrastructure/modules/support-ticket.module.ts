// ============================================
// SUPPORT TICKET MODULE
// src/infrastructure/modules/support-ticket.module.ts
// ============================================

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

// Controller
import { SupportTicketController } from '../../interface/http/support-ticket.controller';

// Repository
import { PrismaSupportTicketRepository } from '../persistence/support-ticket/prisma-support-ticket.repository';

// Use Cases
import {
    CreateSupportTicketUseCase,
    GetSupportTicketByIdUseCase,
    GetSupportTicketByNumberUseCase,
    ListSupportTicketsUseCase,
    GetUserSupportTicketsUseCase,
    GetAssignedTicketsUseCase,
    AssignTicketUseCase,
    StartTicketProgressUseCase,
    ResolveTicketUseCase,
    CloseTicketUseCase,
    ReopenTicketUseCase,
    UpdateTicketPriorityUseCase,
    UpdateTicketDetailsUseCase,
    GetOpenTicketsUseCase,
    GetActiveTicketsUseCase,
    GetUnassignedTicketsUseCase,
    GetHighPriorityTicketsUseCase,
    GetOverdueTicketsUseCase,
    GetTicketsRequiringAttentionUseCase,
    GetTicketsByCategoryUseCase,
    GetSupportTicketStatisticsUseCase,
    GetAgentWorkloadUseCase,
    DeleteSupportTicketUseCase,
} from '../../core/application/support-ticket/use-cases/support-ticket.use-cases';

@Module({
    imports: [PrismaModule],
    controllers: [SupportTicketController],
    providers: [
        // ============================================
        // REPOSITORY
        // ============================================
        {
            provide: 'ISupportTicketRepository',
            useClass: PrismaSupportTicketRepository,
        },

        // ============================================
        // USE CASES
        // ============================================
        CreateSupportTicketUseCase,
        GetSupportTicketByIdUseCase,
        GetSupportTicketByNumberUseCase,
        ListSupportTicketsUseCase,
        GetUserSupportTicketsUseCase,
        GetAssignedTicketsUseCase,
        AssignTicketUseCase,
        StartTicketProgressUseCase,
        ResolveTicketUseCase,
        CloseTicketUseCase,
        ReopenTicketUseCase,
        UpdateTicketPriorityUseCase,
        UpdateTicketDetailsUseCase,
        GetOpenTicketsUseCase,
        GetActiveTicketsUseCase,
        GetUnassignedTicketsUseCase,
        GetHighPriorityTicketsUseCase,
        GetOverdueTicketsUseCase,
        GetTicketsRequiringAttentionUseCase,
        GetTicketsByCategoryUseCase,
        GetSupportTicketStatisticsUseCase,
        GetAgentWorkloadUseCase,
        DeleteSupportTicketUseCase,
    ],
    exports: [
        // Repository
        'ISupportTicketRepository',

        // Use Cases commonly used by other modules
        CreateSupportTicketUseCase,
        GetSupportTicketByIdUseCase,
        GetSupportTicketByNumberUseCase,
        ListSupportTicketsUseCase,
        GetUserSupportTicketsUseCase,
        AssignTicketUseCase,
        ResolveTicketUseCase,
        CloseTicketUseCase,
        GetOpenTicketsUseCase,
        GetSupportTicketStatisticsUseCase,
    ],
})
export class SupportTicketModule {}
