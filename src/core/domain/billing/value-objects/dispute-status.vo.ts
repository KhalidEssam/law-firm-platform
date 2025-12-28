// ============================================
// DISPUTE STATUS VALUE OBJECT
// src/core/domain/billing/value-objects/dispute-status.vo.ts
// ============================================

export enum DisputeStatusEnum {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  CLOSED = 'closed',
}

export class DisputeStatus {
  private static readonly allowedStatuses = Object.values(DisputeStatusEnum);

  private constructor(private readonly value: DisputeStatusEnum) {}

  static create(value: string): DisputeStatus {
    const normalizedValue = value.toLowerCase() as DisputeStatusEnum;
    if (!DisputeStatus.allowedStatuses.includes(normalizedValue)) {
      throw new Error(`Invalid dispute status: ${value}`);
    }
    return new DisputeStatus(normalizedValue);
  }

  static open(): DisputeStatus {
    return new DisputeStatus(DisputeStatusEnum.OPEN);
  }

  static underReview(): DisputeStatus {
    return new DisputeStatus(DisputeStatusEnum.UNDER_REVIEW);
  }

  static resolved(): DisputeStatus {
    return new DisputeStatus(DisputeStatusEnum.RESOLVED);
  }

  static escalated(): DisputeStatus {
    return new DisputeStatus(DisputeStatusEnum.ESCALATED);
  }

  static closed(): DisputeStatus {
    return new DisputeStatus(DisputeStatusEnum.CLOSED);
  }

  getValue(): DisputeStatusEnum {
    return this.value;
  }

  // State query methods
  isOpen(): boolean {
    return this.value === DisputeStatusEnum.OPEN;
  }

  isUnderReview(): boolean {
    return this.value === DisputeStatusEnum.UNDER_REVIEW;
  }

  isResolved(): boolean {
    return this.value === DisputeStatusEnum.RESOLVED;
  }

  isEscalated(): boolean {
    return this.value === DisputeStatusEnum.ESCALATED;
  }

  isClosed(): boolean {
    return this.value === DisputeStatusEnum.CLOSED;
  }

  // Business rule methods
  canBeReviewed(): boolean {
    return this.value === DisputeStatusEnum.OPEN;
  }

  canBeEscalated(): boolean {
    return [DisputeStatusEnum.OPEN, DisputeStatusEnum.UNDER_REVIEW].includes(
      this.value,
    );
  }

  canBeResolved(): boolean {
    return [
      DisputeStatusEnum.OPEN,
      DisputeStatusEnum.UNDER_REVIEW,
      DisputeStatusEnum.ESCALATED,
    ].includes(this.value);
  }

  canBeClosed(): boolean {
    return this.value === DisputeStatusEnum.RESOLVED;
  }

  isActive(): boolean {
    return [
      DisputeStatusEnum.OPEN,
      DisputeStatusEnum.UNDER_REVIEW,
      DisputeStatusEnum.ESCALATED,
    ].includes(this.value);
  }

  isFinal(): boolean {
    return [DisputeStatusEnum.RESOLVED, DisputeStatusEnum.CLOSED].includes(
      this.value,
    );
  }

  equals(other: DisputeStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
