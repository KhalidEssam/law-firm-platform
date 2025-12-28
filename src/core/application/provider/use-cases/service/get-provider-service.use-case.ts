// ============================================
// GET PROVIDER SERVICE USE CASE
// ============================================

import { ProviderService } from '../../../../domain/provider/entities/provider-service.entity';
import { IProviderServiceRepository } from '../../ports/repository';

export class GetProviderServiceUseCase {
  constructor(private readonly repository: IProviderServiceRepository) {}

  async execute(_id: string): Promise<ProviderService | null> {
    return await this.repository.findById(id);
  }
}
