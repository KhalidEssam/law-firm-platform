// ============================================
// CHECK PROVIDER AVAILABILITY USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import {
    type ICallRequestRepository,
} from '../../ports/call-request.repository';

@Injectable()
export class CheckProviderAvailabilityUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(
        providerId: string,
        scheduledAt: Date,
        durationMinutes: number,
    ): Promise<{ isAvailable: boolean; conflictingCalls: CallRequest[] }> {
        const isAvailable = await this.callRequestRepo.isProviderAvailable(
            providerId,
            scheduledAt,
            durationMinutes,
        );

        let conflictingCalls: CallRequest[] = [];
        if (!isAvailable) {
            conflictingCalls = await this.callRequestRepo.findConflictingCalls(
                providerId,
                scheduledAt,
                durationMinutes,
            );
        }

        return { isAvailable, conflictingCalls };
    }
}
