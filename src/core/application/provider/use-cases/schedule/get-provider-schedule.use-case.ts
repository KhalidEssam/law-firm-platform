// ============================================
// GET PROVIDER SCHEDULE USE CASE
// ============================================

import { ProviderSchedule } from '../../../../domain/provider/entities/provider-schedule.entity';
import { IProviderScheduleRepository } from '../../ports/repository';

export class GetProviderScheduleUseCase {
  constructor(private readonly repository: IProviderScheduleRepository) {}

  async execute(_id: string): Promise<ProviderSchedule | null> {
    return await this.repository.findById(id);
  }
}
