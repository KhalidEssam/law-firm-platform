// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from '../../../domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from '../../../domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from '../../../domain/legal-opinion/value-objects/opinion-requestid.vo';

// ============================================
// REJECT OPINION REQUEST USE CASE
// ============================================

export interface RejectOpinionRequestCommand {
  opinionRequestId: string;
  reason: string;
  rejectedBy: string;
}

@Injectable()
export class RejectOpinionRequestUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: RejectOpinionRequestCommand): Promise<any> {
    const opinion = await this.repository.findById(
      OpinionRequestId.create(command.opinionRequestId),
    );

    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Reject
    opinion.reject(command.reason);

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
