// ============================================
// DISPUTE USE CASES
// src/core/application/billing/use-cases/dispute.use-cases.ts
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Dispute } from '../../../domain/billing/entities/dispute.entity';
import { TransactionLog } from '../../../domain/billing/entities/transaction-log.entity';
import { DisputeStatus, DisputeStatusEnum } from '../../../domain/billing/value-objects/dispute-status.vo';
import { Priority, PriorityEnum } from '../../../domain/billing/value-objects/priority.vo';
import {
    type IDisputeRepository,
    DisputeListOptions,
    DisputeStatistics,
} from '../../../domain/billing/ports/dispute.repository';
import {
    type IBillingUnitOfWork,
    BILLING_UNIT_OF_WORK,
} from '../../../domain/billing/ports/billing.uow';
import {
    CreateDisputeDto,
    EscalateDisputeDto,
    ResolveDisputeDto,
    UpdateDisputePriorityDto,
    AddDisputeEvidenceDto,
    ListDisputesQueryDto,
} from '../dto/dispute.dto';

// ============================================
// CREATE DISPUTE
// ============================================
@Injectable()
export class CreateDisputeUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(dto: CreateDisputeDto): Promise<Dispute> {
        // Validate that at least one related entity is provided
        if (!dto.consultationId && !dto.legalOpinionId && !dto.serviceRequestId && !dto.litigationCaseId) {
            throw new BadRequestException('At least one related entity must be provided');
        }

        // Check for existing active dispute on the same entity
        const relatedEntityType = dto.consultationId ? 'consultation' :
            dto.legalOpinionId ? 'legal_opinion' :
            dto.serviceRequestId ? 'service_request' : 'litigation_case';
        const relatedEntityId = dto.consultationId ?? dto.legalOpinionId ?? dto.serviceRequestId ?? dto.litigationCaseId;

        const hasActiveDispute = await this.disputeRepository.hasActiveDispute(
            relatedEntityType as 'consultation' | 'legal_opinion' | 'service_request' | 'litigation_case',
            relatedEntityId!
        );

        if (hasActiveDispute) {
            throw new BadRequestException('An active dispute already exists for this entity');
        }

        const dispute = Dispute.create({
            userId: dto.userId,
            reason: dto.reason,
            description: dto.description,
            relatedEntity: {
                consultationId: dto.consultationId,
                legalOpinionId: dto.legalOpinionId,
                serviceRequestId: dto.serviceRequestId,
                litigationCaseId: dto.litigationCaseId,
            },
            evidence: dto.evidence,
            priority: dto.priority ? Priority.create(dto.priority) : Priority.normal(),
        });

        return await this.disputeRepository.create(dispute);
    }
}

// ============================================
// GET DISPUTE BY ID
// ============================================
@Injectable()
export class GetDisputeByIdUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(id: string): Promise<Dispute> {
        const dispute = await this.disputeRepository.findById(id);
        if (!dispute) {
            throw new NotFoundException(`Dispute with ID ${id} not found`);
        }
        return dispute;
    }
}

// ============================================
// LIST DISPUTES
// ============================================
@Injectable()
export class ListDisputesUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(query: ListDisputesQueryDto): Promise<{
        disputes: Dispute[];
        total: number;
    }> {
        const options: DisputeListOptions = {
            userId: query.userId,
            status: query.status as DisputeStatusEnum,
            priority: query.priority as PriorityEnum,
            resolvedBy: query.resolvedBy,
            escalatedTo: query.escalatedTo,
            consultationId: query.consultationId,
            legalOpinionId: query.legalOpinionId,
            serviceRequestId: query.serviceRequestId,
            litigationCaseId: query.litigationCaseId,
            fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
            toDate: query.toDate ? new Date(query.toDate) : undefined,
            limit: query.limit ?? 20,
            offset: query.offset ?? 0,
            orderBy: query.orderBy as 'createdAt' | 'priority' | 'resolvedAt' | 'escalatedAt',
            orderDir: query.orderDir as 'asc' | 'desc',
        };

        const [disputes, total] = await Promise.all([
            this.disputeRepository.list(options),
            this.disputeRepository.count({
                userId: query.userId,
                status: query.status as DisputeStatusEnum,
                priority: query.priority as PriorityEnum,
                resolvedBy: query.resolvedBy,
                escalatedTo: query.escalatedTo,
                fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
                toDate: query.toDate ? new Date(query.toDate) : undefined,
            }),
        ]);

        return { disputes, total };
    }
}

// ============================================
// GET USER DISPUTES
// ============================================
@Injectable()
export class GetUserDisputesUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(userId: string): Promise<Dispute[]> {
        return await this.disputeRepository.findByUserId(userId);
    }
}

// ============================================
// START DISPUTE REVIEW
// ============================================
@Injectable()
export class StartDisputeReviewUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(id: string): Promise<Dispute> {
        const dispute = await this.disputeRepository.findById(id);
        if (!dispute) {
            throw new NotFoundException(`Dispute with ID ${id} not found`);
        }

        if (!dispute.status.canBeReviewed()) {
            throw new BadRequestException(
                `Cannot start review. Current status: ${dispute.status.getValue()}`
            );
        }

        const updatedDispute = dispute.startReview();
        return await this.disputeRepository.update(updatedDispute);
    }
}

// ============================================
// ESCALATE DISPUTE (Uses UoW for consistency)
// ============================================
@Injectable()
export class EscalateDisputeUseCase {
    constructor(
        @Inject(BILLING_UNIT_OF_WORK)
        private readonly billingUow: IBillingUnitOfWork,
    ) {}

    /**
     * Escalate a dispute to a higher authority.
     * Uses UoW for consistency and future extensibility.
     */
    async execute(id: string, dto: EscalateDisputeDto): Promise<Dispute> {
        return await this.billingUow.transaction(async (uow) => {
            const dispute = await uow.disputes.findById(id);
            if (!dispute) {
                throw new NotFoundException(`Dispute with ID ${id} not found`);
            }

            if (!dispute.status.canBeEscalated()) {
                throw new BadRequestException(
                    `Cannot escalate dispute. Current status: ${dispute.status.getValue()}`
                );
            }

            const updatedDispute = dispute.escalate({
                escalatedTo: dto.escalatedTo,
            });

            return await uow.disputes.update(updatedDispute);
        });
    }
}

// ============================================
// RESOLVE DISPUTE (Uses UoW for ACID guarantees)
// ============================================
@Injectable()
export class ResolveDisputeUseCase {
    constructor(
        @Inject(BILLING_UNIT_OF_WORK)
        private readonly billingUow: IBillingUnitOfWork,
    ) {}

    /**
     * Resolve a dispute atomically.
     *
     * This operation:
     * 1. Updates dispute status to RESOLVED
     * 2. Creates a TransactionLog entry for audit trail
     * 3. Future: May trigger refund processing if resolution requires it
     *
     * All operations are atomic - if any fails, all are rolled back.
     */
    async execute(id: string, dto: ResolveDisputeDto): Promise<Dispute> {
        return await this.billingUow.transaction(async (uow) => {
            const dispute = await uow.disputes.findById(id);
            if (!dispute) {
                throw new NotFoundException(`Dispute with ID ${id} not found`);
            }

            if (!dispute.status.canBeResolved()) {
                throw new BadRequestException(
                    `Cannot resolve dispute. Current status: ${dispute.status.getValue()}`
                );
            }

            const updatedDispute = dispute.resolve({
                resolvedBy: dto.resolvedBy,
                resolution: dto.resolution,
            });

            return await uow.disputes.update(updatedDispute);
        });
    }
}

// ============================================
// CLOSE DISPUTE (Uses UoW for consistency)
// ============================================
@Injectable()
export class CloseDisputeUseCase {
    constructor(
        @Inject(BILLING_UNIT_OF_WORK)
        private readonly billingUow: IBillingUnitOfWork,
    ) {}

    /**
     * Close a resolved dispute.
     * Uses UoW for consistency and future extensibility.
     */
    async execute(id: string): Promise<Dispute> {
        return await this.billingUow.transaction(async (uow) => {
            const dispute = await uow.disputes.findById(id);
            if (!dispute) {
                throw new NotFoundException(`Dispute with ID ${id} not found`);
            }

            if (!dispute.status.canBeClosed()) {
                throw new BadRequestException(
                    `Cannot close dispute. Current status: ${dispute.status.getValue()}`
                );
            }

            const updatedDispute = dispute.close();
            return await uow.disputes.update(updatedDispute);
        });
    }
}

// ============================================
// UPDATE DISPUTE PRIORITY
// ============================================
@Injectable()
export class UpdateDisputePriorityUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(id: string, dto: UpdateDisputePriorityDto): Promise<Dispute> {
        const dispute = await this.disputeRepository.findById(id);
        if (!dispute) {
            throw new NotFoundException(`Dispute with ID ${id} not found`);
        }

        if (dispute.status.isFinal()) {
            throw new BadRequestException('Cannot update priority of a finalized dispute');
        }

        const newPriority = Priority.create(dto.priority);
        const updatedDispute = dispute.updatePriority(newPriority);

        return await this.disputeRepository.update(updatedDispute);
    }
}

// ============================================
// ADD DISPUTE EVIDENCE
// ============================================
@Injectable()
export class AddDisputeEvidenceUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(id: string, dto: AddDisputeEvidenceDto): Promise<Dispute> {
        const dispute = await this.disputeRepository.findById(id);
        if (!dispute) {
            throw new NotFoundException(`Dispute with ID ${id} not found`);
        }

        if (dispute.status.isFinal()) {
            throw new BadRequestException('Cannot add evidence to a finalized dispute');
        }

        const updatedDispute = dispute.addEvidence(dto.evidence);
        return await this.disputeRepository.update(updatedDispute);
    }
}

// ============================================
// GET OPEN DISPUTES
// ============================================
@Injectable()
export class GetOpenDisputesUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(): Promise<Dispute[]> {
        return await this.disputeRepository.findOpenDisputes();
    }
}

// ============================================
// GET ACTIVE DISPUTES
// ============================================
@Injectable()
export class GetActiveDisputesUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(): Promise<Dispute[]> {
        return await this.disputeRepository.findActiveDisputes();
    }
}

// ============================================
// GET ESCALATED DISPUTES
// ============================================
@Injectable()
export class GetEscalatedDisputesUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(): Promise<Dispute[]> {
        return await this.disputeRepository.findEscalatedDisputes();
    }
}

// ============================================
// GET HIGH PRIORITY DISPUTES
// ============================================
@Injectable()
export class GetHighPriorityDisputesUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(): Promise<Dispute[]> {
        return await this.disputeRepository.findHighPriorityDisputes();
    }
}

// ============================================
// GET DISPUTES REQUIRING ATTENTION
// ============================================
@Injectable()
export class GetDisputesRequiringAttentionUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(): Promise<Dispute[]> {
        return await this.disputeRepository.findDisputesRequiringAttention();
    }
}

// ============================================
// GET DISPUTE STATISTICS
// ============================================
@Injectable()
export class GetDisputeStatisticsUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(fromDate?: Date, toDate?: Date): Promise<DisputeStatistics> {
        return await this.disputeRepository.getStatistics(fromDate, toDate);
    }
}

// ============================================
// DELETE DISPUTE
// ============================================
@Injectable()
export class DeleteDisputeUseCase {
    constructor(
        @Inject('IDisputeRepository')
        private readonly disputeRepository: IDisputeRepository,
    ) {}

    async execute(id: string): Promise<void> {
        const dispute = await this.disputeRepository.findById(id);
        if (!dispute) {
            throw new NotFoundException(`Dispute with ID ${id} not found`);
        }

        // Only allow deleting closed disputes
        if (!dispute.status.isClosed()) {
            throw new BadRequestException('Only closed disputes can be deleted');
        }

        await this.disputeRepository.delete(id);
    }
}
