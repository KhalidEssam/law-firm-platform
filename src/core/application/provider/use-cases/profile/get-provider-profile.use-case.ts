// ============================================
// GET PROVIDER PROFILE USE CASE
// ============================================

import { ProviderProfile } from '../../../../domain/provider/entities/providerprofile.entity';
import { IProviderProfileRepository } from '../../ports/repository';

export class GetProviderProfileUseCase {
  constructor(private readonly repository: IProviderProfileRepository) {}

  async execute(_id: string): Promise<ProviderProfile | null> {
    return await this.repository.findById(id);
  }

  async executeByUserId(userId: string): Promise<ProviderProfile | null> {
    return await this.repository.findByUserId(userId);
  }

  async executeByLicenseNumber(
    licenseNumber: string,
  ): Promise<ProviderProfile | null> {
    return await this.repository.findByLicenseNumber(licenseNumber);
  }
}
