// ============================================
// UPDATE PROVIDER USER USE CASE
// ============================================

import { ProviderUser } from '../../../../domain/provider/entities/provider-user.entity';
import { IProviderUserRepository } from '../../ports/repository';

export interface UpdateProviderUserDTO {
  specializations?: string[];
  canAcceptRequests?: boolean;
}

export class UpdateProviderUserUseCase {
  constructor(private readonly repository: IProviderUserRepository) {}

  async execute(
    id: string,
    updates: UpdateProviderUserDTO,
  ): Promise<ProviderUser> {
    const providerUser = await this.repository.findById(id);
    if (!providerUser) {
      throw new Error('Provider user not found');
    }

    if (updates.specializations !== undefined) {
      providerUser.updateSpecializations(updates.specializations);
    }

    if (updates.canAcceptRequests !== undefined) {
      if (updates.canAcceptRequests) {
        providerUser.enableRequestAcceptance();
      } else {
        providerUser.disableRequestAcceptance();
      }
    }

    return await this.repository.update(providerUser);
  }
}
