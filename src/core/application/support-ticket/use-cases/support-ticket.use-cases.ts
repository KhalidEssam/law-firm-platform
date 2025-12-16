// ============================================
// SUPPORT TICKET USE CASES
// src/core/application/support-ticket/use-cases/support-ticket.use-cases.ts
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupportTicket } from '../../../domain/support-ticket/entities/support-ticket.entity';
import { TicketStatus, TicketStatusEnum } from '../../../domain/support-ticket/value-objects/ticket-status.vo';
import { TicketCategory, TicketCategoryEnum } from '../../../domain/support-ticket/value-objects/ticket-category.vo';
import { Priority, PriorityEnum } from '../../../domain/billing/value-objects/priority.vo';
import {
    type ISupportTicketRepository,
    SupportTicketListOptions,
    SupportTicketStatistics,
} from '../../../domain/support-ticket/ports/support-ticket.repository';
import {
    CreateSupportTicketDto,
    UpdateSupportTicketDto,
    AssignTicketDto,
    UpdateTicketPriorityDto,
    ListSupportTicketsQueryDto,
} from '../dto/support-ticket.dto';

// ============================================
// CREATE SUPPORT TICKET
// ============================================
@Injectable()
export class CreateSupportTicketUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(dto: CreateSupportTicketDto): Promise<SupportTicket> {
        const category = TicketCategory.create(dto.category);
        const priority = dto.priority ? Priority.create(dto.priority) : undefined;

        const ticket = SupportTicket.create({
            subscriberId: dto.subscriberId,
            subject: dto.subject,
            description: dto.description,
            category,
            priority,
        });

        return await this.ticketRepository.create(ticket);
    }
}

// ============================================
// GET SUPPORT TICKET BY ID
// ============================================
@Injectable()
export class GetSupportTicketByIdUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(id: string): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findById(id);
        if (!ticket) {
            throw new NotFoundException(`Support ticket with ID ${id} not found`);
        }
        return ticket;
    }
}

// ============================================
// GET SUPPORT TICKET BY NUMBER
// ============================================
@Injectable()
export class GetSupportTicketByNumberUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(ticketNumber: string): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findByTicketNumber(ticketNumber);
        if (!ticket) {
            throw new NotFoundException(`Support ticket with number ${ticketNumber} not found`);
        }
        return ticket;
    }
}

// ============================================
// LIST SUPPORT TICKETS
// ============================================
@Injectable()
export class ListSupportTicketsUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(query: ListSupportTicketsQueryDto): Promise<{
        tickets: SupportTicket[];
        total: number;
    }> {
        const options: SupportTicketListOptions = {
            subscriberId: query.subscriberId,
            status: query.status as TicketStatusEnum,
            category: query.category as TicketCategoryEnum,
            priority: query.priority as PriorityEnum,
            assignedTo: query.assignedTo,
            isUnassigned: query.isUnassigned,
            fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
            toDate: query.toDate ? new Date(query.toDate) : undefined,
            limit: query.limit ?? 20,
            offset: query.offset ?? 0,
            orderBy: query.orderBy as 'createdAt' | 'priority' | 'resolvedAt' | 'updatedAt',
            orderDir: query.orderDir as 'asc' | 'desc',
        };

        const [tickets, total] = await Promise.all([
            this.ticketRepository.list(options),
            this.ticketRepository.count({
                subscriberId: query.subscriberId,
                status: query.status as TicketStatusEnum,
                category: query.category as TicketCategoryEnum,
                priority: query.priority as PriorityEnum,
                assignedTo: query.assignedTo,
                isUnassigned: query.isUnassigned,
                fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
                toDate: query.toDate ? new Date(query.toDate) : undefined,
            }),
        ]);

        return { tickets, total };
    }
}

// ============================================
// GET USER SUPPORT TICKETS
// ============================================
@Injectable()
export class GetUserSupportTicketsUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(subscriberId: string): Promise<SupportTicket[]> {
        return await this.ticketRepository.findBySubscriberId(subscriberId);
    }
}

// ============================================
// GET ASSIGNED TICKETS (for support agent)
// ============================================
@Injectable()
export class GetAssignedTicketsUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(assignedTo: string): Promise<SupportTicket[]> {
        return await this.ticketRepository.findByAssignedTo(assignedTo);
    }
}

// ============================================
// ASSIGN TICKET
// ============================================
@Injectable()
export class AssignTicketUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(id: string, dto: AssignTicketDto): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findById(id);
        if (!ticket) {
            throw new NotFoundException(`Support ticket with ID ${id} not found`);
        }

        if (!ticket.status.canBeAssigned()) {
            throw new BadRequestException(
                `Cannot assign ticket. Current status: ${ticket.status.getValue()}`
            );
        }

        const updatedTicket = ticket.assign({ assignedTo: dto.assignedTo });
        return await this.ticketRepository.update(updatedTicket);
    }
}

// ============================================
// START PROGRESS
// ============================================
@Injectable()
export class StartTicketProgressUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(id: string): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findById(id);
        if (!ticket) {
            throw new NotFoundException(`Support ticket with ID ${id} not found`);
        }

        if (!ticket.status.canStartProgress()) {
            throw new BadRequestException(
                `Cannot start progress. Current status: ${ticket.status.getValue()}`
            );
        }

        const updatedTicket = ticket.startProgress();
        return await this.ticketRepository.update(updatedTicket);
    }
}

// ============================================
// RESOLVE TICKET
// ============================================
@Injectable()
export class ResolveTicketUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(id: string): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findById(id);
        if (!ticket) {
            throw new NotFoundException(`Support ticket with ID ${id} not found`);
        }

        if (!ticket.status.canBeResolved()) {
            throw new BadRequestException(
                `Cannot resolve ticket. Current status: ${ticket.status.getValue()}`
            );
        }

        const updatedTicket = ticket.resolve();
        return await this.ticketRepository.update(updatedTicket);
    }
}

// ============================================
// CLOSE TICKET
// ============================================
@Injectable()
export class CloseTicketUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(id: string): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findById(id);
        if (!ticket) {
            throw new NotFoundException(`Support ticket with ID ${id} not found`);
        }

        if (!ticket.status.canBeClosed()) {
            throw new BadRequestException(
                `Cannot close ticket. Current status: ${ticket.status.getValue()}`
            );
        }

        const updatedTicket = ticket.close();
        return await this.ticketRepository.update(updatedTicket);
    }
}

// ============================================
// REOPEN TICKET
// ============================================
@Injectable()
export class ReopenTicketUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(id: string): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findById(id);
        if (!ticket) {
            throw new NotFoundException(`Support ticket with ID ${id} not found`);
        }

        if (!ticket.status.canBeReopened()) {
            throw new BadRequestException(
                `Cannot reopen ticket. Current status: ${ticket.status.getValue()}`
            );
        }

        const updatedTicket = ticket.reopen();
        return await this.ticketRepository.update(updatedTicket);
    }
}

// ============================================
// UPDATE TICKET PRIORITY
// ============================================
@Injectable()
export class UpdateTicketPriorityUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(id: string, dto: UpdateTicketPriorityDto): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findById(id);
        if (!ticket) {
            throw new NotFoundException(`Support ticket with ID ${id} not found`);
        }

        if (ticket.status.isFinal()) {
            throw new BadRequestException('Cannot update priority of a closed ticket');
        }

        const newPriority = Priority.create(dto.priority);
        const updatedTicket = ticket.updatePriority(newPriority);

        return await this.ticketRepository.update(updatedTicket);
    }
}

// ============================================
// UPDATE TICKET DETAILS
// ============================================
@Injectable()
export class UpdateTicketDetailsUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(id: string, dto: UpdateSupportTicketDto): Promise<SupportTicket> {
        const ticket = await this.ticketRepository.findById(id);
        if (!ticket) {
            throw new NotFoundException(`Support ticket with ID ${id} not found`);
        }

        if (ticket.status.isFinal()) {
            throw new BadRequestException('Cannot update a closed ticket');
        }

        const updatedTicket = ticket.updateDetails(
            dto.subject ?? ticket.subject,
            dto.description ?? ticket.description,
        );

        return await this.ticketRepository.update(updatedTicket);
    }
}

// ============================================
// GET OPEN TICKETS
// ============================================
@Injectable()
export class GetOpenTicketsUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(): Promise<SupportTicket[]> {
        return await this.ticketRepository.findOpenTickets();
    }
}

// ============================================
// GET ACTIVE TICKETS
// ============================================
@Injectable()
export class GetActiveTicketsUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(): Promise<SupportTicket[]> {
        return await this.ticketRepository.findActiveTickets();
    }
}

// ============================================
// GET UNASSIGNED TICKETS
// ============================================
@Injectable()
export class GetUnassignedTicketsUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(): Promise<SupportTicket[]> {
        return await this.ticketRepository.findUnassignedTickets();
    }
}

// ============================================
// GET HIGH PRIORITY TICKETS
// ============================================
@Injectable()
export class GetHighPriorityTicketsUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(): Promise<SupportTicket[]> {
        return await this.ticketRepository.findHighPriorityTickets();
    }
}

// ============================================
// GET OVERDUE TICKETS
// ============================================
@Injectable()
export class GetOverdueTicketsUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(maxAgeDays?: number): Promise<SupportTicket[]> {
        return await this.ticketRepository.findOverdueTickets(maxAgeDays);
    }
}

// ============================================
// GET TICKETS REQUIRING ATTENTION
// ============================================
@Injectable()
export class GetTicketsRequiringAttentionUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(): Promise<SupportTicket[]> {
        return await this.ticketRepository.findTicketsRequiringAttention();
    }
}

// ============================================
// GET TICKETS BY CATEGORY
// ============================================
@Injectable()
export class GetTicketsByCategoryUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(category: string): Promise<SupportTicket[]> {
        const categoryEnum = category.toLowerCase() as TicketCategoryEnum;
        return await this.ticketRepository.findByCategory(categoryEnum);
    }
}

// ============================================
// GET SUPPORT TICKET STATISTICS
// ============================================
@Injectable()
export class GetSupportTicketStatisticsUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(fromDate?: Date, toDate?: Date): Promise<SupportTicketStatistics> {
        return await this.ticketRepository.getStatistics(fromDate, toDate);
    }
}

// ============================================
// GET AGENT WORKLOAD
// ============================================
@Injectable()
export class GetAgentWorkloadUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(assignedTo: string): Promise<{
        open: number;
        inProgress: number;
        total: number;
    }> {
        return await this.ticketRepository.getAgentWorkload(assignedTo);
    }
}

// ============================================
// DELETE SUPPORT TICKET
// ============================================
@Injectable()
export class DeleteSupportTicketUseCase {
    constructor(
        @Inject('ISupportTicketRepository')
        private readonly ticketRepository: ISupportTicketRepository,
    ) {}

    async execute(id: string): Promise<void> {
        const ticket = await this.ticketRepository.findById(id);
        if (!ticket) {
            throw new NotFoundException(`Support ticket with ID ${id} not found`);
        }

        // Only allow deleting closed tickets
        if (!ticket.status.isClosed()) {
            throw new BadRequestException('Only closed tickets can be deleted');
        }

        await this.ticketRepository.softDelete(id);
    }
}
