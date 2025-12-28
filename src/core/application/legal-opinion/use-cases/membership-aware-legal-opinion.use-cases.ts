// ============================================
// MEMBERSHIP-AWARE LEGAL OPINION USE CASES
// Wraps legal opinion use cases with membership validation
// ============================================

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  MembershipIntegrationService,
  ServiceType,
} from '../../membership/services/membership-integration.service';
import {
  CreateOpinionRequestUseCase,
  CreateOpinionRequestCommand,
} from './create-opinion-request.use-case';

// ============================================
// CREATE LEGAL OPINION WITH MEMBERSHIP CHECK
// ============================================

@Injectable()
export class CreateLegalOpinionWithMembershipUseCase {
  private readonly logger = new Logger(
    CreateLegalOpinionWithMembershipUseCase.name,
  );

  constructor(
    private readonly membershipService: MembershipIntegrationService,
    private readonly createOpinionUseCase: CreateOpinionRequestUseCase,
  ) {}

  async execute(command: CreateOpinionRequestCommand): Promise<
    any & {
      membershipInfo?: {
        membershipId: string;
        tierName: string | null;
        quotaRemaining: number | null;
        isUnlimited: boolean;
      };
    }
  > {
    // 1. Validate membership and quota
    const validation =
      await this.membershipService.validateMembershipForService(
        command.clientId,
        ServiceType.LEGAL_OPINION,
      );

    if (!validation.isValid) {
      throw new BadRequestException(
        validation.errorMessage ||
          'Cannot create legal opinion request: membership validation failed',
      );
    }

    // 2. Create the legal opinion using injected use case
    const opinion = await this.createOpinionUseCase.execute(command);

    // 3. Record the service usage
    try {
      await this.membershipService.recordServiceUsage({
        userId: command.clientId,
        serviceType: ServiceType.LEGAL_OPINION,
        requestId: opinion.id,
      });
    } catch (error: unknown) {
      // Log error but don't fail the request
      this.logger.error(
        'Failed to record service usage',
        error instanceof Error ? error.stack : String(error),
      );
    }

    // 4. Return opinion with membership info
    return {
      ...opinion,
      membershipInfo: {
        membershipId: validation.membershipId!,
        tierName: validation.tierName,
        quotaRemaining:
          validation.quotaRemaining !== null
            ? validation.quotaRemaining - 1
            : null,
        isUnlimited: validation.isUnlimited,
      },
    };
  }
}

// ============================================
// CHECK LEGAL OPINION QUOTA
// ============================================

@Injectable()
export class CheckLegalOpinionQuotaUseCase {
  constructor(
    private readonly membershipService: MembershipIntegrationService,
  ) {}

  async execute(userId: string): Promise<{
    canCreate: boolean;
    quotaUsed: number;
    quotaLimit: number | null;
    quotaRemaining: number | null;
    isUnlimited: boolean;
    membershipTier: string | null;
    errorMessage?: string;
  }> {
    const validation =
      await this.membershipService.validateMembershipForService(
        userId,
        ServiceType.LEGAL_OPINION,
      );

    return {
      canCreate: validation.isValid,
      quotaUsed: validation.quotaUsed,
      quotaLimit: validation.quotaLimit,
      quotaRemaining: validation.quotaRemaining,
      isUnlimited: validation.isUnlimited,
      membershipTier: validation.tierName,
      errorMessage: validation.errorMessage,
    };
  }
}

// ============================================
// COMPLETE LEGAL OPINION WITH USAGE TRACKING
// ============================================

@Injectable()
export class CompleteLegalOpinionWithUsageTrackingUseCase {
  private readonly logger = new Logger(
    CompleteLegalOpinionWithUsageTrackingUseCase.name,
  );

  constructor(
    private readonly membershipService: MembershipIntegrationService,
  ) {}

  async execute(
    opinionId: string,
    clientId: string,
    chargedAmount?: number,
  ): Promise<void> {
    // If there's an overage charge, update the service usage
    if (chargedAmount && chargedAmount > 0) {
      try {
        // Get membership for this user
        const status =
          await this.membershipService.getMembershipStatus(clientId);
        if (status.membershipId) {
          const unbilledUsage = await this.membershipService.getUnbilledUsage(
            status.membershipId,
          );
          const usageForOpinion = unbilledUsage.find(
            (u) => u.legalOpinionId === opinionId,
          );
          if (usageForOpinion) {
            await this.membershipService.markUsageAsBilled(
              usageForOpinion.id,
              chargedAmount,
              'SAR',
            );
          }
        }
      } catch (error: unknown) {
        this.logger.error(
          'Failed to update usage billing',
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
