// src/core/application/routing/ports/routing-rule.repository.ts

import { RoutingRule } from '../../../domain/routing/entities/routing-rule.entity';
import { RequestType } from '../../../domain/routing/value-objects/request-type.vo';

/**
 * Filter options for querying routing rules
 */
export interface RoutingRuleFilters {
    requestType?: RequestType | string;
    isActive?: boolean;
    search?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
    limit?: number;
    offset?: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    limit: number;
    offset: number;
}

/**
 * Round-robin state for tracking last assigned provider
 */
export interface RoundRobinState {
    ruleId: string;
    lastAssignedProviderId: string;
    lastAssignedIndex: number;
    updatedAt: Date;
}

/**
 * RoutingRule Repository Interface
 * Defines the contract for routing rule persistence
 */
export interface IRoutingRuleRepository {
    // ============================================
    // CRUD Operations
    // ============================================

    /**
     * Create a new routing rule
     */
    create(rule: RoutingRule): Promise<RoutingRule>;

    /**
     * Update an existing routing rule
     */
    update(rule: RoutingRule): Promise<RoutingRule>;

    /**
     * Delete a routing rule by ID
     */
    delete(id: string): Promise<void>;

    /**
     * Find a routing rule by ID
     */
    findById(id: string): Promise<RoutingRule | null>;

    /**
     * Find a routing rule by name
     */
    findByName(name: string): Promise<RoutingRule | null>;

    // ============================================
    // Query Operations
    // ============================================

    /**
     * Find all routing rules with optional filters and pagination
     */
    findAll(
        filters?: RoutingRuleFilters,
        pagination?: PaginationOptions,
    ): Promise<PaginatedResult<RoutingRule>>;

    /**
     * Find active rules for a specific request type
     * Returns rules ordered by priority (highest first)
     */
    findActiveByRequestType(requestType: RequestType | string): Promise<RoutingRule[]>;

    /**
     * Find all active rules
     */
    findAllActive(): Promise<RoutingRule[]>;

    /**
     * Count rules by request type
     */
    countByRequestType(requestType: RequestType | string): Promise<number>;

    /**
     * Check if a rule with the given name exists
     */
    existsByName(name: string): Promise<boolean>;

    // ============================================
    // Round Robin State Management
    // ============================================

    /**
     * Get the round-robin state for a rule
     */
    getRoundRobinState(ruleId: string): Promise<RoundRobinState | null>;

    /**
     * Update the round-robin state for a rule
     */
    updateRoundRobinState(
        ruleId: string,
        providerId: string,
        providerIndex: number,
    ): Promise<void>;
}

/**
 * Repository token for dependency injection
 */
export const ROUTING_RULE_REPOSITORY = Symbol('ROUTING_RULE_REPOSITORY');
