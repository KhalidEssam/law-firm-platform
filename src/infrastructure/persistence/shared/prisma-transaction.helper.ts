// ============================================
// PRISMA TRANSACTION HELPER
// src/infrastructure/persistence/shared/prisma-transaction.helper.ts
// ============================================

import { Prisma } from '@prisma/client';
import {
    TransactionOptions,
    TransactionIsolationLevel,
    DEFAULT_TRANSACTION_OPTIONS,
} from '../../../core/domain/shared/ports/base-unit-of-work.interface';

/**
 * Prisma interactive transaction options type.
 */
export interface PrismaInteractiveTransactionOptions {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Maps our domain transaction options to Prisma transaction options.
 */
export function toPrismaTransactionOptions(
    options?: TransactionOptions,
): PrismaInteractiveTransactionOptions {
    const opts = options ?? DEFAULT_TRANSACTION_OPTIONS;

    return {
        maxWait: opts.maxWait,
        timeout: opts.timeout,
        isolationLevel: mapIsolationLevel(opts.isolationLevel),
    };
}

/**
 * Maps domain isolation level to Prisma isolation level.
 */
function mapIsolationLevel(
    level?: TransactionIsolationLevel,
): Prisma.TransactionIsolationLevel {
    switch (level) {
        case TransactionIsolationLevel.Serializable:
            return Prisma.TransactionIsolationLevel.Serializable;
        case TransactionIsolationLevel.RepeatableRead:
            return Prisma.TransactionIsolationLevel.RepeatableRead;
        case TransactionIsolationLevel.ReadCommitted:
        default:
            return Prisma.TransactionIsolationLevel.ReadCommitted;
    }
}

/**
 * Type alias for Prisma interactive transaction client.
 * This is the `tx` parameter passed to $transaction callbacks.
 */
export type PrismaTransactionClient = Prisma.TransactionClient;

/**
 * Helper type to extract the transaction client type from PrismaService.
 * Use this when creating transactional repository implementations.
 */
export type TransactionalPrismaClient = Omit<
    PrismaTransactionClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
