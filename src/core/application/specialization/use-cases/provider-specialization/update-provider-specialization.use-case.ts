// ============================================
// UPDATE PROVIDER SPECIALIZATION USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ProviderSpecialization,
  CertificationDetail,
} from '../../../../domain/specialization/entities/provider-specialization.entity';
import type { IProviderSpecializationRepository } from '../../../../domain/specialization/ports/specialization.repository';
import { PROVIDER_SPECIALIZATION_REPOSITORY } from '../../../../domain/specialization/ports/specialization.repository';

export interface UpdateProviderSpecializationDTO {
  id: string;
  experienceYears?: number;
  isCertified?: boolean;
  certifications?: CertificationDetail[];
  caseCount?: number;
  successRate?: number;
}

@Injectable()
export class UpdateProviderSpecializationUseCase {
  constructor(
    @Inject(PROVIDER_SPECIALIZATION_REPOSITORY)
    private readonly repository: IProviderSpecializationRepository,
  ) {}

  async execute(
    dto: UpdateProviderSpecializationDTO,
  ): Promise<ProviderSpecialization> {
    const providerSpecialization = await this.repository.findById(dto.id);

    if (!providerSpecialization) {
      throw new NotFoundException(
        `Provider specialization with ID "${dto.id}" not found`,
      );
    }

    providerSpecialization.updateDetails({
      experienceYears: dto.experienceYears,
      isCertified: dto.isCertified,
      certifications: dto.certifications,
      caseCount: dto.caseCount,
      successRate: dto.successRate,
    });

    return await this.repository.update(providerSpecialization);
  }

  async addCertification(
    id: string,
    certification: CertificationDetail,
  ): Promise<ProviderSpecialization> {
    const providerSpecialization = await this.repository.findById(id);

    if (!providerSpecialization) {
      throw new NotFoundException(
        `Provider specialization with ID "${id}" not found`,
      );
    }

    providerSpecialization.addCertification(certification);

    return await this.repository.update(providerSpecialization);
  }

  async removeCertification(
    id: string,
    certificationName: string,
  ): Promise<ProviderSpecialization> {
    const providerSpecialization = await this.repository.findById(id);

    if (!providerSpecialization) {
      throw new NotFoundException(
        `Provider specialization with ID "${id}" not found`,
      );
    }

    providerSpecialization.removeCertification(certificationName);

    return await this.repository.update(providerSpecialization);
  }
}
