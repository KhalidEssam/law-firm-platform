// ============================================
// BASE UNIT OF WORK INTERFACE
// src/core/domain/shared/ports/base-unit-of-work.interface.ts
// ============================================

/**
 * Base interface for Unit of Work pattern.
 *
 * The Unit of Work pattern maintains a list of objects affected by a business transaction
 * and coordinates the writing out of changes and the resolution of concurrency problems.
 *
 * @template T - The concrete UoW type for fluent transaction callback typing
 */
export interface IBaseUnitOfWork<T = unknown> {
    /**
     * Execute a function within a database transaction.
     * All operations performed within the callback are atomic.
     *
     * @param work - The function containing transactional operations
     * @returns Promise resolving to the result of the work function
     * @throws Will rollback all changes if any operation fails
     *
     * @example
     * ```typescript
     * const result = await unitOfWork.transaction(async (uow) => {
     *   const entity = await uow.entities.findById(id);
     *   entity.update(data);
     *   await uow.entities.save(entity);
     *   await uow.auditLogs.create(log);
     *   return entity;
     * });
     * ```
     */
    transaction<R>(work: (uow: T) => Promise<R>): Promise<R>;
}

/**
 * Transaction isolation levels for Prisma.
 * Use higher isolation for financial/critical operations.
 */
export enum TransactionIsolationLevel {
    /**
     * Default. Prevents dirty reads. Good for most operations.
     */
    ReadCommitted = 'ReadCommitted',

    /**
     * Prevents dirty and non-repeatable reads.
     */
    RepeatableRead = 'RepeatableRead',

    /**
     * Highest isolation. Prevents phantom reads.
     * Use for financial operations, quota consumption, coupon redemption.
     */
    Serializable = 'Serializable',
}

/**
 * Configuration options for transactions.
 */
export interface TransactionOptions {
    /**
     * Maximum time to wait to acquire a lock (ms).
     * Default: 5000ms
     */
    maxWait?: number;

    /**
     * Maximum time the transaction can run (ms).
     * Default: 10000ms
     */
    timeout?: number;

    /**
     * Transaction isolation level.
     * Default: ReadCommitted
     */
    isolationLevel?: TransactionIsolationLevel;
}

/**
 * Default transaction options for standard operations.
 */
export const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: TransactionIsolationLevel.ReadCommitted,
};

/**
 * Transaction options for financial/critical operations.
 * Uses Serializable isolation to prevent race conditions.
 */
export const FINANCIAL_TRANSACTION_OPTIONS: TransactionOptions = {
    maxWait: 5000,
    timeout: 15000,
    isolationLevel: TransactionIsolationLevel.Serializable,
};

/**
 * DI tokens for Unit of Work implementations.
 */
export const UOW_TOKENS = {
    BILLING: Symbol('IBillingUnitOfWork'),
    MEMBERSHIP: Symbol('IMembershipUnitOfWork'),
    CONSULTATION: Symbol('IConsultationUnitOfWork'),
    LITIGATION: Symbol('ILitigationUnitOfWork'),
    CALL_REQUEST: Symbol('ICallRequestUnitOfWork'),
    LEGAL_OPINION: Symbol('ILegalOpinionUnitOfWork'),
} as const;
