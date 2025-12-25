// ============================================
// BILLING UNIT OF WORK INTERFACE
// src/core/domain/billing/ports/billing.uow.ts
// ============================================

import { IBaseUnitOfWork } from '../../shared/ports/base-unit-of-work.interface';
import { IRefundRepository } from './refund.repository';
import { IDisputeRepository } from './dispute.repository';
import { ITransactionLogRepository } from './transaction-log.repository';
import { IMembershipInvoiceRepository } from './membership-invoice.repository';

/**
 * Unit of Work interface for Billing domain.
 *
 * Provides atomic transaction support for billing operations that involve
 * multiple entities, such as:
 * - Processing refunds (Refund + TransactionLog)
 * - Resolving disputes (Dispute + TransactionLog + potential Refund)
 * - Invoice payments (Invoice + TransactionLog)
 *
 * @example
 * ```typescript
 * // Processing a refund atomically
 * await billingUow.transaction(async (uow) => {
 *   const refund = await uow.refunds.findById(refundId);
 *   refund.process(reference);
 *   await uow.refunds.update(refund);
 *
 *   const log = TransactionLog.create({
 *     type: TransactionType.REFUND,
 *     amount: refund.amount,
 *     userId: refund.userId,
 *   });
 *   await uow.transactionLogs.create(log);
 * });
 * ```
 */
export interface IBillingUnitOfWork extends IBaseUnitOfWork<IBillingUnitOfWork> {
    /**
     * Repository for refund operations within the transaction.
     */
    readonly refunds: IRefundRepository;

    /**
     * Repository for dispute operations within the transaction.
     */
    readonly disputes: IDisputeRepository;

    /**
     * Repository for transaction log operations within the transaction.
     */
    readonly transactionLogs: ITransactionLogRepository;

    /**
     * Repository for membership invoice operations within the transaction.
     */
    readonly invoices: IMembershipInvoiceRepository;
}

/**
 * DI token for IBillingUnitOfWork injection.
 */
export const BILLING_UNIT_OF_WORK = Symbol('IBillingUnitOfWork');
