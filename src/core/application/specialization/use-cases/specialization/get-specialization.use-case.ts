// ============================================
// GET SPECIALIZATION USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Specialization } from '../../../../domain/specialization/entities/specialization.entity';
import type { ISpecializationRepository } from '../../../../domain/specialization/ports/specialization.repository';
import { SPECIALIZATION_REPOSITORY } from '../../../../domain/specialization/ports/specialization.repository';

@Injectable()
export class GetSpecializationUseCase {
  constructor(
    @Inject(SPECIALIZATION_REPOSITORY)
    private readonly repository: ISpecializationRepository,
  ) {}

  async execute(_id: string): Promise<Specialization> {
    const specialization = await this.repository.findById(id);

    if (!specialization) {
      throw new NotFoundException(`Specialization with ID "${id}" not found`);
    }

    return specialization;
  }

  async executeByName(name: string): Promise<Specialization> {
    const specialization = await this.repository.findByName(name);

    if (!specialization) {
      throw new NotFoundException(
        `Specialization with name "${name}" not found`,
      );
    }

    return specialization;
  }
}
