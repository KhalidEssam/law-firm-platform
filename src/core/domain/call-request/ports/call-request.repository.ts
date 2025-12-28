// ============================================
// CALL REQUEST REPOSITORY INTERFACE (DOMAIN PORT)
// src/core/domain/call-request/ports/call-request.repository.ts
// ============================================

import { CallRequest } from '../entities/call-request.entity';
import { CallStatus } from '../value-objects/call-status.vo';

/**
 * Filter options for querying call requests
 */
export interface CallRequestFilter {
  subscriberId?: string;
  assignedProviderId?: string;
  status?: CallStatus | CallStatus[];
  consultationType?: string;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'scheduledAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Call Request Repository Interface (Port)
 * Defines the contract for call request persistence operations
 *
 * This is a PORT in Clean Architecture / Hexagonal Architecture.
 * Implementations (adapters) are in the infrastructure layer.
 */
export interface ICallRequestRepository {
  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new call request
   */
  create(callRequest: CallRequest): Promise<CallRequest>;

  /**
   * Update an existing call request
   */
  update(callRequest: CallRequest): Promise<CallRequest>;

  /**
   * Delete a call request (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Hard delete a call request
   */
  hardDelete(id: string): Promise<void>;

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * Find call request by ID
   */
  findById(id: string): Promise<CallRequest | null>;

  /**
   * Find call request by request number
   */
  findByRequestNumber(requestNumber: string): Promise<CallRequest | null>;

  /**
   * Find all call requests with filters and pagination
   */
  findAll(
    filter?: CallRequestFilter,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CallRequest>>;

  /**
   * Find call requests by subscriber
   */
  findBySubscriber(
    subscriberId: string,
    options?: PaginationOptions,
  ): Promise<CallRequest[]>;

  /**
   * Find call requests by provider
   */
  findByProvider(
    providerId: string,
    options?: PaginationOptions,
  ): Promise<CallRequest[]>;

  /**
   * Find call requests by status
   */
  findByStatus(
    status: CallStatus | CallStatus[],
    options?: PaginationOptions,
  ): Promise<CallRequest[]>;

  /**
   * Find scheduled calls for a date range
   */
  findScheduledCalls(
    startDate: Date,
    endDate: Date,
    providerId?: string,
  ): Promise<CallRequest[]>;

  /**
   * Find upcoming calls for a provider
   */
  findUpcomingCallsForProvider(
    providerId: string,
    limit?: number,
  ): Promise<CallRequest[]>;

  /**
   * Find overdue scheduled calls
   */
  findOverdueCalls(): Promise<CallRequest[]>;

  // ============================================
  // AGGREGATION OPERATIONS
  // ============================================

  /**
   * Count call requests by status
   */
  countByStatus(status: CallStatus): Promise<number>;

  /**
   * Count call requests for a subscriber
   */
  countBySubscriber(subscriberId: string, status?: CallStatus): Promise<number>;

  /**
   * Count call requests for a provider
   */
  countByProvider(providerId: string, status?: CallStatus): Promise<number>;

  /**
   * Get total call minutes for a subscriber in a period
   */
  getTotalCallMinutes(
    subscriberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number>;

  /**
   * Get provider availability conflicts
   */
  findConflictingCalls(
    providerId: string,
    scheduledAt: Date,
    durationMinutes: number,
  ): Promise<CallRequest[]>;

  // ============================================
  // EXISTENCE CHECKS
  // ============================================

  /**
   * Check if call request exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if subscriber has pending calls
   */
  hasPendingCalls(subscriberId: string): Promise<boolean>;

  /**
   * Check if provider is available at a given time
   */
  isProviderAvailable(
    providerId: string,
    scheduledAt: Date,
    durationMinutes: number,
  ): Promise<boolean>;
}

/**
 * Repository token for dependency injection
 */
export const CALL_REQUEST_REPOSITORY = Symbol('CALL_REQUEST_REPOSITORY');
