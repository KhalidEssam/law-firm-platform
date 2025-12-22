// ============================================
// CALL REQUEST USE CASES - BACKWARD COMPATIBILITY RE-EXPORT
// ============================================
// This file re-exports from the new modular structure for backward compatibility.
// New code should import directly from the submodule directories.

// Request Use Cases
export { CreateCallRequestUseCase } from './request';
export { GetCallRequestByIdUseCase } from './request';
export { GetCallRequestsUseCase } from './request';

// Provider Use Cases
export { AssignProviderUseCase } from './provider';
export { GetProviderCallsUseCase } from './provider';
export { GetUpcomingCallsUseCase } from './provider';
export { CheckProviderAvailabilityUseCase } from './provider';

// Scheduling Use Cases
export { ScheduleCallUseCase } from './scheduling';
export { RescheduleCallUseCase } from './scheduling';
export { GetScheduledCallsUseCase } from './scheduling';

// Session Use Cases
export { StartCallUseCase } from './session';
export { EndCallUseCase } from './session';
export { CancelCallUseCase } from './session';
export { MarkNoShowUseCase } from './session';
export { UpdateCallLinkUseCase } from './session';

// Subscriber Use Cases
export { GetSubscriberCallsUseCase } from './subscriber';
export { GetCallMinutesSummaryUseCase } from './subscriber';
export type { CallMinutesSummary } from './subscriber';

// Admin Use Cases
export { GetOverdueCallsUseCase } from './admin';
