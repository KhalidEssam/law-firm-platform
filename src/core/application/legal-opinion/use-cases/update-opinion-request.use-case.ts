// ============================================
// USE CASES - PART 1: CRUD OPERATIONS
// Application Layer - Business Logic
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { BackgroundContext } from '../../../domain/legal-opinion/value-objects/background-context.vo';
import { OpinionStatus } from 'src/core/domain/legal-opinion/value-objects/opinion-status.vo';
import { OpinionPriorityVO } from 'src/core/domain/legal-opinion/value-objects/opinion-priority.vo';
import { OpinionPriority } from 'src/core/domain/legal-opinion/value-objects/opinion-priority.vo';
import { OpinionRequestId } from 'src/core/domain/legal-opinion/value-objects/opinion-requestid.vo';
import { SpecificIssues } from 'src/core/domain/legal-opinion/value-objects/specific-issues.vo';
import { RelevantFacts } from 'src/core/domain/legal-opinion/value-objects/relevant-facts.vo';
import { OpinionSubject } from 'src/core/domain/legal-opinion/value-objects/opinion-subject.vo';
import { LegalQuestion } from 'src/core/domain/legal-opinion/value-objects/legal-question.vo';
import { CreateOpinionRequestCommand } from './create-opinion-request.use-case';
import { type ILegalOpinionRequestRepository } from '../../../domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { CreateOpinionRequestUseCase } from './create-opinion-request.use-case';
// ============================================
// UPDATE OPINION REQUEST USE CASE
// ============================================

export interface UpdateOpinionRequestCommand {
  opinionRequestId: string;
  userId: string;
  updates: Partial<CreateOpinionRequestCommand>;
}

@Injectable()
export class UpdateOpinionRequestUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: UpdateOpinionRequestCommand): Promise<any> {
    // Find opinion
    const opinion = await this.repository.findById(
      OpinionRequestId.create(command.opinionRequestId),
    );
    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Check ownership
    if (opinion.clientId.getValue() !== command.userId) {
      throw new ForbiddenException(
        'You can only update your own opinion requests',
      );
    }

    // Check if still in draft
    if (opinion.status.getValue() !== OpinionStatus.DRAFT) {
      throw new BadRequestException('Can only update opinions in draft status');
    }

    // Update fields
    if (command.updates.subject) {
      opinion.updateSubject(OpinionSubject.create(command.updates.subject));
    }
    if (command.updates.legalQuestion) {
      opinion.updateLegalQuestion(
        LegalQuestion.create(command.updates.legalQuestion),
      );
    }
    if (command.updates.backgroundContext) {
      opinion.updateBackgroundContext(
        BackgroundContext.create(command.updates.backgroundContext),
      );
    }
    if (command.updates.relevantFacts) {
      opinion.updateRelevantFacts(
        RelevantFacts.create(command.updates.relevantFacts),
      );
    }
    if (command.updates.specificIssues) {
      opinion.updateSpecificIssues(
        SpecificIssues.create(command.updates.specificIssues),
      );
    }
    if (command.updates.priority) {
      opinion.changePriority(
        OpinionPriorityVO.create(command.updates.priority as OpinionPriority),
      );
    }

    // Save
    const updated = await this.repository.update(opinion);

    return this.toDto(updated);
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return new CreateOpinionRequestUseCase(this.repository as any).execute(
      {} as any,
    );
  }
}
