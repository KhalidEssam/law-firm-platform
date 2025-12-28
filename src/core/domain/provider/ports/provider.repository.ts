// ============================================
// PROVIDER REPOSITORY INTERFACES (DOMAIN PORTS)
// src/core/domain/provider/ports/provider.repository.ts
// ============================================

import { ProviderProfile } from '../entities/providerprofile.entity';
import { ProviderUser } from '../entities/provider-user.entity';
import { ProviderService } from '../entities/provider-service.entity';
import { ProviderSchedule } from '../entities/provider-schedule.entity';
import { VerificationStatus } from '../value-objects/verfication-status.vo';
import { ServiceType } from '../value-objects/service-type.vo';

// ============================================
// PROVIDER PROFILE REPOSITORY
// ============================================

export interface FindProviderProfileOptions {
  includeDeleted?: boolean;
}

export interface ListProviderProfilesOptions {
  verificationStatus?: VerificationStatus;
  isActive?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * IProviderProfileRepository
 * Repository interface for ProviderProfile aggregate root
 */
export interface IProviderProfileRepository {
  // Create
  create(profile: ProviderProfile): Promise<ProviderProfile>;

  // Read
  findById(
    id: string,
    options?: FindProviderProfileOptions,
  ): Promise<ProviderProfile | null>;
  findByUserId(
    userId: string,
    options?: FindProviderProfileOptions,
  ): Promise<ProviderProfile | null>;
  findByLicenseNumber(licenseNumber: string): Promise<ProviderProfile | null>;
  list(options?: ListProviderProfilesOptions): Promise<ProviderProfile[]>;
  count(
    options?: Omit<ListProviderProfilesOptions, 'limit' | 'offset'>,
  ): Promise<number>;

  // Update
  update(profile: ProviderProfile): Promise<ProviderProfile>;

  // Delete
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  // Business operations
  findApprovedAndActive(options?: {
    limit?: number;
    offset?: number;
  }): Promise<ProviderProfile[]>;
  findPendingVerification(options?: {
    limit?: number;
    offset?: number;
  }): Promise<ProviderProfile[]>;
}

// ============================================
// PROVIDER USER REPOSITORY
// ============================================

export interface FindProviderUserOptions {
  includeDeleted?: boolean;
}

export interface ListProviderUsersOptions {
  providerId?: string;
  userId?: string;
  isActive?: boolean;
  canAcceptRequests?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * IProviderUserRepository
 * Repository interface for ProviderUser entity
 */
export interface IProviderUserRepository {
  // Create
  create(providerUser: ProviderUser): Promise<ProviderUser>;

  // Read
  findById(
    id: string,
    options?: FindProviderUserOptions,
  ): Promise<ProviderUser | null>;
  findByProviderAndUser(
    providerId: string,
    userId: string,
    options?: FindProviderUserOptions,
  ): Promise<ProviderUser | null>;
  list(options?: ListProviderUsersOptions): Promise<ProviderUser[]>;
  count(
    options?: Omit<ListProviderUsersOptions, 'limit' | 'offset'>,
  ): Promise<number>;

  // Update
  update(providerUser: ProviderUser): Promise<ProviderUser>;

  // Delete
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  // Business operations
  findActiveUsersByProvider(providerId: string): Promise<ProviderUser[]>;
  findUsersWhoCanAcceptRequests(providerId: string): Promise<ProviderUser[]>;
  existsByProviderAndUser(providerId: string, userId: string): Promise<boolean>;
}

// ============================================
// PROVIDER SERVICE REPOSITORY
// ============================================

export interface ListProviderServicesOptions {
  providerId?: string;
  serviceType?: ServiceType;
  category?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * IProviderServiceRepository
 * Repository interface for ProviderService entity
 */
export interface IProviderServiceRepository {
  // Create
  create(service: ProviderService): Promise<ProviderService>;

  // Read
  findById(id: string): Promise<ProviderService | null>;
  list(options?: ListProviderServicesOptions): Promise<ProviderService[]>;
  count(
    options?: Omit<ListProviderServicesOptions, 'limit' | 'offset'>,
  ): Promise<number>;

  // Update
  update(service: ProviderService): Promise<ProviderService>;

  // Delete
  delete(id: string): Promise<void>;

  // Business operations
  findActiveServicesByProvider(providerId: string): Promise<ProviderService[]>;
  findByProviderAndServiceType(
    providerId: string,
    serviceType: ServiceType,
  ): Promise<ProviderService[]>;
  existsByProviderAndServiceType(
    providerId: string,
    serviceType: ServiceType,
  ): Promise<boolean>;
}

// ============================================
// PROVIDER SCHEDULE REPOSITORY
// ============================================

export interface ListProviderSchedulesOptions {
  providerId?: string;
  dayOfWeek?: number;
  isAvailable?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * IProviderScheduleRepository
 * Repository interface for ProviderSchedule entity
 */
export interface IProviderScheduleRepository {
  // Create
  create(schedule: ProviderSchedule): Promise<ProviderSchedule>;

  // Read
  findById(id: string): Promise<ProviderSchedule | null>;
  findByProviderAndDay(
    providerId: string,
    dayOfWeek: number,
  ): Promise<ProviderSchedule | null>;
  list(options?: ListProviderSchedulesOptions): Promise<ProviderSchedule[]>;
  count(
    options?: Omit<ListProviderSchedulesOptions, 'limit' | 'offset'>,
  ): Promise<number>;

  // Update
  update(schedule: ProviderSchedule): Promise<ProviderSchedule>;

  // Delete
  delete(id: string): Promise<void>;

  // Business operations
  findAllByProvider(providerId: string): Promise<ProviderSchedule[]>;
  findAvailableSchedulesByProvider(
    providerId: string,
  ): Promise<ProviderSchedule[]>;
  existsByProviderAndDay(
    providerId: string,
    dayOfWeek: number,
  ): Promise<boolean>;
}

// ============================================
// UNIT OF WORK (for transactions)
// ============================================

export interface IProviderUnitOfWork {
  providerProfiles: IProviderProfileRepository;
  providerUsers: IProviderUserRepository;
  providerServices: IProviderServiceRepository;
  providerSchedules: IProviderScheduleRepository;

  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// ============================================
// REPOSITORY TOKENS FOR DI
// ============================================

export const PROVIDER_PROFILE_REPOSITORY = Symbol(
  'PROVIDER_PROFILE_REPOSITORY',
);
export const PROVIDER_USER_REPOSITORY = Symbol('PROVIDER_USER_REPOSITORY');
export const PROVIDER_SERVICE_REPOSITORY = Symbol(
  'PROVIDER_SERVICE_REPOSITORY',
);
export const PROVIDER_SCHEDULE_REPOSITORY = Symbol(
  'PROVIDER_SCHEDULE_REPOSITORY',
);
export const PROVIDER_UNIT_OF_WORK = Symbol('PROVIDER_UNIT_OF_WORK');
