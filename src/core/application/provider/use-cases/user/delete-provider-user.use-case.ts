// ============================================
// DELETE PROVIDER USER USE CASE
// ============================================

import { IProviderUserRepository } from '../../ports/repository';

export class DeleteProviderUserUseCase {
  constructor(private readonly repository: IProviderUserRepository) {}

  async execute(id: string, soft: boolean = true): Promise<void> {
    if (soft) {
      await this.repository.softDelete(id);
    } else {
      await this.repository.delete(id);
    }
  }
}
