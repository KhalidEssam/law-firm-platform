// ============================================
// CONSULTATION REQUEST MODULE - DOMAIN LAYER
// ============================================

// ============================================
// VALUE OBJECTS
// ============================================

/**
 * RequestNumber - Unique identifier for consultation requests
 */
export class RequestNumber {
  private constructor(private readonly value: string) {}

  static create(value: string): RequestNumber {
    if (!value || value.trim().length === 0) {
      throw new Error('Request number cannot be empty');
    }
    // Format: CR-YYYYMMDD-XXXX (e.g., CR-20250123-0001)
    const pattern = /^CR-\d{8}-\d{4}$/;
    if (!pattern.test(value)) {
      throw new Error('Invalid request number format. Expected: CR-YYYYMMDD-XXXX');
    }
    return new RequestNumber(value);
  }

  static generate(): RequestNumber {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return new RequestNumber(`CR-${dateStr}-${random}`);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RequestNumber): boolean {
    return this.value === other.value;
  }
}

/**
 * ConsultationType - Type of consultation being requested
 */
export enum ConsultationType {
  GENERAL = 'general',
  CONTRACT_REVIEW = 'contract_review',
  LEGAL_ADVICE = 'legal_advice',
  DOCUMENT_PREPARATION = 'document_preparation',
  DISPUTE_RESOLUTION = 'dispute_resolution',
  COMPLIANCE = 'compliance',
  OTHER = 'other',
}

export class ConsultationTypeVO {
  private constructor(private readonly value: ConsultationType) {}

  static create(value: string): ConsultationTypeVO {
    if (!Object.values(ConsultationType).includes(value as ConsultationType)) {
      throw new Error(`Invalid consultation type: ${value}`);
    }
    return new ConsultationTypeVO(value as ConsultationType);
  }

  getValue(): ConsultationType {
    return this.value;
  }

  equals(other: ConsultationTypeVO): boolean {
    return this.value === other.value;
  }
}

/**
 * ConsultationStatus - Request lifecycle status
 */
export enum ConsultationStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  AWAITING_INFO = 'awaiting_info',
  RESPONDED = 'responded',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export class ConsultationStatusVO {
  private constructor(private readonly value: ConsultationStatus) {}

  static create(value: string): ConsultationStatusVO {
    if (!Object.values(ConsultationStatus).includes(value as ConsultationStatus)) {
      throw new Error(`Invalid consultation status: ${value}`);
    }
    return new ConsultationStatusVO(value as ConsultationStatus);
  }

  static pending(): ConsultationStatusVO {
    return new ConsultationStatusVO(ConsultationStatus.PENDING);
  }

  getValue(): ConsultationStatus {
    return this.value;
  }

  isPending(): boolean {
    return this.value === ConsultationStatus.PENDING;
  }

  isAssigned(): boolean {
    return this.value === ConsultationStatus.ASSIGNED;
  }

  isCompleted(): boolean {
    return this.value === ConsultationStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.value === ConsultationStatus.CANCELLED;
  }

  canBeAssigned(): boolean {
    return this.value === ConsultationStatus.PENDING;
  }

  canBeCompleted(): boolean {
    return [
      ConsultationStatus.ASSIGNED,
      ConsultationStatus.IN_PROGRESS,
      ConsultationStatus.RESPONDED,
    ].includes(this.value);
  }

  canBeCancelled(): boolean {
    return ![
      ConsultationStatus.COMPLETED,
      ConsultationStatus.CANCELLED,
    ].includes(this.value);
  }

  equals(other: ConsultationStatusVO): boolean {
    return this.value === other.value;
  }
}

/**
 * Urgency - Priority level of the request
 */
export enum UrgencyLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class Urgency {
  private constructor(private readonly value: UrgencyLevel) {}

  static create(value: string): Urgency {
    if (!Object.values(UrgencyLevel).includes(value as UrgencyLevel)) {
      throw new Error(`Invalid urgency level: ${value}`);
    }
    return new Urgency(value as UrgencyLevel);
  }

  static normal(): Urgency {
    return new Urgency(UrgencyLevel.NORMAL);
  }

  getValue(): UrgencyLevel {
    return this.value;
  }

  getSLAHours(): number {
    switch (this.value) {
      case UrgencyLevel.URGENT:
        return 4;
      case UrgencyLevel.HIGH:
        return 12;
      case UrgencyLevel.NORMAL:
        return 24;
      case UrgencyLevel.LOW:
        return 48;
      default:
        return 24;
    }
  }

  equals(other: Urgency): boolean {
    return this.value === other.value;
  }
}

/**
 * SLA Status - Service Level Agreement status
 */
export enum SLAStatusType {
  ON_TIME = 'on_time',
  AT_RISK = 'at_risk',
  BREACHED = 'breached',
  NOT_APPLICABLE = 'not_applicable',
}

export class SLAStatus {
  private constructor(private readonly value: SLAStatusType) {}

  static create(value: string): SLAStatus {
    if (!Object.values(SLAStatusType).includes(value as SLAStatusType)) {
      throw new Error(`Invalid SLA status: ${value}`);
    }
    return new SLAStatus(value as SLAStatusType);
  }

  static calculate(deadline: Date, currentDate: Date = new Date()): SLAStatus {
    const hoursRemaining = (deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      return new SLAStatus(SLAStatusType.BREACHED);
    } else if (hoursRemaining < 2) {
      return new SLAStatus(SLAStatusType.AT_RISK);
    } else {
      return new SLAStatus(SLAStatusType.ON_TIME);
    }
  }

  getValue(): SLAStatusType {
    return this.value;
  }

  isBreached(): boolean {
    return this.value === SLAStatusType.BREACHED;
  }

  isAtRisk(): boolean {
    return this.value === SLAStatusType.AT_RISK;
  }

  equals(other: SLAStatus): boolean {
    return this.value === other.value;
  }
}

/**
 * ConsultationCategory - Legal category/specialization
 */
export class ConsultationCategory {
  private constructor(private readonly value: string) {}

  static create(value: string): ConsultationCategory {
    if (!value || value.trim().length === 0) {
      throw new Error('Category cannot be empty');
    }
    if (value.length > 100) {
      throw new Error('Category cannot exceed 100 characters');
    }
    return new ConsultationCategory(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ConsultationCategory): boolean {
    return this.value === other.value;
  }
}

/**
 * Subject - Brief title of the consultation
 */
export class Subject {
  private constructor(private readonly value: string) {}

  static create(value: string): Subject {
    if (!value || value.trim().length === 0) {
      throw new Error('Subject cannot be empty');
    }
    if (value.length < 5) {
      throw new Error('Subject must be at least 5 characters');
    }
    if (value.length > 200) {
      throw new Error('Subject cannot exceed 200 characters');
    }
    return new Subject(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Subject): boolean {
    return this.value === other.value;
  }
}

/**
 * Description - Detailed explanation of the consultation request
 */
export class Description {
  private constructor(private readonly value: string) {}

  static create(value: string): Description {
    if (!value || value.trim().length === 0) {
      throw new Error('Description cannot be empty');
    }
    if (value.length < 20) {
      throw new Error('Description must be at least 20 characters');
    }
    if (value.length > 5000) {
      throw new Error('Description cannot exceed 5000 characters');
    }
    return new Description(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  getWordCount(): number {
    return this.value.split(/\s+/).length;
  }

  equals(other: Description): boolean {
    return this.value === other.value;
  }
}

// ============================================
// ENTITIES
// ============================================

/**
 * UserId - Reference to User aggregate
 */
export class UserId {
  private constructor(private readonly value: string) {}

  static create(value: string): UserId {
    if (!value || value.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
    return new UserId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}

/**
 * ConsultationId - Unique identifier for the consultation request
 */
export class ConsultationId {
  private constructor(private readonly value: string) {}

  static create(value: string): ConsultationId {
    if (!value || value.trim().length === 0) {
      throw new Error('Consultation ID cannot be empty');
    }
    return new ConsultationId(value);
  }

  static generate(): ConsultationId {
    // In real implementation, use UUID library
    return new ConsultationId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ConsultationId): boolean {
    return this.value === other.value;
  }
}

/**
 * ConsultationRequest - Aggregate Root
 */
export interface ConsultationRequestProps {
  id: ConsultationId;
  requestNumber: RequestNumber;
  subscriberId?: UserId;
  assignedProviderId?: UserId;
  consultationType: ConsultationTypeVO;
  category?: ConsultationCategory;
  subject: Subject;
  description: Description;
  urgency: Urgency;
  status: ConsultationStatusVO;
  submittedAt: Date;
  assignedAt?: Date;
  respondedAt?: Date;
  completedAt?: Date;
  slaDeadline?: Date;
  slaStatus?: SLAStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ConsultationRequest {
  private props: ConsultationRequestProps;

  private constructor(props: ConsultationRequestProps) {
    this.props = props;
  }

  /**
   * Factory method to create a new consultation request
   */
  static create(params: {
    subscriberId: UserId;
    consultationType: ConsultationTypeVO;
    category?: ConsultationCategory;
    subject: Subject;
    description: Description;
    urgency?: Urgency;
  }): ConsultationRequest {
    const now = new Date();
    const urgency = params.urgency || Urgency.normal();
    const slaHours = urgency.getSLAHours();
    const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const props: ConsultationRequestProps = {
      id: ConsultationId.generate(),
      requestNumber: RequestNumber.generate(),
      subscriberId: params.subscriberId,
      consultationType: params.consultationType,
      category: params.category,
      subject: params.subject,
      description: params.description,
      urgency,
      status: ConsultationStatusVO.pending(),
      submittedAt: now,
      slaDeadline,
      slaStatus: SLAStatus.calculate(slaDeadline, now),
      createdAt: now,
      updatedAt: now,
    };

    return new ConsultationRequest(props);
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: ConsultationRequestProps): ConsultationRequest {
    return new ConsultationRequest(props);
  }

  // ============================================
  // GETTERS
  // ============================================

  get id(): ConsultationId {
    return this.props.id;
  }

  get requestNumber(): RequestNumber {
    return this.props.requestNumber;
  }

  get subscriberId() {
    return this.props.subscriberId;
  }

  get assignedProviderId(): UserId | undefined {
    return this.props.assignedProviderId;
  }

  get consultationType(): ConsultationTypeVO {
    return this.props.consultationType;
  }

  get category(): ConsultationCategory | undefined {
    return this.props.category;
  }

  get subject(): Subject {
    return this.props.subject;
  }

  get description(): Description {
    return this.props.description;
  }

  get urgency(): Urgency {
    return this.props.urgency;
  }

  get status(): ConsultationStatusVO {
    return this.props.status;
  }

  get submittedAt(): Date {
    return this.props.submittedAt;
  }

  get assignedAt(): Date | undefined {
    return this.props.assignedAt;
  }

  get respondedAt(): Date | undefined {
    return this.props.respondedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get slaDeadline(): Date | undefined {
    return this.props.slaDeadline;
  }

  get slaStatus(): SLAStatus | undefined {
    return this.props.slaStatus;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  // ============================================
  // BUSINESS METHODS
  // ============================================

  /**
   * Assign the request to a provider
   */
  assignToProvider(providerId: UserId): void {
    if (!this.status.canBeAssigned()) {
      throw new Error(
        `Cannot assign request with status: ${this.status.getValue()}`
      );
    }

    this.props.assignedProviderId = providerId;
    this.props.status = ConsultationStatusVO.create(ConsultationStatus.ASSIGNED);
    this.props.assignedAt = new Date();
    this.props.updatedAt = new Date();

    // Update SLA status
    if (this.props.slaDeadline) {
      this.props.slaStatus = SLAStatus.calculate(this.props.slaDeadline);
    }
  }

  /**
   * Mark as responded by provider
   */
  markAsResponded(): void {
    if (!this.props.assignedProviderId) {
      throw new Error('Cannot mark as responded: No provider assigned');
    }

    if (this.status.isCancelled() || this.status.isCompleted()) {
      throw new Error(
        `Cannot mark as responded with status: ${this.status.getValue()}`
      );
    }

    this.props.status = ConsultationStatusVO.create(ConsultationStatus.RESPONDED);
    this.props.respondedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as in progress
   */
  markAsInProgress(): void {
    if (!this.props.assignedProviderId) {
      throw new Error('Cannot mark as in progress: No provider assigned');
    }

    if (!this.status.isAssigned() && this.status.getValue() !== ConsultationStatus.AWAITING_INFO) {
      throw new Error(
        `Cannot mark as in progress from status: ${this.status.getValue()}`
      );
    }

    this.props.status = ConsultationStatusVO.create(ConsultationStatus.IN_PROGRESS);
    this.props.updatedAt = new Date();
  }

  /**
   * Request additional information from subscriber
   */
  requestAdditionalInfo(): void {
    if (!this.props.assignedProviderId) {
      throw new Error('Cannot request info: No provider assigned');
    }

    if (this.status.isCompleted() || this.status.isCancelled()) {
      throw new Error(
        `Cannot request info with status: ${this.status.getValue()}`
      );
    }

    this.props.status = ConsultationStatusVO.create(ConsultationStatus.AWAITING_INFO);
    this.props.updatedAt = new Date();
  }

  /**
   * Complete the consultation request
   */
  complete(): void {
    if (!this.status.canBeCompleted()) {
      throw new Error(
        `Cannot complete request with status: ${this.status.getValue()}`
      );
    }

    this.props.status = ConsultationStatusVO.create(ConsultationStatus.COMPLETED);
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel the consultation request
   */
  cancel(reason?: string): void {
    if (!this.status.canBeCancelled()) {
      throw new Error(
        `Cannot cancel request with status: ${this.status.getValue()}`
      );
    }

    this.props.status = ConsultationStatusVO.create(ConsultationStatus.CANCELLED);
    this.props.updatedAt = new Date();
    // Reason would be stored in a separate event/history
  }

  /**
   * Mark as disputed
   */
  dispute(reason: string): void {
    if (!this.status.isCompleted()) {
      throw new Error('Can only dispute completed requests');
    }

    const hoursSinceCompletion = this.props.completedAt
      ? (new Date().getTime() - this.props.completedAt.getTime()) / (1000 * 60 * 60)
      : 0;

    if (hoursSinceCompletion > 48) {
      throw new Error('Dispute period has expired (48 hours)');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Dispute reason is required');
    }

    this.props.status = ConsultationStatusVO.create(ConsultationStatus.DISPUTED);
    this.props.updatedAt = new Date();
  }

  /**
   * Update SLA status based on current time
   */
  updateSLAStatus(): void {
    if (this.props.slaDeadline && !this.status.isCompleted() && !this.status.isCancelled()) {
      this.props.slaStatus = SLAStatus.calculate(this.props.slaDeadline);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Check if SLA is breached
   */
  isSLABreached(): boolean {
    return this.props.slaStatus?.isBreached() ?? false;
  }

  /**
   * Check if request is assigned
   */
  isAssigned(): boolean {
    return this.props.assignedProviderId !== undefined;
  }

  /**
   * Soft delete the request
   */
  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Check if deleted
   */
  isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }
}
