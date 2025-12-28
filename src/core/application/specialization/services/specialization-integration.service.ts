// ============================================
// SPECIALIZATION INTEGRATION SERVICE
// Provides specialization data for routing and other modules
// src/core/application/specialization/services/specialization-integration.service.ts
// ============================================

import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import type {
  ISpecializationRepository,
  IProviderSpecializationRepository,
} from '../../../domain/specialization/ports/specialization.repository';
import {
  SPECIALIZATION_REPOSITORY,
  PROVIDER_SPECIALIZATION_REPOSITORY,
} from '../../../domain/specialization/ports/specialization.repository';
import { Specialization } from '../../../domain/specialization/entities/specialization.entity';

/**
 * Provider info with specialization data for routing
 */
export interface ProviderWithSpecializations {
  providerId: string;
  specializations: string[]; // Specialization names
  isCertified: boolean; // Has any certified specialization
  totalExperienceYears: number;
  totalCaseCount: number;
  averageSuccessRate: number | null;
}

/**
 * Specialization match result for provider selection
 */
export interface SpecializationMatch {
  providerId: string;
  matchingSpecializations: string[];
  matchScore: number; // Higher = better match
  isCertified: boolean;
  experienceYears: number;
  successRate: number | null;
}

/**
 * SpecializationIntegrationService
 *
 * Provides specialization-related data for cross-module integration.
 * Used by routing module to match providers with required specializations.
 */
@Injectable()
export class SpecializationIntegrationService {
  private readonly logger = new Logger(SpecializationIntegrationService.name);

  constructor(
    @Optional()
    @Inject(SPECIALIZATION_REPOSITORY)
    private readonly specializationRepo?: ISpecializationRepository,
    @Optional()
    @Inject(PROVIDER_SPECIALIZATION_REPOSITORY)
    private readonly providerSpecializationRepo?: IProviderSpecializationRepository,
  ) {}

  /**
   * Get specialization names for a provider
   * Used to populate ProviderInfo.specializations for routing
   */
  async getProviderSpecializationNames(providerId: string): Promise<string[]> {
    if (!this.providerSpecializationRepo || !this.specializationRepo) {
      return [];
    }

    try {
      const providerSpecs =
        await this.providerSpecializationRepo.findByProvider(providerId);

      if (providerSpecs.length === 0) {
        return [];
      }

      // Get specialization names
      const specializationIds = providerSpecs.map((ps) => ps.specializationId);
      const specializations = await Promise.all(
        specializationIds.map((id) => this.specializationRepo!.findById(id)),
      );

      return specializations
        .filter((s): s is Specialization => s !== null && s.isActive)
        .map((s) => s.name);
    } catch (error) {
      this.logger.error(
        `Failed to get specializations for provider ${providerId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Get full provider expertise info
   * Used for detailed provider selection
   */
  async getProviderExpertiseInfo(
    providerId: string,
  ): Promise<ProviderWithSpecializations | null> {
    if (!this.providerSpecializationRepo || !this.specializationRepo) {
      return null;
    }

    try {
      const expertise =
        await this.providerSpecializationRepo.getProviderExpertise(providerId);

      if (expertise.specializations.length === 0) {
        return null;
      }

      // Get specialization names
      const specializationNames: string[] = [];
      let hasCertified = false;
      let totalExperience = 0;

      for (const ps of expertise.specializations) {
        const spec = await this.specializationRepo.findById(
          ps.specializationId,
        );
        if (spec && spec.isActive) {
          specializationNames.push(spec.name);
        }
        if (ps.isCertified) {
          hasCertified = true;
        }
        if (ps.experienceYears) {
          totalExperience = Math.max(totalExperience, ps.experienceYears);
        }
      }

      return {
        providerId,
        specializations: specializationNames,
        isCertified: hasCertified,
        totalExperienceYears: totalExperience,
        totalCaseCount: expertise.totalCases,
        averageSuccessRate: expertise.averageSuccessRate,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get expertise for provider ${providerId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Find providers matching required specializations
   * Used for specialized routing strategy
   */
  async findProvidersWithSpecializations(
    requiredSpecializations: string[],
    options?: {
      requireCertification?: boolean;
      minExperienceYears?: number;
      minSuccessRate?: number;
      limit?: number;
    },
  ): Promise<SpecializationMatch[]> {
    if (!this.providerSpecializationRepo || !this.specializationRepo) {
      return [];
    }

    try {
      // Get specialization IDs for required names
      const specializationIds: string[] = [];
      for (const name of requiredSpecializations) {
        const spec = await this.specializationRepo.findByName(name);
        if (spec && spec.isActive) {
          specializationIds.push(spec.id);
        }
      }

      if (specializationIds.length === 0) {
        return [];
      }

      // Find all provider specializations matching these specializations
      const matches: Map<string, SpecializationMatch> = new Map();

      for (const specId of specializationIds) {
        const providerSpecs =
          await this.providerSpecializationRepo.findBySpecialization({
            specializationId: specId,
            isCertified: options?.requireCertification,
            minExperienceYears: options?.minExperienceYears,
            minSuccessRate: options?.minSuccessRate,
          });

        for (const ps of providerSpecs) {
          const spec = await this.specializationRepo.findById(
            ps.specializationId,
          );
          const specName = spec?.name || ps.specializationId;

          if (matches.has(ps.providerId)) {
            // Update existing match
            const existing = matches.get(ps.providerId)!;
            existing.matchingSpecializations.push(specName);
            existing.matchScore +=
              1 + (ps.isCertified ? 0.5 : 0) + (ps.successRate || 0) / 100;
            if (ps.isCertified) {
              existing.isCertified = true;
            }
            if (
              ps.experienceYears &&
              ps.experienceYears > existing.experienceYears
            ) {
              existing.experienceYears = ps.experienceYears;
            }
          } else {
            // Create new match
            matches.set(ps.providerId, {
              providerId: ps.providerId,
              matchingSpecializations: [specName],
              matchScore:
                1 + (ps.isCertified ? 0.5 : 0) + (ps.successRate || 0) / 100,
              isCertified: ps.isCertified,
              experienceYears: ps.experienceYears || 0,
              successRate: ps.successRate ?? null,
            });
          }
        }
      }

      // Sort by match score (descending) and apply limit
      const sorted = Array.from(matches.values()).sort(
        (a, b) => b.matchScore - a.matchScore,
      );

      return options?.limit ? sorted.slice(0, options.limit) : sorted;
    } catch (error) {
      this.logger.error(
        'Failed to find providers with specializations:',
        error,
      );
      return [];
    }
  }

  /**
   * Get top providers for a specialization category
   * Used for category-based routing
   */
  async getTopProvidersByCategory(
    category: string,
    limit: number = 10,
  ): Promise<SpecializationMatch[]> {
    if (!this.providerSpecializationRepo || !this.specializationRepo) {
      return [];
    }

    try {
      const specializations =
        await this.specializationRepo.findByCategory(category);

      if (specializations.length === 0) {
        return [];
      }

      const specializationNames = specializations.map((s) => s.name);
      return this.findProvidersWithSpecializations(specializationNames, {
        limit,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get top providers for category ${category}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Check if a provider has required specializations
   * Used for validation during assignment
   */
  async providerHasSpecializations(
    providerId: string,
    requiredSpecializations: string[],
  ): Promise<boolean> {
    if (!this.providerSpecializationRepo || !this.specializationRepo) {
      return true; // If service unavailable, don't block
    }

    try {
      const providerSpecs =
        await this.getProviderSpecializationNames(providerId);

      if (requiredSpecializations.length === 0) {
        return true;
      }

      const normalizedRequired = requiredSpecializations.map((s) =>
        s.toLowerCase(),
      );
      const normalizedProvider = providerSpecs.map((s) => s.toLowerCase());

      // At least one match is required
      return normalizedRequired.some((req) => normalizedProvider.includes(req));
    } catch (error) {
      this.logger.error(
        `Failed to check specializations for provider ${providerId}:`,
        error,
      );
      return true; // Don't block on error
    }
  }

  /**
   * Record a case result for a provider's specialization
   * Called when a case is completed
   */
  async recordCaseResult(
    providerId: string,
    category: string,
    wasSuccessful: boolean,
  ): Promise<void> {
    if (!this.providerSpecializationRepo || !this.specializationRepo) {
      return;
    }

    try {
      // Find specializations in this category for this provider
      const specializations =
        await this.specializationRepo.findByCategory(category);

      for (const spec of specializations) {
        const providerSpec =
          await this.providerSpecializationRepo.findByProviderAndSpecialization(
            providerId,
            spec.id,
          );

        if (providerSpec) {
          // Update case count and success rate
          const updated =
            await this.providerSpecializationRepo.incrementCaseCount(
              providerSpec.id,
            );

          const currentRate = providerSpec.successRate ?? 0;
          const oldCount = providerSpec.caseCount;
          const newCount = updated.caseCount;

          const successfulCases =
            (currentRate / 100) * oldCount + (wasSuccessful ? 1 : 0);
          const newRate = (successfulCases / newCount) * 100;

          await this.providerSpecializationRepo.updateSuccessRate(
            providerSpec.id,
            Math.round(newRate * 100) / 100,
          );

          this.logger.log(
            `Updated case result for provider ${providerId} in specialization ${spec.name}: ` +
              `cases=${newCount}, successRate=${newRate.toFixed(2)}%`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to record case result:', error);
    }
  }
}
