// ============================================
// RECORD CASE RESULT USE CASE
// Updates case count and success rate for a provider's specialization
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ProviderSpecialization } from '../../../../domain/specialization/entities/provider-specialization.entity';
import type { IProviderSpecializationRepository } from '../../../../domain/specialization/ports/specialization.repository';
import { PROVIDER_SPECIALIZATION_REPOSITORY } from '../../../../domain/specialization/ports/specialization.repository';

export interface RecordCaseResultDTO {
  providerId: string;
  specializationId: string;
  wasSuccessful: boolean;
}

@Injectable()
export class RecordCaseResultUseCase {
  constructor(
    @Inject(PROVIDER_SPECIALIZATION_REPOSITORY)
    private readonly repository: IProviderSpecializationRepository,
  ) {}

  async execute(dto: RecordCaseResultDTO): Promise<ProviderSpecialization> {
    const providerSpecialization =
      await this.repository.findByProviderAndSpecialization(
        dto.providerId,
        dto.specializationId,
      );

    if (!providerSpecialization) {
      throw new NotFoundException(
        `Provider specialization not found for provider "${dto.providerId}" and specialization "${dto.specializationId}"`,
      );
    }

    // Increment case count
    const updatedSpecialization = await this.repository.incrementCaseCount(
      providerSpecialization.id,
    );

    // Calculate and update success rate
    const currentRate = providerSpecialization.successRate ?? 0;
    const oldCaseCount = providerSpecialization.caseCount;
    const newCaseCount = updatedSpecialization.caseCount;

    // Calculate new success rate:
    // newRate = ((oldRate * oldCount) + (wasSuccessful ? 100 : 0)) / newCount
    const successfulCases =
      (currentRate / 100) * oldCaseCount + (dto.wasSuccessful ? 1 : 0);
    const newSuccessRate = (successfulCases / newCaseCount) * 100;

    return await this.repository.updateSuccessRate(
      providerSpecialization.id,
      Math.round(newSuccessRate * 100) / 100, // Round to 2 decimal places
    );
  }
}
