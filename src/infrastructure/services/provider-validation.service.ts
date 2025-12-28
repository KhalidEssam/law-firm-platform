// src/infrastructure/services/provider-validation.service.ts

import { Injectable, Inject } from '@nestjs/common';
import {
  IProviderValidationService,
  ProviderValidationResult,
  ValidatedProviderInfo,
} from '../../core/application/call-request/ports/provider-validation.port';
import type {
  IProviderUserRepository,
  IProviderProfileRepository,
} from '../../core/application/provider/ports/repository';

/**
 * Provider Validation Service Implementation
 *
 * Validates that users assigned to service requests are:
 * 1. Linked to a ProviderProfile through ProviderUser relationship
 * 2. The ProviderProfile is approved and active
 * 3. The ProviderUser is active and can accept requests
 */
@Injectable()
export class ProviderValidationService implements IProviderValidationService {
  constructor(
    @Inject('PROVIDER_USER_REPOSITORY')
    private readonly providerUserRepo: IProviderUserRepository,
    @Inject('PROVIDER_PROFILE_REPOSITORY')
    private readonly providerProfileRepo: IProviderProfileRepository,
  ) {}

  async validateProviderForAssignment(
    userId: string,
  ): Promise<ProviderValidationResult> {
    // Step 1: Find ProviderUser record for this userId
    const providerUsers = await this.providerUserRepo.list({
      userId,
      includeDeleted: false,
    });

    if (providerUsers.length === 0) {
      return {
        isValid: false,
        error:
          `User ${userId} is not linked to any service provider organization. ` +
          `Only users registered as ProviderUsers can be assigned to service requests.`,
      };
    }

    // Get the first active ProviderUser (user could be linked to multiple providers)
    const activeProviderUser = providerUsers.find((pu) => pu.isActive);
    if (!activeProviderUser) {
      return {
        isValid: false,
        error:
          `User ${userId} has a provider association but it is currently inactive. ` +
          `Please contact the provider administrator to activate this user.`,
      };
    }

    // Step 2: Check if the ProviderUser can accept requests
    if (!activeProviderUser.canAcceptRequests) {
      return {
        isValid: false,
        error:
          `User ${userId} is linked to a provider organization but is not authorized to accept service requests. ` +
          `The provider administrator needs to enable request acceptance for this user.`,
      };
    }

    // Step 3: Get and validate the ProviderProfile
    const providerProfile = await this.providerProfileRepo.findById(
      activeProviderUser.providerId,
    );

    if (!providerProfile) {
      return {
        isValid: false,
        error:
          `Provider profile not found for provider ID ${activeProviderUser.providerId}. ` +
          `The service provider organization may have been removed.`,
      };
    }

    // Step 4: Check if the ProviderProfile is approved
    if (!providerProfile.isApproved) {
      return {
        isValid: false,
        error:
          `The service provider organization "${providerProfile.organizationName.name}" ` +
          `is not yet approved (status: ${providerProfile.verificationStatus.status}). ` +
          `Only users from approved provider organizations can be assigned to service requests.`,
      };
    }

    // Step 5: Check if the ProviderProfile is active
    if (!providerProfile.isActive) {
      return {
        isValid: false,
        error:
          `The service provider organization "${providerProfile.organizationName.name}" ` +
          `is currently inactive. Please contact the platform administrator.`,
      };
    }

    // All validations passed
    return {
      isValid: true,
      providerInfo: {
        userId,
        providerUserId: activeProviderUser.id,
        providerProfileId: providerProfile.id,
        organizationName: providerProfile.organizationName.name,
        isActive: activeProviderUser.isActive,
        canAcceptRequests: activeProviderUser.canAcceptRequests,
      },
    };
  }

  async getValidatedProviderInfo(
    userId: string,
  ): Promise<ValidatedProviderInfo | null> {
    const result = await this.validateProviderForAssignment(userId);
    return result.isValid ? result.providerInfo! : null;
  }

  async isValidProvider(userId: string): Promise<boolean> {
    const result = await this.validateProviderForAssignment(userId);
    return result.isValid;
  }
}
