// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException
} from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from 'src/core/domain/legal-opinion/value-objects/opinion-requestid.vo';

// ============================================
// REQUEST REVISION USE CASE
// ============================================

export interface RequestRevisionCommand {
  opinionRequestId: string;
  reason: string;
  requestedBy: string;
}

@Injectable()
export class RequestRevisionUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: RequestRevisionCommand): Promise<any> {
    const opinion = await this.repository.findById(
      OpinionRequestId.create(command.opinionRequestId),
    );

    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Request revision
    opinion.requestRevision( command.reason);

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
