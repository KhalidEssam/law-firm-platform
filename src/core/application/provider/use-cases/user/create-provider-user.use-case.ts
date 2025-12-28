// ============================================
// CREATE PROVIDER USER USE CASE
// ============================================

import { ProviderUser } from '../../../../domain/provider/entities/provider-user.entity';
import {
  ProviderUserRoleVO,
  ProviderUserRole,
} from '../../../../domain/provider/value-objects/provider-user-role.vo';
import { IProviderUserRepository } from '../../ports/repository';

export interface CreateProviderUserDTO {
  providerId: string;
  userId: string;
  role: ProviderUserRole;
  specializations?: string[];
}

export class CreateProviderUserUseCase {
  constructor(private readonly repository: IProviderUserRepository) {}

  async execute(dto: CreateProviderUserDTO): Promise<ProviderUser> {
    // Check if association already exists
    const existing = await this.repository.findByProviderAndUser(
      dto.providerId,
      dto.userId,
    );
    if (existing) {
      throw new Error('User is already associated with this provider');
    }

    const providerUser = ProviderUser.create({
      providerId: dto.providerId,
      userId: dto.userId,
      role: ProviderUserRoleVO.create(dto.role),
      specializations: dto.specializations,
      isActive: true,
      canAcceptRequests: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(providerUser);
  }
}
