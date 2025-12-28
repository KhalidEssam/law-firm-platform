// ============================================
// LITIGATION CASE ENTITY
// Aggregate Root with Business Logic
// ============================================

import {
  CaseId,
  CaseNumber,
  UserId,
  CaseType,
  CaseSubtype,
  CaseTitle,
  CaseDescription,
  CaseStatus,
  CourtName,
  CaseDetails,
  Money,
  QuoteDetails,
  PaymentStatus,
  PaymentReference,
} from '../value-objects/litigation-case.vo';

export interface LitigationCaseProps {
  id: CaseId;
  caseNumber: CaseNumber;
  subscriberId: UserId;
  assignedProviderId?: UserId;

  // Case Details
  caseType: CaseType;
  caseSubtype?: CaseSubtype;
  title: CaseTitle;
  description: CaseDescription;
  courtName?: CourtName;
  caseDetails?: CaseDetails;

  // Status
  status: CaseStatus;

  // Quote
  quoteAmount?: Money;
  quoteDetails?: QuoteDetails;
  quoteValidUntil?: Date;
  quoteAcceptedAt?: Date;

  // Payment
  paymentStatus: PaymentStatus;
  paymentReference?: PaymentReference;

  // Dates
  submittedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * LitigationCase Aggregate Root
 *
 * Represents a legal case being handled through the platform
 * Contains all business rules for case lifecycle management
 *
 * Business Rules:
 * - Case can only move forward in status (no backward transitions except cancellation)
 * - Quote must be accepted before case can become active
 * - Payment must be completed before case work starts
 * - Cannot close case without resolution
 */
export class LitigationCase {
  private constructor(private readonly props: LitigationCaseProps) {
    this.validate();
  }

  // ============================================
  // FACTORY METHODS
  // ============================================

  /**
   * Create new litigation case (in draft/pending status)
   */
  static create(
    props: Omit<
      LitigationCaseProps,
      | 'id'
      | 'caseNumber'
      | 'status'
      | 'paymentStatus'
      | 'submittedAt'
      | 'createdAt'
      | 'updatedAt'
    >,
  ): LitigationCase {
    const now = new Date();

    return new LitigationCase({
      ...props,
      id: CaseId.create(),
      caseNumber: CaseNumber.generate(),
      status: CaseStatus.create('pending'),
      paymentStatus: PaymentStatus.create('pending'),
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static reconstitute(props: LitigationCaseProps): LitigationCase {
    return new LitigationCase(props);
  }

  // ============================================
  // VALIDATION
  // ============================================

  private validate(): void {
    // Quote must have valid until date
    if (this.props.quoteAmount && !this.props.quoteValidUntil) {
      throw new Error('Quote must have a valid until date');
    }

    // Quote must be accepted before becoming active
    if (
      this.props.status.getValue() === 'active' &&
      !this.props.quoteAcceptedAt
    ) {
      throw new Error('Quote must be accepted before case becomes active');
    }

    // Payment reference required if paid
    if (this.props.paymentStatus.isPaid() && !this.props.paymentReference) {
      throw new Error('Payment reference required when payment status is paid');
    }

    // Closed at date required if status is closed
    if (this.props.status.isClosed() && !this.props.closedAt) {
      throw new Error('Closed date required when case is closed');
    }
  }

  // ============================================
  // GETTERS
  // ============================================

  get id(): CaseId {
    return this.props.id;
  }

  get caseNumber(): CaseNumber {
    return this.props.caseNumber;
  }

  get subscriberId(): UserId {
    return this.props.subscriberId;
  }

  get assignedProviderId(): UserId | undefined {
    return this.props.assignedProviderId;
  }

  get caseType(): CaseType {
    return this.props.caseType;
  }

  get caseSubtype(): CaseSubtype | undefined {
    return this.props.caseSubtype;
  }

  get title(): CaseTitle {
    return this.props.title;
  }

  get description(): CaseDescription {
    return this.props.description;
  }

  get courtName(): CourtName | undefined {
    return this.props.courtName;
  }

  get caseDetails(): CaseDetails | undefined {
    return this.props.caseDetails;
  }

  get status(): CaseStatus {
    return this.props.status;
  }

  get quoteAmount(): Money | undefined {
    return this.props.quoteAmount;
  }

  get quoteDetails(): QuoteDetails | undefined {
    return this.props.quoteDetails;
  }

  get quoteValidUntil(): Date | undefined {
    return this.props.quoteValidUntil;
  }

  get quoteAcceptedAt(): Date | undefined {
    return this.props.quoteAcceptedAt;
  }

  get paymentStatus(): PaymentStatus {
    return this.props.paymentStatus;
  }

  get paymentReference(): PaymentReference | undefined {
    return this.props.paymentReference;
  }

  get submittedAt(): Date {
    return this.props.submittedAt;
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
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
  // BUSINESS LOGIC - Case Lifecycle
  // ============================================

  /**
   * Assign provider to case
   */
  assignProvider(providerId: UserId): void {
    if (this.props.status.getValue() !== 'pending') {
      throw new Error('Can only assign provider to pending cases');
    }

    this.props.assignedProviderId = providerId;
    this.props.updatedAt = new Date();
  }

  /**
   * Provider sends quote to client
   */
  sendQuote(amount: Money, validUntil: Date, details?: QuoteDetails): void {
    if (!this.props.assignedProviderId) {
      throw new Error(
        'Case must have an assigned provider before sending quote',
      );
    }

    if (validUntil <= new Date()) {
      throw new Error('Quote valid until date must be in the future');
    }

    if (!this.props.status.canTransitionTo(CaseStatus.create('quote_sent'))) {
      throw new Error(
        `Cannot send quote from status: ${this.props.status.getValue()}`,
      );
    }

    this.props.quoteAmount = amount;
    this.props.quoteValidUntil = validUntil;
    this.props.quoteDetails = details;
    this.props.status = CaseStatus.create('quote_sent');
    this.props.updatedAt = new Date();
  }

  /**
   * Client accepts quote
   */
  acceptQuote(): void {
    if (this.props.status.getValue() !== 'quote_sent') {
      throw new Error('Can only accept quote when status is quote_sent');
    }

    if (!this.props.quoteAmount) {
      throw new Error('No quote available to accept');
    }

    if (this.props.quoteValidUntil && this.props.quoteValidUntil < new Date()) {
      throw new Error('Quote has expired');
    }

    this.props.status = CaseStatus.create('quote_accepted');
    this.props.quoteAcceptedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Mark payment as completed
   */
  markAsPaid(paymentReference: string, amount?: Money): void {
    if (this.props.status.getValue() !== 'quote_accepted') {
      throw new Error('Quote must be accepted before payment');
    }

    // Validate amount matches quote if provided
    if (amount && this.props.quoteAmount) {
      if (!amount.equals(this.props.quoteAmount)) {
        throw new Error('Payment amount does not match quote amount');
      }
    }

    this.props.paymentStatus = PaymentStatus.create('paid');
    this.props.paymentReference = PaymentReference.create(paymentReference);
    this.props.updatedAt = new Date();
  }

  /**
   * Activate case (start working on it)
   */
  activate(): void {
    if (this.props.status.getValue() !== 'quote_accepted') {
      throw new Error('Can only activate case after quote is accepted');
    }

    if (!this.props.paymentStatus.isPaid()) {
      throw new Error('Payment must be completed before activating case');
    }

    this.props.status = CaseStatus.create('active');
    this.props.updatedAt = new Date();
  }

  /**
   * Close case
   */
  close(): void {
    if (this.props.status.getValue() !== 'active') {
      throw new Error('Can only close active cases');
    }

    this.props.status = CaseStatus.create('closed');
    this.props.closedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel case
   */
  cancel(reason?: string): void {
    const validStatuses = ['pending', 'quote_sent', 'quote_accepted'];
    if (!validStatuses.includes(this.props.status.getValue())) {
      throw new Error('Cannot cancel case in current status');
    }

    // If payment was made, should be refunded first
    if (this.props.paymentStatus.isPaid()) {
      throw new Error(
        'Cannot cancel case with completed payment. Refund first.',
      );
    }

    this.props.status = CaseStatus.create('cancelled');
    this.props.updatedAt = new Date();
  }

  /**
   * Process refund
   */
  processRefund(refundReference: string): void {
    if (!this.props.paymentStatus.isPaid()) {
      throw new Error('Cannot refund unpaid case');
    }

    this.props.paymentStatus = PaymentStatus.create('refunded');
    this.props.updatedAt = new Date();
  }

  // ============================================
  // BUSINESS LOGIC - Updates
  // ============================================

  /**
   * Update case details
   */
  updateDetails(details: CaseDetails): void {
    if (this.props.status.isActive() || this.props.status.isClosed()) {
      throw new Error('Cannot update details for active or closed cases');
    }

    this.props.caseDetails = details;
    this.props.updatedAt = new Date();
  }

  /**
   * Update case title
   */
  updateTitle(title: CaseTitle): void {
    if (this.props.status.isClosed()) {
      throw new Error('Cannot update title for closed cases');
    }

    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  /**
   * Update case description
   */
  updateDescription(description: CaseDescription): void {
    if (this.props.status.isClosed()) {
      throw new Error('Cannot update description for closed cases');
    }

    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  /**
   * Set court name
   */
  setCourtName(courtName: CourtName): void {
    this.props.courtName = courtName;
    this.props.updatedAt = new Date();
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * Check if case requires client action
   */
  requiresClientAction(): boolean {
    return this.props.status.getValue() === 'quote_sent';
  }

  /**
   * Check if case is awaiting payment
   */
  isAwaitingPayment(): boolean {
    return (
      this.props.status.getValue() === 'quote_accepted' &&
      !this.props.paymentStatus.isPaid()
    );
  }

  /**
   * Check if quote is expired
   */
  isQuoteExpired(): boolean {
    if (!this.props.quoteValidUntil) return false;
    return this.props.quoteValidUntil < new Date();
  }

  /**
   * Check if case is in progress
   */
  isInProgress(): boolean {
    return this.props.status.isActive();
  }

  /**
   * Check if case can be modified
   */
  canBeModified(): boolean {
    return (
      this.props.status.isPending() ||
      this.props.status.getValue() === 'quote_sent'
    );
  }

  // ============================================
  // SOFT DELETE
  // ============================================

  softDelete(): void {
    if (this.props.status.isActive()) {
      throw new Error('Cannot delete active cases');
    }

    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }
}
