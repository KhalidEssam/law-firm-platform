
// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from 'src/core/domain/legal-opinion/value-objects/opinion-requestid.vo';


// ============================================
// COMPLETE OPINION USE CASE
// ============================================

export interface CompleteOpinionCommand {
  opinionRequestId: string;
  completedBy: string;
}

@Injectable()
export class CompleteOpinionUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: CompleteOpinionCommand): Promise<any> {
    const opinion = await this.repository.findById(OpinionRequestId.create(command.opinionRequestId));
    
    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Check if paid
    if (!opinion.isPaid) {
      throw new BadRequestException('Opinion must be paid before completion');
    }

    // Complete
    opinion.complete();

    // Save
    const updated = await this.repository.update(opinion);

    return this.toDto(updated);
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      status: opinion.status.getValue(),
      completedAt: opinion.completedAt?.toISOString(),
      finalVersion: opinion.finalVersion,
      updatedAt: opinion.updatedAt.toISOString(),
    };
  }
}