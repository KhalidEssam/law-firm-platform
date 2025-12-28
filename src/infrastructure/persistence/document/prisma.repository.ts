// ============================================
// PRISMA DOCUMENT REPOSITORY IMPLEMENTATION
// src/infrastructure/persistence/document/prisma.repository.ts
// ============================================

import { PrismaClient } from '@prisma/client/extension';
import { Document } from '../../../core/domain/document/entities/document.entity';
import type {
  IDocumentRepository,
  ListDocumentsOptions,
  DocumentsByRequestOptions,
  DocumentStatistics,
} from '../../../core/domain/document/ports/document.repository';
import {
  StorageProvider,
  DocumentCategory,
  DocumentVerificationStatus,
  DocumentRequestType,
  DocumentMetadata,
} from '../../../core/domain/document/value-objects/document.vo';

// ============================================
// MAPPER
// ============================================

class DocumentMapper {
  static toDomain(raw: any): Document {
    return Document.create(
      {
        uploadedBy: raw.uploadedBy,
        fileName: raw.fileName,
        fileUrl: raw.fileUrl,
        fileType: raw.fileType,
        fileSize: raw.fileSize,
        storageProvider:
          (raw.storageProvider as StorageProvider) ||
          StorageProvider.CLOUDINARY,
        publicId: raw.publicId,
        category: raw.category as DocumentCategory,
        description: raw.description,
        consultationId: raw.consultationId,
        legalOpinionId: raw.legalOpinionId,
        serviceRequestId: raw.serviceRequestId,
        litigationCaseId: raw.litigationCaseId,
        supportTicketId: raw.supportTicketId,
        isVerified: raw.isVerified,
        verificationStatus:
          (raw.verificationStatus as DocumentVerificationStatus) ||
          DocumentVerificationStatus.PENDING,
        verifiedBy: raw.verifiedBy,
        verifiedAt: raw.verifiedAt,
        verificationNotes: raw.verificationNotes,
        metadata: raw.metadata as DocumentMetadata,
        checksum: raw.checksum,
        uploadedAt: raw.uploadedAt,
        deletedAt: raw.deletedAt,
      },
      raw.id,
    );
  }

  static toPersistence(domain: Document): any {
    return {
      id: domain.id,
      uploadedBy: domain.uploadedBy,
      fileName: domain.fileName,
      fileUrl: domain.fileUrl,
      fileType: domain.fileType,
      fileSize: domain.fileSize,
      storageProvider: domain.storageProvider,
      publicId: domain.publicId,
      category: domain.category,
      description: domain.description,
      consultationId: domain.consultationId,
      legalOpinionId: domain.legalOpinionId,
      serviceRequestId: domain.serviceRequestId,
      litigationCaseId: domain.litigationCaseId,
      supportTicketId: domain.supportTicketId,
      isVerified: domain.isVerified,
      verificationStatus: domain.verificationStatus,
      verifiedBy: domain.verifiedBy,
      verifiedAt: domain.verifiedAt,
      verificationNotes: domain.verificationNotes,
      metadata: domain.metadata,
      checksum: domain.checksum,
      uploadedAt: domain.uploadedAt,
      deletedAt: domain.deletedAt,
    };
  }
}

// ============================================
// PRISMA DOCUMENT REPOSITORY
// ============================================

export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(document: Document): Promise<Document> {
    const data = DocumentMapper.toPersistence(document);
    // Remove fields not in schema
    delete data.storageProvider;
    delete data.publicId;
    delete data.category;
    delete data.verificationStatus;
    delete data.verifiedBy;
    delete data.verifiedAt;
    delete data.verificationNotes;
    delete data.metadata;
    delete data.checksum;

    const created = await this.prisma.document.create({ data });
    return DocumentMapper.toDomain(created);
  }

  async findById(id: string): Promise<Document | null> {
    const record = await this.prisma.document.findUnique({
      where: { id },
    });
    return record ? DocumentMapper.toDomain(record) : null;
  }

  async update(document: Document): Promise<Document> {
    const data = DocumentMapper.toPersistence(document);
    // Remove fields not in schema
    delete data.storageProvider;
    delete data.publicId;
    delete data.category;
    delete data.verificationStatus;
    delete data.verifiedBy;
    delete data.verifiedAt;
    delete data.verificationNotes;
    delete data.metadata;
    delete data.checksum;

    const updated = await this.prisma.document.update({
      where: { id: document.id },
      data,
    });
    return DocumentMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async list(options?: ListDocumentsOptions): Promise<Document[]> {
    const records = await this.prisma.document.findMany({
      where: {
        ...(options?.uploadedBy && { uploadedBy: options.uploadedBy }),
        ...(options?.isVerified !== undefined && {
          isVerified: options.isVerified,
        }),
        ...(options?.consultationId && {
          consultationId: options.consultationId,
        }),
        ...(options?.legalOpinionId && {
          legalOpinionId: options.legalOpinionId,
        }),
        ...(options?.serviceRequestId && {
          serviceRequestId: options.serviceRequestId,
        }),
        ...(options?.litigationCaseId && {
          litigationCaseId: options.litigationCaseId,
        }),
        ...(options?.supportTicketId && {
          supportTicketId: options.supportTicketId,
        }),
        ...(options?.searchTerm && {
          OR: [
            { fileName: { contains: options.searchTerm, mode: 'insensitive' } },
            {
              description: {
                contains: options.searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        }),
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { uploadedAt: 'desc' },
    });
    return records.map(DocumentMapper.toDomain);
  }

  async count(
    options?: Omit<ListDocumentsOptions, 'limit' | 'offset'>,
  ): Promise<number> {
    return await this.prisma.document.count({
      where: {
        ...(options?.uploadedBy && { uploadedBy: options.uploadedBy }),
        ...(options?.isVerified !== undefined && {
          isVerified: options.isVerified,
        }),
        ...(options?.consultationId && {
          consultationId: options.consultationId,
        }),
        ...(options?.legalOpinionId && {
          legalOpinionId: options.legalOpinionId,
        }),
        ...(options?.serviceRequestId && {
          serviceRequestId: options.serviceRequestId,
        }),
        ...(options?.litigationCaseId && {
          litigationCaseId: options.litigationCaseId,
        }),
        ...(options?.supportTicketId && {
          supportTicketId: options.supportTicketId,
        }),
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async findByRequest(options: DocumentsByRequestOptions): Promise<Document[]> {
    const whereClause = this.getRequestWhereClause(
      options.requestType,
      options.requestId,
    );

    const records = await this.prisma.document.findMany({
      where: {
        ...whereClause,
        ...(options.includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { uploadedAt: 'desc' },
    });
    return records.map(DocumentMapper.toDomain);
  }

  async findByConsultation(consultationId: string): Promise<Document[]> {
    return this.findByRequest({
      requestType: DocumentRequestType.CONSULTATION,
      requestId: consultationId,
    });
  }

  async findByLegalOpinion(legalOpinionId: string): Promise<Document[]> {
    return this.findByRequest({
      requestType: DocumentRequestType.LEGAL_OPINION,
      requestId: legalOpinionId,
    });
  }

  async findByServiceRequest(serviceRequestId: string): Promise<Document[]> {
    return this.findByRequest({
      requestType: DocumentRequestType.SERVICE_REQUEST,
      requestId: serviceRequestId,
    });
  }

  async findByLitigationCase(litigationCaseId: string): Promise<Document[]> {
    return this.findByRequest({
      requestType: DocumentRequestType.LITIGATION_CASE,
      requestId: litigationCaseId,
    });
  }

  async findBySupportTicket(supportTicketId: string): Promise<Document[]> {
    return this.findByRequest({
      requestType: DocumentRequestType.SUPPORT_TICKET,
      requestId: supportTicketId,
    });
  }

  async findByUploader(
    uploadedBy: string,
    options?: { limit?: number; offset?: number; includeDeleted?: boolean },
  ): Promise<Document[]> {
    const records = await this.prisma.document.findMany({
      where: {
        uploadedBy,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { uploadedAt: 'desc' },
    });
    return records.map(DocumentMapper.toDomain);
  }

  async findPendingVerification(limit?: number): Promise<Document[]> {
    const records = await this.prisma.document.findMany({
      where: {
        isVerified: false,
        deletedAt: null,
      },
      take: limit,
      orderBy: { uploadedAt: 'asc' },
    });
    return records.map(DocumentMapper.toDomain);
  }

  async findVerifiedDocuments(options?: {
    verifiedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<Document[]> {
    const records = await this.prisma.document.findMany({
      where: {
        isVerified: true,
        deletedAt: null,
      },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { uploadedAt: 'desc' },
    });
    return records.map(DocumentMapper.toDomain);
  }

  async verifyMultiple(
    ids: string[],
    _verifiedBy: string,
    _notes?: string,
  ): Promise<number> {
    const result = await this.prisma.document.updateMany({
      where: {
        id: { in: ids },
        isVerified: false,
        deletedAt: null,
      },
      data: {
        isVerified: true,
      },
    });
    return result.count;
  }

  async deleteByRequest(
    requestType: DocumentRequestType,
    requestId: string,
  ): Promise<number> {
    const whereClause = this.getRequestWhereClause(requestType, requestId);

    const result = await this.prisma.document.updateMany({
      where: whereClause,
      data: { deletedAt: new Date() },
    });
    return result.count;
  }

  async getStatistics(options?: {
    uploadedBy?: string;
    requestType?: DocumentRequestType;
    requestId?: string;
  }): Promise<DocumentStatistics> {
    const whereClause: any = { deletedAt: null };

    if (options?.uploadedBy) {
      whereClause.uploadedBy = options.uploadedBy;
    }

    if (options?.requestType && options?.requestId) {
      Object.assign(
        whereClause,
        this.getRequestWhereClause(options.requestType, options.requestId),
      );
    }

    const [total, totalSize, verifiedCount] = await Promise.all([
      this.prisma.document.count({ where: whereClause }),
      this.prisma.document.aggregate({
        where: whereClause,
        _sum: { fileSize: true },
      }),
      this.prisma.document.count({
        where: { ...whereClause, isVerified: true },
      }),
    ]);

    return {
      total,
      byCategory: {},
      byVerificationStatus: {
        verified: verifiedCount,
        pending: total - verifiedCount,
      },
      totalSize: totalSize._sum.fileSize || 0,
      averageSize: total > 0 ? (totalSize._sum.fileSize || 0) / total : 0,
    };
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.document.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async existsByFileUrl(fileUrl: string): Promise<boolean> {
    const count = await this.prisma.document.count({
      where: { fileUrl, deletedAt: null },
    });
    return count > 0;
  }

  private getRequestWhereClause(
    requestType: DocumentRequestType,
    requestId: string,
  ): Record<string, string> {
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
