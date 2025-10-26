// ============================================
// CONSULTATION REQUEST - USE CASES (APPLICATION LAYER)
// ============================================

import {
    ConsultationRequest,
    ConsultationId,
    UserId,
    RequestNumber,
    ConsultationTypeVO,
    ConsultationType,
    ConsultationStatusVO,
    ConsultationStatus,
    Urgency,
    UrgencyLevel,
    ConsultationCategory,
    Subject,
    Description,
} from '../../../domain/consultation/valeo-objects/consultation-request-domain';

import {
    Document,
    DocumentId,
    FileName,
    FileUrl,
    FileSize,
    RequestMessage,
    MessageId,
    MessageContent,
    MessageType,
    RequestStatusHistory,
    RequestRating,
    RatingValue,
    RatingComment,
    RequestCollaborator,
    CollaboratorId,
    ProviderUserId,
    CollaboratorRole,
} from '../../../domain/consultation/entities/consultation-request-entities';

import {
    IConsultationRequestRepository,
    IDocumentRepository,
    IRequestMessageRepository,
    IRequestStatusHistoryRepository,
    IRequestRatingRepository,
    IRequestCollaboratorRepository,
    IConsultationRequestUnitOfWork,
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
    UpdateSLAStatusesResponseDTO
} from '../consultation request.dtos';

export class CreateConsultationRequestUseCase {
    constructor(
        private readonly unitOfWork: IConsultationRequestUnitOfWork
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

// ============================================
// USE CASE 2: GET CONSULTATION REQUEST BY ID
// ============================================

export class GetConsultationRequestUseCase {
    constructor(
        private readonly repository: IConsultationRequestRepository
    ) { }

    async execute(id: string): Promise<ConsultationRequestResponseDTO> {
        const consultationId = ConsultationId.create(id);
        const consultation = await this.repository.findById(consultationId);

        if (!consultation) {
            throw new Error(`Consultation request with ID ${id} not found`);
        }

        return this.toDTO(consultation);
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

// ============================================
// USE CASE 3: LIST CONSULTATION REQUESTS
// ============================================

export class ListConsultationRequestsUseCase {
    constructor(
        private readonly repository: IConsultationRequestRepository
    ) { }

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

// ============================================
// USE CASE 4: ASSIGN TO PROVIDER
// ============================================

export class AssignConsultationToProviderUseCase {
    constructor(
        private readonly unitOfWork: IConsultationRequestUnitOfWork
    ) { }

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

// ============================================
// USE CASE 5: MARK AS IN PROGRESS
// ============================================

export class MarkConsultationAsInProgressUseCase {
    constructor(
        private readonly unitOfWork: IConsultationRequestUnitOfWork
    ) { }

    async execute(consultationId: string): Promise<ConsultationRequestResponseDTO> {
        const id = ConsultationId.create(consultationId);

        return await this.unitOfWork.transaction(async (uow) => {
            const consultation = await uow.consultationRequests.findById(id);
            if (!consultation) {
                throw new Error(`Consultation request with ID ${consultationId} not found`);
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

// ============================================
// USE CASE 6: COMPLETE CONSULTATION
// ============================================

export class CompleteConsultationRequestUseCase {
    constructor(
        private readonly unitOfWork: IConsultationRequestUnitOfWork
    ) { }

    async execute(consultationId: string): Promise<ConsultationRequestResponseDTO> {
        const id = ConsultationId.create(consultationId);

        return await this.unitOfWork.transaction(async (uow) => {
            const consultation = await uow.consultationRequests.findById(id);
            if (!consultation) {
                throw new Error(`Consultation request with ID ${consultationId} not found`);
            }

            const oldStatus = consultation.status;
            consultation.complete();

            const updated = await uow.consultationRequests.update(consultation);

            const statusHistory = RequestStatusHistory.create({
                consultationId: updated.id,
                fromStatus: oldStatus,
                toStatus: updated.status,
                reason: 'Consultation completed',
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

// ============================================
// USE CASE 7: CANCEL CONSULTATION
// ============================================

export class CancelConsultationRequestUseCase {
    constructor(
        private readonly unitOfWork: IConsultationRequestUnitOfWork
    ) { }

    async execute(consultationId: string, reason?: string): Promise<ConsultationRequestResponseDTO> {
        const id = ConsultationId.create(consultationId);

        return await this.unitOfWork.transaction(async (uow) => {
            const consultation = await uow.consultationRequests.findById(id);
            if (!consultation) {
                throw new Error(`Consultation request with ID ${consultationId} not found`);
            }

            const oldStatus = consultation.status;
            consultation.cancel(reason);

            const updated = await uow.consultationRequests.update(consultation);

            const statusHistory = RequestStatusHistory.create({
                consultationId: updated.id,
                fromStatus: oldStatus,
                toStatus: updated.status,
                reason: reason || 'Consultation cancelled',
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

// ============================================
// USE CASE 8: DISPUTE CONSULTATION
// ============================================

export class DisputeConsultationRequestUseCase {
    constructor(
        private readonly unitOfWork: IConsultationRequestUnitOfWork
    ) { }

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
            // respondedAt: consultation.responded,
            // completedAt: consultation.completed,
            // slaDeadline: consultation.slaDeadli,
            slaStatus: consultation.slaStatus?.getValue(),
            createdAt: consultation.createdAt,
            updatedAt: consultation.updatedAt
        };
    }
}

// ============================================
// USE CASE 9: UPLOAD DOCUMENT
// ============================================

export class UploadDocumentUseCase {
    constructor(
        private readonly consultationRepo: IConsultationRequestRepository,
        private readonly documentRepo: IDocumentRepository
    ) { }

    async execute(dto: UploadDocumentDTO): Promise<DocumentResponseDTO> {
        // Validate consultation exists
        const consultationId = ConsultationId.create(dto.consultationId);
        const exists = await this.consultationRepo.exists(consultationId);
        if (!exists) {
            throw new Error(`Consultation request with ID ${dto.consultationId} not found`);
        }

        // Create document entity
        const document = Document.create({
            consultationId,
            uploadedBy: UserId.create(dto.uploadedBy),
            fileName: FileName.create(dto.fileName),
            fileUrl: FileUrl.create(dto.fileUrl),
            fileType: dto.fileType,
            fileSize: FileSize.create(dto.fileSize),
            description: dto.description,
        });

        // Save
        const saved = await this.documentRepo.create(document);

        return this.toDTO(saved);
    }

    private toDTO(document: Document): DocumentResponseDTO {
        return {
            id: document.id.getValue(),
            consultationId: document.consultationId.getValue(),
            uploadedBy: document.uploadedBy.getValue(),
            uploadedAt: document.uploadedAt,
            fileName: document.fileName.getValue(),
            fileUrl: document.fileUrl.getValue(),
            fileType: document.fileType,
            fileSize: document.fileSize.getBytes(),
            fileSizeFormatted: document.fileSize.toString(),
            description: document.description,
            isVerified: document.isVerified,
            // uploadedAt: document.uploadedAt,
        };
    }
}

// ============================================
// USE CASE 10: SEND MESSAGE
// ============================================

export class SendMessageUseCase {
    constructor(
        private readonly consultationRepo: IConsultationRequestRepository,
        private readonly messageRepo: IRequestMessageRepository
    ) { }

    async execute(dto: SendMessageDTO): Promise<MessageResponseDTO> {
        // Validate consultation exists
        const consultationId = ConsultationId.create(dto.consultationId);
        const exists = await this.consultationRepo.exists(consultationId);
        if (!exists) {
            throw new Error(`Consultation request with ID ${dto.consultationId} not found`);
        }

        // Create message entity
        const message = RequestMessage.create({
            consultationId,
            senderId: UserId.create(dto.senderId),
            message: MessageContent.create(dto.message),
            messageType: dto.messageType ? (dto.messageType as MessageType) : MessageType.TEXT,
        });

        // Save
        const saved = await this.messageRepo.create(message);

        return this.toDTO(saved);
    }

    private toDTO(message: RequestMessage): MessageResponseDTO {
        return {
            id: message.id.getValue(),
            consultationId: message.consultationId.getValue(),
            senderId: message.senderId.getValue(),
            message: message.message.getValue(),
            messageType: message.messageType,
            isRead: message.isRead,
            sentAt: message.sentAt,
        };
    }
}

// ============================================
// USE CASE 11: ADD RATING
// ============================================

export class AddRatingUseCase {
    constructor(
        private readonly consultationRepo: IConsultationRequestRepository,
        private readonly ratingRepo: IRequestRatingRepository
    ) { }

    async execute(dto: AddRatingDTO): Promise<RatingResponseDTO> {
        const consultationId = ConsultationId.create(dto.consultationId);

        // Validate consultation exists and is completed
        const consultation = await this.consultationRepo.findById(consultationId);
        if (!consultation) {
            throw new Error(`Consultation request with ID ${dto.consultationId} not found`);
        }

        if (!consultation.status.isCompleted()) {
            throw new Error('Can only rate completed consultations');
        }

        // Check if already rated
        const existingRating = await this.ratingRepo.exists(consultationId);
        if (existingRating) {
            throw new Error('This consultation has already been rated');
        }

        // Create rating entity
        const rating = RequestRating.create({
            consultationId,
            subscriberId: UserId.create(dto.subscriberId),
            rating: RatingValue.create(dto.rating),
            comment: dto.comment ? RatingComment.create(dto.comment) : undefined,
        });

        // Save
        const saved = await this.ratingRepo.create(rating);

        return this.toDTO(saved);
    }

    private toDTO(rating: RequestRating): RatingResponseDTO {
        return {
            id: rating.id.getValue(),
            consultationId: rating.consultationId.getValue(),
            subscriberId: rating.subscriberId.getValue(),
            rating: rating.rating.getValue(),
            comment: rating.comment?.getValue(),
            createdAt: rating.createdAt,
        };
    }
}

// ============================================
// USE CASE 12: GET STATISTICS
// ============================================

export class GetConsultationStatisticsUseCase {
    constructor(
        private readonly repository: IConsultationRequestRepository
    ) { }

    async execute(filters?: ConsultationRequestFilters): Promise<ConsultationStatisticsDTO> {
        const stats = await this.repository.getStatistics(filters);
        return stats;
    }
}
// ============================================
// USE CASE 13: UPDATE SLA STATUSES (BACKGROUND JOB)
// ============================================

export class UpdateSLAStatusesUseCase {
    constructor(
        private readonly repository: IConsultationRequestRepository
    ) { }

    async execute(): Promise<{
        updatedCount: number;
        updatedIds: string[];
        executedAt: Date;
    }> {
        // Find all active consultations (not completed or cancelled)
        const activeConsultations = await this.repository.getAll({
            status: [
                ConsultationStatus.PENDING,
                ConsultationStatus.ASSIGNED,
                ConsultationStatus.IN_PROGRESS,
                ConsultationStatus.AWAITING_INFO,
                ConsultationStatus.RESPONDED,
            ],
        });

        // Update SLA statuses
        const ids = activeConsultations.map((c) => c.id);
        const updated = await this.repository.updateSLAStatuses(ids);

        return {
            updatedCount: updated,
            updatedIds: ids.map((id) => id.getValue()),
            executedAt: new Date(),
        };
    }
}