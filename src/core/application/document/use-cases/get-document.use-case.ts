// ============================================
// GET DOCUMENT USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Document } from '../../../domain/document/entities/document.entity';
import type {
  IDocumentRepository,
  DocumentStatistics,
} from '../../../domain/document/ports/document.repository';
import { DOCUMENT_REPOSITORY } from '../../../domain/document/ports/document.repository';
import { DocumentRequestType } from '../../../domain/document/value-objects/document.vo';
import { DocumentStorageService } from '../services/storage/document-storage.service';

@Injectable()
export class GetDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly repository: IDocumentRepository,
    private readonly storageService: DocumentStorageService,
  ) {}

  async execute(_id: string): Promise<Document> {
    const document = await this.repository.findById(id);

    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }

    return document;
  }

  async getByRequest(
    requestType: DocumentRequestType,
    requestId: string,
  ): Promise<Document[]> {
    return this.repository.findByRequest({
      requestType,
      requestId,
      includeDeleted: false,
    });
  }

  async getByConsultation(consultationId: string): Promise<Document[]> {
    return this.repository.findByConsultation(consultationId);
  }

  async getByLegalOpinion(legalOpinionId: string): Promise<Document[]> {
    return this.repository.findByLegalOpinion(legalOpinionId);
  }

  async getByServiceRequest(serviceRequestId: string): Promise<Document[]> {
    return this.repository.findByServiceRequest(serviceRequestId);
  }

  async getByLitigationCase(litigationCaseId: string): Promise<Document[]> {
    return this.repository.findByLitigationCase(litigationCaseId);
  }

  async getBySupportTicket(supportTicketId: string): Promise<Document[]> {
    return this.repository.findBySupportTicket(supportTicketId);
  }

  async getByUploader(
    uploadedBy: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Document[]> {
    return this.repository.findByUploader(uploadedBy, {
      limit: options?.limit,
      offset: options?.offset,
      includeDeleted: false,
    });
  }

  async getSignedUrl(_id: string, expiresIn?: number): Promise<string | null> {
    const document = await this.repository.findById(id);

    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }

    if (!document.publicId) {
      return document.fileUrl; // Return direct URL if no publicId
    }

    return this.storageService.getSignedUrl(document.storageProvider, {
      publicId: document.publicId,
      expiresIn,
    });
  }

  async getStatistics(options?: {
    uploadedBy?: string;
    requestType?: DocumentRequestType;
    requestId?: string;
  }): Promise<DocumentStatistics> {
    return this.repository.getStatistics(options);
  }

  async exists(_id: string): Promise<boolean> {
    return this.repository.exists(id);
  }
}
