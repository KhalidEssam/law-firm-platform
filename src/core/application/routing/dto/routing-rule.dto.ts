// src/core/application/routing/dto/routing-rule.dto.ts

import { RoutingConditionsData } from '../../../domain/routing/value-objects/routing-conditions.vo';
import { ProviderTargetData } from '../../../domain/routing/value-objects/provider-target.vo';

/**
 * DTO for creating a new routing rule
 */
export interface CreateRoutingRuleDto {
    name: string;
    requestType: string;
    routingStrategy: string;
    conditions?: RoutingConditionsData | null;
    priority?: number;
    targetProviders?: ProviderTargetData | null;
    isActive?: boolean;
}

/**
 * DTO for updating an existing routing rule
 */
export interface UpdateRoutingRuleDto {
    name?: string;
    requestType?: string;
    routingStrategy?: string;
    conditions?: RoutingConditionsData | null;
    priority?: number;
    targetProviders?: ProviderTargetData | null;
    isActive?: boolean;
}

/**
 * DTO for filtering routing rules
 */
export interface FilterRoutingRulesDto {
    requestType?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}

/**
 * DTO for testing a routing rule against a request
 */
export interface TestRoutingRuleDto {
    requestType: string;
    category?: string;
    urgency?: string;
    subscriberTier?: string;
    subscriberId?: string;
    amount?: number;
    region?: string;
    specializations?: string[];
    metadata?: Record<string, any>;
}

/**
 * DTO for auto-assignment request
 */
export interface AutoAssignRequestDto {
    requestId: string;
    requestType: string;
    category?: string;
    urgency?: string;
    subscriberTier?: string;
    subscriberId: string;
    amount?: number;
    region?: string;
    specializations?: string[];
}

/**
 * DTO for reassigning a request
 */
export interface ReassignRequestDto {
    requestId: string;
    requestType: string;
    newProviderId: string;
    reason?: string;
}

/**
 * Result of an auto-assignment operation
 */
export interface AssignmentResult {
    success: boolean;
    requestId: string;
    providerId?: string;
    providerName?: string;
    ruleId?: string;
    ruleName?: string;
    strategy?: string;
    reason?: string;
}

/**
 * Provider workload information
 */
export interface ProviderWorkload {
    providerId: string;
    providerName: string;
    activeRequests: number;
    pendingRequests: number;
    inProgressRequests: number;
    completedToday: number;
    rating?: number;
    specializations?: string[];
    isAvailable: boolean;
}

/**
 * Routing statistics
 */
export interface RoutingStats {
    totalRules: number;
    activeRules: number;
    rulesByRequestType: Record<string, number>;
    rulesByStrategy: Record<string, number>;
    assignmentsToday: number;
    assignmentsThisWeek: number;
    averageAssignmentTime?: number;
    topProviders: {
        providerId: string;
        providerName: string;
        assignmentCount: number;
    }[];
}
