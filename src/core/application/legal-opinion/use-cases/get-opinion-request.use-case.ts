// ============================================
// USE CASES - PART 1: CRUD OPERATIONS
// Application Layer - Business Logic
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from '../../../domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from 'src/core/domain/legal-opinion/value-objects/opinion-requestid.vo';

// ============================================
// GET OPINION REQUEST USE CASE
// ============================================

export interface GetOpinionRequestQuery {
  opinionRequestId: string;
  userId: string;
  userRole: string;
}

@Injectable()
export class GetOpinionRequestUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(query: GetOpinionRequestQuery): Promise<any> {
    const opinion = await this.repository.findById(
      OpinionRequestId.create(query.opinionRequestId),
    );

    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Check access
    const isOwner = opinion.clientId.getValue() === query.userId;
    const isAssigned = opinion.assignedLawyerId?.getValue() === query.userId;
    const isAdmin = ['admin', 'manager'].includes(query.userRole);

    if (!isOwner && !isAssigned && !isAdmin) {
      throw new ForbiddenException(
        'You do not have access to this opinion request',
      );
    }

    return this.toDto(opinion);
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      clientId: opinion.clientId.getValue(),
      assignedLawyerId: opinion.assignedLawyerId?.getValue(),
      opinionType: opinion.opinionType.getValue(),
      subject: opinion.subject.getValue(),
      legalQuestion: opinion.legalQuestion.getValue(),
      backgroundContext: opinion.backgroundContext.getValue(),
      relevantFacts: opinion.relevantFacts.getValue(),
      specificIssues: opinion.specificIssues?.getValue(),
      jurisdiction: {
        country: opinion.jurisdiction.getCountry(),
        region: opinion.jurisdiction.getRegion(),
        city: opinion.jurisdiction.getCity(),
        legalSystem: opinion.jurisdiction.getLegalSystem(),
      },
      priority: opinion.priority.getValue(),
      status: opinion.status.getValue(),
      deliveryFormat: opinion.deliveryFormat.getValue(),
      estimatedCost: opinion.estimatedCost
        ? {
            amount: opinion.estimatedCost.getAmount(),
            currency: opinion.estimatedCost.getCurrency(),
          }
        : undefined,
      isPaid: opinion.isPaid,
      createdAt: opinion.createdAt.toISOString(),
      updatedAt: opinion.updatedAt.toISOString(),
    };
  }
}
