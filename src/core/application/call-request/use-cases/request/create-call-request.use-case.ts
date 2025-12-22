// ============================================
// CREATE CALL REQUEST USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
} from '../../ports/call-request.repository';
import { CreateCallRequestDto } from '../../dto/call-request.dto';

@Injectable()
export class CreateCallRequestUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(dto: CreateCallRequestDto): Promise<CallRequest> {
        // Check if subscriber has too many pending calls
        const hasPending = await this.callRequestRepo.hasPendingCalls(dto.subscriberId);
        if (hasPending) {
            // Allow multiple pending, but could add a limit here
        }

        const callRequest = CallRequest.create({
            subscriberId: dto.subscriberId,
            purpose: dto.purpose,
            consultationType: dto.consultationType,
            preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
            preferredTime: dto.preferredTime,
        });

        return await this.callRequestRepo.create(callRequest);
    }
}
