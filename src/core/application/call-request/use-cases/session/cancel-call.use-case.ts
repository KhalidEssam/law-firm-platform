// ============================================
// CANCEL CALL USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
} from '../../ports/call-request.repository';
import { CancelCallDto } from '../../dto/call-request.dto';

@Injectable()
export class CancelCallUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string, dto?: CancelCallDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        callRequest.cancel(dto?.reason);

        return await this.callRequestRepo.update(callRequest);
    }
}
