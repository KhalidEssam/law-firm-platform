// ============================================
// UPDATE PROVIDER SCHEDULE USE CASE
// ============================================

import { ProviderSchedule } from '../../../../domain/provider/entities/provider-schedule.entity';
import { TimeSlot } from '../../../../domain/provider/value-objects/time-slot.vo';
import { IProviderScheduleRepository } from '../../ports/repository';

export interface UpdateProviderScheduleDTO {
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}

export class UpdateProviderScheduleUseCase {
  constructor(private readonly repository: IProviderScheduleRepository) {}

  async execute(
    id: string,
    updates: UpdateProviderScheduleDTO,
  ): Promise<ProviderSchedule> {
    const schedule = await this.repository.findById(id);
    if (!schedule) {
      throw new Error('Provider schedule not found');
    }

    if (updates.startTime && updates.endTime) {
      schedule.updateTimeSlot(
        TimeSlot.create({
          startTime: updates.startTime,
          endTime: updates.endTime,
        }),
      );
    }

    if (updates.isAvailable !== undefined) {
      if (updates.isAvailable) {
        schedule.markAvailable();
      } else {
        schedule.markUnavailable();
      }
    }

    return await this.repository.update(schedule);
  }
}
