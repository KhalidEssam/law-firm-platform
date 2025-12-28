// ============================================
// DELETE SPECIALIZATION USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type {
  ISpecializationRepository,
  IProviderSpecializationRepository,
} from '../../../../domain/specialization/ports/specialization.repository';
import {
  SPECIALIZATION_REPOSITORY,
  PROVIDER_SPECIALIZATION_REPOSITORY,
} from '../../../../domain/specialization/ports/specialization.repository';

@Injectable()
export class DeleteSpecializationUseCase {
  constructor(
    @Inject(SPECIALIZATION_REPOSITORY)
    private readonly repository: ISpecializationRepository,
    @Inject(PROVIDER_SPECIALIZATION_REPOSITORY)
    private readonly providerSpecializationRepository: IProviderSpecializationRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const specialization = await this.repository.findById(id);

    if (!specialization) {
      throw new NotFoundException(`Specialization with ID "${id}" not found`);
    }

    // First, delete all provider specializations referencing this specialization
    // (handled by cascade in DB, but we do it explicitly for clarity)
    await this.providerSpecializationRepository.deleteBySpecialization(id);

    // Then delete the specialization
    await this.repository.delete(id);
  }
}
