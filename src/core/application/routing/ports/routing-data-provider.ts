// ============================================
// ROUTING DATA PROVIDER INTERFACE
// src/core/application/routing/ports/routing-data-provider.ts
// ============================================

import { ProviderInfo } from '../../../domain/routing/value-objects/provider-target.vo';

/**
 * Provider details for routing decisions
 */
export interface ProviderDetails {
  userId: string;
  fullName: string | null;
  username: string | null;
  providerId: string;
  isActive: boolean;
  canAcceptRequests: boolean;
  specializations: string[];
  isCertified: boolean;
  experienceYears: number;
}

/**
 * Request assignment data for updating a request
 */
export interface RequestAssignmentData {
  requestId: string;
  requestType: string;
  providerId: string;
  assignedAt?: Date;
}

/**
 * Request status options
 */
export type RequestStatusType =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'quote_sent'
  | 'completed'
  | 'cancelled'
  | 'closed';

/**
 * IRoutingDataProvider
 *
 * Provides data access for routing operations.
 * Abstracts the data access layer from routing use cases.
 */
export interface IRoutingDataProvider {
  /**
   * Get all available providers with verification status approved
   */
  getAvailableProviders(): Promise<ProviderDetails[]>;

  /**
   * Get active request count for a provider across all request types
   */
  getProviderActiveRequestCount(providerId: string): Promise<number>;

  /**
   * Get request count by specific statuses for a provider
   */
  getProviderRequestCountByStatus(
    providerId: string,
    statuses: RequestStatusType[],
  ): Promise<number>;

  /**
   * Get count of requests completed today for a provider
   */
  getProviderCompletedTodayCount(providerId: string): Promise<number>;

  /**
   * Get average rating for a provider
   */
  getProviderRating(providerId: string): Promise<number | undefined>;

  /**
   * Get provider user details by user ID
   */
  getProviderUserDetails(userId: string): Promise<{
    fullName: string | null;
    username: string | null;
  } | null>;

  /**
   * Verify a provider exists and is available
   */
  verifyProviderAvailable(userId: string): Promise<{
    isAvailable: boolean;
    fullName?: string;
    username?: string;
  }>;

  /**
   * Assign a request to a provider
   */
  assignRequestToProvider(data: RequestAssignmentData): Promise<void>;

  /**
   * Update a request's assigned provider (for reassignment)
   */
  updateRequestProvider(data: RequestAssignmentData): Promise<void>;

  /**
   * Get provider info formatted for routing decisions
   */
  getProviderInfoForRouting(requestType: string): Promise<ProviderInfo[]>;
}

/**
 * DI Token for RoutingDataProvider
 */
export const ROUTING_DATA_PROVIDER = Symbol('IRoutingDataProvider');
