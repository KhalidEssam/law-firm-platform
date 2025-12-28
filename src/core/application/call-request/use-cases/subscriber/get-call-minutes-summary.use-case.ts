// ============================================
// GET CALL MINUTES SUMMARY USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { type ICallRequestRepository } from '../../ports/call-request.repository';

export interface CallMinutesSummary {
  totalMinutes: number;
  billableMinutes: number;
}

@Injectable()
export class GetCallMinutesSummaryUseCase {
  constructor(
    @Inject('ICallRequestRepository')
    private readonly callRequestRepo: ICallRequestRepository,
  ) {}

  async execute(
    subscriberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CallMinutesSummary> {
    const totalMinutes = await this.callRequestRepo.getTotalCallMinutes(
      subscriberId,
      startDate,
      endDate,
    );

    // Calculate billable minutes (rounded up to 15-minute increments)
    const billableMinutes = Math.ceil(totalMinutes / 15) * 15;

    return {
      totalMinutes,
      billableMinutes,
    };
  }
}
