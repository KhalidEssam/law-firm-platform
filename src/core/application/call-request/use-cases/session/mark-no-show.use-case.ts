// ============================================
// MARK NO SHOW USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import { type ICallRequestRepository } from '../../ports/call-request.repository';

@Injectable()
export class MarkNoShowUseCase {
  constructor(
    @Inject('ICallRequestRepository')
    private readonly callRequestRepo: ICallRequestRepository,
  ) {}

  async execute(callRequestId: string): Promise<CallRequest> {
    const callRequest = await this.callRequestRepo.findById(callRequestId);
    if (!callRequest) {
      throw new NotFoundException(
        `Call request with ID ${callRequestId} not found`,
      );
    }

    callRequest.markNoShow();

    return await this.callRequestRepo.update(callRequest);
  }
}
