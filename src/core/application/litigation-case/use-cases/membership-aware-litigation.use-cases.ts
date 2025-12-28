// ============================================
// MEMBERSHIP-AWARE LITIGATION USE CASES
// Wraps litigation use cases with membership validation
// ============================================

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  MembershipIntegrationService,
  ServiceType,
} from '../../membership/services/membership-integration.service';
import {
  CreateLitigationCaseUseCase,
  CreateLitigationCaseCommand,
  CloseCaseUseCase,
} from './litigation-case.use-cases';

// ============================================
// CREATE LITIGATION CASE WITH MEMBERSHIP CHECK
// ============================================

@Injectable()
export class CreateLitigationWithMembershipUseCase {
  private readonly logger = new Logger(CreateLitigationWithMembershipUseCase.name);

  constructor(
    private readonly membershipService: MembershipIntegrationService,
    private readonly createLitigationUseCase: CreateLitigationCaseUseCase,
  ) {}

  async execute(command: CreateLitigationCaseCommand): Promise<
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
        command.subscriberId,
        ServiceType.LITIGATION,
      );

    if (!validation.isValid) {
      throw new BadRequestException(
        validation.errorMessage ||
          'Cannot create litigation case: membership validation failed',
      );
    }

    // 2. Create the litigation case using injected use case
    const litigationCase = await this.createLitigationUseCase.execute(command);

    // 3. Record the service usage
    try {
      await this.membershipService.recordServiceUsage({
        userId: command.subscriberId,
        serviceType: ServiceType.LITIGATION,
        requestId: litigationCase.id,
      });
    } catch (error: any) {
      // Log error but don't fail the request
      this.logger.error('Failed to record service usage', error?.stack || error);
    }

    // 4. Return case with membership info
    return {
      ...litigationCase,
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
// CHECK LITIGATION QUOTA
// ============================================

@Injectable()
export class CheckLitigationQuotaUseCase {
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
        ServiceType.LITIGATION,
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
// CLOSE LITIGATION WITH USAGE TRACKING
// ============================================

@Injectable()
export class CloseLitigationWithUsageTrackingUseCase {
  private readonly logger = new Logger(CloseLitigationWithUsageTrackingUseCase.name);

  constructor(
    private readonly membershipService: MembershipIntegrationService,
    private readonly closeCaseUseCase: CloseCaseUseCase,
  ) {}

  async execute(
    caseId: string,
    subscriberId: string,
    chargedAmount?: number,
  ): Promise<any> {
    // 1. Close the case using injected use case
    const closedCase = await this.closeCaseUseCase.execute({ caseId });

    // 2. If there's an overage charge, update the service usage
    if (chargedAmount && chargedAmount > 0) {
      try {
        // Get membership for this user
        const status =
          await this.membershipService.getMembershipStatus(subscriberId);
        if (status.membershipId) {
          const unbilledUsage = await this.membershipService.getUnbilledUsage(
            status.membershipId,
          );
          const usageForCase = unbilledUsage.find(
            (u) => u.litigationCaseId === caseId,
          );
          if (usageForCase) {
            await this.membershipService.markUsageAsBilled(
              usageForCase.id,
              chargedAmount,
              'SAR',
            );
          }
        }
      } catch (error: any) {
        this.logger.error('Failed to update usage billing', error?.stack || error);
      }
    }

    return closedCase;
  }
}
