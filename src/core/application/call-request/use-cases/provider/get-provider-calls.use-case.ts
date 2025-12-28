// ============================================
// GET PROVIDER CALLS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
  type ICallRequestRepository,
  PaginationOptions,
} from '../../ports/call-request.repository';

@Injectable()
export class GetProviderCallsUseCase {
  constructor(
    @Inject('ICallRequestRepository')
    private readonly callRequestRepo: ICallRequestRepository,
  ) {}

  async execute(
    providerId: string,
    options?: PaginationOptions,
  ): Promise<CallRequest[]> {
    return await this.callRequestRepo.findByProvider(providerId, options);
  }
}
