
// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from 'src/core/domain/legal-opinion/value-objects/opinion-requestid.vo';


// ============================================
// SUBMIT FOR REVIEW USE CASE
// ============================================

export interface SubmitForReviewCommand {
  opinionRequestId: string;
  lawyerId: string;
}

@Injectable()
export class SubmitForReviewUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: SubmitForReviewCommand): Promise<any> {
    const opinion = await this.repository.findById(OpinionRequestId.create(command.opinionRequestId));
    
    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Check assignment
    if (opinion.assignedLawyerId?.getValue() !== command.lawyerId) {
      throw new ForbiddenException('This opinion is not assigned to you');
    }

    // Submit for review
    opinion.submitForReview();

    // Save
    const updated = await this.repository.update(opinion);

    return this.toDto(updated);
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      status: opinion.status.getValue(),
      reviewStartedAt: opinion.reviewStartedAt?.toISOString(),
      updatedAt: opinion.updatedAt.toISOString(),
    };
  }
}
