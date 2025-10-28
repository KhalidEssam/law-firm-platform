// ============================================
// LEGAL OPINION REQUEST REPOSITORY PORT (INTERFACE)
// Domain Layer - Repository Contract
// ============================================

import { LegalOpinionRequest } from '../entities/legal-opinion-request.entity';
import {
  OpinionRequestId,
  
} from '../value-objects/opinion-requestid.vo';
import { OpinionStatus } from '../value-objects/opinion-status.vo';
import { OpinionType } from '../value-objects/opinion-type.vo';
import { OpinionPriority } from '../value-objects/opinion-priority.vo';
import { UserId } from '../../consultation/value-objects/consultation-request-domain';
/**
 * Repository Port (Interface)
 * 
 * This defines the contract that any infrastructure implementation must follow.
 * The domain layer depends on this interface, not on concrete implementations.
 * 
 * Following the Dependency Inversion Principle:
 * - Domain (high-level) doesn't depend on Infrastructure (low-level)
 * - Both depend on this abstraction
 */

// ============================================
// FILTER & PAGINATION INTERFACES
// ============================================

export interface OpinionRequestFilters {
  clientId?: string;
  assignedLawyerId?: string;
  status?: OpinionStatus | OpinionStatus[];
  opinionType?: OpinionType | OpinionType[];
  priority?: OpinionPriority | OpinionPriority[];
  jurisdiction?: string;
  isPaid?: boolean;
  isOverdue?: boolean;
  searchTerm?: string; // Search in subject, legal question
  submittedFrom?: Date;
  submittedTo?: Date;
  completedFrom?: Date;
  completedTo?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ============================================
// STATISTICS INTERFACE
// ============================================

export interface OpinionStatistics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  averageCompletionTime: number; // in hours
  overdueCount: number;
  paidCount: number;
  unpaidCount: number;
  totalRevenue: number;
  averageRevenue: number;
}

// ============================================
// REPOSITORY INTERFACE
// ============================================

export interface ILegalOpinionRequestRepository {
  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  /**
   * Save a new opinion request
   * @param opinion - The opinion request to save
   * @returns The saved opinion request
   */
  save(opinion: LegalOpinionRequest): Promise<LegalOpinionRequest>;

  /**
   * Update an existing opinion request
   * @param opinion - The opinion request to update
   * @returns The updated opinion request
   */
  update(opinion: LegalOpinionRequest): Promise<LegalOpinionRequest>;

  /**
   * Find opinion request by ID
   * @param id - The opinion request ID
   * @returns The opinion request or null if not found
   */
  findById(id: OpinionRequestId): Promise<LegalOpinionRequest | null>;

  /**
   * Find opinion request by opinion number
   * @param opinionNumber - The human-readable opinion number
   * @returns The opinion request or null if not found
   */
  findByOpinionNumber(opinionNumber: string): Promise<LegalOpinionRequest | null>;

  /**
   * Find all opinion requests with optional filters and pagination
   * @param filters - Optional filters
   * @param pagination - Optional pagination params
   * @returns Paginated result with opinion requests
   */
  findAll(
    filters?: OpinionRequestFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>>;

  /**
   * Delete (soft delete) an opinion request
   * @param id - The opinion request ID
   * @returns True if deleted, false otherwise
   */
  delete(id: OpinionRequestId): Promise<boolean>;

  // ============================================
  // QUERY BY USER
  // ============================================

  /**
   * Find all opinions for a specific client
   * @param clientId - The client user ID
   * @param pagination - Optional pagination params
   * @returns Paginated result with opinion requests
   */
  findByClientId(
    clientId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>>;

  /**
   * Find all opinions assigned to a specific lawyer
   * @param lawyerId - The lawyer user ID
   * @param pagination - Optional pagination params
   * @returns Paginated result with opinion requests
   */
  findByLawyerId(
    lawyerId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>>;

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Find all overdue opinions (past expected completion date)
   * @param pagination - Optional pagination params
   * @returns Paginated result with overdue opinions
   */
  findOverdue(
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>>;

  /**
   * Find all unpaid opinions that are completed
   * @param pagination - Optional pagination params
   * @returns Paginated result with unpaid opinions
   */
  findUnpaid(
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>>;

  /**
   * Find opinions in specific statuses
   * @param statuses - Array of statuses to filter by
   * @param pagination - Optional pagination params
   * @returns Paginated result with opinions
   */
  findByStatuses(
    statuses: OpinionStatus[],
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>>;

  /**
   * Find opinions by priority
   * @param priority - The priority level
   * @param pagination - Optional pagination params
   * @returns Paginated result with opinions
   */
  findByPriority(
    priority: OpinionPriority,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>>;

  // ============================================
  // COUNTS & STATISTICS
  // ============================================

  /**
   * Count total opinions matching filters
   * @param filters - Optional filters
   * @returns Total count
   */
  count(filters?: OpinionRequestFilters): Promise<number>;

  /**
   * Get statistics about opinions
   * @param filters - Optional filters to scope statistics
   * @returns Opinion statistics
   */
  getStatistics(filters?: OpinionRequestFilters): Promise<OpinionStatistics>;

  /**
   * Count opinions by client
   * @param clientId - The client user ID
   * @returns Total count for this client
   */
  countByClientId(clientId: UserId): Promise<number>;

  /**
   * Count opinions by lawyer
   * @param lawyerId - The lawyer user ID
   * @returns Total count for this lawyer
   */
  countByLawyerId(lawyerId: UserId): Promise<number>;

  /**
   * Get lawyer workload (active opinions count)
   * @param lawyerId - The lawyer user ID
   * @returns Count of active opinions
   */
  getLawyerWorkload(lawyerId: UserId): Promise<number>;

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Find opinions that need SLA status update
   * (opinions that are overdue but not marked as such)
   * @returns Array of opinions needing update
   */
  findNeedingSLAUpdate(): Promise<LegalOpinionRequest[]>;

  /**
   * Batch update multiple opinions
   * @param opinions - Array of opinions to update
   * @returns Array of updated opinions
   */
  batchUpdate(opinions: LegalOpinionRequest[]): Promise<LegalOpinionRequest[]>;

  // ============================================
  // EXISTENCE CHECKS
  // ============================================

  /**
   * Check if opinion exists by ID
   * @param id - The opinion request ID
   * @returns True if exists, false otherwise
   */
  exists(id: OpinionRequestId): Promise<boolean>;

  /**
   * Check if opinion number is already used
   * @param opinionNumber - The opinion number to check
   * @returns True if exists, false otherwise
   */
  existsByOpinionNumber(opinionNumber: string): Promise<boolean>;
}