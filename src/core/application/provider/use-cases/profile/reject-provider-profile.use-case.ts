// ============================================
// REJECT PROVIDER PROFILE USE CASE
// ============================================

import { ProviderProfile } from '../../../../domain/provider/entities/providerprofile.entity';
import { IProviderProfileRepository } from '../../ports/repository';

export class RejectProviderProfileUseCase {
    constructor(private readonly repository: IProviderProfileRepository) {}

    async execute(id: string): Promise<ProviderProfile> {
        const profile = await this.repository.findById(id);
        if (!profile) {
            throw new Error('Provider profile not found');
        }

        profile.reject();
        return await this.repository.update(profile);
    }
}
