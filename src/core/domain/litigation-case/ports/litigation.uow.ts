// ============================================
// LITIGATION UNIT OF WORK INTERFACE
// src/core/domain/litigation-case/ports/litigation.uow.ts
// ============================================

import { IBaseUnitOfWork } from '../../shared/ports/base-unit-of-work.interface';
import {
  ILitigationCaseRepository,
  PaginatedResult,
  PaginationParams,
} from '../port/litigation-case.repository';
import {
  LitigationStatusHistory,
  StatusHistoryId,
} from '../entities/litigation-status-history.entity';
import { CaseId } from '../value-objects/litigation-case.vo';

/**
 * Repository interface for Litigation Status History operations.
 */
export interface ILitigationStatusHistoryRepository {
  /**
   * Creates a new status history record.
   */
  create(history: LitigationStatusHistory): Promise<LitigationStatusHistory>;

  /**
   * Creates multiple status history records atomically.
   */
  createMany(
    histories: LitigationStatusHistory[],
  ): Promise<LitigationStatusHistory[]>;

  /**
   * Finds a status history record by ID.
   */
  findById(id: StatusHistoryId): Promise<LitigationStatusHistory | null>;

  /**
   * Finds all status history records for a litigation case.
   */
  findByLitigationCaseId(
    litigationCaseId: CaseId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LitigationStatusHistory>>;

  /**
   * Gets the most recent status history for a case.
   */
  findLatestByLitigationCaseId(
    litigationCaseId: CaseId,
  ): Promise<LitigationStatusHistory | null>;

  /**
   * Counts status changes for a case.
   */
  countByLitigationCaseId(litigationCaseId: CaseId): Promise<number>;

  /**
   * Deletes a status history record.
   */
  delete(id: StatusHistoryId): Promise<void>;
}

/**
 * Unit of Work interface for Litigation domain.
 *
 * Provides atomic transaction support for litigation case operations that involve
 * multiple entities, such as:
 * - Status changes with history tracking
 * - Payment marking with audit trail
 * - Case closure with final status record
 *
 * @example
 * ```typescript
 * // Marking a case as paid with status history
 * await litigationUow.transaction(async (uow) => {
 *   const case = await uow.cases.findById(caseId);
 *   const oldStatus = case.status;
 *
 *   case.markAsPaid(paymentReference);
 *   await uow.cases.update(case);
 *
 *   // Create status history atomically
 *   const history = LitigationStatusHistory.create({
 *     litigationCaseId: case.id,
 *     fromStatus: oldStatus,
 *     toStatus: case.status,
 *     reason: 'Payment received',
 *   });
 *   await uow.statusHistories.create(history);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Closing a case with audit trail
 * await litigationUow.transaction(async (uow) => {
 *   const case = await uow.cases.findById(caseId);
 *   const oldStatus = case.status;
 *
 *   case.close();
 *   await uow.cases.update(case);
 *
 *   // Record closure in history
 *   const history = LitigationStatusHistory.create({
 *     litigationCaseId: case.id,
 *     fromStatus: oldStatus,
 *     toStatus: case.status,
 *     reason: 'Case closed',
 *     changedBy: closedByUserId,
 *   });
 *   await uow.statusHistories.create(history);
 * });
 * ```
 */
export interface ILitigationUnitOfWork
  extends IBaseUnitOfWork<ILitigationUnitOfWork> {
  /**
   * Repository for litigation case operations within the transaction.
   */
  readonly cases: ILitigationCaseRepository;

  /**
   * Repository for status history operations within the transaction.
   * Used to create audit trail for all status changes.
   */
  readonly statusHistories: ILitigationStatusHistoryRepository;
}

/**
 * DI token for ILitigationUnitOfWork injection.
 */
export const LITIGATION_UNIT_OF_WORK = Symbol('ILitigationUnitOfWork');
