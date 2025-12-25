// src/core/application/routing/use-cases/auto-assign.use-cases.ts

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
    type IRoutingRuleRepository,
    ROUTING_RULE_REPOSITORY,
} from '../ports/routing-rule.repository';
import {
    type IRoutingDataProvider,
    ROUTING_DATA_PROVIDER,
} from '../ports/routing-data-provider';
import { RoutingRule } from '../../../domain/routing/entities/routing-rule.entity';
import { RoutingStrategy } from '../../../domain/routing/value-objects/routing-strategy.vo';
import { RequestContext } from '../../../domain/routing/value-objects/routing-conditions.vo';
import {
    AutoAssignRequestDto,
    AssignmentResult,
    ProviderWorkload,
    ReassignRequestDto,
} from '../dto/routing-rule.dto';

// ============================================
// AUTO ASSIGN REQUEST USE CASE
// ============================================

@Injectable()
export class AutoAssignRequestUseCase {
    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
        @Inject(ROUTING_DATA_PROVIDER)
        private readonly dataProvider: IRoutingDataProvider,
    ) {}

    /**
     * Automatically assign a request to a provider based on routing rules
     */
    async execute(dto: AutoAssignRequestDto): Promise<AssignmentResult> {
        // Build request context
        const context: RequestContext = {
            requestType: dto.requestType,
            category: dto.category,
            urgency: dto.urgency,
            subscriberTier: dto.subscriberTier,
            subscriberId: dto.subscriberId,
            amount: dto.amount,
            region: dto.region,
            specializations: dto.specializations,
        };

        // Find matching routing rule
        const rules = await this.ruleRepo.findActiveByRequestType(dto.requestType);
        let matchingRule: RoutingRule | null = null;

        for (const rule of rules) {
            if (rule.matchesRequest(context)) {
                matchingRule = rule;
                break;
            }
        }

        // If no rule matches or rule is manual, return no assignment
        if (!matchingRule) {
            return {
                success: false,
                requestId: dto.requestId,
                reason: 'No matching routing rule found for this request',
            };
        }

        if (!matchingRule.supportsAutoAssignment()) {
            return {
                success: false,
                requestId: dto.requestId,
                ruleId: matchingRule.id,
                ruleName: matchingRule.name,
                strategy: matchingRule.routingStrategy,
                reason: 'Routing rule requires manual assignment',
            };
        }

        // Get eligible providers
        const allProviders = await this.dataProvider.getProviderInfoForRouting(dto.requestType);
        const eligibleProviders = matchingRule.getEligibleProviders(allProviders);

        if (eligibleProviders.length === 0) {
            return {
                success: false,
                requestId: dto.requestId,
                ruleId: matchingRule.id,
                ruleName: matchingRule.name,
                strategy: matchingRule.routingStrategy,
                reason: 'No eligible providers available for this request',
            };
        }

        // Get round-robin state if needed
        let lastAssignedIndex: number | undefined;
        if (matchingRule.routingStrategy === RoutingStrategy.ROUND_ROBIN) {
            const state = await this.ruleRepo.getRoundRobinState(matchingRule.id);
            if (state) {
                // Find the index of the last assigned provider in eligible providers
                const lastProviderIndex = eligibleProviders.findIndex(
                    p => p.id === state.lastAssignedProviderId
                );
                if (lastProviderIndex >= 0) {
                    lastAssignedIndex = lastProviderIndex;
                }
            }
        }

        // Select provider based on strategy
        const selectedProvider = matchingRule.selectProvider(eligibleProviders, lastAssignedIndex);

        if (!selectedProvider) {
            return {
                success: false,
                requestId: dto.requestId,
                ruleId: matchingRule.id,
                ruleName: matchingRule.name,
                strategy: matchingRule.routingStrategy,
                reason: 'Could not select a provider with the current strategy',
            };
        }

        // Update round-robin state
        if (matchingRule.routingStrategy === RoutingStrategy.ROUND_ROBIN) {
            const providerIndex = eligibleProviders.findIndex(p => p.id === selectedProvider.id);
            await this.ruleRepo.updateRoundRobinState(
                matchingRule.id,
                selectedProvider.id,
                providerIndex,
            );
        }

        // Perform the assignment in the database
        await this.dataProvider.assignRequestToProvider({
            requestId: dto.requestId,
            requestType: dto.requestType,
            providerId: selectedProvider.id,
            assignedAt: new Date(),
        });

        // Get provider name for response
        const providerUser = await this.dataProvider.getProviderUserDetails(selectedProvider.id);

        return {
            success: true,
            requestId: dto.requestId,
            providerId: selectedProvider.id,
            providerName: providerUser?.fullName || providerUser?.username || 'Unknown',
            ruleId: matchingRule.id,
            ruleName: matchingRule.name,
            strategy: matchingRule.routingStrategy,
        };
    }
}

// ============================================
// REASSIGN REQUEST USE CASE
// ============================================

@Injectable()
export class ReassignRequestUseCase {
    constructor(
        @Inject(ROUTING_DATA_PROVIDER)
        private readonly dataProvider: IRoutingDataProvider,
    ) {}

    /**
     * Reassign a request to a different provider
     */
    async execute(dto: ReassignRequestDto): Promise<AssignmentResult> {
        // Verify the new provider exists and is active
        const providerCheck = await this.dataProvider.verifyProviderAvailable(dto.newProviderId);

        if (!providerCheck.isAvailable) {
            throw new NotFoundException(
                `Provider with ID ${dto.newProviderId} not found or not available`
            );
        }

        // Update the request
        await this.dataProvider.updateRequestProvider({
            requestId: dto.requestId,
            requestType: dto.requestType,
            providerId: dto.newProviderId,
        });

        return {
            success: true,
            requestId: dto.requestId,
            providerId: dto.newProviderId,
            providerName: providerCheck.fullName || providerCheck.username || 'Unknown',
            reason: dto.reason || 'Manual reassignment',
        };
    }
}

// ============================================
// GET PROVIDER WORKLOAD USE CASE
// ============================================

@Injectable()
export class GetProviderWorkloadUseCase {
    constructor(
        @Inject(ROUTING_DATA_PROVIDER)
        private readonly dataProvider: IRoutingDataProvider,
    ) {}

    /**
     * Get workload information for all providers
     */
    async execute(): Promise<ProviderWorkload[]> {
        const providers = await this.dataProvider.getAvailableProviders();
        const workloads: ProviderWorkload[] = [];

        for (const p of providers) {
            const [active, pending, inProgress, completedToday, rating] = await Promise.all([
                this.dataProvider.getProviderActiveRequestCount(p.userId),
                this.dataProvider.getProviderRequestCountByStatus(p.userId, ['pending']),
                this.dataProvider.getProviderRequestCountByStatus(p.userId, ['in_progress']),
                this.dataProvider.getProviderCompletedTodayCount(p.userId),
                this.dataProvider.getProviderRating(p.providerId),
            ]);

            workloads.push({
                providerId: p.userId,
                providerName: p.fullName || p.username || 'Unknown',
                activeRequests: active,
                pendingRequests: pending,
                inProgressRequests: inProgress,
                completedToday,
                rating,
                specializations: p.specializations,
                isAvailable: p.canAcceptRequests,
            });
        }

        return workloads.sort((a, b) => a.activeRequests - b.activeRequests);
    }
}

// ============================================
// GET ROUTING STATS USE CASE
// ============================================

@Injectable()
export class GetRoutingStatsUseCase {
    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
    ) {}

    async execute(): Promise<{
        totalRules: number;
        activeRules: number;
        rulesByRequestType: Record<string, number>;
        rulesByStrategy: Record<string, number>;
    }> {
        const rules = await this.ruleRepo.findAll({}, { limit: 1000 });

        const rulesByRequestType: Record<string, number> = {};
        const rulesByStrategy: Record<string, number> = {};
        let activeRules = 0;

        for (const rule of rules.data) {
            const data = rule.toObject();

            // Count by request type
            rulesByRequestType[data.requestType] = (rulesByRequestType[data.requestType] || 0) + 1;

            // Count by strategy
            rulesByStrategy[data.routingStrategy] = (rulesByStrategy[data.routingStrategy] || 0) + 1;

            // Count active
            if (data.isActive) {
                activeRules++;
            }
        }

        return {
            totalRules: rules.total,
            activeRules,
            rulesByRequestType,
            rulesByStrategy,
        };
    }
}
