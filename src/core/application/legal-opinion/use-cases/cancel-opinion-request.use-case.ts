// ============================================
// CANCEL OPINION REQUEST USE CASE
// Application Layer - State Management
// ============================================

import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LegalOpinionRequest } from '../../../domain/legal-opinion/entities/legal-opinion-request.entity';
import { LegalOpinionStatusHistory } from '../../../domain/legal-opinion/entities/legal-opinion-status-history.entity';
import { OpinionRequestId } from '../../../domain/legal-opinion/value-objects/opinion-requestid.vo';
import type { ILegalOpinionUnitOfWork } from '../../../domain/legal-opinion/port/legal-opinion.uow';
import { LEGAL_OPINION_UNIT_OF_WORK } from '../../../domain/legal-opinion/port/legal-opinion.uow';

// ============================================
// CANCEL OPINION REQUEST USE CASE
// ============================================

export interface CancelOpinionRequestCommand {
    opinionRequestId: string;
    userId: string;
    reason: string;
}

@Injectable()
export class CancelOpinionRequestUseCase {
    constructor(
        @Inject(LEGAL_OPINION_UNIT_OF_WORK)
        private readonly legalOpinionUow: ILegalOpinionUnitOfWork,
    ) {}

    async execute(command: CancelOpinionRequestCommand): Promise<any> {
        return await this.legalOpinionUow.transaction(async (uow) => {
            const opinion = await uow.opinions.findById(
                OpinionRequestId.create(command.opinionRequestId),
            );

            if (!opinion) {
                throw new NotFoundException('Opinion request not found');
            }

            // Check ownership
            if (opinion.clientId.getValue() !== command.userId) {
                throw new ForbiddenException('You can only cancel your own opinion requests');
            }

            const oldStatus = opinion.status.getValue();

            // Cancel
            opinion.cancel(command.reason);

            // Save
            const updated = await uow.opinions.update(opinion);

            // Create status history record
            const statusHistory = LegalOpinionStatusHistory.create({
                legalOpinionId: updated.id.getValue(),
                fromStatus: oldStatus,
                toStatus: updated.status.getValue(),
                reason: command.reason || 'Opinion request cancelled',
                changedBy: command.userId,
            });
            await uow.statusHistories.create(statusHistory);

            return this.toDto(updated);
        });
    }

    private toDto(opinion: LegalOpinionRequest): any {
        return {
            id: opinion.id.getValue(),
            opinionNumber: opinion.opinionNumber.toString(),
            status: opinion.status.getValue(),
            updatedAt: opinion.updatedAt.toISOString(),
        };
    }
}
