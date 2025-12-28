// ============================================
// UPLOAD DOCUMENT USE CASE
// ============================================

import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as path from 'path';
import { Document } from '../../../domain/document/entities/document.entity';
import type { IDocumentRepository } from '../../../domain/document/ports/document.repository';
import { DOCUMENT_REPOSITORY } from '../../../domain/document/ports/document.repository';
import {
  StorageProvider,
  DocumentCategory,
  DocumentRequestType,
  DocumentVerificationStatus,
  isValidFileType,
  isValidFileSize,
  getExtensionFromMimeType,
} from '../../../domain/document/value-objects/document.vo';
import { DocumentStorageService } from '../services/storage/document-storage.service';
import type { FileUploadInput } from '../services/storage/storage-provider.interface';

export interface UploadDocumentDTO {
  uploadedBy: string;
  file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  };
  // Optional request association
  requestType?: DocumentRequestType;
  requestId?: string;
  // Metadata
  category?: DocumentCategory;
  description?: string;
  tags?: string[];
  // Storage options
  preferredProvider?: StorageProvider;
}

export interface UploadDocumentResult {
  success: boolean;
  document?: Document;
  error?: string;
}

@Injectable()
export class UploadDocumentUseCase {
  private readonly logger = new Logger(UploadDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly repository: IDocumentRepository,
    private readonly storageService: DocumentStorageService,
  ) {}

  // Allowed file extensions for security
  private readonly allowedExtensions = [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.txt',
    '.csv',
    '.rtf',
    '.odt',
    '.ods',
  ];

  async execute(dto: UploadDocumentDTO): Promise<UploadDocumentResult> {
    // Validate file extension (prevents double extension attacks like .php.jpg)
    const fileExtension = path.extname(dto.file.originalName).toLowerCase();
    if (!this.allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File extension ${fileExtension} is not allowed. Allowed extensions: ${this.allowedExtensions.join(', ')}`,
      );
    }

    // Validate file type (MIME type)
    if (!isValidFileType(dto.file.mimeType)) {
      throw new BadRequestException(
        `File type ${dto.file.mimeType} is not allowed`,
      );
    }

    // Validate file size
    if (!isValidFileSize(dto.file.size, dto.category)) {
      throw new BadRequestException(
        `File size exceeds maximum allowed for category ${dto.category || 'default'}`,
      );
    }

    // Check if storage is available
    if (!this.storageService.hasAvailableProvider()) {
      throw new BadRequestException(
        'No storage provider is configured. Please contact administrator.',
      );
    }

    try {
      // Prepare upload input
      const uploadInput: FileUploadInput = {
        buffer: dto.file.buffer,
        fileName: dto.file.originalName,
        mimeType: dto.file.mimeType,
        folder: this.getFolderPath(dto.requestType, dto.category),
        tags: dto.tags,
        metadata: {
          uploadedBy: dto.uploadedBy,
          category: dto.category || DocumentCategory.ATTACHMENT,
          requestType: dto.requestType || 'standalone',
        },
      };

      // Upload to storage
      const uploadResult = dto.preferredProvider
        ? await this.storageService.uploadTo(dto.preferredProvider, uploadInput)
        : await this.storageService.upload(uploadInput);

      if (!uploadResult.success) {
        this.logger.error(`Upload failed: ${uploadResult.error}`);
        return {
          success: false,
          error: uploadResult.error || 'Upload failed',
        };
      }

      // Create document entity
      const document = Document.create({
        uploadedBy: dto.uploadedBy,
        fileName: dto.file.originalName,
        fileUrl: uploadResult.fileUrl,
        fileType: dto.file.mimeType,
        fileSize: dto.file.size,
        storageProvider: uploadResult.provider,
        publicId: uploadResult.publicId,
        category: dto.category,
        description: dto.description,
        ...this.getRequestAssociation(dto.requestType, dto.requestId),
        isVerified: false,
        verificationStatus: DocumentVerificationStatus.PENDING,
        metadata: {
          originalName: dto.file.originalName,
          mimeType: dto.file.mimeType,
          size: dto.file.size,
          extension: getExtensionFromMimeType(dto.file.mimeType) || '',
          uploadedAt: new Date(),
          provider: uploadResult.provider,
          publicId: uploadResult.publicId,
        },
        uploadedAt: new Date(),
      });

      // Save to database
      const savedDocument = await this.repository.create(document);

      this.logger.log(
        `Document uploaded successfully: ${savedDocument.id} (${dto.file.originalName})`,
      );

      return {
        success: true,
        document: savedDocument,
      };
    } catch (error: unknown) {
      this.logger.error('Document upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  private getFolderPath(
    requestType?: DocumentRequestType,
    category?: DocumentCategory,
  ): string {
    const parts: string[] = ['documents'];

    if (requestType) {
      parts.push(requestType);
    }

    if (category) {
      parts.push(category);
    }

    return parts.join('/');
  }

  private getRequestAssociation(
    requestType?: DocumentRequestType,
    requestId?: string,
  ): Partial<{
    consultationId: string;
    legalOpinionId: string;
    serviceRequestId: string;
    litigationCaseId: string;
    supportTicketId: string;
  }> {
    if (!requestType || !requestId) {
      return {};
    }

    switch (requestType) {
      case DocumentRequestType.CONSULTATION:
        return { consultationId: requestId };
      case DocumentRequestType.LEGAL_OPINION:
        return { legalOpinionId: requestId };
      case DocumentRequestType.SERVICE_REQUEST:
        return { serviceRequestId: requestId };
      case DocumentRequestType.LITIGATION_CASE:
        return { litigationCaseId: requestId };
      case DocumentRequestType.SUPPORT_TICKET:
        return { supportTicketId: requestId };
      default:
        return {};
    }
  }
}
