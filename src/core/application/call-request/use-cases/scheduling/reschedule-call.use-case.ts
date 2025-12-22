// ============================================
// RESCHEDULE CALL USE CASE
// ============================================

import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
} from '../../ports/call-request.repository';
import { RescheduleCallDto } from '../../dto/call-request.dto';

@Injectable()
export class RescheduleCallUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string, dto: RescheduleCallDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        const scheduledAt = new Date(dto.scheduledAt);
        const durationMinutes = dto.durationMinutes || callRequest.scheduledDuration || 30;

        // Check for provider conflicts
        if (callRequest.assignedProviderId) {
            const conflicts = await this.callRequestRepo.findConflictingCalls(
                callRequest.assignedProviderId,
                scheduledAt,
                durationMinutes,
            );

            // Exclude current call from conflicts
            const otherConflicts = conflicts.filter(c => c.id !== callRequestId);
            if (otherConflicts.length > 0) {
                throw new ConflictException(
                    'Provider has conflicting calls at the requested time'
                );
            }
        }

        callRequest.reschedule({
            scheduledAt,
            durationMinutes: dto.durationMinutes,
            reason: dto.reason,
        });

        return await this.callRequestRepo.update(callRequest);
    }
}
