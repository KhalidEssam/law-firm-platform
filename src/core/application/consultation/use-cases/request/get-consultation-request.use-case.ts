// ============================================
// GET CONSULTATION REQUEST USE CASE
// ============================================

import {
  ConsultationRequest,
  ConsultationId,
} from '../../../../domain/consultation/value-objects/consultation-request-domain';

import { IConsultationRequestRepository } from '../../ports/repository';

import { ConsultationRequestResponseDTO } from '../../consultation request.dtos';

export class GetConsultationRequestUseCase {
  constructor(private readonly repository: IConsultationRequestRepository) {}

  async execute(_id: string): Promise<ConsultationRequestResponseDTO> {
    const consultationId = ConsultationId.create(id);
    const consultation = await this.repository.findById(consultationId);

    if (!consultation) {
      throw new Error(`Consultation request with ID ${id} not found`);
    }

    return this.toDTO(consultation);
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
