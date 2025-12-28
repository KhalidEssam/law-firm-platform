// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { PaginationParams } from 'src/infrastructure/persistence/consultation/prisma.repository';
import { UserId } from 'src/core/domain/consultation/value-objects/consultation-request-domain';

// ============================================
// GET MY OPINION REQUESTS USE CASE
// ============================================

export interface GetMyOpinionRequestsQuery {
  userId: string;
  filters?: any;
  pagination?: PaginationParams;
}

@Injectable()
export class GetMyOpinionRequestsUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(query: GetMyOpinionRequestsQuery): Promise<any> {
    const result = await this.repository.findByClientId(
      UserId.create(query.userId),
      query.pagination,
    );

    return {
      data: result.data.map((opinion) => this.toDto(opinion)),
      pagination: result.pagination,
    };
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      opinionType: opinion.opinionType.getValue(),
      subject: opinion.subject.getValue(),
      status: opinion.status.getValue(),
      priority: opinion.priority.getValue(),
      isPaid: opinion.isPaid,
      estimatedCost: opinion.estimatedCost
        ? {
            amount: opinion.estimatedCost.getAmount(),
            currency: opinion.estimatedCost.getCurrency(),
          }
        : undefined,
      submittedAt: opinion.submittedAt?.toISOString(),
      completedAt: opinion.completedAt?.toISOString(),
      createdAt: opinion.createdAt.toISOString(),
    };
  }
}
