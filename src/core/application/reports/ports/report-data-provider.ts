// ============================================
// REPORT DATA PROVIDER INTERFACE
// src/core/application/reports/ports/report-data-provider.ts
// ============================================

/**
 * Date range for queries
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// ============================================
// FINANCIAL REPORT DATA
// ============================================

export interface FinancialStats {
  activeMemberships: number;
  transactions: {
    count: number;
    totalAmount: number;
    averageAmount: number;
  };
  payments: {
    count: number;
    totalAmount: number;
    pendingAmount: number;
  };
  revenueByService: Record<string, number>;
}

// ============================================
// OPERATIONAL REPORT DATA
// ============================================

export interface RequestCounts {
  consultations: number;
  legalOpinions: number;
  litigations: number;
  calls: number;
  services: number;
}

export interface SLAStats {
  onTrack: number;
  atRisk: number;
  breached: number;
  total: number;
}

export interface OperationalStats {
  requestCounts: RequestCounts;
  activeProviders: number;
  activeSubscribers: number;
  slaStats: SLAStats;
}

// ============================================
// PERFORMANCE REPORT DATA
// ============================================

export interface RatingDistribution {
  [rating: number]: number;
}

export interface PerformanceStats {
  ratings: {
    count: number;
    average: number;
    distribution: RatingDistribution;
  };
  completionRate: number;
  totalRequests: number;
  completedRequests: number;
}

// ============================================
// COMPLIANCE REPORT DATA
// ============================================

export interface AuditStats {
  totalLogs: number;
  byAction: Record<string, number>;
}

export interface ComplianceStats {
  auditStats: AuditStats;
  sessionCount: number;
  dataExportRequests: number;
}

// ============================================
// REPORT DATA PROVIDER INTERFACE
// ============================================

/**
 * IReportDataProvider
 *
 * Provides aggregated data for report generation.
 * Abstracts the data access layer from report use cases.
 */
export interface IReportDataProvider {
  /**
   * Get financial statistics for a date range
   */
  getFinancialStats(dateRange: DateRange): Promise<FinancialStats>;

  /**
   * Get operational statistics for a date range
   */
  getOperationalStats(dateRange: DateRange): Promise<OperationalStats>;

  /**
   * Get performance statistics for a date range
   */
  getPerformanceStats(dateRange: DateRange): Promise<PerformanceStats>;

  /**
   * Get compliance statistics for a date range
   */
  getComplianceStats(dateRange: DateRange): Promise<ComplianceStats>;

  /**
   * Get request counts by type for a date range
   */
  getRequestCountsByType(dateRange: DateRange): Promise<RequestCounts>;

  /**
   * Get SLA statistics for a date range
   */
  getSLAStats(dateRange: DateRange): Promise<SLAStats>;

  /**
   * Get provider workload statistics
   */
  getProviderWorkloadStats(): Promise<{
    totalActive: number;
    averageWorkload: number;
    topPerformers: Array<{
      providerId: string;
      name: string;
      completedRequests: number;
    }>;
  }>;

  /**
   * Get subscriber statistics for a date range
   */
  getSubscriberStats(dateRange: DateRange): Promise<{
    totalActive: number;
    newThisPeriod: number;
    retention: number;
  }>;
}

/**
 * DI Token for ReportDataProvider
 */
export const REPORT_DATA_PROVIDER = Symbol('IReportDataProvider');
