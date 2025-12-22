// ============================================
// REPORT GENERATION USE CASES - BACKWARD COMPATIBILITY RE-EXPORTS
// ============================================
// NOTE: This file re-exports from modular use-case files for backward compatibility.
// New code should import directly from the specific subdirectories.
// ============================================

// Report CRUD use cases
export { CreateReportUseCase } from './report';
export { GetReportByIdUseCase } from './report';
export { ListReportsUseCase } from './report';
export { DeleteReportUseCase } from './report';
export { GetReportStatisticsUseCase } from './report';

// Report generation use cases
export { GenerateFinancialReportUseCase } from './generation';
export { GenerateOperationalReportUseCase } from './generation';
export { GeneratePerformanceReportUseCase } from './generation';
export { GenerateComplianceReportUseCase } from './generation';
