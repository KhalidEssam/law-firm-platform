// ============================================
// SUPPORT TICKET DTOs
// src/core/application/support-ticket/dto/support-ticket.dto.ts
// ============================================

import {
    IsString,
    IsOptional,
    IsEnum,
    IsDateString,
    MinLength,
    Min,
    IsNumber,
    IsBoolean,
} from 'class-validator';

// ============================================
// INPUT DTOs
// ============================================

export class CreateSupportTicketDto {
    @IsString()
    subscriberId: string;

    @IsString()
    @MinLength(5)
    subject: string;

    @IsString()
    @MinLength(20)
    description: string;

    @IsEnum(['technical', 'billing', 'general', 'complaint'])
    category: string;

    @IsOptional()
    @IsEnum(['low', 'normal', 'high', 'urgent'])
    priority?: string;
}

export class UpdateSupportTicketDto {
    @IsOptional()
    @IsString()
    @MinLength(5)
    subject?: string;

    @IsOptional()
    @IsString()
    @MinLength(20)
    description?: string;
}

export class AssignTicketDto {
    @IsString()
    assignedTo: string;
}

export class UpdateTicketPriorityDto {
    @IsEnum(['low', 'normal', 'high', 'urgent'])
    priority: string;
}

export class ListSupportTicketsQueryDto {
    @IsOptional()
    @IsString()
    subscriberId?: string;

    @IsOptional()
    @IsEnum(['open', 'in_progress', 'resolved', 'closed'])
    status?: string;

    @IsOptional()
    @IsEnum(['technical', 'billing', 'general', 'complaint'])
    category?: string;

    @IsOptional()
    @IsEnum(['low', 'normal', 'high', 'urgent'])
    priority?: string;

    @IsOptional()
    @IsString()
    assignedTo?: string;

    @IsOptional()
    @IsBoolean()
    isUnassigned?: boolean;

    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @IsOptional()
    @IsDateString()
    toDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    offset?: number;

    @IsOptional()
    @IsEnum(['createdAt', 'priority', 'resolvedAt', 'updatedAt'])
    orderBy?: string;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    orderDir?: string;
}

// ============================================
// OUTPUT DTOs
// ============================================

export class SupportTicketResponseDto {
    id: string;
    ticketNumber: string;
    subscriberId: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    assignedTo?: string;
    resolvedAt?: string;
    isAssigned: boolean;
    isOverdue: boolean;
    ageInDays: number;
    createdAt: string;
    updatedAt: string;
}

export class SupportTicketListResponseDto {
    tickets: SupportTicketResponseDto[];
    total: number;
    limit: number;
    offset: number;
}

export class SupportTicketStatisticsResponseDto {
    totalOpen: number;
    totalInProgress: number;
    totalResolved: number;
    totalClosed: number;
    averageResolutionTimeHours: number | null;
    byCategory: {
        technical: number;
        billing: number;
        general: number;
        complaint: number;
    };
    byPriority: {
        low: number;
        normal: number;
        high: number;
        urgent: number;
    };
    unassignedCount: number;
    overdueCount: number;
}

export class AgentWorkloadResponseDto {
    assignedTo: string;
    open: number;
    inProgress: number;
    total: number;
}
