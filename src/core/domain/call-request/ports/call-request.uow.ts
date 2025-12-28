// ============================================
// CALL REQUEST UNIT OF WORK INTERFACE
// src/core/domain/call-request/ports/call-request.uow.ts
// ============================================

import { IBaseUnitOfWork } from '../../shared/ports/base-unit-of-work.interface';
import {
  ICallRequestRepository,
  PaginatedResult,
  PaginationOptions,
} from './call-request.repository';
import {
  CallStatusHistory,
  StatusHistoryId,
} from '../entities/call-status-history.entity';

/**
 * Repository interface for Call Status History operations.
 */
export interface ICallStatusHistoryRepository {
  /**
   * Creates a new status history record.
   */
  create(history: CallStatusHistory): Promise<CallStatusHistory>;

  /**
   * Creates multiple status history records atomically.
   */
  createMany(histories: CallStatusHistory[]): Promise<CallStatusHistory[]>;

  /**
   * Finds a status history record by ID.
   */
  findById(id: StatusHistoryId): Promise<CallStatusHistory | null>;

  /**
   * Finds all status history records for a call request.
   */
  findByCallRequestId(
    callRequestId: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CallStatusHistory>>;

  /**
   * Gets the most recent status history for a call request.
   */
  findLatestByCallRequestId(
    callRequestId: string,
  ): Promise<CallStatusHistory | null>;

  /**
   * Counts status changes for a call request.
   */
  countByCallRequestId(callRequestId: string): Promise<number>;

  /**
   * Deletes a status history record.
   */
  delete(id: StatusHistoryId): Promise<void>;
}

/**
 * Unit of Work interface for Call Request domain.
 *
 * Provides atomic transaction support for call request operations that involve
 * multiple entities, such as:
 * - Starting a call with status history
 * - Ending a call with minutes tracking and status history
 * - Scheduling a call with conflict checking (atomic)
 * - Cancelling a call with status history
 *
 * @example
 * ```typescript
 * // Ending a call with status history
 * await callRequestUow.transaction(async (uow) => {
 *   const call = await uow.callRequests.findById(callId);
 *   const oldStatus = call.status;
 *
 *   call.endCall(recordingUrl);
 *   await uow.callRequests.update(call);
 *
 *   // Create status history atomically
 *   const history = CallStatusHistory.create({
 *     callRequestId: call.id,
 *     fromStatus: oldStatus,
 *     toStatus: call.status,
 *     reason: 'Call completed',
 *   });
 *   await uow.statusHistories.create(history);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Scheduling a call with atomic conflict check
 * await callRequestUow.transaction(async (uow) => {
 *   const call = await uow.callRequests.findById(callId);
 *
 *   // Check availability within transaction (prevents race conditions)
 *   const isAvailable = await uow.callRequests.isProviderAvailable(
 *     call.assignedProviderId,
 *     scheduledAt,
 *     durationMinutes,
 *   );
 *   if (!isAvailable) {
 *     throw new ConflictException('Time slot not available');
 *   }
 *
 *   const oldStatus = call.status;
 *   call.schedule({ scheduledAt, durationMinutes });
 *   await uow.callRequests.update(call);
 *
 *   // Create status history atomically
 *   const history = CallStatusHistory.create({
 *     callRequestId: call.id,
 *     fromStatus: oldStatus,
 *     toStatus: call.status,
 *     reason: 'Call scheduled',
 *   });
 *   await uow.statusHistories.create(history);
 * });
 * ```
 */
export interface ICallRequestUnitOfWork
  extends IBaseUnitOfWork<ICallRequestUnitOfWork> {
  /**
   * Repository for call request operations within the transaction.
   */
  readonly callRequests: ICallRequestRepository;

  /**
   * Repository for status history operations within the transaction.
   * Used to create audit trail for all status changes.
   */
  readonly statusHistories: ICallStatusHistoryRepository;
}

/**
 * DI token for ICallRequestUnitOfWork injection.
 */
export const CALL_REQUEST_UNIT_OF_WORK = Symbol('ICallRequestUnitOfWork');
