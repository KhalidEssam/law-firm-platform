// ============================================
// MEMBERSHIP-AWARE CONSULTATION USE CASES
// Wraps consultation use cases with membership validation
// ============================================

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  MembershipIntegrationService,
  ServiceType,
} from '../../membership/services/membership-integration.service';
import {
  CreateConsultationRequestUseCase,
  CompleteConsultationRequestUseCase,
} from './consultation.use-cases';
import {
  CreateConsultationRequestDTO,
  ConsultationRequestResponseDTO,
} from '../consultation request.dtos';

// ============================================
// CREATE CONSULTATION WITH MEMBERSHIP CHECK
// ============================================

@Injectable()
export class CreateConsultationWithMembershipUseCase {
  private readonly logger = new Logger(
    CreateConsultationWithMembershipUseCase.name,
  );

  constructor(
    private readonly membershipService: MembershipIntegrationService,
    private readonly createConsultationUseCase: CreateConsultationRequestUseCase,
  ) {}

  async execute(dto: CreateConsultationRequestDTO): Promise<
    ConsultationRequestResponseDTO & {
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
        dto.subscriberId,
        ServiceType.CONSULTATION,
      );

    if (!validation.isValid) {
      throw new BadRequestException(
        validation.errorMessage ||
          'Cannot create consultation: membership validation failed',
      );
    }

    // 2. Create the consultation using injected use case
    const consultation = await this.createConsultationUseCase.execute(dto);

    // 3. Record the service usage
    try {
      await this.membershipService.recordServiceUsage({
        userId: dto.subscriberId,
        serviceType: ServiceType.CONSULTATION,
        requestId: consultation.id,
      });
    } catch (error: any) {
      // Log error but don't fail the request
      this.logger.error(
        'Failed to record service usage',
        error?.stack || error,
      );
    }

    // 4. Return consultation with membership info
    return {
      ...consultation,
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
// COMPLETE CONSULTATION WITH USAGE TRACKING
// ============================================

@Injectable()
export class CompleteConsultationWithUsageTrackingUseCase {
  private readonly logger = new Logger(
    CompleteConsultationWithUsageTrackingUseCase.name,
  );

  constructor(
    private readonly membershipService: MembershipIntegrationService,
    private readonly completeConsultationUseCase: CompleteConsultationRequestUseCase,
  ) {}

  async execute(
    consultationId: string,
    chargedAmount?: number,
  ): Promise<ConsultationRequestResponseDTO> {
    // 1. Complete the consultation using injected use case
    const consultation =
      await this.completeConsultationUseCase.execute(consultationId);

    // 2. If there's an overage charge, update the service usage
    if (chargedAmount && chargedAmount > 0) {
      try {
        // Get membership for this user
        const status = await this.membershipService.getMembershipStatus(
          consultation.subscriberId,
        );
        if (status.membershipId) {
          const unbilledUsage = await this.membershipService.getUnbilledUsage(
            status.membershipId,
          );
          const usageForConsultation = unbilledUsage.find(
            (u) => u.consultationId === consultationId,
          );
          if (usageForConsultation) {
            await this.membershipService.markUsageAsBilled(
              usageForConsultation.id,
              chargedAmount,
              'SAR',
            );
          }
        }
      } catch (error: any) {
        this.logger.error(
          'Failed to update usage billing',
          error?.stack || error,
        );
      }
    }

    return consultation;
  }
}

// ============================================
// CHECK CONSULTATION QUOTA
// ============================================

@Injectable()
export class CheckConsultationQuotaUseCase {
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
        ServiceType.CONSULTATION,
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
