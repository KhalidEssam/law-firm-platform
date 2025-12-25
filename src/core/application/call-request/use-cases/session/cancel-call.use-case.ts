// ============================================
// CANCEL CALL USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CallRequest } from '../../../../domain/call-request/entities/call-request.entity';
import { CallStatusHistory } from '../../../../domain/call-request/entities/call-status-history.entity';
import type { ICallRequestUnitOfWork } from '../../../../domain/call-request/ports/call-request.uow';
import { CALL_REQUEST_UNIT_OF_WORK } from '../../../../domain/call-request/ports/call-request.uow';
import { CancelCallDto } from '../../dto/call-request.dto';

@Injectable()
export class CancelCallUseCase {
    constructor(
        @Inject(CALL_REQUEST_UNIT_OF_WORK)
        private readonly callRequestUow: ICallRequestUnitOfWork,
    ) {}

    async execute(callRequestId: string, dto?: CancelCallDto): Promise<CallRequest> {
        return await this.callRequestUow.transaction(async (uow) => {
            const callRequest = await uow.callRequests.findById(callRequestId);
            if (!callRequest) {
                throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
            }

            const oldStatus = callRequest.status;
            callRequest.cancel(dto?.reason);

            const updated = await uow.callRequests.update(callRequest);

            // Create status history record for the cancellation
            const statusHistory = CallStatusHistory.create({
                callRequestId: updated.id,
                fromStatus: oldStatus,
                toStatus: updated.status,
                reason: dto?.reason || 'Call cancelled',
            });
            await uow.statusHistories.create(statusHistory);

            return updated;
        });
    }
}
