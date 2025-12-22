// ============================================
// SEND MESSAGE USE CASE
// ============================================

import {
    ConsultationId,
    UserId,
} from '../../../../domain/consultation/value-objects/consultation-request-domain';

import {
    RequestMessage,
    MessageContent,
    MessageType,
} from '../../../../domain/consultation/entities/consultation-request-entities';

import {
    IConsultationRequestRepository,
    IRequestMessageRepository,
} from '../../ports/repository';

import {
    SendMessageDTO,
    MessageResponseDTO,
} from '../../consultation request.dtos';

export class SendMessageUseCase {
    constructor(
        private readonly consultationRepo: IConsultationRequestRepository,
        private readonly messageRepo: IRequestMessageRepository
    ) {}

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
