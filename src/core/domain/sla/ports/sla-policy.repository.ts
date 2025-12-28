// src/core/domain/sla/ports/sla-policy.repository.ts

import { SLAPolicy } from '../entities/sla-policy.entity';
import { RequestType } from '../value-objects/request-type.vo';
import { Priority } from '../value-objects/priority.vo';

/**
 * SLA Policy Repository Interface
 */
export interface ISLAPolicyRepository {
  /**
   * Save a new or updated SLA policy
   */
  save(policy: SLAPolicy): Promise<SLAPolicy>;

  /**
   * Find a policy by ID
   */
  findById(id: string): Promise<SLAPolicy | null>;

  /**
   * Find a policy by name
   */
  findByName(name: string): Promise<SLAPolicy | null>;

  /**
   * Find a policy by request type and priority
   */
  findByTypeAndPriority(
    requestType: RequestType,
    priority: Priority,
  ): Promise<SLAPolicy | null>;

  /**
   * Find the best matching policy for a request type
   * Returns the exact match if exists, otherwise falls back to normal priority
   */
  findBestMatch(
    requestType: RequestType,
    priority?: Priority,
  ): Promise<SLAPolicy | null>;

  /**
   * Find all policies for a request type
   */
  findByRequestType(requestType: RequestType): Promise<SLAPolicy[]>;

  /**
   * Find all active policies
   */
  findAllActive(): Promise<SLAPolicy[]>;

  /**
   * Find all policies (including inactive)
   */
  findAll(): Promise<SLAPolicy[]>;

  /**
   * Delete a policy
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a policy with the given name already exists
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Check if a policy for the given type and priority already exists
   */
  existsByTypeAndPriority(
    requestType: RequestType,
    priority: Priority,
  ): Promise<boolean>;
}

export const ISLAPolicyRepository = Symbol('ISLAPolicyRepository');
