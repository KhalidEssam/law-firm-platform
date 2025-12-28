// ============================================
// PAYMENT METHOD USE CASES - BACKWARD COMPATIBILITY RE-EXPORTS
// Application Layer - Business Logic
// ============================================
// NOTE: This file re-exports from modular use-case files for backward compatibility.
// New code should import directly from the specific subdirectories.
// ============================================

// Management use cases
export {
  AddPaymentMethodUseCase,
  type AddPaymentMethodCommand,
  UpdatePaymentMethodUseCase,
  type UpdatePaymentMethodCommand,
  DeletePaymentMethodUseCase,
  type DeletePaymentMethodCommand,
  RestorePaymentMethodUseCase,
  type RestorePaymentMethodCommand,
  ActivatePaymentMethodUseCase,
  type ActivatePaymentMethodCommand,
  DeactivatePaymentMethodUseCase,
  type DeactivatePaymentMethodCommand,
} from './management';

// Verification use cases
export {
  VerifyPaymentMethodUseCase,
  type VerifyPaymentMethodCommand,
  SetDefaultPaymentMethodUseCase,
  type SetDefaultPaymentMethodCommand,
  MarkPaymentMethodAsUsedUseCase,
  type MarkPaymentMethodAsUsedCommand,
  RecordFailedPaymentAttemptUseCase,
  type RecordFailedPaymentAttemptCommand,
  ResetFailedAttemptsUseCase,
  type ResetFailedAttemptsCommand,
} from './verification';

// Query use cases
export {
  GetPaymentMethodUseCase,
  type GetPaymentMethodQuery,
  GetMyPaymentMethodsUseCase,
  type GetMyPaymentMethodsQuery,
  GetDefaultPaymentMethodUseCase,
  type GetDefaultPaymentMethodQuery,
  ListPaymentMethodsUseCase,
  type ListPaymentMethodsQuery,
  GetExpiringPaymentMethodsUseCase,
  type GetExpiringPaymentMethodsQuery,
  GetPaymentMethodStatisticsUseCase,
  type GetPaymentMethodStatisticsQuery,
} from './query';

// Admin use cases
export {
  HardDeletePaymentMethodUseCase,
  type HardDeletePaymentMethodCommand,
} from './admin';
