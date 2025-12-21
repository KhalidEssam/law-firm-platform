// ============================================
// LIST PROVIDER USERS USE CASE
// ============================================

import { ProviderUser } from '../../../../domain/provider/entities/provider-user.entity';
import { IProviderUserRepository } from '../../ports/repository';

export interface ListProviderUsersOptions {
    isActive?: boolean;
    canAcceptRequests?: boolean;
    limit?: number;
    offset?: number;
}

export interface ListProviderUsersResult {
    users: ProviderUser[];
    total: number;
}

export class ListProviderUsersByProviderUseCase {
    constructor(private readonly repository: IProviderUserRepository) {}

    async execute(providerId: string, options?: ListProviderUsersOptions): Promise<ListProviderUsersResult> {
        const users = await this.repository.list({ providerId, ...options });
        const total = await this.repository.count({ providerId, ...options });
        return { users, total };
    }
}
