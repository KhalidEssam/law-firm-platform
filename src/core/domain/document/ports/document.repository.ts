// ============================================
// DOCUMENT REPOSITORY INTERFACE (PORT)
// src/core/domain/document/ports/document.repository.ts
// ============================================

import { Document } from '../entities/document.entity';
import {
    DocumentCategory,
    DocumentVerificationStatus,
    DocumentRequestType,
} from '../value-objects/document.vo';

// ============================================
// DI TOKENS
// ============================================

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

// ============================================
// FILTER & PAGINATION INTERFACES
// ============================================

export interface ListDocumentsOptions {
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

export interface DocumentsByRequestOptions {
    requestType: DocumentRequestType;
    requestId: string;
    includeDeleted?: boolean;
}

export interface DocumentStatistics {
    total: number;
    byCategory: Record<string, number>;
    byVerificationStatus: Record<string, number>;
    totalSize: number;
    averageSize: number;
}

// ============================================
// DOCUMENT REPOSITORY INTERFACE
// ============================================

export interface IDocumentRepository {
    // Basic CRUD
    create(document: Document): Promise<Document>;
    findById(id: string): Promise<Document | null>;
    update(document: Document): Promise<Document>;
    delete(id: string): Promise<void>;
    softDelete(id: string): Promise<void>;

    // Queries
    list(options?: ListDocumentsOptions): Promise<Document[]>;
    count(options?: Omit<ListDocumentsOptions, 'limit' | 'offset'>): Promise<number>;

    // Request-specific queries
    findByRequest(options: DocumentsByRequestOptions): Promise<Document[]>;
    findByConsultation(consultationId: string): Promise<Document[]>;
    findByLegalOpinion(legalOpinionId: string): Promise<Document[]>;
    findByServiceRequest(serviceRequestId: string): Promise<Document[]>;
    findByLitigationCase(litigationCaseId: string): Promise<Document[]>;
    findBySupportTicket(supportTicketId: string): Promise<Document[]>;

    // User-specific queries
    findByUploader(uploadedBy: string, options?: {
        limit?: number;
        offset?: number;
        includeDeleted?: boolean;
    }): Promise<Document[]>;

    // Verification queries
    findPendingVerification(limit?: number): Promise<Document[]>;
    findVerifiedDocuments(options?: {
        verifiedBy?: string;
        limit?: number;
        offset?: number;
    }): Promise<Document[]>;

    // Batch operations
    verifyMultiple(ids: string[], verifiedBy: string, notes?: string): Promise<number>;
    deleteByRequest(requestType: DocumentRequestType, requestId: string): Promise<number>;

    // Statistics
    getStatistics(options?: {
        uploadedBy?: string;
        requestType?: DocumentRequestType;
        requestId?: string;
    }): Promise<DocumentStatistics>;

    // Validation
    exists(id: string): Promise<boolean>;
    existsByFileUrl(fileUrl: string): Promise<boolean>;
}
