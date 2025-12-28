// ============================================
// LITIGATION CASE REPOSITORY INTERFACE (PORT)
// ============================================

import { LitigationCase } from '../entities/litigation-case.entity';
import {
  CaseId,
  UserId,
  CaseStatus,
} from '../value-objects/litigation-case.vo';

export interface LitigationCaseFilters {
  subscriberId?: string;
  assignedProviderId?: string;
  caseType?: string;
  status?: string | string[];
  paymentStatus?: string;
  searchTerm?: string;
  submittedFrom?: Date;
  submittedTo?: Date;
  closedFrom?: Date;
  closedTo?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface LitigationCaseStatistics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPaymentStatus: Record<string, number>;
  totalRevenue: number;
  averageRevenue: number;
  activeCount: number;
  closedCount: number;
}

export interface ILitigationCaseRepository {
  save(litigationCase: LitigationCase): Promise<LitigationCase>;

  update(litigationCase: LitigationCase): Promise<LitigationCase>;

  findById(id: CaseId): Promise<LitigationCase | null>;

  findByCaseNumber(caseNumber: string): Promise<LitigationCase | null>;

  findBySubscriberId(
    subscriberId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LitigationCase>>;

  findByProviderId(
    providerId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LitigationCase>>;

  findAll(
    filters: LitigationCaseFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<LitigationCase>>;

  findByStatus(
    status: CaseStatus,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LitigationCase>>;

  delete(id: CaseId): Promise<boolean>;

  exists(id: CaseId): Promise<boolean>;

  count(filters?: LitigationCaseFilters): Promise<number>;

  getStatistics(
    filters?: LitigationCaseFilters,
  ): Promise<LitigationCaseStatistics>;
}
