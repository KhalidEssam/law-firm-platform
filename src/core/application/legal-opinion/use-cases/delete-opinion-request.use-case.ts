

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { OpinionRequestId } from 'src/core/domain/legal-opinion/value-objects/opinion-requestid.vo';

// ============================================
// DELETE OPINION REQUEST USE CASE
// ============================================

export interface DeleteOpinionRequestCommand {
  opinionRequestId: string;
  deletedBy: string;
}

@Injectable()
export class DeleteOpinionRequestUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: DeleteOpinionRequestCommand): Promise<void> {
    const opinion = await this.repository.findById(OpinionRequestId.create(command.opinionRequestId));
    
    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Soft delete
    await this.repository.delete(opinion.id);
  }
}
