// ============================================
// LIST PROVIDER SPECIALIZATIONS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { ProviderSpecialization } from '../../../../domain/specialization/entities/provider-specialization.entity';
import type {
  IProviderSpecializationRepository,
  ListProviderSpecializationsOptions,
} from '../../../../domain/specialization/ports/specialization.repository';
import { PROVIDER_SPECIALIZATION_REPOSITORY } from '../../../../domain/specialization/ports/specialization.repository';

export interface ListProviderSpecializationsDTO {
  providerId?: string;
  specializationId?: string;
  isCertified?: boolean;
  minExperienceYears?: number;
  limit?: number;
  offset?: number;
}

export interface ListProviderSpecializationsResult {
  providerSpecializations: ProviderSpecialization[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProviderExpertiseResult {
  specializations: ProviderSpecialization[];
  totalCases: number;
  averageSuccessRate: number | null;
}

@Injectable()
export class ListProviderSpecializationsUseCase {
  constructor(
    @Inject(PROVIDER_SPECIALIZATION_REPOSITORY)
    private readonly repository: IProviderSpecializationRepository,
  ) {}

  async execute(
    dto?: ListProviderSpecializationsDTO,
  ): Promise<ListProviderSpecializationsResult> {
    const options: ListProviderSpecializationsOptions = {
      providerId: dto?.providerId,
      specializationId: dto?.specializationId,
      isCertified: dto?.isCertified,
      minExperienceYears: dto?.minExperienceYears,
      limit: dto?.limit ?? 50,
      offset: dto?.offset ?? 0,
    };

    const [providerSpecializations, total] = await Promise.all([
      this.repository.list(options),
      this.repository.count({
        providerId: options.providerId,
        specializationId: options.specializationId,
        isCertified: options.isCertified,
        minExperienceYears: options.minExperienceYears,
      }),
    ]);

    return {
      providerSpecializations,
      total,
      limit: options.limit!,
      offset: options.offset!,
    };
  }

  async executeByProvider(
    providerId: string,
  ): Promise<ProviderSpecialization[]> {
    return await this.repository.findByProvider(providerId);
  }

  async executeCertifiedByProvider(
    providerId: string,
  ): Promise<ProviderSpecialization[]> {
    return await this.repository.findCertifiedByProvider(providerId);
  }

  async getProviderExpertise(
    providerId: string,
  ): Promise<ProviderExpertiseResult> {
    return await this.repository.getProviderExpertise(providerId);
  }

  async findTopProvidersBySpecialization(
    specializationId: string,
    limit?: number,
  ): Promise<ProviderSpecialization[]> {
    return await this.repository.findTopProvidersBySpecialization(
      specializationId,
      limit,
    );
  }

  async countProvidersBySpecialization(
    specializationId: string,
  ): Promise<number> {
    return await this.repository.countProvidersBySpecialization(
      specializationId,
    );
  }
}
