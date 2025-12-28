// ============================================
// LIST DOCUMENTS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { Document } from '../../../domain/document/entities/document.entity';
import type {
  IDocumentRepository,
  ListDocumentsOptions,
} from '../../../domain/document/ports/document.repository';
import { DOCUMENT_REPOSITORY } from '../../../domain/document/ports/document.repository';
import {
  DocumentCategory,
  DocumentVerificationStatus,
} from '../../../domain/document/value-objects/document.vo';

export interface ListDocumentsDTO {
  uploadedBy?: string;
  category?: DocumentCategory;
  verificationStatus?: DocumentVerificationStatus;
  isVerified?: boolean;
  consultationId?: string;
  legalOpinionId?: string;
  serviceRequestId?: string;
  litigationCaseId?: string;
  supportTicketId?: string;
  searchTerm?: string;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListDocumentsResult {
  documents: Document[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class ListDocumentsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly repository: IDocumentRepository,
  ) {}

  async execute(dto?: ListDocumentsDTO): Promise<ListDocumentsResult> {
    const options: ListDocumentsOptions = {
      uploadedBy: dto?.uploadedBy,
      category: dto?.category,
      verificationStatus: dto?.verificationStatus,
      isVerified: dto?.isVerified,
      consultationId: dto?.consultationId,
      legalOpinionId: dto?.legalOpinionId,
      serviceRequestId: dto?.serviceRequestId,
      litigationCaseId: dto?.litigationCaseId,
      supportTicketId: dto?.supportTicketId,
      searchTerm: dto?.searchTerm,
      includeDeleted: dto?.includeDeleted ?? false,
      limit: dto?.limit ?? 50,
      offset: dto?.offset ?? 0,
    };

    const [documents, total] = await Promise.all([
      this.repository.list(options),
      this.repository.count({
        uploadedBy: options.uploadedBy,
        category: options.category,
        verificationStatus: options.verificationStatus,
        isVerified: options.isVerified,
        consultationId: options.consultationId,
        legalOpinionId: options.legalOpinionId,
        serviceRequestId: options.serviceRequestId,
        litigationCaseId: options.litigationCaseId,
        supportTicketId: options.supportTicketId,
        searchTerm: options.searchTerm,
        includeDeleted: options.includeDeleted,
      }),
    ]);

    return {
      documents,
      total,
      limit: options.limit!,
      offset: options.offset!,
    };
  }

  async listPendingVerification(limit?: number): Promise<Document[]> {
    return this.repository.findPendingVerification(limit);
  }

  async listVerified(options?: {
    verifiedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<Document[]> {
    return this.repository.findVerifiedDocuments(options);
  }
}
