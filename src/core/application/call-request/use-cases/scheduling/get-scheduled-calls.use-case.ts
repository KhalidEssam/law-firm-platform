// ============================================
// GET SCHEDULED CALLS FOR DATE RANGE USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
} from '../../ports/call-request.repository';

@Injectable()
export class GetScheduledCallsUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(
        startDate: Date,
        endDate: Date,
        providerId?: string,
    ): Promise<CallRequest[]> {
        return await this.callRequestRepo.findScheduledCalls(startDate, endDate, providerId);
    }
}
