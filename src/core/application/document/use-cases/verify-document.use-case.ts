// ============================================
// VERIFY DOCUMENT USE CASE
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Document } from '../../../domain/document/entities/document.entity';
import type { IDocumentRepository } from '../../../domain/document/ports/document.repository';
import { DOCUMENT_REPOSITORY } from '../../../domain/document/ports/document.repository';
import { DocumentVerificationStatus } from '../../../domain/document/value-objects/document.vo';

export interface VerifyDocumentDTO {
  documentId: string;
  verifiedBy: string;
  notes?: string;
}

export interface RejectDocumentDTO {
  documentId: string;
  rejectedBy: string;
  reason: string;
}

export interface BulkVerifyDocumentsDTO {
  documentIds: string[];
  verifiedBy: string;
  notes?: string;
}

@Injectable()
export class VerifyDocumentUseCase {
  private readonly logger = new Logger(VerifyDocumentUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly repository: IDocumentRepository,
  ) {}

  async verify(dto: VerifyDocumentDTO): Promise<Document> {
    const document = await this.repository.findById(dto.documentId);

    if (!document) {
      throw new NotFoundException(
        `Document with ID "${dto.documentId}" not found`,
      );
    }

    if (document.isDeleted) {
      throw new BadRequestException('Cannot verify a deleted document');
    }

    if (document.verificationStatus === DocumentVerificationStatus.VERIFIED) {
      throw new BadRequestException('Document is already verified');
    }

    document.verify(dto.verifiedBy, dto.notes);
    const updatedDocument = await this.repository.update(document);

    this.logger.log(`Document ${dto.documentId} verified by ${dto.verifiedBy}`);

    return updatedDocument;
  }

  async reject(dto: RejectDocumentDTO): Promise<Document> {
    const document = await this.repository.findById(dto.documentId);

    if (!document) {
      throw new NotFoundException(
        `Document with ID "${dto.documentId}" not found`,
      );
    }

    if (document.isDeleted) {
      throw new BadRequestException('Cannot reject a deleted document');
    }

    if (document.verificationStatus === DocumentVerificationStatus.REJECTED) {
      throw new BadRequestException('Document is already rejected');
    }

    document.reject(dto.rejectedBy, dto.reason);
    const updatedDocument = await this.repository.update(document);

    this.logger.log(
      `Document ${dto.documentId} rejected by ${dto.rejectedBy}: ${dto.reason}`,
    );

    return updatedDocument;
  }

  async verifyMultiple(
    dto: BulkVerifyDocumentsDTO,
  ): Promise<{ verified: number; failed: string[] }> {
    const failed: string[] = [];
    let verified = 0;

    for (const documentId of dto.documentIds) {
      try {
        await this.verify({
          documentId,
          verifiedBy: dto.verifiedBy,
          notes: dto.notes,
        });
        verified++;
      } catch (error: any) {
        this.logger.warn(
          `Failed to verify document ${documentId}: ${error.message}`,
        );
        failed.push(documentId);
      }
    }

    this.logger.log(
      `Bulk verification complete: ${verified} verified, ${failed.length} failed`,
    );

    return { verified, failed };
  }

  async getPendingVerification(limit?: number): Promise<Document[]> {
    return this.repository.findPendingVerification(limit);
  }

  async getVerificationStatus(documentId: string): Promise<{
    status: DocumentVerificationStatus;
    verifiedBy?: string;
    verifiedAt?: Date;
    notes?: string;
  }> {
    const document = await this.repository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document with ID "${documentId}" not found`);
    }

    return {
      status: document.verificationStatus,
      verifiedBy: document.verifiedBy,
      verifiedAt: document.verifiedAt,
      notes: document.verificationNotes,
    };
  }
}
