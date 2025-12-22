// ============================================
// SCHEDULE CALL USE CASE
// ============================================

import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
} from '../../ports/call-request.repository';
import { ScheduleCallDto } from '../../dto/call-request.dto';

@Injectable()
export class ScheduleCallUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string, dto: ScheduleCallDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        const scheduledAt = new Date(dto.scheduledAt);

        // Check for provider conflicts if assigned
        if (callRequest.assignedProviderId) {
            const isAvailable = await this.callRequestRepo.isProviderAvailable(
                callRequest.assignedProviderId,
                scheduledAt,
                dto.durationMinutes,
            );

            if (!isAvailable) {
                throw new ConflictException(
                    'Provider is not available at the requested time. Please choose a different time slot.'
                );
            }
        }

        callRequest.schedule({
            scheduledAt,
            durationMinutes: dto.durationMinutes,
            platform: dto.platform,
            callLink: dto.callLink,
        });

        return await this.callRequestRepo.update(callRequest);
    }
}
