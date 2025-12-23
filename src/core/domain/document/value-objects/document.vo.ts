// ============================================
// DOCUMENT VALUE OBJECTS
// src/core/domain/document/value-objects/document.vo.ts
// ============================================

/**
 * Storage providers for document upload
 */
export enum StorageProvider {
    CLOUDINARY = 'cloudinary',
    AWS_S3 = 'aws_s3',
    LOCAL = 'local',
}

/**
 * Document categories for classification
 */
export enum DocumentCategory {
    // Legal documents
    LEGAL_OPINION = 'legal_opinion',
    CONTRACT = 'contract',
    AGREEMENT = 'agreement',
    COURT_FILING = 'court_filing',
    EVIDENCE = 'evidence',

    // Identification
    ID_DOCUMENT = 'id_document',
    LICENSE = 'license',
    CERTIFICATE = 'certificate',

    // Business
    INVOICE = 'invoice',
    RECEIPT = 'receipt',
    REPORT = 'report',

    // General
    ATTACHMENT = 'attachment',
    OTHER = 'other',
}

/**
 * Document verification status
 */
export enum DocumentVerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
}

/**
 * Allowed file types and their MIME types
 */
export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
    // Documents
    pdf: ['application/pdf'],
    doc: ['application/msword'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],

    // Images
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
    png: ['image/png'],
    gif: ['image/gif'],
    webp: ['image/webp'],

    // Spreadsheets
    xls: ['application/vnd.ms-excel'],
    xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],

    // Text
    txt: ['text/plain'],
    rtf: ['application/rtf'],
};

/**
 * Maximum file sizes by category (in bytes)
 */
export const MAX_FILE_SIZES: Record<DocumentCategory, number> = {
    [DocumentCategory.LEGAL_OPINION]: 50 * 1024 * 1024, // 50MB
    [DocumentCategory.CONTRACT]: 25 * 1024 * 1024, // 25MB
    [DocumentCategory.AGREEMENT]: 25 * 1024 * 1024, // 25MB
    [DocumentCategory.COURT_FILING]: 100 * 1024 * 1024, // 100MB
    [DocumentCategory.EVIDENCE]: 100 * 1024 * 1024, // 100MB
    [DocumentCategory.ID_DOCUMENT]: 10 * 1024 * 1024, // 10MB
    [DocumentCategory.LICENSE]: 10 * 1024 * 1024, // 10MB
    [DocumentCategory.CERTIFICATE]: 10 * 1024 * 1024, // 10MB
    [DocumentCategory.INVOICE]: 10 * 1024 * 1024, // 10MB
    [DocumentCategory.RECEIPT]: 10 * 1024 * 1024, // 10MB
    [DocumentCategory.REPORT]: 50 * 1024 * 1024, // 50MB
    [DocumentCategory.ATTACHMENT]: 25 * 1024 * 1024, // 25MB
    [DocumentCategory.OTHER]: 25 * 1024 * 1024, // 25MB
};

/**
 * Default max file size (25MB)
 */
export const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Request types that can have documents
 */
export enum DocumentRequestType {
    CONSULTATION = 'consultation',
    LEGAL_OPINION = 'legal_opinion',
    SERVICE_REQUEST = 'service_request',
    LITIGATION_CASE = 'litigation_case',
    SUPPORT_TICKET = 'support_ticket',
}

/**
 * Upload result from storage provider
 */
export interface UploadResult {
    success: boolean;
    fileUrl: string;
    publicId?: string; // Cloudinary public_id or S3 key
    provider: StorageProvider;
    metadata?: Record<string, any>;
    error?: string;
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
    originalName: string;
    mimeType: string;
    size: number;
    extension: string;
    uploadedAt: Date;
    provider: StorageProvider;
    publicId?: string;
    checksum?: string;
}

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string): boolean {
    for (const types of Object.values(ALLOWED_FILE_TYPES)) {
        if (types.includes(mimeType)) {
            return true;
        }
    }
    return false;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string | null {
    for (const [ext, types] of Object.entries(ALLOWED_FILE_TYPES)) {
        if (types.includes(mimeType)) {
            return ext;
        }
    }
    return null;
}

/**
 * Validate file size for category
 */
export function isValidFileSize(size: number, category?: DocumentCategory): boolean {
    const maxSize = category ? MAX_FILE_SIZES[category] : DEFAULT_MAX_FILE_SIZE;
    return size <= maxSize;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
