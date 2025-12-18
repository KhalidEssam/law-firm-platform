// src/core/application/routing/use-cases/auto-assign.use-cases.ts

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    type IRoutingRuleRepository,
    ROUTING_RULE_REPOSITORY,
} from '../ports/routing-rule.repository';
import { RoutingRule } from '../../../domain/routing/entities/routing-rule.entity';
import { RoutingStrategy } from '../../../domain/routing/value-objects/routing-strategy.vo';
import { RequestContext } from '../../../domain/routing/value-objects/routing-conditions.vo';
import { ProviderInfo } from '../../../domain/routing/value-objects/provider-target.vo';
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
        private readonly prisma: PrismaService,
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
        const allProviders = await this.getAvailableProviders(dto.requestType);
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
        await this.assignRequestToProvider(dto.requestId, dto.requestType, selectedProvider.id);

        // Get provider name for response
        const providerUser = await this.prisma.user.findUnique({
            where: { id: selectedProvider.id },
            select: { fullName: true, username: true },
        });

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

    /**
     * Get all available providers with their current workload
     */
    private async getAvailableProviders(requestType: string): Promise<ProviderInfo[]> {
        // Get all active providers who can accept requests
        const providerUsers = await this.prisma.providerUser.findMany({
            where: {
                isActive: true,
                canAcceptRequests: true,
                deletedAt: null,
                provider: {
                    isActive: true,
                    verificationStatus: 'approved',
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                provider: {
                    include: {
                        specializations: {
                            include: {
                                specialization: true,
                            },
                        },
                    },
                },
            },
        });

        // Get active request counts for each provider
        const providerInfos: ProviderInfo[] = [];

        for (const pu of providerUsers) {
            const activeRequestCount = await this.getProviderActiveRequestCount(pu.userId);

            // Get average rating if available
            const rating = await this.getProviderRating(pu.providerId);

            // Get specializations
            const specializations = pu.provider.specializations.map(
                ps => ps.specialization.name
            );

            providerInfos.push({
                id: pu.userId,
                isActive: pu.isActive,
                canAcceptRequests: pu.canAcceptRequests,
                activeRequestCount,
                rating,
                specializations,
                region: undefined, // Could be added from provider profile
                isCertified: pu.provider.specializations.some(s => s.isCertified),
                experienceYears: pu.provider.specializations.reduce(
                    (max, s) => Math.max(max, s.experienceYears || 0),
                    0
                ),
            });
        }

        return providerInfos;
    }

    /**
     * Get the count of active requests for a provider
     */
    private async getProviderActiveRequestCount(providerId: string): Promise<number> {
        const activeStatuses = ['pending', 'assigned', 'in_progress', 'quote_sent'];

        const [consultations, opinions, services, litigations, calls] = await Promise.all([
            this.prisma.consultationRequest.count({
                where: { assignedProviderId: providerId, status: { in: activeStatuses } },
            }),
            this.prisma.legalOpinionRequest.count({
                where: { assignedProviderId: providerId, status: { in: activeStatuses } },
            }),
            this.prisma.serviceRequest.count({
                where: { assignedProviderId: providerId, status: { in: activeStatuses } },
            }),
            this.prisma.litigationCase.count({
                where: { assignedProviderId: providerId, status: { in: activeStatuses } },
            }),
            this.prisma.callRequest.count({
                where: { assignedProviderId: providerId, status: { in: activeStatuses } },
            }),
        ]);

        return consultations + opinions + services + litigations + calls;
    }

    /**
     * Get the average rating for a provider
     */
    private async getProviderRating(providerId: string): Promise<number | undefined> {
        const reviews = await this.prisma.providerReview.aggregate({
            where: { providerId, isPublic: true },
            _avg: { rating: true },
        });

        return reviews._avg.rating || undefined;
    }

    /**
     * Assign a request to a provider in the database
     */
    private async assignRequestToProvider(
        requestId: string,
        requestType: string,
        providerId: string,
    ): Promise<void> {
        const now = new Date();

        switch (requestType) {
            case 'consultation':
                await this.prisma.consultationRequest.update({
                    where: { id: requestId },
                    data: {
                        assignedProviderId: providerId,
                        assignedAt: now,
                        status: 'assigned',
                    },
                });
                break;

            case 'legal_opinion':
                await this.prisma.legalOpinionRequest.update({
                    where: { id: requestId },
                    data: {
                        assignedProviderId: providerId,
                        status: 'assigned',
                    },
                });
                break;

            case 'service':
                await this.prisma.serviceRequest.update({
                    where: { id: requestId },
                    data: {
                        assignedProviderId: providerId,
                        status: 'assigned',
                    },
                });
                break;

            case 'litigation':
                await this.prisma.litigationCase.update({
                    where: { id: requestId },
                    data: {
                        assignedProviderId: providerId,
                        status: 'assigned',
                    },
                });
                break;

            case 'call':
                await this.prisma.callRequest.update({
                    where: { id: requestId },
                    data: {
                        assignedProviderId: providerId,
                        status: 'assigned',
                    },
                });
                break;

            default:
                throw new BadRequestException(`Unknown request type: ${requestType}`);
        }
    }
}

// ============================================
// REASSIGN REQUEST USE CASE
// ============================================

@Injectable()
export class ReassignRequestUseCase {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Reassign a request to a different provider
     */
    async execute(dto: ReassignRequestDto): Promise<AssignmentResult> {
        // Verify the new provider exists and is active
        const provider = await this.prisma.providerUser.findFirst({
            where: {
                userId: dto.newProviderId,
                isActive: true,
                canAcceptRequests: true,
            },
            include: {
                user: {
                    select: { fullName: true, username: true },
                },
            },
        });

        if (!provider) {
            throw new NotFoundException(
                `Provider with ID ${dto.newProviderId} not found or not available`
            );
        }

        // Update the request
        await this.updateRequestProvider(dto.requestId, dto.requestType, dto.newProviderId);

        return {
            success: true,
            requestId: dto.requestId,
            providerId: dto.newProviderId,
            providerName: provider.user.fullName || provider.user.username || 'Unknown',
            reason: dto.reason || 'Manual reassignment',
        };
    }

    private async updateRequestProvider(
        requestId: string,
        requestType: string,
        providerId: string,
    ): Promise<void> {
        switch (requestType) {
            case 'consultation':
                await this.prisma.consultationRequest.update({
                    where: { id: requestId },
                    data: { assignedProviderId: providerId },
                });
                break;

            case 'legal_opinion':
                await this.prisma.legalOpinionRequest.update({
                    where: { id: requestId },
                    data: { assignedProviderId: providerId },
                });
                break;

            case 'service':
                await this.prisma.serviceRequest.update({
                    where: { id: requestId },
                    data: { assignedProviderId: providerId },
                });
                break;

            case 'litigation':
                await this.prisma.litigationCase.update({
                    where: { id: requestId },
                    data: { assignedProviderId: providerId },
                });
                break;

            case 'call':
                await this.prisma.callRequest.update({
                    where: { id: requestId },
                    data: { assignedProviderId: providerId },
                });
                break;

            default:
                throw new BadRequestException(`Unknown request type: ${requestType}`);
        }
    }
}

// ============================================
// GET PROVIDER WORKLOAD USE CASE
// ============================================

@Injectable()
export class GetProviderWorkloadUseCase {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Get workload information for all providers
     */
    async execute(): Promise<ProviderWorkload[]> {
        const providers = await this.prisma.providerUser.findMany({
            where: {
                isActive: true,
                deletedAt: null,
            },
            include: {
                user: {
                    select: { id: true, fullName: true, username: true },
                },
                provider: {
                    include: {
                        specializations: {
                            include: {
                                specialization: true,
                            },
                        },
                    },
                },
            },
        });

        const workloads: ProviderWorkload[] = [];

        for (const p of providers) {
            const [active, pending, inProgress, completedToday, rating] = await Promise.all([
                this.getActiveRequestCount(p.userId),
                this.getRequestCountByStatus(p.userId, ['pending']),
                this.getRequestCountByStatus(p.userId, ['in_progress']),
                this.getCompletedTodayCount(p.userId),
                this.getAverageRating(p.providerId),
            ]);

            workloads.push({
                providerId: p.userId,
                providerName: p.user.fullName || p.user.username || 'Unknown',
                activeRequests: active,
                pendingRequests: pending,
                inProgressRequests: inProgress,
                completedToday,
                rating,
                specializations: p.provider.specializations.map(s => s.specialization.name),
                isAvailable: p.canAcceptRequests,
            });
        }

        return workloads.sort((a, b) => a.activeRequests - b.activeRequests);
    }

    private async getActiveRequestCount(providerId: string): Promise<number> {
        const activeStatuses = ['pending', 'assigned', 'in_progress', 'quote_sent'];
        return this.getRequestCountByStatus(providerId, activeStatuses);
    }

    private async getRequestCountByStatus(providerId: string, statuses: string[]): Promise<number> {
        const [c, o, s, l, call] = await Promise.all([
            this.prisma.consultationRequest.count({
                where: { assignedProviderId: providerId, status: { in: statuses } },
            }),
            this.prisma.legalOpinionRequest.count({
                where: { assignedProviderId: providerId, status: { in: statuses } },
            }),
            this.prisma.serviceRequest.count({
                where: { assignedProviderId: providerId, status: { in: statuses } },
            }),
            this.prisma.litigationCase.count({
                where: { assignedProviderId: providerId, status: { in: statuses } },
            }),
            this.prisma.callRequest.count({
                where: { assignedProviderId: providerId, status: { in: statuses } },
            }),
        ]);
        return c + o + s + l + call;
    }

    private async getCompletedTodayCount(providerId: string): Promise<number> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [c, o, s, l, call] = await Promise.all([
            this.prisma.consultationRequest.count({
                where: {
                    assignedProviderId: providerId,
                    status: 'completed',
                    completedAt: { gte: startOfDay },
                },
            }),
            this.prisma.legalOpinionRequest.count({
                where: {
                    assignedProviderId: providerId,
                    status: 'completed',
                    completedAt: { gte: startOfDay },
                },
            }),
            this.prisma.serviceRequest.count({
                where: {
                    assignedProviderId: providerId,
                    status: 'completed',
                    completedAt: { gte: startOfDay },
                },
            }),
            this.prisma.litigationCase.count({
                where: {
                    assignedProviderId: providerId,
                    status: 'closed',
                    closedAt: { gte: startOfDay },
                },
            }),
            this.prisma.callRequest.count({
                where: {
                    assignedProviderId: providerId,
                    status: 'completed',
                    completedAt: { gte: startOfDay },
                },
            }),
        ]);
        return c + o + s + l + call;
    }

    private async getAverageRating(providerId: string): Promise<number | undefined> {
        const result = await this.prisma.providerReview.aggregate({
            where: { providerId, isPublic: true },
            _avg: { rating: true },
        });
        return result._avg.rating || undefined;
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
        private readonly prisma: PrismaService,
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
