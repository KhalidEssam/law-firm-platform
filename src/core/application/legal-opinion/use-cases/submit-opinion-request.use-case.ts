// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from 'src/core/domain/legal-opinion/value-objects/opinion-requestid.vo';
import { UserId } from 'src/core/domain/consultation/value-objects/consultation-request-domain';
// ============================================
// SUBMIT OPINION REQUEST USE CASE
// ============================================

export interface SubmitOpinionRequestCommand {
  opinionRequestId: string;
  userId: string;
}

@Injectable()
export class SubmitOpinionRequestUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: SubmitOpinionRequestCommand): Promise<any> {
    const opinion = await this.repository.findById(
      OpinionRequestId.create(command.opinionRequestId),
    );

    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Check ownership
    if (opinion.clientId.getValue() !== command.userId) {
      throw new ForbiddenException(
        'You can only submit your own opinion requests',
      );
    }

    // Submit
    opinion.submit();

    // Save
    const updated = await this.repository.update(opinion);

    return this.toDto(updated);
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      status: opinion.status.getValue(),
      submittedAt: opinion.submittedAt?.toISOString(),
      updatedAt: opinion.updatedAt.toISOString(),
    };
  }
}
