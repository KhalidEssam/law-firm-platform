// ============================================
// MARK AS PAID USE CASE
// Application Layer - State Management
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { LegalOpinionRequest } from '../../../domain/legal-opinion/entities/legal-opinion-request.entity';
import { LegalOpinionStatusHistory } from '../../../domain/legal-opinion/entities/legal-opinion-status-history.entity';
import { OpinionRequestId } from '../../../domain/legal-opinion/value-objects/opinion-requestid.vo';
import { Money } from '../../../domain/legal-opinion/value-objects/money.vo';
import type { ILegalOpinionUnitOfWork } from '../../../domain/legal-opinion/port/legal-opinion.uow';
import { LEGAL_OPINION_UNIT_OF_WORK } from '../../../domain/legal-opinion/port/legal-opinion.uow';

// ============================================
// MARK AS PAID USE CASE
// ============================================

export interface MarkAsPaidCommand {
    opinionRequestId: string;
    paymentReference: string;
    finalCost?: {
        amount: number;
        currency: string;
    };
    markedBy: string;
}

@Injectable()
export class MarkAsPaidUseCase {
    constructor(
        @Inject(LEGAL_OPINION_UNIT_OF_WORK)
        private readonly legalOpinionUow: ILegalOpinionUnitOfWork,
    ) {}

    async execute(command: MarkAsPaidCommand): Promise<any> {
        return await this.legalOpinionUow.transaction(async (uow) => {
            const opinion = await uow.opinions.findById(
                OpinionRequestId.create(command.opinionRequestId),
            );

            if (!opinion) {
                throw new NotFoundException('Opinion request not found');
            }

            const oldStatus = opinion.status.getValue();

            // Mark as paid
            const finalCost = command.finalCost
                ? Money.create(command.finalCost.amount, command.finalCost.currency)
                : opinion.estimatedCost;

            if (finalCost) {
                opinion.markAsPaid(command.paymentReference, finalCost);
            }

            // Save
            const updated = await uow.opinions.update(opinion);

            // Create status history record for payment
            const statusHistory = LegalOpinionStatusHistory.create({
                legalOpinionId: updated.id.getValue(),
                fromStatus: oldStatus,
                toStatus: updated.status.getValue(),
                reason: `Payment received: ${command.paymentReference}`,
                changedBy: command.markedBy,
            });
            await uow.statusHistories.create(statusHistory);

            return this.toDto(updated);
        });
    }

    private toDto(opinion: LegalOpinionRequest): any {
        return {
            id: opinion.id.getValue(),
            opinionNumber: opinion.opinionNumber.toString(),
            isPaid: opinion.isPaid,
            paymentReference: opinion.paymentReference,
            finalCost: opinion.finalCost
                ? {
                      amount: opinion.finalCost.getAmount(),
                      currency: opinion.finalCost.getCurrency(),
                  }
                : undefined,
            updatedAt: opinion.updatedAt.toISOString(),
        };
    }
}
