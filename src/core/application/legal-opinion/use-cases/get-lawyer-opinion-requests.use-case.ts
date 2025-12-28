// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { PaginationParams } from 'src/infrastructure/persistence/consultation/prisma.repository';
import { UserId } from 'src/core/domain/consultation/value-objects/consultation-request-domain';

// ============================================
// GET LAWYER OPINION REQUESTS USE CASE
// ============================================

export interface GetLawyerOpinionRequestsQuery {
  lawyerId: string;
  filters?: any;
  pagination?: PaginationParams;
}

@Injectable()
export class GetLawyerOpinionRequestsUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(query: GetLawyerOpinionRequestsQuery): Promise<any> {
    const result = await this.repository.findByLawyerId(
      UserId.create(query.lawyerId),
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
      clientId: opinion.clientId.getValue(),
      opinionType: opinion.opinionType.getValue(),
      subject: opinion.subject.getValue(),
      legalQuestion: opinion.legalQuestion.getValue(),
      status: opinion.status.getValue(),
      priority: opinion.priority.getValue(),
      expectedCompletionDate: opinion.expectedCompletionDate?.toISOString(),
      assignedAt: opinion.assignedAt?.toISOString(),
      createdAt: opinion.createdAt.toISOString(),
    };
  }
}
