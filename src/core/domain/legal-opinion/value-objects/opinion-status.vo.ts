// ============================================
// VALUE OBJECT 8: OPINION STATUS
// Status of the legal opinion request
// ============================================

// import { DomainException } from '../shared/domain-exception';

export enum OpinionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ASSIGNED = 'assigned',
  RESEARCH_PHASE = 'research_phase',
  DRAFTING = 'drafting',
  INTERNAL_REVIEW = 'internal_review',
  REVISION_REQUESTED = 'revision_requested',
  REVISING = 'revising',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export class OpinionStatusVO {
  private readonly value: OpinionStatus;

  private constructor(value: OpinionStatus) {
    this.validate(value);
    this.value = value;
  }

  private validate(_value: OpinionStatus): void {
    // if (!Object.values(OpinionStatus).includes(value)) {
    //   throw new DomainException(`Invalid opinion status: ${value}`);
    // }
  }

  static create(value: OpinionStatus | string): OpinionStatusVO {
    return new OpinionStatusVO(value as OpinionStatus);
  }

  getValue(): OpinionStatus {
    return this.value;
  }

  // Status checks
  isDraft(): boolean {
    return this.value === OpinionStatus.DRAFT;
  }

  isSubmitted(): boolean {
    return this.value === OpinionStatus.SUBMITTED;
  }

  isInProgress(): boolean {
    return [
      OpinionStatus.ASSIGNED,
      OpinionStatus.RESEARCH_PHASE,
      OpinionStatus.DRAFTING,
      OpinionStatus.INTERNAL_REVIEW,
      OpinionStatus.REVISING,
    ].includes(this.value);
  }

  isCompleted(): boolean {
    return this.value === OpinionStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.value === OpinionStatus.CANCELLED;
  }

  isFinal(): boolean {
    return [
      OpinionStatus.COMPLETED,
      OpinionStatus.CANCELLED,
      OpinionStatus.REJECTED,
    ].includes(this.value);
  }

  // Get display label
  getLabel(): string {
    const labels: Record<OpinionStatus, string> = {
      [OpinionStatus.DRAFT]: 'Draft',
      [OpinionStatus.SUBMITTED]: 'Submitted',
      [OpinionStatus.UNDER_REVIEW]: 'Under Review',
      [OpinionStatus.ASSIGNED]: 'Assigned',
      [OpinionStatus.RESEARCH_PHASE]: 'Research Phase',
      [OpinionStatus.DRAFTING]: 'Drafting',
      [OpinionStatus.INTERNAL_REVIEW]: 'Internal Review',
      [OpinionStatus.REVISION_REQUESTED]: 'Revision Requested',
      [OpinionStatus.REVISING]: 'Revising',
      [OpinionStatus.COMPLETED]: 'Completed',
      [OpinionStatus.CANCELLED]: 'Cancelled',
      [OpinionStatus.REJECTED]: 'Rejected',
    };
    return labels[this.value];
  }

  // Get color for UI
  getColor(): string {
    const colors: Record<OpinionStatus, string> = {
      [OpinionStatus.DRAFT]: 'gray',
      [OpinionStatus.SUBMITTED]: 'blue',
      [OpinionStatus.UNDER_REVIEW]: 'yellow',
      [OpinionStatus.ASSIGNED]: 'cyan',
      [OpinionStatus.RESEARCH_PHASE]: 'purple',
      [OpinionStatus.DRAFTING]: 'indigo',
      [OpinionStatus.INTERNAL_REVIEW]: 'orange',
      [OpinionStatus.REVISION_REQUESTED]: 'amber',
      [OpinionStatus.REVISING]: 'teal',
      [OpinionStatus.COMPLETED]: 'green',
      [OpinionStatus.CANCELLED]: 'red',
      [OpinionStatus.REJECTED]: 'red',
    };
    return colors[this.value];
  }

  equals(other: OpinionStatusVO): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
