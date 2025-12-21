// ============================================
// CREATE PROVIDER SCHEDULE USE CASE
// ============================================

import { ProviderSchedule } from '../../../../domain/provider/entities/provider-schedule.entity';
import { TimeSlot } from '../../../../domain/provider/value-objects/time-slot.vo';
import { IProviderScheduleRepository } from '../../ports/repository';

export interface CreateProviderScheduleDTO {
    providerId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export class CreateProviderScheduleUseCase {
    constructor(private readonly repository: IProviderScheduleRepository) {}

    async execute(dto: CreateProviderScheduleDTO): Promise<ProviderSchedule> {
        // Check if schedule already exists for this day
        const existing = await this.repository.findByProviderAndDay(dto.providerId, dto.dayOfWeek);
        if (existing) {
            throw new Error('Schedule already exists for this day');
        }

        const schedule = ProviderSchedule.create({
            providerId: dto.providerId,
            dayOfWeek: dto.dayOfWeek,
            timeSlot: TimeSlot.create({
                startTime: dto.startTime,
                endTime: dto.endTime,
            }),
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return await this.repository.create(schedule);
    }
}
