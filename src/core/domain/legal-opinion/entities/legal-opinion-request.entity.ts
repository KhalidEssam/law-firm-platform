// ============================================
// LEGAL OPINION REQUEST ENTITY (AGGREGATE ROOT)
// Domain Layer - Core Business Entity
// ============================================

/**
 * LegalOpinionRequest represents a formal request for a written legal opinion
 * from a qualified legal professional. This is a more formal and structured
 * service compared to general consultations.
 * 
 * Key Characteristics:
 * - Requires detailed case information and legal questions
 * - Results in a formal written legal opinion document
 * - Has strict formatting and delivery requirements
 * - Typically more expensive than regular consultations
 * - May require multiple review cycles
 */

// import { DomainException } from '../shared/domain-exception';

// Value Object Imports
import { OpinionRequestId } from '../value-objects/opinion-requestid.vo';
import { OpinionNumber } from '../value-objects/opinion-number.vo';
import { UserId } from '../../consultation/value-objects/consultation-request-domain';
import { OpinionSubject } from '../value-objects/opinion-subject.vo';
import { LegalQuestion } from '../value-objects/legal-question.vo';
import { BackgroundContext } from '../value-objects/background-context.vo';
import { RelevantFacts } from '../value-objects/relevant-facts.vo';
import { SpecificIssues } from '../value-objects/specific-issues.vo';
import { Jurisdiction } from '../value-objects/jurisdiction.vo';
import { OpinionStatusVO } from '../value-objects/opinion-status.vo';
import { OpinionTypeVO } from '../value-objects/opinion-type.vo';
import { OpinionPriorityVO } from '../value-objects/opinion-priority.vo';
import { DeliveryFormatVO } from '../value-objects/delivery-format.vo';
import { Money } from '../value-objects/money.vo';
import { ConfidentialityLevel } from '../value-objects/confidentiality-level.vo';

// ============================================
// ENUMS
// ============================================

export enum OpinionStatus {
  DRAFT = 'draft',                    // Client is preparing the request
  SUBMITTED = 'submitted',            // Request submitted, awaiting review
  UNDER_REVIEW = 'under_review',      // Legal team reviewing the request
  ASSIGNED = 'assigned',              // Assigned to specific lawyer
  RESEARCH_PHASE = 'research_phase',  // Lawyer conducting legal research
  DRAFTING = 'drafting',              // Opinion being drafted
  INTERNAL_REVIEW = 'internal_review', // Internal quality review
  REVISION_REQUESTED = 'revision_requested', // Client requested changes
  REVISING = 'revising',              // Lawyer making revisions
  COMPLETED = 'completed',            // Opinion delivered
  CANCELLED = 'cancelled',            // Request cancelled
  REJECTED = 'rejected',              // Request rejected (out of scope, etc.)
}

export enum OpinionType {
  LEGAL_ANALYSIS = 'legal_analysis',           // Analysis of legal issue
  CONTRACT_REVIEW = 'contract_review',         // Contract review opinion
  COMPLIANCE_OPINION = 'compliance_opinion',   // Compliance assessment
  DUE_DILIGENCE = 'due_diligence',            // Due diligence opinion
  LITIGATION_RISK = 'litigation_risk',         // Litigation risk assessment
  REGULATORY_OPINION = 'regulatory_opinion',   // Regulatory compliance
  CUSTOM = 'custom',                           // Custom opinion type
}

export enum OpinionPriority {
  STANDARD = 'standard',     // 7-10 business days
  EXPEDITED = 'expedited',   // 3-5 business days
  RUSH = 'rush',             // 24-48 hours
  URGENT = 'urgent',         // Within 24 hours (premium)
}

export enum DeliveryFormat {
  PDF = 'pdf',
  WORD = 'word',
  BOTH = 'both',
}

// ============================================
// LEGAL OPINION REQUEST ENTITY
// ============================================

export interface LegalOpinionRequestProps {
  id: OpinionRequestId;
  opinionNumber: OpinionNumber;
  clientId: UserId;
  assignedLawyerId?: UserId;
  reviewedBy?: UserId;
  
  // Request Details
  opinionType: OpinionTypeVO;
  subject: OpinionSubject;
  legalQuestion: LegalQuestion;
  backgroundContext: BackgroundContext;
  relevantFacts: RelevantFacts;
  specificIssues?: SpecificIssues;
  jurisdiction: Jurisdiction;
  
  // Priority & Deadlines
  priority: OpinionPriorityVO;
  requestedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  
  // Status & Workflow
  status: OpinionStatusVO;
  draftVersion?: number;
  finalVersion?: number;
  
  // Deliverables
  deliveryFormat: DeliveryFormatVO;
  includeExecutiveSummary: boolean;
  includeCitations: boolean;
  includeRecommendations: boolean;
  
  // Pricing
  estimatedCost?: Money;
  finalCost?: Money;
  isPaid: boolean;
  paymentReference?: string;
  
  // Timestamps
  submittedAt?: Date;
  assignedAt?: Date;
  researchStartedAt?: Date;
  draftCompletedAt?: Date;
  reviewStartedAt?: Date;
  completedAt?: Date;
  expectedCompletionDate?: Date;
  
  // Metadata
  confidentialityLevel: ConfidentialityLevel;
  isUrgent: boolean;
  requiresCollaboration: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class LegalOpinionRequest {
  private constructor(private props: LegalOpinionRequestProps) {
    this.validate();
  }

  // ============================================
  // FACTORY METHODS
  // ============================================

  static create(props: {
    clientId: UserId;
    opinionType: OpinionTypeVO;
    subject: OpinionSubject;
    legalQuestion: LegalQuestion;
    backgroundContext: BackgroundContext;
    relevantFacts: RelevantFacts;
    jurisdiction: Jurisdiction;
    priority?: OpinionPriorityVO;
    deliveryFormat?: DeliveryFormatVO;
    requestedDeliveryDate?: Date;
    specificIssues?: SpecificIssues;
    includeExecutiveSummary?: boolean;
    includeCitations?: boolean;
    includeRecommendations?: boolean;
    confidentialityLevel?: ConfidentialityLevel;
  }): LegalOpinionRequest {
    const now = new Date();
    
    return new LegalOpinionRequest({
      id: OpinionRequestId.create(),
      opinionNumber: OpinionNumber.generate(),
      clientId: props.clientId,
      opinionType: props.opinionType,
      subject: props.subject,
      legalQuestion: props.legalQuestion,
      backgroundContext: props.backgroundContext,
      relevantFacts: props.relevantFacts,
      jurisdiction: props.jurisdiction,
      specificIssues: props.specificIssues,
      priority: props.priority || OpinionPriorityVO.create(OpinionPriority.STANDARD),
      requestedDeliveryDate: props.requestedDeliveryDate,
      status: OpinionStatusVO.create(OpinionStatus.DRAFT),
      deliveryFormat: props.deliveryFormat || DeliveryFormatVO.create(DeliveryFormat.PDF),
      includeExecutiveSummary: props.includeExecutiveSummary ?? true,
      includeCitations: props.includeCitations ?? true,
      includeRecommendations: props.includeRecommendations ?? true,
      confidentialityLevel: props.confidentialityLevel || ConfidentialityLevel.create('standard'),
      isUrgent: false,
      requiresCollaboration: false,
      isPaid: false,
      draftVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: LegalOpinionRequestProps): LegalOpinionRequest {
    return new LegalOpinionRequest(props);
  }

  // ============================================
  // BUSINESS RULES & VALIDATION
  // ============================================

  private validate(): void {
    // if (!this.props.id) {
    //   throw new DomainException('Opinion request must have an ID');
    // }
    // if (!this.props.clientId) {
    //   throw new DomainException('Opinion request must have a client');
    // }
    // if (!this.props.opinionType) {
    //   throw new DomainException('Opinion request must have a type');
    // }
  }

  // ============================================
  // DOMAIN BEHAVIORS - WORKFLOW TRANSITIONS
  // ============================================

  submit(): void {
    // if (this.props.status.getValue() !== OpinionStatus.DRAFT) {
    //   throw new DomainException('Can only submit draft opinions');
    // }
    
    // // Business rule: Must have all required information
    // if (!this.hasRequiredInformation()) {
    //   throw new DomainException('Opinion request must have all required information before submission');
    // }

    this.props.status = OpinionStatusVO.create(OpinionStatus.SUBMITTED);
    this.props.submittedAt = new Date();
    this.props.updatedAt = new Date();
    
    // Calculate expected completion date based on priority
    this.calculateExpectedCompletionDate();
  }

  updateSubject(subject: OpinionSubject): void {
    this.props.subject = subject;
    this.props.updatedAt = new Date();
  }

  updateLegalQuestion(legalQuestion: LegalQuestion): void {
    this.props.legalQuestion = legalQuestion;
    this.props.updatedAt = new Date();
  }

  updateBackgroundContext(backgroundContext: BackgroundContext): void {
    this.props.backgroundContext = backgroundContext;
    this.props.updatedAt = new Date();
  }
  updateRelevantFacts(relevantFacts: RelevantFacts): void {
    this.props.relevantFacts = relevantFacts;
    this.props.updatedAt = new Date();
  }
  
  updateSpecificIssues(specificIssues: SpecificIssues): void {
    this.props.specificIssues = specificIssues;
    this.props.updatedAt = new Date();
    
  }
  changePriority(priority: OpinionPriorityVO): void {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
  }
  assignToLawyer(lawyerId: UserId): void {
    const allowedStatuses = [OpinionStatus.SUBMITTED, OpinionStatus.UNDER_REVIEW];
    // if (!allowedStatuses.includes(this.props.status.getValue() as OpinionStatus)) {
    //   throw new DomainException('Can only assign submitted or under-review opinions');
    // }

    this.props.assignedLawyerId = lawyerId;
    this.props.status = OpinionStatusVO.create(OpinionStatus.ASSIGNED);
    this.props.assignedAt = new Date();
    this.props.updatedAt = new Date();
  }

  submitForReview(): void {
    // if (this.props.status.getValue() !== OpinionStatus.ASSIGNED) {
    //   throw new DomainException('Can only submit for review assigned opinions');
    // }
    // if (!this.props.assignedLawyerId) {
    //   throw new DomainException('Opinion must be assigned to a lawyer');
    // }

    this.props.status = OpinionStatusVO.create(OpinionStatus.UNDER_REVIEW);
    this.props.updatedAt = new Date();
  }

  startResearch(): void {
    // if (this.props.status.getValue() !== OpinionStatus.ASSIGNED) {
    //   throw new DomainException('Can only start research on assigned opinions');
    // }
    // if (!this.props.assignedLawyerId) {
    //   throw new DomainException('Opinion must be assigned to a lawyer');
    // }

    this.props.status = OpinionStatusVO.create(OpinionStatus.RESEARCH_PHASE);
    this.props.researchStartedAt = new Date();
    this.props.updatedAt = new Date();
  }

  startDrafting(): void {
    // if (this.props.status.getValue() !== OpinionStatus.RESEARCH_PHASE) {
    //   throw new DomainException('Must complete research before drafting');
    // }

    this.props.status = OpinionStatusVO.create(OpinionStatus.DRAFTING);
    this.props.updatedAt = new Date();
  }

  submitForInternalReview(): void {
    // if (this.props.status.getValue() !== OpinionStatus.DRAFTING) {
    //   throw new DomainException('Can only submit draft for review');
    // }

    this.props.status = OpinionStatusVO.create(OpinionStatus.INTERNAL_REVIEW);
    this.props.draftCompletedAt = new Date();
    this.props.draftVersion = (this.props.draftVersion || 0) + 1;
    this.props.updatedAt = new Date();
  }

  requestRevision(reason: string): void {
    // if (this.props.status.getValue() !== OpinionStatus.INTERNAL_REVIEW) {
    //   throw new DomainException('Can only request revision during internal review');
    // }

    this.props.status = OpinionStatusVO.create(OpinionStatus.REVISION_REQUESTED);
    this.props.updatedAt = new Date();
    // Revision reason would be stored in a related entity (OpinionReview)
  }

  startRevising(): void {
    // if (this.props.status.getValue() !== OpinionStatus.REVISION_REQUESTED) {
    //   throw new DomainException('Can only revise when revision is requested');
    // }

    this.props.status = OpinionStatusVO.create(OpinionStatus.REVISING);
    this.props.updatedAt = new Date();
  }

  complete(): void {
    // if (this.props.status.getValue() !== OpinionStatus.INTERNAL_REVIEW) {
    //   throw new DomainException('Can only complete opinions that passed internal review');
    // }
    
    // Business rule: Must be paid before delivery
    // if (!this.props.isPaid) {
    //   throw new DomainException('Opinion must be paid before delivery');
    // }

    this.props.status = OpinionStatusVO.create(OpinionStatus.COMPLETED);
    this.props.completedAt = new Date();
    this.props.actualDeliveryDate = new Date();
    this.props.finalVersion = this.props.draftVersion;
    this.props.updatedAt = new Date();
  }

  cancel(reason: string): void {
    const allowedStatuses = [
      OpinionStatus.DRAFT,
      OpinionStatus.SUBMITTED,
      OpinionStatus.UNDER_REVIEW,
      OpinionStatus.ASSIGNED,
    ];
    
    // if (!allowedStatuses.includes(this.props.status.getValue() as OpinionStatus)) {
    //   throw new DomainException('Cannot cancel opinion in current status');
    // }

    this.props.status = OpinionStatusVO.create(OpinionStatus.CANCELLED);
    this.props.updatedAt = new Date();
    // Cancellation reason would be stored in a related entity
  }

  reject(reason: string): void {
    const allowedStatuses = [OpinionStatus.SUBMITTED, OpinionStatus.UNDER_REVIEW];
    
    // if (!allowedStatuses.includes(this.props.status.getValue() as OpinionStatus)) {
    //   throw new DomainException('Can only reject submitted or under-review opinions');
    // }

    this.props.status = OpinionStatusVO.create(OpinionStatus.REJECTED);
    this.props.updatedAt = new Date();
  }

  // ============================================
  // PRICING & PAYMENT
  // ============================================

  setEstimatedCost(cost: Money): void {
    // if (this.props.status.getValue() !== OpinionStatus.SUBMITTED &&
    //     this.props.status.getValue() !== OpinionStatus.UNDER_REVIEW) {
    //   throw new DomainException('Can only set estimated cost during review phase');
    // }

    this.props.estimatedCost = cost;
    this.props.updatedAt = new Date();
  }

  markAsPaid(paymentReference: string, finalCost?: Money): void {
    // if (this.props.isPaid) {
    //   throw new DomainException('Opinion is already marked as paid');
    // }

    this.props.isPaid = true;
    this.props.paymentReference = paymentReference;
    if (finalCost) {
      this.props.finalCost = finalCost;
    }
    this.props.updatedAt = new Date();
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private hasRequiredInformation(): boolean {
    return !!(
      this.props.subject &&
      this.props.legalQuestion &&
      this.props.backgroundContext &&
      this.props.relevantFacts &&
      this.props.jurisdiction
    );
  }

  private calculateExpectedCompletionDate(): void {
    const now = new Date();
    const priority = this.props.priority.getValue();
    let daysToAdd = 7; // default

    switch (priority) {
      case OpinionPriority.STANDARD:
        daysToAdd = 10;
        break;
      case OpinionPriority.EXPEDITED:
        daysToAdd = 5;
        break;
      case OpinionPriority.RUSH:
        daysToAdd = 2;
        break;
      case OpinionPriority.URGENT:
        daysToAdd = 1;
        break;
    }

    this.props.expectedCompletionDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  isOverdue(): boolean {
    if (!this.props.expectedCompletionDate) return false;
    if (this.props.status.getValue() === OpinionStatus.COMPLETED) return false;
    
    return new Date() > this.props.expectedCompletionDate;
  }

  canBeEdited(): boolean {
    return this.props.status.getValue() === OpinionStatus.DRAFT;
  }

  canBeCancelled(): boolean {
    const cancellableStatuses = [
      OpinionStatus.DRAFT,
      OpinionStatus.SUBMITTED,
      OpinionStatus.UNDER_REVIEW,
      OpinionStatus.ASSIGNED,
    ];
    return cancellableStatuses.includes(this.props.status.getValue() as OpinionStatus);
  }

  // ============================================
  // GETTERS
  // ============================================

  get id(): OpinionRequestId { return this.props.id; }
  get opinionNumber(): OpinionNumber { return this.props.opinionNumber; }
  get clientId(): UserId { return this.props.clientId; }
  get assignedLawyerId(): UserId | undefined { return this.props.assignedLawyerId; }
  get reviewedBy(): UserId | undefined { return this.props.reviewedBy; }
  
  get opinionType(): OpinionTypeVO { return this.props.opinionType; }
  get subject(): OpinionSubject { return this.props.subject; }
  get legalQuestion(): LegalQuestion { return this.props.legalQuestion; }
  get backgroundContext(): BackgroundContext { return this.props.backgroundContext; }
  get relevantFacts(): RelevantFacts { return this.props.relevantFacts; }
  get specificIssues(): SpecificIssues | undefined { return this.props.specificIssues; }
  get jurisdiction(): Jurisdiction { return this.props.jurisdiction; }
  
  get priority(): OpinionPriorityVO { return this.props.priority; }
  get requestedDeliveryDate(): Date | undefined { return this.props.requestedDeliveryDate; }
  get actualDeliveryDate(): Date | undefined { return this.props.actualDeliveryDate; }
  
  get status(): OpinionStatusVO { return this.props.status; }
  get draftVersion(): number | undefined { return this.props.draftVersion; }
  get finalVersion(): number | undefined { return this.props.finalVersion; }
  
  get deliveryFormat(): DeliveryFormatVO { return this.props.deliveryFormat; }
  get includeExecutiveSummary(): boolean { return this.props.includeExecutiveSummary; }
  get includeCitations(): boolean { return this.props.includeCitations; }
  get includeRecommendations(): boolean { return this.props.includeRecommendations; }
  
  get estimatedCost(): Money | undefined { return this.props.estimatedCost; }
  get finalCost(): Money | undefined { return this.props.finalCost; }
  get isPaid(): boolean { return this.props.isPaid; }
  get paymentReference(): string | undefined { return this.props.paymentReference; }
  
  get submittedAt(): Date | undefined { return this.props.submittedAt; }
  get assignedAt(): Date | undefined { return this.props.assignedAt; }
  get researchStartedAt(): Date | undefined { return this.props.researchStartedAt; }
  get draftCompletedAt(): Date | undefined { return this.props.draftCompletedAt; }
  get reviewStartedAt(): Date | undefined { return this.props.reviewStartedAt; }
  get completedAt(): Date | undefined { return this.props.completedAt; }
  get expectedCompletionDate(): Date | undefined { return this.props.expectedCompletionDate; }
  
  get confidentialityLevel(): ConfidentialityLevel { return this.props.confidentialityLevel; }
  get isUrgent(): boolean { return this.props.isUrgent; }
  get requiresCollaboration(): boolean { return this.props.requiresCollaboration; }
  
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | undefined { return this.props.deletedAt; }
}