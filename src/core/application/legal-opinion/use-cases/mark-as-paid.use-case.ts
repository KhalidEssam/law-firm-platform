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
// MARK AS PAID USE CASE
// ============================================

export interface MarkAsPaidCommand {
  opinionRequestId: string;
  paymentReference: string;
  finalCost?: {
    amount: number;
    currency: string;
  };
  markedBy: string;
}

@Injectable()
export class MarkAsPaidUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: MarkAsPaidCommand): Promise<any> {
    const opinion = await this.repository.findById(OpinionRequestId.create(command.opinionRequestId));
    
    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Mark as paid
    const finalCost = command.finalCost 
      ? Money.create(command.finalCost.amount, command.finalCost.currency)
      : opinion.estimatedCost;

    if (finalCost) {
      opinion.markAsPaid(command.paymentReference, finalCost);
    }

    // Save
    const updated = await this.repository.update(opinion);

    return this.toDto(updated);
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      isPaid: opinion.isPaid,
      paymentReference: opinion.paymentReference,
      finalCost: opinion.finalCost ? {
        amount: opinion.finalCost.getAmount(),
        currency: opinion.finalCost.getCurrency(),
      } : undefined,
      updatedAt: opinion.updatedAt.toISOString(),
    };
  }
}