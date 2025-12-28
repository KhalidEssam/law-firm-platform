// ============================================
// LEGAL OPINION UNIT OF WORK INTERFACE
// src/core/domain/legal-opinion/port/legal-opinion.uow.ts
// ============================================

import { IBaseUnitOfWork } from '../../shared/ports/base-unit-of-work.interface';
import {
  ILegalOpinionRequestRepository,
  PaginationParams,
  PaginatedResult,
} from './legal-opinion-request.repository.interface';
import {
  LegalOpinionStatusHistory,
  StatusHistoryId,
} from '../entities/legal-opinion-status-history.entity';

/**
 * Repository interface for Legal Opinion Status History operations.
 */
export interface ILegalOpinionStatusHistoryRepository {
  /**
   * Creates a new status history record.
   */
  create(
    history: LegalOpinionStatusHistory,
  ): Promise<LegalOpinionStatusHistory>;

  /**
   * Creates multiple status history records atomically.
   */
  createMany(
    histories: LegalOpinionStatusHistory[],
  ): Promise<LegalOpinionStatusHistory[]>;

  /**
   * Finds a status history record by ID.
   */
  findById(id: StatusHistoryId): Promise<LegalOpinionStatusHistory | null>;

  /**
   * Finds all status history records for a legal opinion request.
   */
  findByLegalOpinionId(
    legalOpinionId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionStatusHistory>>;

  /**
   * Gets the most recent status history for a legal opinion request.
   */
  findLatestByLegalOpinionId(
    legalOpinionId: string,
  ): Promise<LegalOpinionStatusHistory | null>;

  /**
   * Counts status changes for a legal opinion request.
   */
  countByLegalOpinionId(legalOpinionId: string): Promise<number>;

  /**
   * Deletes a status history record.
   */
  delete(id: StatusHistoryId): Promise<void>;
}

/**
 * Unit of Work interface for Legal Opinion domain.
 *
 * Provides atomic transaction support for legal opinion operations that involve
 * multiple entities, such as:
 * - Completing an opinion with status history
 * - Cancelling an opinion with status history
 * - Marking as paid with status history
 * - Transitioning through workflow states atomically
 *
 * @example
 * ```typescript
 * // Completing an opinion with status history
 * await legalOpinionUow.transaction(async (uow) => {
 *   const opinion = await uow.opinions.findById(opinionId);
 *   const oldStatus = opinion.status.getValue();
 *
 *   opinion.complete();
 *   await uow.opinions.update(opinion);
 *
 *   // Create status history atomically
 *   const history = LegalOpinionStatusHistory.create({
 *     legalOpinionId: opinion.id.getValue(),
 *     fromStatus: oldStatus,
 *     toStatus: opinion.status.getValue(),
 *     reason: 'Opinion completed and delivered',
 *     changedBy: completedByUserId,
 *   });
 *   await uow.statusHistories.create(history);
 * });
 * ```
 */
export interface ILegalOpinionUnitOfWork
  extends IBaseUnitOfWork<ILegalOpinionUnitOfWork> {
  /**
   * Repository for legal opinion request operations within the transaction.
   */
  readonly opinions: ILegalOpinionRequestRepository;

  /**
   * Repository for status history operations within the transaction.
   * Used to create audit trail for all status changes.
   */
  readonly statusHistories: ILegalOpinionStatusHistoryRepository;
}

/**
 * DI token for ILegalOpinionUnitOfWork injection.
 */
export const LEGAL_OPINION_UNIT_OF_WORK = Symbol('ILegalOpinionUnitOfWork');
