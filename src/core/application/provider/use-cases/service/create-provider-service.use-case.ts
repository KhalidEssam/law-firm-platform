// ============================================
// CREATE PROVIDER SERVICE USE CASE
// ============================================

import { ProviderService } from '../../../../domain/provider/entities/provider-service.entity';
import {
  ServiceTypeVO,
  ServiceType,
} from '../../../../domain/provider/value-objects/service-type.vo';
import { Pricing } from '../../../../domain/provider/value-objects/pricing.vo';
import { IProviderServiceRepository } from '../../ports/repository';

export interface CreateProviderServiceDTO {
  providerId: string;
  serviceType: ServiceType;
  category?: string;
  pricing?: {
    amount?: number;
    currency?: string;
    type?: 'fixed' | 'hourly' | 'range';
    minAmount?: number;
    maxAmount?: number;
  };
}

export class CreateProviderServiceUseCase {
  constructor(private readonly repository: IProviderServiceRepository) {}

  async execute(dto: CreateProviderServiceDTO): Promise<ProviderService> {
    const service = ProviderService.create({
      providerId: dto.providerId,
      serviceType: ServiceTypeVO.create(dto.serviceType, dto.category),
      isActive: true,
      pricing: dto.pricing ? Pricing.create(dto.pricing) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(service);
  }
}
