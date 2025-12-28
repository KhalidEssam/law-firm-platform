// ============================================
// TRANSACTION LOG REPOSITORY PORT
// src/core/domain/billing/ports/transaction-log.repository.ts
// ============================================

import { TransactionLog } from '../entities/transaction-log.entity';
import { TransactionTypeEnum } from '../value-objects/transaction-type.vo';
import { PaymentStatusEnum } from '../value-objects/payment-status.vo';

export interface TransactionLogListOptions {
  userId?: string;
  type?: TransactionTypeEnum;
  status?: PaymentStatusEnum;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'amount';
  orderDir?: 'asc' | 'desc';
}

export interface TransactionLogCountOptions {
  userId?: string;
  type?: TransactionTypeEnum;
  status?: PaymentStatusEnum;
  fromDate?: Date;
  toDate?: Date;
}

export interface TransactionSummary {
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  transactionCount: number;
}

export interface ITransactionLogRepository {
  // ============================================
  // CREATE
  // ============================================
  create(transaction: TransactionLog): Promise<TransactionLog>;

  // ============================================
  // READ
  // ============================================
  findById(id: string): Promise<TransactionLog | null>;
  findByReference(reference: string): Promise<TransactionLog | null>;
  findByUserId(userId: string): Promise<TransactionLog[]>;
  list(options?: TransactionLogListOptions): Promise<TransactionLog[]>;
  count(options?: TransactionLogCountOptions): Promise<number>;

  // ============================================
  // UPDATE
  // ============================================
  update(transaction: TransactionLog): Promise<TransactionLog>;
  markAsPaid(id: string): Promise<TransactionLog>;
  markAsFailed(id: string): Promise<TransactionLog>;
  markAsRefunded(id: string): Promise<TransactionLog>;
  markAsPartiallyRefunded(id: string): Promise<TransactionLog>;

  // ============================================
  // DELETE
  // ============================================
  delete(id: string): Promise<void>;

  // ============================================
  // BUSINESS QUERIES
  // ============================================
  findPendingTransactions(userId?: string): Promise<TransactionLog[]>;
  findFailedTransactions(userId?: string): Promise<TransactionLog[]>;
  findSuccessfulTransactions(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TransactionLog[]>;
  getUserTransactionSummary(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TransactionSummary>;
  getTotalSpent(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<number>;
  getTotalRefunded(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<number>;
}
