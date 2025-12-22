// ============================================
// GET SUBSCRIBER CALLS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
    PaginationOptions,
} from '../../ports/call-request.repository';

@Injectable()
export class GetSubscriberCallsUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(subscriberId: string, options?: PaginationOptions): Promise<CallRequest[]> {
        return await this.callRequestRepo.findBySubscriber(subscriberId, options);
    }
}
