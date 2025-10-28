
// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from 'src/core/domain/legal-opinion/value-objects/opinion-requestid.vo';


// ============================================
// CANCEL OPINION REQUEST USE CASE
// ============================================

export interface CancelOpinionRequestCommand {
  opinionRequestId: string;
  userId: string;
  reason: string;
}

@Injectable()
export class CancelOpinionRequestUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: CancelOpinionRequestCommand): Promise<any> {
    const opinion = await this.repository.findById(OpinionRequestId.create(command.opinionRequestId));
    
    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Check ownership
    if (opinion.clientId.getValue() !== command.userId) {
      throw new ForbiddenException('You can only cancel your own opinion requests');
    }

    // Cancel
    opinion.cancel( command.reason );

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

