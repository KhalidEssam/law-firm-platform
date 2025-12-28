// ============================================
// PAYMENT METHOD REPOSITORY INTERFACE (PORT)
// ============================================

import { PaymentMethod } from '../entities/payment-method.entities';
import {
  PaymentMethodId,
  UserId,
  PaymentMethodType,
} from '../value-objects/payment-method.vo';

export interface PaymentMethodFilters {
  userId?: string;
  type?: string | string[];
  isDefault?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  deletedAt?: boolean;
  isExpiringSoon?: boolean;
  searchTerm?: string;
  createdFrom?: Date;
  createdTo?: Date;
  lastUsedFrom?: Date;
  lastUsedTo?: Date;
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

export interface PaymentMethodStatistics {
  total: number;
  byType: Record<string, number>;

  byStatus: {
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    deleted: number;
  };
  totalFailedAttempts: number;
  expiringSoon: number;
  expired: number;
  defaultMethods: number;
}

export interface IPaymentMethodRepository {
  save(paymentMethod: PaymentMethod): Promise<PaymentMethod>;

  update(paymentMethod: PaymentMethod): Promise<PaymentMethod>;

  findById(id: PaymentMethodId): Promise<PaymentMethod | null>;

  findByUserId(
    userId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<PaymentMethod>>;

  findDefaultByUserId(userId: UserId): Promise<PaymentMethod | null>;

  findActiveByUserId(
    userId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<PaymentMethod>>;

  findByType(
    type: PaymentMethodType,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<PaymentMethod>>;

  findExpiringSoon(
    days?: number,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<PaymentMethod>>;

  findAll(
    filters: PaymentMethodFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<PaymentMethod>>;

  delete(id: PaymentMethodId): Promise<boolean>;

  hardDelete(id: PaymentMethodId): Promise<boolean>;

  exists(id: PaymentMethodId): Promise<boolean>;

  existsDefaultForUser(userId: UserId): Promise<boolean>;

  countByUserId(userId: UserId): Promise<number>;

  count(filters?: PaymentMethodFilters): Promise<number>;

  getStatistics(
    filters?: PaymentMethodFilters,
  ): Promise<PaymentMethodStatistics>;

  unsetAllDefaultsForUser(userId: UserId): Promise<void>;
}
