// ============================================
// REFUND USE CASES
// src/core/application/billing/use-cases/refund.use-cases.ts
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Refund } from '../../../domain/billing/entities/refund.entity';
import { Money, CurrencyEnum } from '../../../domain/billing/value-objects/money.vo';
import { RefundStatusEnum } from '../../../domain/billing/value-objects/refund-status.vo';
import {
    IRefundRepository,
    RefundListOptions,
    RefundStatistics,
} from '../../../domain/billing/ports/refund.repository';
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
// APPROVE REFUND
// ============================================
@Injectable()
export class ApproveRefundUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(id: string, dto: ReviewRefundDto): Promise<Refund> {
        const refund = await this.refundRepository.findById(id);
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

        return await this.refundRepository.update(updatedRefund);
    }
}

// ============================================
// REJECT REFUND
// ============================================
@Injectable()
export class RejectRefundUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(id: string, dto: ReviewRefundDto): Promise<Refund> {
        const refund = await this.refundRepository.findById(id);
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

        return await this.refundRepository.update(updatedRefund);
    }
}

// ============================================
// PROCESS REFUND
// ============================================
@Injectable()
export class ProcessRefundUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(id: string, dto: ProcessRefundDto): Promise<Refund> {
        const refund = await this.refundRepository.findById(id);
        if (!refund) {
            throw new NotFoundException(`Refund with ID ${id} not found`);
        }

        if (!refund.status.canBeProcessed()) {
            throw new BadRequestException(
                `Cannot process refund. Current status: ${refund.status.getValue()}`
            );
        }

        const updatedRefund = refund.process(dto.refundReference);
        return await this.refundRepository.update(updatedRefund);
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
