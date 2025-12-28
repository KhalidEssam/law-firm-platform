// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestFilters } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { PaginationParams } from 'src/infrastructure/persistence/consultation/prisma.repository';

// ============================================
// LIST OPINION REQUESTS USE CASE
// ============================================

export interface ListOpinionRequestsQuery {
  filters?: any;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

@Injectable()
export class ListOpinionRequestsUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(query: ListOpinionRequestsQuery): Promise<any> {
    const filters: OpinionRequestFilters = {
      clientId: query.filters?.clientId,
      assignedLawyerId: query.filters?.assignedLawyerId,
      status: query.filters?.status,
      isPaid: query.filters?.isPaid,
      searchTerm: query.filters?.searchTerm,
      submittedFrom: query.filters?.submittedFrom
        ? new Date(query.filters.submittedFrom)
        : undefined,
      submittedTo: query.filters?.submittedTo
        ? new Date(query.filters.submittedTo)
        : undefined,
      completedFrom: query.filters?.completedFrom
        ? new Date(query.filters.completedFrom)
        : undefined,
      completedTo: query.filters?.completedTo
        ? new Date(query.filters.completedTo)
        : undefined,
    };

    const pagination: PaginationParams = {
      page: query.pagination?.page || 1,
      limit: query.pagination?.limit || 10,
      sortBy: query.pagination?.sortBy || 'createdAt',
      sortOrder: query.pagination?.sortOrder || 'desc',
    };

    const result = await this.repository.findAll(filters, pagination);

    return {
      data: result.data.map((opinion) => this.toDto(opinion)),
      pagination: result.pagination,
    };
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      clientId: opinion.clientId.getValue(),
      assignedLawyerId: opinion.assignedLawyerId?.getValue(),
      opinionType: opinion.opinionType.getValue(),
      subject: opinion.subject.getValue(),
      status: opinion.status.getValue(),
      priority: opinion.priority.getValue(),
      isPaid: opinion.isPaid,
      submittedAt: opinion.submittedAt?.toISOString(),
      completedAt: opinion.completedAt?.toISOString(),
      createdAt: opinion.createdAt.toISOString(),
      updatedAt: opinion.updatedAt.toISOString(),
    };
  }
}
