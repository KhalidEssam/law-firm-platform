// ============================================
// GET PROVIDER SPECIALIZATION USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ProviderSpecialization } from '../../../../domain/specialization/entities/provider-specialization.entity';
import type { IProviderSpecializationRepository } from '../../../../domain/specialization/ports/specialization.repository';
import { PROVIDER_SPECIALIZATION_REPOSITORY } from '../../../../domain/specialization/ports/specialization.repository';

@Injectable()
export class GetProviderSpecializationUseCase {
  constructor(
    @Inject(PROVIDER_SPECIALIZATION_REPOSITORY)
    private readonly repository: IProviderSpecializationRepository,
  ) {}

  async execute(_id: string): Promise<ProviderSpecialization> {
    const providerSpecialization = await this.repository.findById(id);

    if (!providerSpecialization) {
      throw new NotFoundException(
        `Provider specialization with ID "${id}" not found`,
      );
    }

    return providerSpecialization;
  }

  async executeByProviderAndSpecialization(
    providerId: string,
    specializationId: string,
  ): Promise<ProviderSpecialization> {
    const providerSpecialization =
      await this.repository.findByProviderAndSpecialization(
        providerId,
        specializationId,
      );

    if (!providerSpecialization) {
      throw new NotFoundException(
        `Provider specialization not found for provider "${providerId}" and specialization "${specializationId}"`,
      );
    }

    return providerSpecialization;
  }
}
