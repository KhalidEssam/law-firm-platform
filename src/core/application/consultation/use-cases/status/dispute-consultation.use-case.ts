// ============================================
// DISPUTE CONSULTATION REQUEST USE CASE
// ============================================

import {
    ConsultationRequest,
    ConsultationId,
} from '../../../../domain/consultation/value-objects/consultation-request-domain';

import { RequestStatusHistory } from '../../../../domain/consultation/entities/consultation-request-entities';

import { IConsultationRequestUnitOfWork } from '../../ports/repository';

import { ConsultationRequestResponseDTO } from '../../consultation request.dtos';

export class DisputeConsultationRequestUseCase {
    constructor(
        private readonly unitOfWork: IConsultationRequestUnitOfWork
    ) {}

    async execute(consultationId: string, reason: string): Promise<ConsultationRequestResponseDTO> {
        if (!reason || reason.trim().length === 0) {
            throw new Error('Dispute reason is required');
        }

        const id = ConsultationId.create(consultationId);

        return await this.unitOfWork.transaction(async (uow) => {
            const consultation = await uow.consultationRequests.findById(id);
            if (!consultation) {
                throw new Error(`Consultation request with ID ${consultationId} not found`);
            }

            const oldStatus = consultation.status;
            consultation.dispute(reason);

            const updated = await uow.consultationRequests.update(consultation);

            const statusHistory = RequestStatusHistory.create({
                consultationId: updated.id,
                fromStatus: oldStatus,
                toStatus: updated.status,
                reason: `Disputed: ${reason}`,
            });
            await uow.statusHistories.create(statusHistory);

            return this.toDTO(updated);
        });
    }

    private toDTO(consultation: ConsultationRequest): ConsultationRequestResponseDTO {
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
            slaStatus: consultation.slaStatus?.getValue(),
            createdAt: consultation.createdAt,
            updatedAt: consultation.updatedAt,
        };
    }
}
