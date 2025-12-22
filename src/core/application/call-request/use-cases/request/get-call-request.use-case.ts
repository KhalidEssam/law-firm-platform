// ============================================
// GET CALL REQUEST BY ID USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
} from '../../ports/call-request.repository';

@Injectable()
export class GetCallRequestByIdUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(id: string): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(id);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${id} not found`);
        }
        return callRequest;
    }
}
