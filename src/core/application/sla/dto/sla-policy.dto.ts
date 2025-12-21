// src/core/application/sla/dto/sla-policy.dto.ts

import { RequestType } from '../../../domain/sla/value-objects/request-type.vo';
import { Priority } from '../../../domain/sla/value-objects/priority.vo';
import { SLAStatus } from '../../../domain/sla/value-objects/sla-status.vo';

/**
 * Create SLA Policy DTO
 */
export interface CreateSLAPolicyDto {
    name: string;
    requestType: RequestType | string;
    priority?: Priority | string;
    responseTime: number;      // Minutes
    resolutionTime: number;    // Minutes
    escalationTime?: number;   // Minutes
    isActive?: boolean;
}

/**
 * Update SLA Policy DTO
 */
export interface UpdateSLAPolicyDto {
    name?: string;
    responseTime?: number;
    resolutionTime?: number;
    escalationTime?: number | null;
    isActive?: boolean;
}

/**
 * SLA Policy Response DTO
 */
export interface SLAPolicyResponseDto {
    id: string;
    name: string;
    requestType: string;
    priority: string;
    responseTime: number;
    resolutionTime: number;
    escalationTime: number | null;
    responseTimeFormatted: string;
    resolutionTimeFormatted: string;
    escalationTimeFormatted: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Apply SLA to Request DTO
 */
export interface ApplySLAToRequestDto {
    requestId: string;
    requestType: RequestType | string;
    priority?: Priority | string;
    startDate?: Date;
}

/**
 * SLA Deadlines Response DTO
 */
export interface SLADeadlinesResponseDto {
    requestId: string;
    policyId: string | null;
    responseDeadline: Date;
    resolutionDeadline: Date;
    escalationDeadline: Date | null;
    createdAt: Date;
}

/**
 * Check SLA Status DTO
 */
export interface CheckSLAStatusDto {
    requestId: string;
    requestType: RequestType | string;
    priority: Priority | string;
    responseDeadline: Date;
    resolutionDeadline: Date;
    escalationDeadline?: Date;
    createdAt: Date;
    respondedAt?: Date;
    resolvedAt?: Date;
}

/**
 * SLA Status Response DTO
 */
export interface SLAStatusResponseDto {
    requestId: string;
    requestType: string;
    priority: string;
    status: SLAStatus;
    responseStatus: SLAStatus;
    resolutionStatus: SLAStatus;
    deadlines: {
        response: Date;
        resolution: Date;
        escalation: Date | null;
    };
    timeRemaining: {
        response: string;
        resolution: string;
    };
    percentElapsed: {
        response: number;
        resolution: number;
    };
    isEscalationRequired: boolean;
    policyId: string | null;
}

/**
 * Breached Requests Query DTO
 */
export interface GetBreachedRequestsDto {
    requestType?: RequestType | string;
    breachType?: 'response' | 'resolution' | 'all';
    limit?: number;
    offset?: number;
}

/**
 * Breach Info Response DTO
 */
export interface SLABreachResponseDto {
    requestId: string;
    requestType: string;
    breachType: 'response' | 'resolution';
    deadline: Date;
    breachedAt: Date;
    overdueDuration: string;
}

/**
 * At Risk Requests Query DTO
 */
export interface GetAtRiskRequestsDto {
    requestType?: RequestType | string;
    threshold?: number;  // Percentage (default 75)
    limit?: number;
    offset?: number;
}

/**
 * List SLA Policies Query DTO
 */
export interface ListSLAPoliciesDto {
    requestType?: RequestType | string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}
