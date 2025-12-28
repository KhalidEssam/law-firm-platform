// ============================================
// GET OVERDUE CALLS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import { type ICallRequestRepository } from '../../ports/call-request.repository';

@Injectable()
export class GetOverdueCallsUseCase {
  constructor(
    @Inject('ICallRequestRepository')
    private readonly callRequestRepo: ICallRequestRepository,
  ) {}

  async execute(): Promise<CallRequest[]> {
    return await this.callRequestRepo.findOverdueCalls();
  }
}
