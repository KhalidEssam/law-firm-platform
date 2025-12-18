// src/core/application/call-request/ports/provider-validation.port.ts

/**
 * Provider Validation Port
 * Interface for validating that a user can be assigned as a service provider
 */

export interface ValidatedProviderInfo {
    userId: string;
    providerUserId: string;
    providerProfileId: string;
    organizationName: string;
    isActive: boolean;
    canAcceptRequests: boolean;
}

export interface ProviderValidationResult {
    isValid: boolean;
    error?: string;
    providerInfo?: ValidatedProviderInfo;
}

/**
 * Port for validating provider assignments
 * Ensures users assigned to service requests are valid, active ProviderUsers
 * linked to approved ProviderProfiles
 */
export interface IProviderValidationService {
    /**
     * Validate that a user can be assigned as a provider for service requests
     *
     * This checks:
     * 1. User exists as a ProviderUser (linked to a ProviderProfile)
     * 2. The ProviderProfile is approved and active
     * 3. The ProviderUser is active and can accept requests
     *
     * @param userId - The user ID to validate
     * @returns Validation result with provider info if valid
     */
    validateProviderForAssignment(userId: string): Promise<ProviderValidationResult>;

    /**
     * Get validated provider info for a user
     * Returns null if user is not a valid provider
     *
     * @param userId - The user ID to lookup
     * @returns Provider info if valid, null otherwise
     */
    getValidatedProviderInfo(userId: string): Promise<ValidatedProviderInfo | null>;

    /**
     * Check if a user is a valid provider (quick check)
     *
     * @param userId - The user ID to check
     * @returns true if user is a valid, active provider
     */
    isValidProvider(userId: string): Promise<boolean>;
}
