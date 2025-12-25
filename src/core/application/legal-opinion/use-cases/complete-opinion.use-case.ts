// ============================================
// COMPLETE OPINION USE CASE
// Application Layer - State Management
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { LegalOpinionRequest } from '../../../domain/legal-opinion/entities/legal-opinion-request.entity';
import { LegalOpinionStatusHistory } from '../../../domain/legal-opinion/entities/legal-opinion-status-history.entity';
import { OpinionRequestId } from '../../../domain/legal-opinion/value-objects/opinion-requestid.vo';
import type { ILegalOpinionUnitOfWork } from '../../../domain/legal-opinion/port/legal-opinion.uow';
import { LEGAL_OPINION_UNIT_OF_WORK } from '../../../domain/legal-opinion/port/legal-opinion.uow';

// ============================================
// COMPLETE OPINION USE CASE
// ============================================

export interface CompleteOpinionCommand {
    opinionRequestId: string;
    completedBy: string;
}

@Injectable()
export class CompleteOpinionUseCase {
    constructor(
        @Inject(LEGAL_OPINION_UNIT_OF_WORK)
        private readonly legalOpinionUow: ILegalOpinionUnitOfWork,
    ) {}

    async execute(command: CompleteOpinionCommand): Promise<any> {
        return await this.legalOpinionUow.transaction(async (uow) => {
            const opinion = await uow.opinions.findById(
                OpinionRequestId.create(command.opinionRequestId),
            );

            if (!opinion) {
                throw new NotFoundException('Opinion request not found');
            }

            // Check if paid
            if (!opinion.isPaid) {
                throw new BadRequestException('Opinion must be paid before completion');
            }

            const oldStatus = opinion.status.getValue();

            // Complete
            opinion.complete();

            // Save
            const updated = await uow.opinions.update(opinion);

            // Create status history record
            const statusHistory = LegalOpinionStatusHistory.create({
                legalOpinionId: updated.id.getValue(),
                fromStatus: oldStatus,
                toStatus: updated.status.getValue(),
                reason: 'Opinion completed and delivered',
                changedBy: command.completedBy,
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
            completedAt: opinion.completedAt?.toISOString(),
            finalVersion: opinion.finalVersion,
            updatedAt: opinion.updatedAt.toISOString(),
        };
    }
}
