// src/core/domain/membership/repositories/tier-service.repository.ts

import { TierService } from '../entities/tier-service.entity';

export interface ITierServiceRepository {
  /** Create a new tier service */
  create(tierService: TierService): Promise<TierService>;

  /** Find by ID */
  findById(id: string): Promise<TierService | null>;

  /** Find by tier ID and service ID */
  findByTierAndService(
    tierId: number,
    serviceId: string,
  ): Promise<TierService | null>;

  /** Find all services for a tier */
  findByTierId(
    tierId: number,
    options?: { isActive?: boolean },
  ): Promise<TierService[]>;

  /** Find all tiers for a service */
  findByServiceId(
    serviceId: string,
    options?: { isActive?: boolean },
  ): Promise<TierService[]>;

  /** Update tier service */
  update(tierService: TierService): Promise<TierService>;

  /** Delete tier service */
  delete(id: string): Promise<void>;

  /** Bulk create tier services */
  createMany(tierServices: TierService[]): Promise<TierService[]>;

  /** Bulk delete by tier ID */
  deleteByTierId(tierId: number): Promise<void>;

  /** Check if tier has service */
  tierHasService(tierId: number, serviceId: string): Promise<boolean>;

  /** Get quota for specific tier and service */
  getQuota(
    tierId: number,
    serviceId: string,
  ): Promise<{
    quotaPerMonth: number | null;
    quotaPerYear: number | null;
    rolloverUnused: boolean;
  } | null>;
}
