// ============================================
// END CALL USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
} from '../../ports/call-request.repository';
import { EndCallDto } from '../../dto/call-request.dto';

@Injectable()
export class EndCallUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string, dto?: EndCallDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        callRequest.endCall(dto?.recordingUrl);

        return await this.callRequestRepo.update(callRequest);
    }
}
