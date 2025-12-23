// ============================================
// UPDATE SPECIALIZATION USE CASE
// ============================================

import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Specialization } from '../../../../domain/specialization/entities/specialization.entity';
import type { ISpecializationRepository } from '../../../../domain/specialization/ports/specialization.repository';
import { SPECIALIZATION_REPOSITORY } from '../../../../domain/specialization/ports/specialization.repository';

export interface UpdateSpecializationDTO {
    id: string;
    name?: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    category?: string;
    isActive?: boolean;
}

@Injectable()
export class UpdateSpecializationUseCase {
    constructor(
        @Inject(SPECIALIZATION_REPOSITORY)
        private readonly repository: ISpecializationRepository,
    ) {}

    async execute(dto: UpdateSpecializationDTO): Promise<Specialization> {
        const specialization = await this.repository.findById(dto.id);

        if (!specialization) {
            throw new NotFoundException(`Specialization with ID "${dto.id}" not found`);
        }

        // Check if new name conflicts with existing specialization
        if (dto.name && dto.name !== specialization.name) {
            const existingByName = await this.repository.findByName(dto.name);
            if (existingByName && existingByName.id !== dto.id) {
                throw new ConflictException(`Specialization with name "${dto.name}" already exists`);
            }
        }

        // Update details
        specialization.updateDetails({
            name: dto.name,
            nameAr: dto.nameAr,
            description: dto.description,
            descriptionAr: dto.descriptionAr,
            category: dto.category?.toLowerCase(),
        });

        // Handle activation/deactivation
        if (dto.isActive !== undefined) {
            if (dto.isActive) {
                specialization.activate();
            } else {
                specialization.deactivate();
            }
        }

        return await this.repository.update(specialization);
    }
}
