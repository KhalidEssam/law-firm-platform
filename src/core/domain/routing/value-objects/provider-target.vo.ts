// src/core/domain/routing/value-objects/provider-target.vo.ts

/**
 * ProviderTargetData - Configuration for targeting providers
 */
export interface ProviderTargetData {
  providerIds?: string[]; // Specific provider IDs to target
  specializations?: string[]; // Target providers with these specializations
  minRating?: number; // Minimum provider rating (1-5)
  maxActiveRequests?: number; // Maximum active requests a provider can have
  regions?: string[]; // Target providers in these regions
  excludeProviderIds?: string[]; // Providers to exclude
  requireCertification?: boolean; // Only certified providers
  minExperienceYears?: number; // Minimum years of experience
}

/**
 * ProviderInfo - Provider data for evaluation
 */
export interface ProviderInfo {
  id: string;
  isActive: boolean;
  canAcceptRequests: boolean;
  activeRequestCount: number;
  rating?: number;
  specializations?: string[];
  region?: string;
  isCertified?: boolean;
  experienceYears?: number;
}

/**
 * ProviderTarget Value Object
 * Encapsulates the logic for filtering eligible providers
 */
export class ProviderTarget {
  private readonly target: ProviderTargetData;

  constructor(target: ProviderTargetData | null | undefined) {
    this.target = target || {};
  }

  /**
   * Check if a provider is eligible based on target criteria
   */
  isEligible(provider: ProviderInfo): boolean {
    // Provider must be active and accepting requests
    if (!provider.isActive || !provider.canAcceptRequests) {
      return false;
    }

    // Check exclusions first
    if (this.isExcluded(provider.id)) {
      return false;
    }

    // If specific provider IDs are set, only those are eligible
    if (this.target.providerIds?.length) {
      return this.target.providerIds.includes(provider.id);
    }

    // Check all other criteria
    if (!this.matchesRating(provider.rating)) {
      return false;
    }

    if (!this.matchesActiveRequests(provider.activeRequestCount)) {
      return false;
    }

    if (!this.matchesSpecializations(provider.specializations)) {
      return false;
    }

    if (!this.matchesRegion(provider.region)) {
      return false;
    }

    if (!this.matchesCertification(provider.isCertified)) {
      return false;
    }

    if (!this.matchesExperience(provider.experienceYears)) {
      return false;
    }

    return true;
  }

  /**
   * Filter a list of providers to only eligible ones
   */
  filterEligible(providers: ProviderInfo[]): ProviderInfo[] {
    return providers.filter((p) => this.isEligible(p));
  }

  /**
   * Sort providers by priority for load balancing
   * Lower active request count = higher priority
   */
  sortByLoadBalance(providers: ProviderInfo[]): ProviderInfo[] {
    return [...providers].sort(
      (a, b) => a.activeRequestCount - b.activeRequestCount,
    );
  }

  /**
   * Sort providers by rating
   * Higher rating = higher priority
   */
  sortByRating(providers: ProviderInfo[]): ProviderInfo[] {
    return [...providers].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  /**
   * Check if target specifies specific provider IDs
   */
  hasSpecificProviders(): boolean {
    return Boolean(this.target.providerIds?.length);
  }

  /**
   * Get the specific provider IDs if set
   */
  getSpecificProviderIds(): string[] {
    return this.target.providerIds || [];
  }

  /**
   * Get required specializations
   */
  getRequiredSpecializations(): string[] {
    return this.target.specializations || [];
  }

  /**
   * Check if target is empty (accept all eligible providers)
   */
  isEmpty(): boolean {
    return (
      !this.target.providerIds?.length &&
      !this.target.specializations?.length &&
      !this.target.regions?.length &&
      !this.target.excludeProviderIds?.length &&
      this.target.minRating === undefined &&
      this.target.maxActiveRequests === undefined &&
      this.target.minExperienceYears === undefined &&
      this.target.requireCertification !== true
    );
  }

  /**
   * Get the raw target data
   */
  toJSON(): ProviderTargetData {
    return { ...this.target };
  }

  // ============================================
  // PRIVATE MATCHING METHODS
  // ============================================

  private isExcluded(providerId: string): boolean {
    return this.target.excludeProviderIds?.includes(providerId) ?? false;
  }

  private matchesRating(rating: number | undefined): boolean {
    if (this.target.minRating === undefined) {
      return true;
    }
    return (rating || 0) >= this.target.minRating;
  }

  private matchesActiveRequests(activeCount: number): boolean {
    if (this.target.maxActiveRequests === undefined) {
      return true;
    }
    return activeCount < this.target.maxActiveRequests;
  }

  private matchesSpecializations(providerSpecs: string[] | undefined): boolean {
    const requiredSpecs = this.target.specializations;
    if (!requiredSpecs?.length) {
      return true;
    }

    if (!providerSpecs?.length) {
      return false;
    }

    // At least one specialization must match
    const normalizedRequired = requiredSpecs.map((s) => s.toLowerCase());
    const normalizedProvider = providerSpecs.map((s) => s.toLowerCase());

    return normalizedRequired.some((req) => normalizedProvider.includes(req));
  }

  private matchesRegion(region: string | undefined): boolean {
    const targetRegions = this.target.regions;
    if (!targetRegions?.length) {
      return true;
    }

    if (!region) {
      return false;
    }

    return targetRegions
      .map((r) => r.toLowerCase())
      .includes(region.toLowerCase());
  }

  private matchesCertification(isCertified: boolean | undefined): boolean {
    if (!this.target.requireCertification) {
      return true;
    }
    return isCertified === true;
  }

  private matchesExperience(years: number | undefined): boolean {
    if (this.target.minExperienceYears === undefined) {
      return true;
    }
    return (years || 0) >= this.target.minExperienceYears;
  }
}

/**
 * Create ProviderTarget from raw data
 */
export function createProviderTarget(
  data: ProviderTargetData | null | undefined,
): ProviderTarget {
  return new ProviderTarget(data);
}
