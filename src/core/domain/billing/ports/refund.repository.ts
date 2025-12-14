// ============================================
// REFUND REPOSITORY PORT
// src/core/domain/billing/ports/refund.repository.ts
// ============================================

import { Refund, RefundReviewData } from '../entities/refund.entity';
import { RefundStatusEnum } from '../value-objects/refund-status.vo';

export interface RefundListOptions {
    userId?: string;
    status?: RefundStatusEnum;
    reviewedBy?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'amount' | 'reviewedAt' | 'processedAt';
    orderDir?: 'asc' | 'desc';
}

export interface RefundCountOptions {
    userId?: string;
    status?: RefundStatusEnum;
    reviewedBy?: string;
    fromDate?: Date;
    toDate?: Date;
}

export interface RefundStatistics {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalProcessed: number;
    totalAmount: number;
    averageProcessingTime: number | null;
}

export interface IRefundRepository {
    // ============================================
    // CREATE
    // ============================================
    create(refund: Refund): Promise<Refund>;

    // ============================================
    // READ
    // ============================================
    findById(id: string): Promise<Refund | null>;
    findByTransactionLogId(transactionLogId: string): Promise<Refund[]>;
    findByPaymentId(paymentId: string): Promise<Refund[]>;
    findByUserId(userId: string): Promise<Refund[]>;
    list(options?: RefundListOptions): Promise<Refund[]>;
    count(options?: RefundCountOptions): Promise<number>;

    // ============================================
    // UPDATE
    // ============================================
    update(refund: Refund): Promise<Refund>;
    approve(id: string, reviewData: RefundReviewData): Promise<Refund>;
    reject(id: string, reviewData: RefundReviewData): Promise<Refund>;
    process(id: string, refundReference: string): Promise<Refund>;

    // ============================================
    // DELETE
    // ============================================
    delete(id: string): Promise<void>;

    // ============================================
    // BUSINESS QUERIES
    // ============================================
    findPendingRefunds(): Promise<Refund[]>;
    findApprovedButNotProcessed(): Promise<Refund[]>;
    findByReviewer(reviewedBy: string): Promise<Refund[]>;
    getStatistics(fromDate?: Date, toDate?: Date): Promise<RefundStatistics>;
    getTotalRefundedAmount(userId?: string): Promise<number>;
    getPendingRefundAmount(userId?: string): Promise<number>;
}
