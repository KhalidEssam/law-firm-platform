// src/core/application/routing/services/routing-integration.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import {
    type IRoutingRuleRepository,
    ROUTING_RULE_REPOSITORY,
} from '../ports/routing-rule.repository';
import { AutoAssignRequestUseCase } from '../use-cases/auto-assign.use-cases';
import { AssignmentResult, AutoAssignRequestDto } from '../dto/routing-rule.dto';
import { RequestType } from '../../../domain/routing/value-objects/request-type.vo';

/**
 * Request information for auto-assignment
 */
export interface AutoAssignableRequest {
    id: string;
    requestType: RequestType | string;
    subscriberId: string;
    category?: string;
    urgency?: string;
    subscriberTier?: string;
    amount?: number;
    region?: string;
    specializations?: string[];
}

/**
 * RoutingIntegrationService
 *
 * A service that integrates auto-routing into request creation workflows.
 * This service can be injected into any request module to automatically
 * assign requests to providers based on configured routing rules.
 */
@Injectable()
export class RoutingIntegrationService {
    private readonly logger = new Logger(RoutingIntegrationService.name);

    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
        private readonly autoAssignUseCase: AutoAssignRequestUseCase,
    ) { }

    /**
     * Attempt to auto-assign a request to a provider
     *
     * This method is safe to call after creating any type of request.
     * If no matching routing rule is found or no provider is available,
     * the request will remain unassigned (pending manual assignment).
     *
     * @param request The request to auto-assign
     * @returns Assignment result with success status and details
     */
    async tryAutoAssign(request: AutoAssignableRequest): Promise<AssignmentResult> {
        try {
            this.logger.log(
                `Attempting auto-assignment for ${request.requestType} request ${request.id}`
            );

            const dto: AutoAssignRequestDto = {
                requestId: request.id,
                requestType: request.requestType as string,
                subscriberId: request.subscriberId,
                category: request.category,
                urgency: request.urgency,
                subscriberTier: request.subscriberTier,
                amount: request.amount,
                region: request.region,
                specializations: request.specializations,
            };

            const result = await this.autoAssignUseCase.execute(dto);

            if (result.success) {
                this.logger.log(
                    `Successfully assigned ${request.requestType} request ${request.id} ` +
                    `to provider ${result.providerId} using rule "${result.ruleName}"`
                );
            } else {
                this.logger.log(
                    `Auto-assignment not performed for request ${request.id}: ${result.reason}`
                );
            }

            return result;
        } catch (error) {
            this.logger.error(
                `Error during auto-assignment for request ${request.id}: ${error.message}`,
                error.stack
            );

            // Return a failure result, don't throw - auto-assignment should not break request creation
            return {
                success: false,
                requestId: request.id,
                reason: `Auto-assignment error: ${error.message}`,
            };
        }
    }

    /**
     * Check if auto-routing is available for a request type
     */
    async hasRoutingRules(requestType: RequestType | string): Promise<boolean> {
        const rules = await this.ruleRepo.findActiveByRequestType(requestType);
        return rules.length > 0;
    }

    /**
     * Get the number of active routing rules for a request type
     */
    async getActiveRuleCount(requestType: RequestType | string): Promise<number> {
        const rules = await this.ruleRepo.findActiveByRequestType(requestType);
        return rules.length;
    }

    /**
     * Auto-assign a consultation request
     */
    async autoAssignConsultation(
        requestId: string,
        subscriberId: string,
        options?: {
            category?: string;
            urgency?: string;
            subscriberTier?: string;
        }
    ): Promise<AssignmentResult> {
        return this.tryAutoAssign({
            id: requestId,
            requestType: RequestType.CONSULTATION,
            subscriberId,
            ...options,
        });
    }

    /**
     * Auto-assign a legal opinion request
     */
    async autoAssignLegalOpinion(
        requestId: string,
        subscriberId: string,
        options?: {
            category?: string;
            urgency?: string;
            subscriberTier?: string;
        }
    ): Promise<AssignmentResult> {
        return this.tryAutoAssign({
            id: requestId,
            requestType: RequestType.LEGAL_OPINION,
            subscriberId,
            ...options,
        });
    }

    /**
     * Auto-assign a service request
     */
    async autoAssignServiceRequest(
        requestId: string,
        subscriberId: string,
        options?: {
            category?: string;
            urgency?: string;
            subscriberTier?: string;
            amount?: number;
        }
    ): Promise<AssignmentResult> {
        return this.tryAutoAssign({
            id: requestId,
            requestType: RequestType.SERVICE,
            subscriberId,
            ...options,
        });
    }

    /**
     * Auto-assign a litigation case
     */
    async autoAssignLitigationCase(
        requestId: string,
        subscriberId: string,
        options?: {
            category?: string;
            urgency?: string;
            subscriberTier?: string;
            amount?: number;
        }
    ): Promise<AssignmentResult> {
        return this.tryAutoAssign({
            id: requestId,
            requestType: RequestType.LITIGATION,
            subscriberId,
            ...options,
        });
    }

    /**
     * Auto-assign a call request
     */
    async autoAssignCallRequest(
        requestId: string,
        subscriberId: string,
        options?: {
            category?: string;
            urgency?: string;
            subscriberTier?: string;
        }
    ): Promise<AssignmentResult> {
        return this.tryAutoAssign({
            id: requestId,
            requestType: RequestType.CALL,
            subscriberId,
            ...options,
        });
    }
}
