// ============================================
// LIST SPECIALIZATIONS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { Specialization } from '../../../../domain/specialization/entities/specialization.entity';
import type {
    ISpecializationRepository,
    ListSpecializationsOptions,
} from '../../../../domain/specialization/ports/specialization.repository';
import { SPECIALIZATION_REPOSITORY } from '../../../../domain/specialization/ports/specialization.repository';

export interface ListSpecializationsDTO {
    category?: string;
    isActive?: boolean;
    searchTerm?: string;
    limit?: number;
    offset?: number;
}

export interface ListSpecializationsResult {
    specializations: Specialization[];
    total: number;
    limit: number;
    offset: number;
}

@Injectable()
export class ListSpecializationsUseCase {
    constructor(
        @Inject(SPECIALIZATION_REPOSITORY)
        private readonly repository: ISpecializationRepository,
    ) {}

    async execute(dto?: ListSpecializationsDTO): Promise<ListSpecializationsResult> {
        const options: ListSpecializationsOptions = {
            category: dto?.category?.toLowerCase(),
            isActive: dto?.isActive,
            searchTerm: dto?.searchTerm,
            limit: dto?.limit ?? 50,
            offset: dto?.offset ?? 0,
        };

        const [specializations, total] = await Promise.all([
            this.repository.list(options),
            this.repository.count({
                category: options.category,
                isActive: options.isActive,
                searchTerm: options.searchTerm,
            }),
        ]);

        return {
            specializations,
            total,
            limit: options.limit!,
            offset: options.offset!,
        };
    }

    async executeByCategory(category: string): Promise<Specialization[]> {
        return await this.repository.findByCategory(category.toLowerCase());
    }

    async executeActive(): Promise<Specialization[]> {
        return await this.repository.findActiveSpecializations();
    }

    async getCategories(): Promise<string[]> {
        return await this.repository.getCategories();
    }
}
