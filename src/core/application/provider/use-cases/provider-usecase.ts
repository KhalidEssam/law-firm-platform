// ============================================
// PROVIDER USE CASES - BACKWARD COMPATIBILITY RE-EXPORT
// ============================================
// This file re-exports from the new modular structure for backward compatibility.
// New code should import directly from the submodule directories.

// Profile Use Cases - Types
export type { CreateProviderProfileDTO, UpdateProviderProfileDTO } from './profile';
// Profile Use Cases - Classes
export {
    CreateProviderProfileUseCase,
    GetProviderProfileUseCase,
    UpdateProviderProfileUseCase,
    DeleteProviderProfileUseCase,
    ApproveProviderProfileUseCase,
    RejectProviderProfileUseCase,
    ListProviderProfilesUseCase,
} from './profile';

// User Use Cases - Types
export type {
    CreateProviderUserDTO,
    UpdateProviderUserDTO,
    ListProviderUsersOptions,
    ListProviderUsersResult,
} from './user';
// User Use Cases - Classes
export {
    CreateProviderUserUseCase,
    GetProviderUserUseCase,
    UpdateProviderUserUseCase,
    DeleteProviderUserUseCase,
    ListProviderUsersByProviderUseCase,
} from './user';

// Service Use Cases - Types
export type {
    CreateProviderServiceDTO,
    UpdateProviderServiceDTO,
    ListProviderServicesOptions,
    ListProviderServicesResult,
} from './service';
// Service Use Cases - Classes
export {
    CreateProviderServiceUseCase,
    GetProviderServiceUseCase,
    UpdateProviderServiceUseCase,
    DeleteProviderServiceUseCase,
    ListProviderServicesByProviderUseCase,
} from './service';

// Schedule Use Cases - Types
export type {
    CreateProviderScheduleDTO,
    UpdateProviderScheduleDTO,
    ListProviderSchedulesOptions,
} from './schedule';
// Schedule Use Cases - Classes
export {
    CreateProviderScheduleUseCase,
    GetProviderScheduleUseCase,
    UpdateProviderScheduleUseCase,
    DeleteProviderScheduleUseCase,
    ListProviderSchedulesByProviderUseCase,
} from './schedule';
