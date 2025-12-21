// ============================================
// GET PROVIDER USER USE CASE
// ============================================

import { ProviderUser } from '../../../../domain/provider/entities/provider-user.entity';
import { IProviderUserRepository } from '../../ports/repository';

export class GetProviderUserUseCase {
    constructor(private readonly repository: IProviderUserRepository) {}

    async execute(id: string): Promise<ProviderUser | null> {
        return await this.repository.findById(id);
    }

    async executeByProviderAndUser(providerId: string, userId: string): Promise<ProviderUser | null> {
        return await this.repository.findByProviderAndUser(providerId, userId);
    }
}
