// ============================================
// LIST PROVIDER SCHEDULES USE CASE
// ============================================

import { ProviderSchedule } from '../../../../domain/provider/entities/provider-schedule.entity';
import { IProviderScheduleRepository } from '../../ports/repository';

export interface ListProviderSchedulesOptions {
    dayOfWeek?: number;
    isAvailable?: boolean;
}

export class ListProviderSchedulesByProviderUseCase {
    constructor(private readonly repository: IProviderScheduleRepository) {}

    async execute(providerId: string, options?: ListProviderSchedulesOptions): Promise<ProviderSchedule[]> {
        return await this.repository.list({ providerId, ...options });
    }
}
