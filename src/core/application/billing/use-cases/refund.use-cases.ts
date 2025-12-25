// ============================================
// REFUND USE CASES
// src/core/application/billing/use-cases/refund.use-cases.ts
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Refund } from '../../../domain/billing/entities/refund.entity';
import { TransactionLog } from '../../../domain/billing/entities/transaction-log.entity';
import { Money, CurrencyEnum } from '../../../domain/billing/value-objects/money.vo';
import { RefundStatusEnum } from '../../../domain/billing/value-objects/refund-status.vo';
import {
    type IRefundRepository,
    RefundListOptions,
    RefundStatistics,
} from '../../../domain/billing/ports/refund.repository';
import {
    type IBillingUnitOfWork,
    BILLING_UNIT_OF_WORK,
} from '../../../domain/billing/ports/billing.uow';
import {
    RequestRefundDto,
    ReviewRefundDto,
    ProcessRefundDto,
    ListRefundsQueryDto,
} from '../dto/refund.dto';

// ============================================
// REQUEST REFUND
// ============================================
@Injectable()
export class RequestRefundUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(dto: RequestRefundDto): Promise<Refund> {
        const refund = Refund.create({
            userId: dto.userId,
            amount: Money.create({
                amount: dto.amount,
                currency: dto.currency ?? CurrencyEnum.SAR,
            }),
            reason: dto.reason,
            transactionLogId: dto.transactionLogId,
            paymentId: dto.paymentId,
        });

        return await this.refundRepository.create(refund);
    }
}

// ============================================
// GET REFUND BY ID
// ============================================
@Injectable()
export class GetRefundByIdUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(id: string): Promise<Refund> {
        const refund = await this.refundRepository.findById(id);
        if (!refund) {
            throw new NotFoundException(`Refund with ID ${id} not found`);
        }
        return refund;
    }
}

// ============================================
// LIST REFUNDS
// ============================================
@Injectable()
export class ListRefundsUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(query: ListRefundsQueryDto): Promise<{
        refunds: Refund[];
        total: number;
    }> {
        const options: RefundListOptions = {
            userId: query.userId,
            status: query.status as RefundStatusEnum,
            reviewedBy: query.reviewedBy,
            fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
            toDate: query.toDate ? new Date(query.toDate) : undefined,
            limit: query.limit ?? 20,
            offset: query.offset ?? 0,
            orderBy: query.orderBy as 'createdAt' | 'amount' | 'reviewedAt' | 'processedAt',
            orderDir: query.orderDir as 'asc' | 'desc',
        };

        const [refunds, total] = await Promise.all([
            this.refundRepository.list(options),
            this.refundRepository.count({
                userId: query.userId,
                status: query.status as RefundStatusEnum,
                reviewedBy: query.reviewedBy,
                fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
                toDate: query.toDate ? new Date(query.toDate) : undefined,
            }),
        ]);

        return { refunds, total };
    }
}

// ============================================
// GET USER REFUNDS
// ============================================
@Injectable()
export class GetUserRefundsUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(userId: string): Promise<Refund[]> {
        return await this.refundRepository.findByUserId(userId);
    }
}

// ============================================
// APPROVE REFUND (Uses UoW for consistency)
// ============================================
@Injectable()
export class ApproveRefundUseCase {
    constructor(
        @Inject(BILLING_UNIT_OF_WORK)
        private readonly billingUow: IBillingUnitOfWork,
    ) {}

    /**
     * Approve a pending refund request.
     * Uses UoW for consistency and future extensibility (e.g., audit logging).
     */
    async execute(id: string, dto: ReviewRefundDto): Promise<Refund> {
        return await this.billingUow.transaction(async (uow) => {
            const refund = await uow.refunds.findById(id);
            if (!refund) {
                throw new NotFoundException(`Refund with ID ${id} not found`);
            }

            if (!refund.status.canBeReviewed()) {
                throw new BadRequestException(
                    `Cannot approve refund. Current status: ${refund.status.getValue()}`
                );
            }

            const updatedRefund = refund.approve({
                reviewedBy: dto.reviewedBy,
                reviewNotes: dto.reviewNotes,
            });

            return await uow.refunds.update(updatedRefund);
        });
    }
}

// ============================================
// REJECT REFUND (Uses UoW for consistency)
// ============================================
@Injectable()
export class RejectRefundUseCase {
    constructor(
        @Inject(BILLING_UNIT_OF_WORK)
        private readonly billingUow: IBillingUnitOfWork,
    ) {}

    /**
     * Reject a pending refund request.
     * Uses UoW for consistency and future extensibility (e.g., audit logging).
     */
    async execute(id: string, dto: ReviewRefundDto): Promise<Refund> {
        return await this.billingUow.transaction(async (uow) => {
            const refund = await uow.refunds.findById(id);
            if (!refund) {
                throw new NotFoundException(`Refund with ID ${id} not found`);
            }

            if (!refund.status.canBeReviewed()) {
                throw new BadRequestException(
                    `Cannot reject refund. Current status: ${refund.status.getValue()}`
                );
            }

            const updatedRefund = refund.reject({
                reviewedBy: dto.reviewedBy,
                reviewNotes: dto.reviewNotes,
            });

            return await uow.refunds.update(updatedRefund);
        });
    }
}

// ============================================
// PROCESS REFUND (Uses UoW for ACID guarantees)
// ============================================
@Injectable()
export class ProcessRefundUseCase {
    constructor(
        @Inject(BILLING_UNIT_OF_WORK)
        private readonly billingUow: IBillingUnitOfWork,
    ) {}

    /**
     * Process an approved refund atomically.
     *
     * This operation:
     * 1. Updates refund status to PROCESSED
     * 2. Creates a TransactionLog entry for the refund
     * 3. If original transaction exists, marks it as refunded
     *
     * All operations are atomic - if any fails, all are rolled back.
     */
    async execute(id: string, dto: ProcessRefundDto): Promise<Refund> {
        return await this.billingUow.transaction(async (uow) => {
            // 1. Find and validate refund
            const refund = await uow.refunds.findById(id);
            if (!refund) {
                throw new NotFoundException(`Refund with ID ${id} not found`);
            }

            if (!refund.status.canBeProcessed()) {
                throw new BadRequestException(
                    `Cannot process refund. Current status: ${refund.status.getValue()}`
                );
            }

            // 2. Update refund status
            const updatedRefund = refund.process(dto.refundReference);
            await uow.refunds.update(updatedRefund);

            // 3. Create refund transaction log for audit trail
            const refundTransactionLog = TransactionLog.createRefundTransaction({
                userId: refund.userId,
                amount: refund.amount,
                originalTransactionId: refund.transactionLogId ?? refund.id,
                metadata: {
                    refundId: refund.id,
                    refundReference: dto.refundReference,
                    reason: refund.reason,
                },
            });
            const createdLog = await uow.transactionLogs.create(refundTransactionLog);

            // 4. Mark the refund transaction as paid (completed)
            const paidLog = createdLog.markAsPaid();
            await uow.transactionLogs.update(paidLog);

            // 5. If there's an original transaction, mark it as refunded
            if (refund.transactionLogId) {
                const originalTransaction = await uow.transactionLogs.findById(refund.transactionLogId);
                if (originalTransaction && originalTransaction.status.canBeRefunded()) {
                    const refundedTransaction = originalTransaction.markAsRefunded();
                    await uow.transactionLogs.update(refundedTransaction);
                }
            }

            return updatedRefund;
        });
    }
}

// ============================================
// GET PENDING REFUNDS
// ============================================
@Injectable()
export class GetPendingRefundsUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(): Promise<Refund[]> {
        return await this.refundRepository.findPendingRefunds();
    }
}

// ============================================
// GET APPROVED BUT NOT PROCESSED REFUNDS
// ============================================
@Injectable()
export class GetApprovedRefundsUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(): Promise<Refund[]> {
        return await this.refundRepository.findApprovedButNotProcessed();
    }
}

// ============================================
// GET REFUND STATISTICS
// ============================================
@Injectable()
export class GetRefundStatisticsUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(fromDate?: Date, toDate?: Date): Promise<RefundStatistics> {
        return await this.refundRepository.getStatistics(fromDate, toDate);
    }
}

// ============================================
// GET TOTAL REFUNDED AMOUNT
// ============================================
@Injectable()
export class GetTotalRefundedAmountUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(userId?: string): Promise<number> {
        return await this.refundRepository.getTotalRefundedAmount(userId);
    }
}

// ============================================
// GET PENDING REFUND AMOUNT
// ============================================
@Injectable()
export class GetPendingRefundAmountUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(userId?: string): Promise<number> {
        return await this.refundRepository.getPendingRefundAmount(userId);
    }
}

// ============================================
// DELETE REFUND
// ============================================
@Injectable()
export class DeleteRefundUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(id: string): Promise<void> {
        const refund = await this.refundRepository.findById(id);
        if (!refund) {
            throw new NotFoundException(`Refund with ID ${id} not found`);
        }

        // Only allow deleting rejected refunds
        if (!refund.status.isRejected()) {
            throw new BadRequestException('Only rejected refunds can be deleted');
        }

        await this.refundRepository.delete(id);
    }
}
