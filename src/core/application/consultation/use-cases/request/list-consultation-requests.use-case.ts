// ============================================
// LIST CONSULTATION REQUESTS USE CASE
// ============================================

import {
    ConsultationRequest,
} from '../../../../domain/consultation/value-objects/consultation-request-domain';

import {
    IConsultationRequestRepository,
    ConsultationRequestFilters,
    PaginationParams,
    PaginatedResult,
} from '../../ports/repository';

import { ConsultationRequestResponseDTO } from '../../consultation request.dtos';

export class ListConsultationRequestsUseCase {
    constructor(
        private readonly repository: IConsultationRequestRepository
    ) {}

    async execute(
        filters?: ConsultationRequestFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequestResponseDTO>> {
        const result = await this.repository.findAll(filters, pagination);

        return {
            data: result.data.map((c) => this.toDTO(c)),
            pagination: result.pagination,
        };
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
