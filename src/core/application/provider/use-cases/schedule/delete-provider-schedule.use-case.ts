// ============================================
// DELETE PROVIDER SCHEDULE USE CASE
// ============================================

import { IProviderScheduleRepository } from '../../ports/repository';

export class DeleteProviderScheduleUseCase {
  constructor(private readonly repository: IProviderScheduleRepository) {}

  async execute(_id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
