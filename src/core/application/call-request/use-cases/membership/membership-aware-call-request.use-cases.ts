// ============================================
// MEMBERSHIP-AWARE CALL REQUEST USE CASES
// Wraps call request use cases with membership validation
// src/core/application/call-request/use-cases/membership/membership-aware-call-request.use-cases.ts
// ============================================

import {
  Injectable,
  BadRequestException,
  Optional,
  Logger,
} from '@nestjs/common';
import {
  MembershipIntegrationService,
  ServiceType,
  MembershipValidationResult,
} from '../../../membership/services/membership-integration.service';
import { CreateCallRequestUseCase } from '../request/create-call-request.use-case';
import { EndCallUseCase } from '../session/end-call.use-case';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import { CreateCallRequestDto } from '../../dto/call-request.dto';

// ============================================
// CREATE CALL REQUEST WITH MEMBERSHIP CHECK
// ============================================

export interface CreateCallRequestWithMembershipResult {
  callRequest: CallRequest;
  membershipInfo?: {
    membershipId: string;
    tierName: string | null;
    quotaRemaining: number | null;
    isUnlimited: boolean;
  };
}

@Injectable()
export class CreateCallRequestWithMembershipUseCase {
  private readonly logger = new Logger(
    CreateCallRequestWithMembershipUseCase.name,
  );

  constructor(
    @Optional()
    private readonly membershipService: MembershipIntegrationService,
    private readonly createCallRequestUseCase: CreateCallRequestUseCase,
  ) {}

  async execute(
    dto: CreateCallRequestDto,
  ): Promise<CreateCallRequestWithMembershipResult> {
    let validation: MembershipValidationResult | null = null;

    // 1. Validate membership and quota if service is available
    if (this.membershipService) {
      validation = await this.membershipService.validateMembershipForService(
        dto.subscriberId,
        ServiceType.CALL,
      );

      if (!validation.isValid) {
        throw new BadRequestException(
          validation.errorMessage ||
            'Cannot create call request: membership validation failed',
        );
      }
    }

    // 2. Create the call request
    const callRequest = await this.createCallRequestUseCase.execute(dto);

    // 3. Record the service usage (quota will be consumed when call ends based on minutes)
    // For calls, we don't consume quota on creation - we consume when call ends based on actual minutes
    // However, we can optionally record the initial request
    if (this.membershipService && validation?.membershipId) {
      try {
        // Note: For calls, actual quota consumption happens on call end based on minutes used
        // This is just to track that a call request was made
        this.logger.log(
          `Call request ${callRequest.id} created for user ${dto.subscriberId}`,
        );
      } catch (error) {
        this.logger.error('Failed to log call request creation:', error);
      }
    }

    // 4. Return call request with membership info
    return {
      callRequest,
      membershipInfo: validation
        ? {
            membershipId: validation.membershipId!,
            tierName: validation.tierName,
            quotaRemaining: validation.quotaRemaining,
            isUnlimited: validation.isUnlimited,
          }
        : undefined,
    };
  }
}

// ============================================
// END CALL WITH USAGE TRACKING
// Records actual call minutes used against quota
// ============================================

export interface EndCallWithUsageResult {
  callRequest: CallRequest;
  usageRecorded: boolean;
  minutesUsed: number;
  quotaRemaining: number | null;
}

@Injectable()
export class EndCallWithUsageTrackingUseCase {
  private readonly logger = new Logger(EndCallWithUsageTrackingUseCase.name);

  constructor(
    @Optional()
    private readonly membershipService: MembershipIntegrationService,
    private readonly endCallUseCase: EndCallUseCase,
  ) {}

  async execute(
    callRequestId: string,
    recordingUrl?: string,
    actualDurationMinutes?: number,
  ): Promise<EndCallWithUsageResult> {
    // 1. End the call
    const callRequest = await this.endCallUseCase.execute(callRequestId, {
      recordingUrl,
    });

    let usageRecorded = false;
    let quotaRemaining: number | null = null;

    // 2. Calculate minutes used
    const minutesUsed =
      actualDurationMinutes ?? this.calculateDuration(callRequest);

    // 3. Record usage against quota
    if (this.membershipService && minutesUsed > 0) {
      try {
        const result = await this.membershipService.recordServiceUsage({
          userId: callRequest.subscriberId,
          serviceType: ServiceType.CALL,
          requestId: callRequest.id,
          chargedAmount: 0, // Call minutes are counted, not charged per minute typically
        });

        usageRecorded = true;
        quotaRemaining = result.quotaRemaining;

        this.logger.log(
          `Recorded ${minutesUsed} minutes for call ${callRequestId}. ` +
            `Quota remaining: ${quotaRemaining ?? 'unlimited'}`,
        );
      } catch (error) {
        this.logger.error('Failed to record call usage:', error);
      }
    }

    return {
      callRequest,
      usageRecorded,
      minutesUsed,
      quotaRemaining,
    };
  }

  private calculateDuration(callRequest: CallRequest): number {
    if (!callRequest.callStartedAt || !callRequest.callEndedAt) {
      return 0;
    }
    const durationMs =
      callRequest.callEndedAt.getTime() - callRequest.callStartedAt.getTime();
    return Math.ceil(durationMs / (1000 * 60)); // Round up to nearest minute
  }
}

// ============================================
// CHECK CALL QUOTA
// ============================================

@Injectable()
export class CheckCallQuotaUseCase {
  constructor(
    @Optional()
    private readonly membershipService: MembershipIntegrationService,
  ) {}

  async execute(userId: string): Promise<{
    canCreate: boolean;
    minutesUsed: number;
    minutesLimit: number | null;
    minutesRemaining: number | null;
    isUnlimited: boolean;
    membershipTier: string | null;
    errorMessage?: string;
  }> {
    if (!this.membershipService) {
      return {
        canCreate: true,
        minutesUsed: 0,
        minutesLimit: null,
        minutesRemaining: null,
        isUnlimited: true,
        membershipTier: null,
      };
    }

    const validation =
      await this.membershipService.validateMembershipForService(
        userId,
        ServiceType.CALL,
      );

    return {
      canCreate: validation.isValid,
      minutesUsed: validation.quotaUsed,
      minutesLimit: validation.quotaLimit,
      minutesRemaining: validation.quotaRemaining,
      isUnlimited: validation.isUnlimited,
      membershipTier: validation.tierName,
      errorMessage: validation.errorMessage,
    };
  }
}
