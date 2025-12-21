// ============================================
// CONSULTATION REQUEST - USE CASES (APPLICATION LAYER)
// ============================================

import { Injectable } from '@nestjs/common';

import {
    ConsultationRequest,
    ConsultationId,
    UserId,
    ConsultationTypeVO,
    ConsultationStatus,
    Urgency,
    ConsultationCategory,
    Subject,
    Description,
} from '../../../domain/consultation/value-objects/consultation-request-domain';

import {
    ConsultationRequestFilters,
    PaginationParams,
    PaginatedResult,
} from '../ports/repository';

import {
    CreateConsultationRequestDTO,
    ConsultationRequestResponseDTO,
    DocumentResponseDTO,
    UploadDocumentDTO,
    SendMessageDTO,
    MessageResponseDTO,
    AddRatingDTO,
    RatingResponseDTO,
    ConsultationStatisticsDTO,
} from '../consultation request.dtos';

import { ConsultationRequestRepository } from '../../../../infrastructure/persistence/consultation/prisma.repository';

// ============================================
// HELPER: CONVERT ENTITY TO DTO
// ============================================

function toDTO(consultation: ConsultationRequest): ConsultationRequestResponseDTO {
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

// ============================================
// USE CASE 1: CREATE CONSULTATION REQUEST
// ============================================

@Injectable()
export class CreateConsultationRequestUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

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

        // Save consultation
        const saved = await this.repository.create(consultation);

        return toDTO(saved);
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
}

// ============================================
// USE CASE 2: GET CONSULTATION REQUEST BY ID
// ============================================

@Injectable()
export class GetConsultationRequestUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(id: string): Promise<ConsultationRequestResponseDTO> {
        const consultationId = ConsultationId.create(id);
        const consultation = await this.repository.findById(consultationId);

        if (!consultation) {
            throw new Error(`Consultation request with ID ${id} not found`);
        }

        return toDTO(consultation);
    }
}

// ============================================
// USE CASE 3: LIST CONSULTATION REQUESTS
// ============================================

@Injectable()
export class ListConsultationRequestsUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(
        filters?: ConsultationRequestFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResult<ConsultationRequestResponseDTO>> {
        const result = await this.repository.findAll(filters as any, pagination);

        return {
            data: result.data.map((c) => toDTO(c)),
            pagination: result.pagination,
        };
    }
}

// ============================================
// USE CASE 4: ASSIGN TO PROVIDER
// ============================================

@Injectable()
export class AssignConsultationToProviderUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(consultationId: string, providerId: string): Promise<ConsultationRequestResponseDTO> {
        const id = ConsultationId.create(consultationId);
        const providerUserId = UserId.create(providerId);

        const updated = await this.repository.assign(id, providerUserId);

        return toDTO(updated);
    }
}

// ============================================
// USE CASE 5: MARK AS IN PROGRESS
// ============================================

@Injectable()
export class MarkConsultationAsInProgressUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(consultationId: string): Promise<ConsultationRequestResponseDTO> {
        const id = ConsultationId.create(consultationId);
        const consultation = await this.repository.findById(id);

        if (!consultation) {
            throw new Error(`Consultation request with ID ${consultationId} not found`);
        }

        consultation.markAsInProgress();
        const updated = await this.repository.updateStatus(id, consultation.status);

        return toDTO(updated);
    }
}

// ============================================
// USE CASE 6: COMPLETE CONSULTATION
// ============================================

@Injectable()
export class CompleteConsultationRequestUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(consultationId: string): Promise<ConsultationRequestResponseDTO> {
        const id = ConsultationId.create(consultationId);
        const consultation = await this.repository.findById(id);

        if (!consultation) {
            throw new Error(`Consultation request with ID ${consultationId} not found`);
        }

        consultation.complete();
        const updated = await this.repository.updateStatus(id, consultation.status, {
            completedAt: new Date(),
        });

        return toDTO(updated);
    }
}

// ============================================
// USE CASE 7: CANCEL CONSULTATION
// ============================================

@Injectable()
export class CancelConsultationRequestUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(consultationId: string, reason?: string): Promise<ConsultationRequestResponseDTO> {
        const id = ConsultationId.create(consultationId);
        const consultation = await this.repository.findById(id);

        if (!consultation) {
            throw new Error(`Consultation request with ID ${consultationId} not found`);
        }

        consultation.cancel(reason);
        const updated = await this.repository.updateStatus(id, consultation.status);

        return toDTO(updated);
    }
}

// ============================================
// USE CASE 8: DISPUTE CONSULTATION
// ============================================

@Injectable()
export class DisputeConsultationRequestUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(consultationId: string, reason: string): Promise<ConsultationRequestResponseDTO> {
        if (!reason || reason.trim().length === 0) {
            throw new Error('Dispute reason is required');
        }

        const id = ConsultationId.create(consultationId);
        const consultation = await this.repository.findById(id);

        if (!consultation) {
            throw new Error(`Consultation request with ID ${consultationId} not found`);
        }

        consultation.dispute(reason);
        const updated = await this.repository.updateStatus(id, consultation.status);

        return toDTO(updated);
    }
}

// ============================================
// USE CASE 9: UPLOAD DOCUMENT
// ============================================

@Injectable()
export class UploadDocumentUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(dto: UploadDocumentDTO): Promise<DocumentResponseDTO> {
        // For now, just validate the consultation exists
        const consultationId = ConsultationId.create(dto.consultationId);
        const consultation = await this.repository.findById(consultationId);

        if (!consultation) {
            throw new Error(`Consultation request with ID ${dto.consultationId} not found`);
        }

        // TODO: Implement document upload when document repository is available
        throw new Error('Document upload not implemented yet');
    }
}

// ============================================
// USE CASE 10: SEND MESSAGE
// ============================================

@Injectable()
export class SendMessageUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(dto: SendMessageDTO): Promise<MessageResponseDTO> {
        // Validate consultation exists
        const consultationId = ConsultationId.create(dto.consultationId);
        const consultation = await this.repository.findById(consultationId);

        if (!consultation) {
            throw new Error(`Consultation request with ID ${dto.consultationId} not found`);
        }

        // TODO: Implement message sending when message repository is available
        throw new Error('Message sending not implemented yet');
    }
}

// ============================================
// USE CASE 11: ADD RATING
// ============================================

@Injectable()
export class AddRatingUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(dto: AddRatingDTO): Promise<RatingResponseDTO> {
        const consultationId = ConsultationId.create(dto.consultationId);
        const consultation = await this.repository.findById(consultationId);

        if (!consultation) {
            throw new Error(`Consultation request with ID ${dto.consultationId} not found`);
        }

        if (!consultation.status.isCompleted()) {
            throw new Error('Can only rate completed consultations');
        }

        // TODO: Implement rating when rating repository is available
        throw new Error('Rating not implemented yet');
    }
}

// ============================================
// USE CASE 12: GET STATISTICS
// ============================================

@Injectable()
export class GetConsultationStatisticsUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(filters?: ConsultationRequestFilters): Promise<ConsultationStatisticsDTO> {
        const stats = await this.repository.getStatistics(filters as any);
        return stats;
    }
}

// ============================================
// USE CASE 13: UPDATE SLA STATUSES (BACKGROUND JOB)
// ============================================

@Injectable()
export class UpdateSLAStatusesUseCase {
    constructor(
        private readonly repository: ConsultationRequestRepository
    ) { }

    async execute(): Promise<{
        updatedCount: number;
        updatedIds: string[];
        executedAt: Date;
    }> {
        // Find consultations needing SLA update
        const consultations = await this.repository.findConsultationsNeedingSLAUpdate();

        // For now, just return the count
        return {
            updatedCount: consultations.length,
            updatedIds: consultations.map((c) => c.id.getValue()),
            executedAt: new Date(),
        };
    }
}
