// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from '../../../domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from '../../../domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from '../../../domain/legal-opinion/value-objects/opinion-requestid.vo';

// ============================================
// START REVISING USE CASE
// ============================================

export interface StartRevisingCommand {
  opinionRequestId: string;
  lawyerId: string;
}

@Injectable()
export class StartRevisingUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: StartRevisingCommand): Promise<any> {
    const opinion = await this.repository.findById(
      OpinionRequestId.create(command.opinionRequestId),
    );

    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Check assignment
    if (opinion.assignedLawyerId?.getValue() !== command.lawyerId) {
      throw new ForbiddenException('This opinion is not assigned to you');
    }

    // Start revising
    opinion.startRevising();

    // Save
    const updated = await this.repository.update(opinion);

    return this.toDto(updated);
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      status: opinion.status.getValue(),
      updatedAt: opinion.updatedAt.toISOString(),
    };
  }
}
