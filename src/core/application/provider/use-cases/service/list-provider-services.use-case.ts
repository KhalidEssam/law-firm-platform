// ============================================
// LIST PROVIDER SERVICES USE CASE
// ============================================

import { ProviderService } from '../../../../domain/provider/entities/provider-service.entity';
import { ServiceType } from '../../../../domain/provider/value-objects/service-type.vo';
import { IProviderServiceRepository } from '../../ports/repository';

export interface ListProviderServicesOptions {
  serviceType?: ServiceType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListProviderServicesResult {
  services: ProviderService[];
  total: number;
}

export class ListProviderServicesByProviderUseCase {
  constructor(private readonly repository: IProviderServiceRepository) {}

  async execute(
    providerId: string,
    options?: ListProviderServicesOptions,
  ): Promise<ListProviderServicesResult> {
    const services = await this.repository.list({ providerId, ...options });
    const total = await this.repository.count({ providerId, ...options });
    return { services, total };
  }
}
