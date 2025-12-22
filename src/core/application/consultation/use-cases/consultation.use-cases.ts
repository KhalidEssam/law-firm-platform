// ============================================
// CONSULTATION USE CASES - BACKWARD COMPATIBILITY RE-EXPORT
// ============================================
// This file re-exports from the new modular structure for backward compatibility.
// New code should import directly from the submodule directories.

// Request Use Cases
export { CreateConsultationRequestUseCase } from './request';
export { GetConsultationRequestUseCase } from './request';
export { ListConsultationRequestsUseCase } from './request';

// Status Transition Use Cases
export { AssignConsultationToProviderUseCase } from './status';
export { MarkConsultationAsInProgressUseCase } from './status';
export { CompleteConsultationRequestUseCase } from './status';
export { CancelConsultationRequestUseCase } from './status';
export { DisputeConsultationRequestUseCase } from './status';

// Document Use Cases
export { UploadDocumentUseCase } from './document';

// Message Use Cases
export { SendMessageUseCase } from './message';

// Rating Use Cases
export { AddRatingUseCase } from './rating';

// Analytics Use Cases
export { GetConsultationStatisticsUseCase } from './analytics';
export { UpdateSLAStatusesUseCase } from './analytics';
export type { UpdateSLAStatusesResult } from './analytics';
