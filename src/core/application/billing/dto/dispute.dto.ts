// ============================================
// DISPUTE DTOs
// src/core/application/billing/dto/dispute.dto.ts
// ============================================

import {
    IsString,
    IsOptional,
    IsEnum,
    IsDateString,
    IsObject,
    MinLength,
    Min,
    IsNumber,
} from 'class-validator';

// ============================================
// INPUT DTOs
// ============================================

export class CreateDisputeDto {
    @IsString()
    userId: string;

    @IsString()
    @MinLength(5)
    reason: string;

    @IsString()
    @MinLength(20)
    description: string;

    @IsOptional()
    @IsString()
    consultationId?: string;

    @IsOptional()
    @IsString()
    legalOpinionId?: string;

    @IsOptional()
    @IsString()
    serviceRequestId?: string;

    @IsOptional()
    @IsString()
    litigationCaseId?: string;

    @IsOptional()
    @IsObject()
    evidence?: Record<string, unknown>;

    @IsOptional()
    @IsEnum(['low', 'normal', 'high', 'urgent'])
    priority?: string;
}

export class EscalateDisputeDto {
    @IsString()
    escalatedTo: string;
}

export class ResolveDisputeDto {
    @IsString()
    resolvedBy: string;

    @IsString()
    @MinLength(10)
    resolution: string;
}

export class UpdateDisputePriorityDto {
    @IsEnum(['low', 'normal', 'high', 'urgent'])
    priority: string;
}

export class AddDisputeEvidenceDto {
    @IsObject()
    evidence: Record<string, unknown>;
}

export class ListDisputesQueryDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsEnum(['open', 'under_review', 'resolved', 'escalated', 'closed'])
    status?: string;

    @IsOptional()
    @IsEnum(['low', 'normal', 'high', 'urgent'])
    priority?: string;

    @IsOptional()
    @IsString()
    resolvedBy?: string;

    @IsOptional()
    @IsString()
    escalatedTo?: string;

    @IsOptional()
    @IsString()
    consultationId?: string;

    @IsOptional()
    @IsString()
    legalOpinionId?: string;

    @IsOptional()
    @IsString()
    serviceRequestId?: string;

    @IsOptional()
    @IsString()
    litigationCaseId?: string;

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
    @IsEnum(['createdAt', 'priority', 'resolvedAt', 'escalatedAt'])
    orderBy?: string;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    orderDir?: string;
}

// ============================================
// OUTPUT DTOs
// ============================================

export class DisputeResponseDto {
    id: string;
    userId: string;
    consultationId?: string;
    legalOpinionId?: string;
    serviceRequestId?: string;
    litigationCaseId?: string;
    reason: string;
    description: string;
    evidence?: Record<string, unknown>;
    status: string;
    priority: string;
    resolution?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    escalatedAt?: string;
    escalatedTo?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    ageInDays: number;
    createdAt: string;
    updatedAt: string;
}

export class DisputeListResponseDto {
    disputes: DisputeResponseDto[];
    total: number;
    limit: number;
    offset: number;
}

export class DisputeStatisticsResponseDto {
    totalOpen: number;
    totalUnderReview: number;
    totalEscalated: number;
    totalResolved: number;
    totalClosed: number;
    averageResolutionTime: number | null;
    byPriority: {
        low: number;
        normal: number;
        high: number;
        urgent: number;
    };
}
