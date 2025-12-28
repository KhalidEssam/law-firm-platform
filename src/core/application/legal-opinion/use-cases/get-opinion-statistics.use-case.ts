// ============================================
// USE CASES - PART 1: CRUD OPERATIONS
// Application Layer - Business Logic
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from '../../../domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { OpinionRequestFilters } from '../../../domain/legal-opinion/port/legal-opinion-request.repository.interface';

// ============================================
// GET OPINION STATISTICS USE CASE
// ============================================

export interface GetOpinionStatisticsQuery {
  filters?: any;
}

@Injectable()
export class GetOpinionStatisticsUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(query: GetOpinionStatisticsQuery): Promise<any> {
    const filters: OpinionRequestFilters = query.filters
      ? {
          status: query.filters.status,
          isPaid: query.filters.isPaid,
          submittedFrom: query.filters.submittedFrom
            ? new Date(query.filters.submittedFrom)
            : undefined,
          submittedTo: query.filters.submittedTo
            ? new Date(query.filters.submittedTo)
            : undefined,
        }
      : {};

    const stats = await this.repository.getStatistics(filters);

    return {
      total: stats.total,
      byStatus: stats.byStatus,
      byType: stats.byType,
      byPriority: stats.byPriority,
      averageCompletionTime: stats.averageCompletionTime,
      overdueCount: stats.overdueCount,
      paidCount: stats.paidCount,
      unpaidCount: stats.unpaidCount,
      totalRevenue: stats.totalRevenue,
      averageRevenue: stats.averageRevenue,
    };
  }
}
