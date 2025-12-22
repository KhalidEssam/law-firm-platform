// ============================================
// CREATE CONSULTATION REQUEST USE CASE
// ============================================

import {
    ConsultationRequest,
    UserId,
    ConsultationTypeVO,
    Urgency,
    ConsultationCategory,
    Subject,
    Description,
} from '../../../../domain/consultation/value-objects/consultation-request-domain';

import { RequestStatusHistory } from '../../../../domain/consultation/entities/consultation-request-entities';

import { IConsultationRequestUnitOfWork } from '../../ports/repository';

import {
    CreateConsultationRequestDTO,
    ConsultationRequestResponseDTO,
} from '../../consultation request.dtos';

export class CreateConsultationRequestUseCase {
    constructor(
        private readonly unitOfWork: IConsultationRequestUnitOfWork
    ) {}

    async execute(dto: CreateConsultationRequestDTO): Promise<ConsultationRequestResponseDTO> {
        // Validate input
        this.validate(dto);

        // Create domain entity
        const consultation = ConsultationRequest.create({
            subscriberId: UserId.create(dto.subscriberId),
            consultationType: ConsultationTypeVO.create(dto.consultationType),
            category: dto.category ? ConsultationCategory.create(dto.category) : undefined,
            subject: Subject.create(dto.subject),
            description: Description.create(dto.description),
            urgency: dto.urgency ? Urgency.create(dto.urgency) : Urgency.normal(),
        });

        // Use transaction to ensure consistency
        return await this.unitOfWork.transaction(async (uow) => {
            // Save consultation
            const saved = await uow.consultationRequests.create(consultation);

            // Create initial status history
            const statusHistory = RequestStatusHistory.create({
                consultationId: saved.id,
                toStatus: saved.status,
                reason: 'Initial creation',
            });
            await uow.statusHistories.create(statusHistory);

            return this.toDTO(saved);
        });
    }

    private validate(dto: CreateConsultationRequestDTO): void {
        if (!dto.subscriberId) {
            throw new Error('Subscriber ID is required');
        }
        if (!dto.consultationType) {
            throw new Error('Consultation type is required');
        }
        if (!dto.subject) {
            throw new Error('Subject is required');
        }
        if (!dto.description) {
            throw new Error('Description is required');
        }
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
