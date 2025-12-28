// ============================================
// UPLOAD DOCUMENT USE CASE
// ============================================

import {
  ConsultationId,
  UserId,
} from '../../../../domain/consultation/value-objects/consultation-request-domain';

import {
  Document,
  FileName,
  FileUrl,
  FileSize,
} from '../../../../domain/consultation/entities/consultation-request-entities';

import {
  IConsultationRequestRepository,
  IDocumentRepository,
} from '../../ports/repository';

import {
  UploadDocumentDTO,
  DocumentResponseDTO,
} from '../../consultation request.dtos';

export class UploadDocumentUseCase {
  constructor(
    private readonly consultationRepo: IConsultationRequestRepository,
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async execute(dto: UploadDocumentDTO): Promise<DocumentResponseDTO> {
    // Validate consultation exists
    const consultationId = ConsultationId.create(dto.consultationId);
    const exists = await this.consultationRepo.exists(consultationId);
    if (!exists) {
      throw new Error(
        `Consultation request with ID ${dto.consultationId} not found`,
      );
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
    };
  }
}
