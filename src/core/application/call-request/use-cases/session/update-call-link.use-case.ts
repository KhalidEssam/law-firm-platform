// ============================================
// UPDATE CALL LINK USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
} from '../../ports/call-request.repository';
import { UpdateCallLinkDto } from '../../dto/call-request.dto';

@Injectable()
export class UpdateCallLinkUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string, dto: UpdateCallLinkDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        callRequest.updateCallLink(dto.callLink, dto.platform);

        return await this.callRequestRepo.update(callRequest);
    }
}
