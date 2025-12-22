// ============================================
// GET UPCOMING CALLS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
} from '../../ports/call-request.repository';

@Injectable()
export class GetUpcomingCallsUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(providerId: string, limit: number = 10): Promise<CallRequest[]> {
        return await this.callRequestRepo.findUpcomingCallsForProvider(providerId, limit);
    }
}
