import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { type ILegalOpinionRequestRepository } from '../../../domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from '../../../domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from '../../../domain/legal-opinion/value-objects/opinion-requestid.vo';
import { UserId } from '../../../domain/consultation/value-objects/consultation-request-domain';

// ============================================
// ASSIGN TO LAWYER USE CASE
// ============================================

export interface AssignToLawyerCommand {
  opinionRequestId: string;
  lawyerId: string;
  assignedBy: string;
}

@Injectable()
export class AssignToLawyerUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: AssignToLawyerCommand): Promise<any> {
    const opinion = await this.repository.findById(
      OpinionRequestId.create(command.opinionRequestId),
    );

    if (!opinion) {
      throw new NotFoundException('Opinion request not found');
    }

    // Assign
    opinion.assignToLawyer(UserId.create(command.lawyerId));

    // Save
    const updated = await this.repository.update(opinion);

    return this.toDto(updated);
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      assignedLawyerId: opinion.assignedLawyerId?.getValue(),
      status: opinion.status.getValue(),
      assignedAt: opinion.assignedAt?.toISOString(),
      updatedAt: opinion.updatedAt.toISOString(),
    };
  }
}
