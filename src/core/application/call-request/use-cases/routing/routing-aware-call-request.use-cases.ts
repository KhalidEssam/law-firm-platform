// ============================================
// ROUTING-AWARE CALL REQUEST USE CASES
// Integrates auto-assignment into call request creation
// src/core/application/call-request/use-cases/routing/routing-aware-call-request.use-cases.ts
// ============================================

import { Injectable, Optional, Logger } from '@nestjs/common';
import { RoutingIntegrationService } from '../../../routing/services/routing-integration.service';
import { CreateCallRequestWithMembershipUseCase, CreateCallRequestWithMembershipResult } from '../membership';
import { CreateCallRequestDto } from '../../dto/call-request.dto';
import { AssignmentResult } from '../../../routing/dto/routing-rule.dto';

// ============================================
// CREATE CALL REQUEST WITH AUTO-ROUTING
// ============================================

export interface CreateCallRequestWithRoutingResult extends CreateCallRequestWithMembershipResult {
    routingResult?: AssignmentResult;
}

@Injectable()
export class CreateCallRequestWithRoutingUseCase {
    private readonly logger = new Logger(CreateCallRequestWithRoutingUseCase.name);

    constructor(
        private readonly createWithMembershipUseCase: CreateCallRequestWithMembershipUseCase,
        @Optional()
        private readonly routingService: RoutingIntegrationService,
    ) {}

    async execute(dto: CreateCallRequestDto): Promise<CreateCallRequestWithRoutingResult> {
        // 1. Create the call request with membership validation
        const result = await this.createWithMembershipUseCase.execute(dto);

        // 2. Attempt auto-assignment if routing service is available
        let routingResult: AssignmentResult | undefined;

        if (this.routingService) {
            try {
                routingResult = await this.routingService.autoAssignCallRequest(
                    result.callRequest.id,
                    dto.subscriberId,
                    {
                        category: dto.consultationType,
                        urgency: 'normal', // Calls are typically normal priority
                    },
                );

                if (routingResult.success) {
                    this.logger.log(
                        `Auto-assigned call request ${result.callRequest.id} to provider ${routingResult.providerId}`
                    );
                }
            } catch (error) {
                // Auto-assignment failure should not fail the request creation
                this.logger.error(`Auto-assignment failed for call request ${result.callRequest.id}:`, error);
            }
        }

        return {
            ...result,
            routingResult,
        };
    }
}
