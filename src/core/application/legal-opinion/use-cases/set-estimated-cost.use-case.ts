// ============================================
// USE CASES - PART 2: WORKFLOW TRANSITIONS
// Application Layer - State Management
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,

} from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from 'src/core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from 'src/core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from 'src/core/domain/legal-opinion/value-objects/opinion-requestid.vo';
import { Money } from 'src/core/domain/legal-opinion/value-objects/money.vo';
// ============================================
// SET ESTIMATED COST USE CASE
// ============================================

export interface SetEstimatedCostCommand {
  opinionRequestId: string;
  estimatedCost: {
    amount: number;
    currency: string;
  };
  setBy: string;
}

@Injectable()
export class SetEstimatedCostUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: SetEstimatedCostCommand): Promise<any> {
    const opinion = await this.repository.findById(OpinionRequestId.create(command.opinionRequestId));
    
    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Set estimated cost
    const cost = Money.create(command.estimatedCost.amount, command.estimatedCost.currency);
    opinion.setEstimatedCost(cost);

    // Save
    const updated = await this.repository.update(opinion);

    return this.toDto(updated);
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      estimatedCost: opinion.estimatedCost ? {
        amount: opinion.estimatedCost.getAmount(),
        currency: opinion.estimatedCost.getCurrency(),
      } : undefined,
      updatedAt: opinion.updatedAt.toISOString(),
    };
  }
}
