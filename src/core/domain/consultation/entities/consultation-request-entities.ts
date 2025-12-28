// ============================================
// CONSULTATION REQUEST - RELATED ENTITIES
// ============================================

import {
  ConsultationId,
  UserId,
  ConsultationStatusVO,
} from '../value-objects/consultation-request-domain';

// ============================================
// DOCUMENT ENTITY
// ============================================

export class DocumentId {
  private constructor(private readonly value: string) {}

  static create(value: string): DocumentId {
    if (!value || value.trim().length === 0) {
      throw new Error('Document ID cannot be empty');
    }
    return new DocumentId(value);
  }

  static generate(): DocumentId {
    return new DocumentId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: DocumentId): boolean {
    return this.value === other.value;
  }
}

export class FileName {
  private constructor(private readonly value: string) {}

  static create(value: string): FileName {
    if (!value || value.trim().length === 0) {
      throw new Error('File name cannot be empty');
    }
    if (value.length > 255) {
      throw new Error('File name cannot exceed 255 characters');
    }
    // Check for invalid characters
    if (/[<>:"/\\|?*]/.test(value)) {
      throw new Error('File name contains invalid characters');
    }
    return new FileName(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  getExtension(): string {
    const parts = this.value.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  equals(other: FileName): boolean {
    return this.value === other.value;
  }
}

export class FileUrl {
  private constructor(private readonly value: string) {}

  static create(value: string): FileUrl {
    if (!value || value.trim().length === 0) {
      throw new Error('File URL cannot be empty');
    }
    // Basic URL validation
    try {
      new URL(value);
    } catch {
      throw new Error('Invalid file URL format');
    }
    return new FileUrl(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: FileUrl): boolean {
    return this.value === other.value;
  }
}

export class FileSize {
  private constructor(private readonly bytes: number) {}

  static create(bytes: number): FileSize {
    if (bytes < 0) {
      throw new Error('File size cannot be negative');
    }
    if (bytes > 100 * 1024 * 1024) {
      // 100MB limit
      throw new Error('File size exceeds maximum limit (100MB)');
    }
    return new FileSize(bytes);
  }

  getBytes(): number {
    return this.bytes;
  }

  getKilobytes(): number {
    return this.bytes / 1024;
  }

  getMegabytes(): number {
    return this.bytes / (1024 * 1024);
  }

  toString(): string {
    if (this.bytes < 1024) {
      return `${this.bytes} bytes`;
    } else if (this.bytes < 1024 * 1024) {
      return `${this.getKilobytes().toFixed(2)} KB`;
    } else {
      return `${this.getMegabytes().toFixed(2)} MB`;
    }
  }
}

export interface DocumentProps {
  id: DocumentId;
  consultationId: ConsultationId;
  uploadedBy: UserId;
  fileName: FileName;
  fileUrl: FileUrl;
  fileType: string;
  fileSize: FileSize;
  description?: string;
  isVerified: boolean;
  uploadedAt: Date;
  deletedAt?: Date;
}

export class Document {
  private props: DocumentProps;

  private constructor(props: DocumentProps) {
    this.props = props;
  }

  static create(params: {
    consultationId: ConsultationId;
    uploadedBy: UserId;
    fileName: FileName;
    fileUrl: FileUrl;
    fileType: string;
    fileSize: FileSize;
    description?: string;
  }): Document {
    const props: DocumentProps = {
      id: DocumentId.generate(),
      consultationId: params.consultationId,
      uploadedBy: params.uploadedBy,
      fileName: params.fileName,
      fileUrl: params.fileUrl,
      fileType: params.fileType,
      fileSize: params.fileSize,
      description: params.description,
      isVerified: false,
      uploadedAt: new Date(),
    };

    return new Document(props);
  }

  static reconstitute(props: DocumentProps): Document {
    return new Document(props);
  }

  get id(): DocumentId {
    return this.props.id;
  }

  get consultationId(): ConsultationId {
    return this.props.consultationId;
  }

  get uploadedBy(): UserId {
    return this.props.uploadedBy;
  }

  get fileName(): FileName {
    return this.props.fileName;
  }

  get fileUrl(): FileUrl {
    return this.props.fileUrl;
  }

  get fileType(): string {
    return this.props.fileType;
  }

  get fileSize(): FileSize {
    return this.props.fileSize;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get uploadedAt(): Date {
    return this.props.uploadedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  verify(): void {
    this.props.isVerified = true;
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }
}

// ============================================
// MESSAGE ENTITY
// ============================================

export class MessageId {
  private constructor(private readonly value: string) {}

  static create(value: string): MessageId {
    if (!value || value.trim().length === 0) {
      throw new Error('Message ID cannot be empty');
    }
    return new MessageId(value);
  }

  static generate(): MessageId {
    return new MessageId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: MessageId): boolean {
    return this.value === other.value;
  }
}

export enum MessageType {
  TEXT = 'text',
  INFO_REQUEST = 'info_request',
  DOCUMENT_REQUEST = 'document_request',
  SYSTEM = 'system',
}

export class MessageContent {
  private constructor(private readonly value: string) {}

  static create(value: string): MessageContent {
    if (!value || value.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }
    if (value.length > 10000) {
      throw new Error('Message content cannot exceed 10000 characters');
    }
    return new MessageContent(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: MessageContent): boolean {
    return this.value === other.value;
  }
}

export interface RequestMessageProps {
  id: MessageId;
  consultationId: ConsultationId;
  senderId: UserId;
  message: MessageContent;
  messageType: MessageType;
  isRead: boolean;
  sentAt: Date;
  deletedAt?: Date;
}

export class RequestMessage {
  private props: RequestMessageProps;

  private constructor(props: RequestMessageProps) {
    this.props = props;
  }

  static create(params: {
    consultationId: ConsultationId;
    senderId: UserId;
    message: MessageContent;
    messageType?: MessageType;
  }): RequestMessage {
    const props: RequestMessageProps = {
      id: MessageId.generate(),
      consultationId: params.consultationId,
      senderId: params.senderId,
      message: params.message,
      messageType: params.messageType || MessageType.TEXT,
      isRead: false,
      sentAt: new Date(),
    };

    return new RequestMessage(props);
  }

  static reconstitute(props: RequestMessageProps): RequestMessage {
    return new RequestMessage(props);
  }

  get id(): MessageId {
    return this.props.id;
  }

  get consultationId(): ConsultationId {
    return this.props.consultationId;
  }

  get senderId(): UserId {
    return this.props.senderId;
  }

  get message(): MessageContent {
    return this.props.message;
  }

  get messageType(): MessageType {
    return this.props.messageType;
  }

  get isRead(): boolean {
    return this.props.isRead;
  }

  get sentAt(): Date {
    return this.props.sentAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  markAsRead(): void {
    this.props.isRead = true;
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }
}

// ============================================
// STATUS HISTORY ENTITY
// ============================================

export class StatusHistoryId {
  private constructor(private readonly value: string) {}

  static create(value: string): StatusHistoryId {
    if (!value || value.trim().length === 0) {
      throw new Error('Status History ID cannot be empty');
    }
    return new StatusHistoryId(value);
  }

  static generate(): StatusHistoryId {
    return new StatusHistoryId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: StatusHistoryId): boolean {
    return this.value === other.value;
  }
}

export interface RequestStatusHistoryProps {
  id: StatusHistoryId;
  consultationId: ConsultationId;
  fromStatus?: ConsultationStatusVO;
  toStatus: ConsultationStatusVO;
  reason?: string;
  changedBy?: UserId;
  changedAt: Date;
}

export class RequestStatusHistory {
  private props: RequestStatusHistoryProps;

  private constructor(props: RequestStatusHistoryProps) {
    this.props = props;
  }

  static create(params: {
    consultationId: ConsultationId;
    fromStatus?: ConsultationStatusVO;
    toStatus: ConsultationStatusVO;
    reason?: string;
    changedBy?: UserId;
  }): RequestStatusHistory {
    const props: RequestStatusHistoryProps = {
      id: StatusHistoryId.generate(),
      consultationId: params.consultationId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      reason: params.reason,
      changedBy: params.changedBy,
      changedAt: new Date(),
    };

    return new RequestStatusHistory(props);
  }

  static reconstitute(props: RequestStatusHistoryProps): RequestStatusHistory {
    return new RequestStatusHistory(props);
  }

  get id(): StatusHistoryId {
    return this.props.id;
  }

  get consultationId(): ConsultationId {
    return this.props.consultationId;
  }

  get fromStatus(): ConsultationStatusVO | undefined {
    return this.props.fromStatus;
  }

  get toStatus(): ConsultationStatusVO {
    return this.props.toStatus;
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get changedBy(): UserId | undefined {
    return this.props.changedBy;
  }

  get changedAt(): Date {
    return this.props.changedAt;
  }
}

// ============================================
// RATING ENTITY
// ============================================

export class RatingId {
  private constructor(private readonly value: string) {}

  static create(value: string): RatingId {
    if (!value || value.trim().length === 0) {
      throw new Error('Rating ID cannot be empty');
    }
    return new RatingId(value);
  }

  static generate(): RatingId {
    return new RatingId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RatingId): boolean {
    return this.value === other.value;
  }
}

export class RatingValue {
  private constructor(private readonly value: number) {}

  static create(value: number): RatingValue {
    if (!Number.isInteger(value)) {
      throw new Error('Rating must be an integer');
    }
    if (value < 1 || value > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    return new RatingValue(value);
  }

  getValue(): number {
    return this.value;
  }

  equals(other: RatingValue): boolean {
    return this.value === other.value;
  }
}

export class RatingComment {
  private constructor(private readonly value: string) {}

  static create(value: string): RatingComment {
    if (value.length > 1000) {
      throw new Error('Rating comment cannot exceed 1000 characters');
    }
    return new RatingComment(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value.length === 0;
  }

  equals(other: RatingComment): boolean {
    return this.value === other.value;
  }
}

export interface RequestRatingProps {
  id: RatingId;
  consultationId: ConsultationId;
  subscriberId: UserId;
  rating: RatingValue;
  comment?: RatingComment;
  createdAt: Date;
}

export class RequestRating {
  private props: RequestRatingProps;

  private constructor(props: RequestRatingProps) {
    this.props = props;
  }

  static create(params: {
    consultationId: ConsultationId;
    subscriberId: UserId;
    rating: RatingValue;
    comment?: RatingComment;
  }): RequestRating {
    const props: RequestRatingProps = {
      id: RatingId.generate(),
      consultationId: params.consultationId,
      subscriberId: params.subscriberId,
      rating: params.rating,
      comment: params.comment,
      createdAt: new Date(),
    };

    return new RequestRating(props);
  }

  static reconstitute(props: RequestRatingProps): RequestRating {
    return new RequestRating(props);
  }

  get id(): RatingId {
    return this.props.id;
  }

  get consultationId(): ConsultationId {
    return this.props.consultationId;
  }

  get subscriberId(): UserId {
    return this.props.subscriberId;
  }

  get rating(): RatingValue {
    return this.props.rating;
  }

  get comment(): RatingComment | undefined {
    return this.props.comment;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

// ============================================
// COLLABORATOR ENTITY
// ============================================

export class CollaboratorId {
  private constructor(private readonly value: string) {}

  static create(value: string): CollaboratorId {
    if (!value || value.trim().length === 0) {
      throw new Error('Collaborator ID cannot be empty');
    }
    return new CollaboratorId(value);
  }

  static generate(): CollaboratorId {
    return new CollaboratorId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: CollaboratorId): boolean {
    return this.value === other.value;
  }
}

export class ProviderUserId {
  private constructor(private readonly value: string) {}

  static create(value: string): ProviderUserId {
    if (!value || value.trim().length === 0) {
      throw new Error('Provider User ID cannot be empty');
    }
    return new ProviderUserId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ProviderUserId): boolean {
    return this.value === other.value;
  }
}

export enum CollaboratorRole {
  LEAD = 'lead',
  SUPPORT = 'support',
  REVIEWER = 'reviewer',
}

export enum CollaboratorStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface RequestCollaboratorProps {
  id: CollaboratorId;
  consultationId: ConsultationId;
  providerUserId: ProviderUserId;
  role?: CollaboratorRole;
  status: CollaboratorStatus;
  invitedAt: Date;
  respondedAt?: Date;
}

export class RequestCollaborator {
  private props: RequestCollaboratorProps;

  private constructor(props: RequestCollaboratorProps) {
    this.props = props;
  }

  static create(params: {
    consultationId: ConsultationId;
    providerUserId: ProviderUserId;
    role?: CollaboratorRole;
  }): RequestCollaborator {
    const props: RequestCollaboratorProps = {
      id: CollaboratorId.generate(),
      consultationId: params.consultationId,
      providerUserId: params.providerUserId,
      role: params.role,
      status: CollaboratorStatus.PENDING,
      invitedAt: new Date(),
    };

    return new RequestCollaborator(props);
  }

  static reconstitute(props: RequestCollaboratorProps): RequestCollaborator {
    return new RequestCollaborator(props);
  }

  get id(): CollaboratorId {
    return this.props.id;
  }

  get consultationId(): ConsultationId {
    return this.props.consultationId;
  }

  get providerUserId(): ProviderUserId {
    return this.props.providerUserId;
  }

  get role(): CollaboratorRole | undefined {
    return this.props.role;
  }

  get status(): CollaboratorStatus {
    return this.props.status;
  }

  get invitedAt(): Date {
    return this.props.invitedAt;
  }

  get respondedAt(): Date | undefined {
    return this.props.respondedAt;
  }

  accept(): void {
    if (this.props.status !== CollaboratorStatus.PENDING) {
      throw new Error('Can only accept pending invitations');
    }
    this.props.status = CollaboratorStatus.ACCEPTED;
    this.props.respondedAt = new Date();
  }

  reject(): void {
    if (this.props.status !== CollaboratorStatus.PENDING) {
      throw new Error('Can only reject pending invitations');
    }
    this.props.status = CollaboratorStatus.REJECTED;
    this.props.respondedAt = new Date();
  }

  isPending(): boolean {
    return this.props.status === CollaboratorStatus.PENDING;
  }

  isAccepted(): boolean {
    return this.props.status === CollaboratorStatus.ACCEPTED;
  }

  isRejected(): boolean {
    return this.props.status === CollaboratorStatus.REJECTED;
  }
}
