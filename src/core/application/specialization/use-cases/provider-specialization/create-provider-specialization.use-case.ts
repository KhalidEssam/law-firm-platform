// ============================================
// CREATE PROVIDER SPECIALIZATION USE CASE
// ============================================

import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  ProviderSpecialization,
  CertificationDetail,
} from '../../../../domain/specialization/entities/provider-specialization.entity';
import type {
  ISpecializationRepository,
  IProviderSpecializationRepository,
} from '../../../../domain/specialization/ports/specialization.repository';
import {
  SPECIALIZATION_REPOSITORY,
  PROVIDER_SPECIALIZATION_REPOSITORY,
} from '../../../../domain/specialization/ports/specialization.repository';

export interface CreateProviderSpecializationDTO {
  providerId: string;
  specializationId: string;
  experienceYears?: number;
  isCertified?: boolean;
  certifications?: CertificationDetail[];
  caseCount?: number;
  successRate?: number;
}

@Injectable()
export class CreateProviderSpecializationUseCase {
  constructor(
    @Inject(SPECIALIZATION_REPOSITORY)
    private readonly specializationRepository: ISpecializationRepository,
    @Inject(PROVIDER_SPECIALIZATION_REPOSITORY)
    private readonly repository: IProviderSpecializationRepository,
  ) {}

  async execute(
    dto: CreateProviderSpecializationDTO,
  ): Promise<ProviderSpecialization> {
    // Verify specialization exists
    const specialization = await this.specializationRepository.findById(
      dto.specializationId,
    );
    if (!specialization) {
      throw new NotFoundException(
        `Specialization with ID "${dto.specializationId}" not found`,
      );
    }

    // Check if provider already has this specialization
    const existing = await this.repository.existsByProviderAndSpecialization(
      dto.providerId,
      dto.specializationId,
    );
    if (existing) {
      throw new ConflictException(
        `Provider already has specialization "${specialization.name}"`,
      );
    }

    const providerSpecialization = ProviderSpecialization.create({
      providerId: dto.providerId,
      specializationId: dto.specializationId,
      experienceYears: dto.experienceYears,
      isCertified: dto.isCertified ?? false,
      certifications: dto.certifications,
      caseCount: dto.caseCount ?? 0,
      successRate: dto.successRate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(providerSpecialization);
  }
}
