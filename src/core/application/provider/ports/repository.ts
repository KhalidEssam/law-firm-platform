// ============================================
// PROVIDER REPOSITORY - RE-EXPORT FROM DOMAIN
// src/core/application/provider/ports/repository.ts
// ============================================
// NOTE: Repository interfaces have been moved to domain layer.
// This file re-exports for backward compatibility.
// New code should import from '@core/domain/provider/ports'
// ============================================

export type {
  // Options interfaces
  FindProviderProfileOptions,
  ListProviderProfilesOptions,
  FindProviderUserOptions,
  ListProviderUsersOptions,
  ListProviderServicesOptions,
  ListProviderSchedulesOptions,

  // Repository interfaces
  IProviderProfileRepository,
  IProviderUserRepository,
  IProviderServiceRepository,
  IProviderScheduleRepository,
  IProviderUnitOfWork,
} from '../../../domain/provider/ports/provider.repository';

export {
  // DI Tokens
  PROVIDER_PROFILE_REPOSITORY,
  PROVIDER_USER_REPOSITORY,
  PROVIDER_SERVICE_REPOSITORY,
  PROVIDER_SCHEDULE_REPOSITORY,
  PROVIDER_UNIT_OF_WORK,
} from '../../../domain/provider/ports/provider.repository';

// Keep backward compatible alias
export type { IProviderUnitOfWork as IUnitOfWork } from '../../../domain/provider/ports/provider.repository';
