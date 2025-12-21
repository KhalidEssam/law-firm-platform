// ============================================
// LIST PROVIDER PROFILES USE CASE
// ============================================

import { ProviderProfile } from '../../../../domain/provider/entities/providerprofile.entity';
import { IProviderProfileRepository, ListProviderProfilesOptions } from '../../ports/repository';

export interface ListProviderProfilesResult {
    profiles: ProviderProfile[];
    total: number;
}

export class ListProviderProfilesUseCase {
    constructor(private readonly repository: IProviderProfileRepository) {}

    async execute(options?: ListProviderProfilesOptions): Promise<ListProviderProfilesResult> {
        const profiles = await this.repository.list(options);
        const total = await this.repository.count(options);
        return { profiles, total };
    }
}
