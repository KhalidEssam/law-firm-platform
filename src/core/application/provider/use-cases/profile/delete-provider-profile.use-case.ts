// ============================================
// DELETE PROVIDER PROFILE USE CASE
// ============================================

import { IProviderProfileRepository } from '../../ports/repository';

export class DeleteProviderProfileUseCase {
  constructor(private readonly repository: IProviderProfileRepository) {}

  async execute(id: string, soft: boolean = true): Promise<void> {
    if (soft) {
      await this.repository.softDelete(id);
    } else {
      await this.repository.delete(id);
    }
  }
}
