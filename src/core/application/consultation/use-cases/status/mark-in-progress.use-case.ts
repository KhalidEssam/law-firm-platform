// ============================================
// MARK CONSULTATION AS IN PROGRESS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import {
  ConsultationRequest,
  ConsultationId,
} from '../../../../domain/consultation/value-objects/consultation-request-domain';

import { RequestStatusHistory } from '../../../../domain/consultation/entities/consultation-request-entities';

import type { IConsultationRequestUnitOfWork } from '../../../../domain/consultation/ports/consultation-request.repository';
import { CONSULTATION_UNIT_OF_WORK } from '../../../../domain/consultation/ports/consultation-request.repository';

import { ConsultationRequestResponseDTO } from '../../consultation request.dtos';

@Injectable()
export class MarkConsultationAsInProgressUseCase {
  constructor(
    @Inject(CONSULTATION_UNIT_OF_WORK)
    private readonly unitOfWork: IConsultationRequestUnitOfWork,
  ) {}

  async execute(
    consultationId: string,
  ): Promise<ConsultationRequestResponseDTO> {
    const id = ConsultationId.create(consultationId);

    return await this.unitOfWork.transaction(async (uow) => {
      const consultation = await uow.consultationRequests.findById(id);
      if (!consultation) {
        throw new Error(
          `Consultation request with ID ${consultationId} not found`,
        );
      }

      const oldStatus = consultation.status;
      consultation.markAsInProgress();

      const updated = await uow.consultationRequests.update(consultation);

      const statusHistory = RequestStatusHistory.create({
        consultationId: updated.id,
        fromStatus: oldStatus,
        toStatus: updated.status,
        reason: 'Provider started working',
      });
      await uow.statusHistories.create(statusHistory);

      return this.toDTO(updated);
    });
  }

  private toDTO(
    consultation: ConsultationRequest,
  ): ConsultationRequestResponseDTO {
    return {
      id: consultation.id.getValue(),
      requestNumber: consultation.requestNumber.getValue(),
      subscriberId: consultation.subscriberId?.getValue() || '',
      assignedProviderId: consultation.assignedProviderId?.getValue(),
      consultationType: consultation.consultationType.getValue(),
      category: consultation.category?.getValue(),
      subject: consultation.subject.getValue(),
      description: consultation.description.getValue(),
      urgency: consultation.urgency.getValue(),
      status: consultation.status.getValue(),
      submittedAt: consultation.submittedAt,
      assignedAt: consultation.assignedAt,
      respondedAt: consultation.respondedAt,
      completedAt: consultation.completedAt,
      slaDeadline: consultation.slaDeadline,
      slaStatus: consultation.slaStatus?.getValue(),
      createdAt: consultation.createdAt,
      updatedAt: consultation.updatedAt,
    };
  }
}
