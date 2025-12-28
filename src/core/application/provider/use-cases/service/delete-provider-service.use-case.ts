// ============================================
// DELETE PROVIDER SERVICE USE CASE
// ============================================

import { IProviderServiceRepository } from '../../ports/repository';

export class DeleteProviderServiceUseCase {
  constructor(private readonly repository: IProviderServiceRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
