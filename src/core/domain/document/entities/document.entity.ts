// ============================================
// DOCUMENT ENTITY
// src/core/domain/document/entities/document.entity.ts
// ============================================

import { AggregateRoot } from '../../base/AggregateRoot';
import {
  StorageProvider,
  DocumentCategory,
  DocumentVerificationStatus,
  DocumentRequestType,
  DocumentMetadata,
} from '../value-objects/document.vo';

export interface DocumentProps {
  uploadedBy: string;
  fileName: string;
  fileUrl: string;
  fileType: string; // MIME type
  fileSize: number; // bytes

  // Storage info
  storageProvider: StorageProvider;
  publicId?: string; // Cloudinary public_id or S3 key

  // Classification
  category?: DocumentCategory;
  description?: string;

  // Polymorphic relations
  consultationId?: string;
  legalOpinionId?: string;
  serviceRequestId?: string;
  litigationCaseId?: string;
  supportTicketId?: string;

  // Verification
  isVerified: boolean;
  verificationStatus: DocumentVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;

  // Metadata
  metadata?: DocumentMetadata;
  checksum?: string;

  // Timestamps
  uploadedAt: Date;
  deletedAt?: Date;
}

export class Document extends AggregateRoot<DocumentProps> {
  get uploadedBy(): string {
    return this.props.uploadedBy;
  }

  get fileName(): string {
    return this.props.fileName;
  }

  get fileUrl(): string {
    return this.props.fileUrl;
  }

  get fileType(): string {
    return this.props.fileType;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get storageProvider(): StorageProvider {
    return this.props.storageProvider;
  }

  get publicId(): string | undefined {
    return this.props.publicId;
  }

  get category(): DocumentCategory | undefined {
    return this.props.category;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get consultationId(): string | undefined {
    return this.props.consultationId;
  }

  get legalOpinionId(): string | undefined {
    return this.props.legalOpinionId;
  }

  get serviceRequestId(): string | undefined {
    return this.props.serviceRequestId;
  }

  get litigationCaseId(): string | undefined {
    return this.props.litigationCaseId;
  }

  get supportTicketId(): string | undefined {
    return this.props.supportTicketId;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get verificationStatus(): DocumentVerificationStatus {
    return this.props.verificationStatus;
  }

  get verifiedBy(): string | undefined {
    return this.props.verifiedBy;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }

  get verificationNotes(): string | undefined {
    return this.props.verificationNotes;
  }

  get metadata(): DocumentMetadata | undefined {
    return this.props.metadata;
  }

  get checksum(): string | undefined {
    return this.props.checksum;
  }

  get uploadedAt(): Date {
    return this.props.uploadedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  /**
   * Get the request type this document belongs to
   */
  get requestType(): DocumentRequestType | null {
    if (this.props.consultationId) return DocumentRequestType.CONSULTATION;
    if (this.props.legalOpinionId) return DocumentRequestType.LEGAL_OPINION;
    if (this.props.serviceRequestId) return DocumentRequestType.SERVICE_REQUEST;
    if (this.props.litigationCaseId) return DocumentRequestType.LITIGATION_CASE;
    if (this.props.supportTicketId) return DocumentRequestType.SUPPORT_TICKET;
    return null;
  }

  /**
   * Get the request ID this document belongs to
   */
  get requestId(): string | null {
    return (
      this.props.consultationId ||
      this.props.legalOpinionId ||
      this.props.serviceRequestId ||
      this.props.litigationCaseId ||
      this.props.supportTicketId ||
      null
    );
  }

  private constructor(props: DocumentProps, id?: string) {
    super(props, id);
  }

  public static create(props: DocumentProps, id?: string): Document {
    return new Document(
      {
        ...props,
        storageProvider: props.storageProvider ?? StorageProvider.CLOUDINARY,
        isVerified: props.isVerified ?? false,
        verificationStatus:
          props.verificationStatus ?? DocumentVerificationStatus.PENDING,
        uploadedAt: props.uploadedAt ?? new Date(),
      },
      id,
    );
  }

  /**
   * Verify the document
   */
  public verify(verifiedBy: string, notes?: string): void {
    this.props.isVerified = true;
    this.props.verificationStatus = DocumentVerificationStatus.VERIFIED;
    this.props.verifiedBy = verifiedBy;
    this.props.verifiedAt = new Date();
    this.props.verificationNotes = notes;
  }

  /**
   * Reject the document
   */
  public reject(rejectedBy: string, reason: string): void {
    this.props.isVerified = false;
    this.props.verificationStatus = DocumentVerificationStatus.REJECTED;
    this.props.verifiedBy = rejectedBy;
    this.props.verifiedAt = new Date();
    this.props.verificationNotes = reason;
  }

  /**
   * Mark document as expired
   */
  public markExpired(): void {
    this.props.verificationStatus = DocumentVerificationStatus.EXPIRED;
  }

  /**
   * Update description
   */
  public updateDescription(description: string): void {
    this.props.description = description;
  }

  /**
   * Update category
   */
  public updateCategory(category: DocumentCategory): void {
    this.props.category = category;
  }

  /**
   * Soft delete the document
   */
  public softDelete(): void {
    this.props.deletedAt = new Date();
  }

  /**
   * Restore deleted document
   */
  public restore(): void {
    this.props.deletedAt = undefined;
  }
}
