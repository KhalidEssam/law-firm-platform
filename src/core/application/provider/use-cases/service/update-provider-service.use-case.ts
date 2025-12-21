// ============================================
// UPDATE PROVIDER SERVICE USE CASE
// ============================================

import { ProviderService } from '../../../../domain/provider/entities/provider-service.entity';
import { Pricing } from '../../../../domain/provider/value-objects/pricing.vo';
import { IProviderServiceRepository } from '../../ports/repository';

export interface UpdateProviderServiceDTO {
    pricing?: {
        amount?: number;
        currency?: string;
        type?: 'fixed' | 'hourly' | 'range';
        minAmount?: number;
        maxAmount?: number;
    };
    isActive?: boolean;
}

export class UpdateProviderServiceUseCase {
    constructor(private readonly repository: IProviderServiceRepository) {}

    async execute(id: string, updates: UpdateProviderServiceDTO): Promise<ProviderService> {
        const service = await this.repository.findById(id);
        if (!service) {
            throw new Error('Provider service not found');
        }

        if (updates.pricing !== undefined) {
            service.updatePricing(Pricing.create(updates.pricing));
        }

        if (updates.isActive !== undefined) {
            if (updates.isActive) {
                service.activate();
            } else {
                service.deactivate();
            }
        }

        return await this.repository.update(service);
    }
}
