// ============================================
// REFUND ENTITY
// src/core/domain/billing/entities/refund.entity.ts
// ============================================

import { Money } from '../value-objects/money.vo';
import { RefundStatus } from '../value-objects/refund-status.vo';

export interface RefundProps {
  userId: string;
  amount: Money;
  reason: string;
  transactionLogId?: string;
  paymentId?: string;
  status?: RefundStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RefundRehydrateProps {
  id: string;
  userId: string;
  transactionLogId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  processedAt?: Date;
  refundReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundReviewData {
  reviewedBy: string;
  reviewNotes?: string;
}

export class Refund {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly transactionLogId: string | undefined,
    public readonly paymentId: string | undefined,
    public readonly amount: Money,
    public readonly reason: string,
    public readonly status: RefundStatus,
    public readonly reviewedBy: string | undefined,
    public readonly reviewedAt: Date | undefined,
    public readonly reviewNotes: string | undefined,
    public readonly processedAt: Date | undefined,
    public readonly refundReference: string | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // ============================================
  // FACTORY METHODS
  // ============================================

  static create(props: RefundProps): Refund {
    const now = new Date();
    return new Refund(
      crypto.randomUUID(),
      props.userId,
      props.transactionLogId,
      props.paymentId,
      props.amount,
      props.reason,
      props.status ?? RefundStatus.pending(),
      undefined, // reviewedBy
      undefined, // reviewedAt
      undefined, // reviewNotes
      undefined, // processedAt
      undefined, // refundReference
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }

  static rehydrate(props: RefundRehydrateProps): Refund {
    return new Refund(
      props.id,
      props.userId,
      props.transactionLogId,
      props.paymentId,
      Money.create({ amount: props.amount, currency: props.currency }),
      props.reason,
      RefundStatus.create(props.status),
      props.reviewedBy,
      props.reviewedAt,
      props.reviewNotes,
      props.processedAt,
      props.refundReference,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ============================================
  // DOMAIN METHODS - Immutable State Transitions
  // ============================================

  approve(reviewData: RefundReviewData): Refund {
    if (!this.status.canBeReviewed()) {
      throw new Error(
        `Cannot approve refund. Current status: ${this.status.getValue()}`,
      );
    }
    return new Refund(
      this.id,
      this.userId,
      this.transactionLogId,
      this.paymentId,
      this.amount,
      this.reason,
      RefundStatus.approved(),
      reviewData.reviewedBy,
      new Date(),
      reviewData.reviewNotes,
      undefined, // processedAt - not yet processed
      undefined, // refundReference - not yet processed
      this.createdAt,
      new Date(),
    );
  }

  reject(reviewData: RefundReviewData): Refund {
    if (!this.status.canBeReviewed()) {
      throw new Error(
        `Cannot reject refund. Current status: ${this.status.getValue()}`,
      );
    }
    return new Refund(
      this.id,
      this.userId,
      this.transactionLogId,
      this.paymentId,
      this.amount,
      this.reason,
      RefundStatus.rejected(),
      reviewData.reviewedBy,
      new Date(),
      reviewData.reviewNotes,
      undefined,
      undefined,
      this.createdAt,
      new Date(),
    );
  }

  process(refundReference: string): Refund {
    if (!this.status.canBeProcessed()) {
      throw new Error(
        `Cannot process refund. Current status: ${this.status.getValue()}`,
      );
    }
    return new Refund(
      this.id,
      this.userId,
      this.transactionLogId,
      this.paymentId,
      this.amount,
      this.reason,
      RefundStatus.processed(),
      this.reviewedBy,
      this.reviewedAt,
      this.reviewNotes,
      new Date(),
      refundReference,
      this.createdAt,
      new Date(),
    );
  }

  // ============================================
  // BUSINESS LOGIC QUERIES
  // ============================================

  isPending(): boolean {
    return this.status.isPending();
  }

  isApproved(): boolean {
    return this.status.isApproved();
  }

  isRejected(): boolean {
    return this.status.isRejected();
  }

  isProcessed(): boolean {
    return this.status.isProcessed();
  }

  isFinal(): boolean {
    return this.status.isFinal();
  }

  hasBeenReviewed(): boolean {
    return this.reviewedBy !== undefined && this.reviewedAt !== undefined;
  }

  getProcessingDuration(): number | null {
    if (!this.processedAt || !this.reviewedAt) {
      return null;
    }
    return this.processedAt.getTime() - this.reviewedAt.getTime();
  }

  getReviewDuration(): number | null {
    if (!this.reviewedAt) {
      return null;
    }
    return this.reviewedAt.getTime() - this.createdAt.getTime();
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      transactionLogId: this.transactionLogId,
      paymentId: this.paymentId,
      amount: this.amount.amount,
      currency: this.amount.currency,
      reason: this.reason,
      status: this.status.getValue(),
      reviewedBy: this.reviewedBy,
      reviewedAt: this.reviewedAt?.toISOString(),
      reviewNotes: this.reviewNotes,
      processedAt: this.processedAt?.toISOString(),
      refundReference: this.refundReference,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
