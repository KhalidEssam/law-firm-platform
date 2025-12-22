// ============================================
// ASSIGN CONSULTATION TO PROVIDER USE CASE
// ============================================

import {
    ConsultationRequest,
    ConsultationId,
    UserId,
} from '../../../../domain/consultation/value-objects/consultation-request-domain';

import { RequestStatusHistory } from '../../../../domain/consultation/entities/consultation-request-entities';

import { IConsultationRequestUnitOfWork } from '../../ports/repository';

import { ConsultationRequestResponseDTO } from '../../consultation request.dtos';

export class AssignConsultationToProviderUseCase {
    constructor(
        private readonly unitOfWork: IConsultationRequestUnitOfWork
    ) {}

    async execute(consultationId: string, providerId: string): Promise<ConsultationRequestResponseDTO> {
        const id = ConsultationId.create(consultationId);
        const providerUserId = UserId.create(providerId);

        return await this.unitOfWork.transaction(async (uow) => {
            // Get consultation
            const consultation = await uow.consultationRequests.findById(id);
            if (!consultation) {
                throw new Error(`Consultation request with ID ${consultationId} not found`);
            }

            // Capture old status
            const oldStatus = consultation.status;

            // Assign to provider (domain logic)
            consultation.assignToProvider(providerUserId);

            // Save
            const updated = await uow.consultationRequests.update(consultation);

            // Create status history
            const statusHistory = RequestStatusHistory.create({
                consultationId: updated.id,
                fromStatus: oldStatus,
                toStatus: updated.status,
                reason: `Assigned to provider ${providerId}`,
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
            respondedAt: consultation.respondedAt,
            completedAt: consultation.completedAt,
            slaDeadline: consultation.slaDeadline,
            slaStatus: consultation.slaStatus?.getValue(),
            createdAt: consultation.createdAt,
            updatedAt: consultation.updatedAt,
        };
    }
}
