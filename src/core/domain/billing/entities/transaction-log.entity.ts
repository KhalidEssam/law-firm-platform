// ============================================
// TRANSACTION LOG ENTITY
// src/core/domain/billing/entities/transaction-log.entity.ts
// ============================================

import { Money, CurrencyEnum } from '../value-objects/money.vo';
import {
  TransactionType,
  TransactionTypeEnum,
} from '../value-objects/transaction-type.vo';
import {
  PaymentStatus,
  PaymentStatusEnum,
} from '../value-objects/payment-status.vo';

export interface TransactionLogProps {
  userId: string;
  type: TransactionType;
  amount: Money;
  status: PaymentStatus;
  reference?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface TransactionLogRehydrateProps {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export class TransactionLog {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: TransactionType,
    public readonly amount: Money,
    public readonly status: PaymentStatus,
    public readonly reference: string | undefined,
    public readonly metadata: Record<string, unknown> | undefined,
    public readonly createdAt: Date,
  ) {}

  // ============================================
  // FACTORY METHODS
  // ============================================

  static create(props: TransactionLogProps): TransactionLog {
    return new TransactionLog(
      crypto.randomUUID(),
      props.userId,
      props.type,
      props.amount,
      props.status,
      props.reference,
      props.metadata,
      props.createdAt ?? new Date(),
    );
  }

  static rehydrate(props: TransactionLogRehydrateProps): TransactionLog {
    return new TransactionLog(
      props.id,
      props.userId,
      TransactionType.create(props.type),
      Money.create({ amount: props.amount, currency: props.currency }),
      PaymentStatus.create(props.status),
      props.reference,
      props.metadata,
      props.createdAt,
    );
  }

  // ============================================
  // SPECIALIZED FACTORY METHODS
  // ============================================

  static createSubscriptionPayment(params: {
    userId: string;
    amount: Money;
    reference?: string;
    metadata?: Record<string, unknown>;
  }): TransactionLog {
    return TransactionLog.create({
      userId: params.userId,
      type: TransactionType.subscription(),
      amount: params.amount,
      status: PaymentStatus.pending(),
      reference: params.reference,
      metadata: params.metadata,
    });
  }

  static createWalletTopup(params: {
    userId: string;
    amount: Money;
    reference?: string;
    metadata?: Record<string, unknown>;
  }): TransactionLog {
    return TransactionLog.create({
      userId: params.userId,
      type: TransactionType.walletTopup(),
      amount: params.amount,
      status: PaymentStatus.pending(),
      reference: params.reference,
      metadata: params.metadata,
    });
  }

  static createServicePayment(params: {
    userId: string;
    amount: Money;
    reference?: string;
    metadata?: Record<string, unknown>;
  }): TransactionLog {
    return TransactionLog.create({
      userId: params.userId,
      type: TransactionType.servicePayment(),
      amount: params.amount,
      status: PaymentStatus.pending(),
      reference: params.reference,
      metadata: params.metadata,
    });
  }

  static createRefundTransaction(params: {
    userId: string;
    amount: Money;
    originalTransactionId: string;
    metadata?: Record<string, unknown>;
  }): TransactionLog {
    return TransactionLog.create({
      userId: params.userId,
      type: TransactionType.refund(),
      amount: params.amount,
      status: PaymentStatus.pending(),
      reference: params.originalTransactionId,
      metadata: {
        ...params.metadata,
        originalTransactionId: params.originalTransactionId,
      },
    });
  }

  // ============================================
  // DOMAIN METHODS - Immutable State Transitions
  // ============================================

  markAsPaid(): TransactionLog {
    if (!this.status.canBeRetried()) {
      throw new Error(
        `Cannot mark transaction as paid. Current status: ${this.status.getValue()}`,
      );
    }
    return new TransactionLog(
      this.id,
      this.userId,
      this.type,
      this.amount,
      PaymentStatus.paid(),
      this.reference,
      this.metadata,
      this.createdAt,
    );
  }

  markAsFailed(): TransactionLog {
    if (this.status.isFinal()) {
      throw new Error(
        `Cannot mark transaction as failed. Current status: ${this.status.getValue()}`,
      );
    }
    return new TransactionLog(
      this.id,
      this.userId,
      this.type,
      this.amount,
      PaymentStatus.failed(),
      this.reference,
      this.metadata,
      this.createdAt,
    );
  }

  markAsRefunded(): TransactionLog {
    if (!this.status.canBeRefunded()) {
      throw new Error(
        `Cannot mark transaction as refunded. Current status: ${this.status.getValue()}`,
      );
    }
    return new TransactionLog(
      this.id,
      this.userId,
      this.type,
      this.amount,
      PaymentStatus.refunded(),
      this.reference,
      this.metadata,
      this.createdAt,
    );
  }

  markAsPartiallyRefunded(): TransactionLog {
    if (!this.status.canBeRefunded()) {
      throw new Error(
        `Cannot mark transaction as partially refunded. Current status: ${this.status.getValue()}`,
      );
    }
    return new TransactionLog(
      this.id,
      this.userId,
      this.type,
      this.amount,
      PaymentStatus.partiallyRefunded(),
      this.reference,
      this.metadata,
      this.createdAt,
    );
  }

  withReference(reference: string): TransactionLog {
    return new TransactionLog(
      this.id,
      this.userId,
      this.type,
      this.amount,
      this.status,
      reference,
      this.metadata,
      this.createdAt,
    );
  }

  withMetadata(metadata: Record<string, unknown>): TransactionLog {
    return new TransactionLog(
      this.id,
      this.userId,
      this.type,
      this.amount,
      this.status,
      this.reference,
      { ...this.metadata, ...metadata },
      this.createdAt,
    );
  }

  // ============================================
  // BUSINESS LOGIC QUERIES
  // ============================================

  isCredit(): boolean {
    return this.type.isCredit();
  }

  isDebit(): boolean {
    return this.type.isDebit();
  }

  isSuccessful(): boolean {
    return this.status.isSuccessful();
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type.getValue(),
      amount: this.amount.amount,
      currency: this.amount.currency,
      status: this.status.getValue(),
      reference: this.reference,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
