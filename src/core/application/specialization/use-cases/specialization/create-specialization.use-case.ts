// ============================================
// CREATE SPECIALIZATION USE CASE
// ============================================

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { Specialization } from '../../../../domain/specialization/entities/specialization.entity';
import type { ISpecializationRepository } from '../../../../domain/specialization/ports/specialization.repository';
import { SPECIALIZATION_REPOSITORY } from '../../../../domain/specialization/ports/specialization.repository';

export interface CreateSpecializationDTO {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  category: string;
  isActive?: boolean;
}

@Injectable()
export class CreateSpecializationUseCase {
  constructor(
    @Inject(SPECIALIZATION_REPOSITORY)
    private readonly repository: ISpecializationRepository,
  ) {}

  async execute(dto: CreateSpecializationDTO): Promise<Specialization> {
    // Check if specialization with same name exists
    const existingByName = await this.repository.existsByName(dto.name);
    if (existingByName) {
      throw new ConflictException(
        `Specialization with name "${dto.name}" already exists`,
      );
    }

    const specialization = Specialization.create({
      name: dto.name,
      nameAr: dto.nameAr,
      description: dto.description,
      descriptionAr: dto.descriptionAr,
      category: dto.category.toLowerCase(),
      isActive: dto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(specialization);
  }
}
