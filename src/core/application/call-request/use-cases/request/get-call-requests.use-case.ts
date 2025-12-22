// ============================================
// GET CALL REQUESTS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
    CallRequestFilter,
    PaginationOptions,
    PaginatedResult,
} from '../../ports/call-request.repository';
import { GetCallRequestsQueryDto } from '../../dto/call-request.dto';

@Injectable()
export class GetCallRequestsUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(query: GetCallRequestsQueryDto): Promise<PaginatedResult<CallRequest>> {
        const filter: CallRequestFilter = {};

        if (query.subscriberId) filter.subscriberId = query.subscriberId;
        if (query.providerId) filter.assignedProviderId = query.providerId;
        if (query.status) filter.status = query.status;
        if (query.consultationType) filter.consultationType = query.consultationType;
        if (query.scheduledAfter) filter.scheduledAfter = new Date(query.scheduledAfter);
        if (query.scheduledBefore) filter.scheduledBefore = new Date(query.scheduledBefore);

        const pagination: PaginationOptions = {
            limit: query.limit || 20,
            offset: query.offset || 0,
            orderBy: query.orderBy || 'createdAt',
            orderDirection: query.orderDirection || 'desc',
        };

        return await this.callRequestRepo.findAll(filter, pagination);
    }
}
