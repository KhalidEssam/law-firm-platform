// ============================================
// VALUE OBJECT: OPINION PRIORITY
// Priority level of the legal opinion
// ============================================

// import { DomainException } from '../shared/domain-exception';

export enum OpinionPriority {
  STANDARD = 'standard', // 7-10 business days
  EXPEDITED = 'expedited', // 3-5 business days
  RUSH = 'rush', // 24-48 hours
  URGENT = 'urgent', // Within 24 hours
}

export class OpinionPriorityVO {
  private readonly value: OpinionPriority;

  private constructor(value: OpinionPriority) {
    this.validate(value);
    this.value = value;
  }

  private validate(_value: OpinionPriority): void {
    // if (!Object.values(OpinionPriority).includes(value)) {
    //   throw new DomainException(`Invalid priority: ${value}`);
    // }
  }

  static create(value: OpinionPriority | string): OpinionPriorityVO {
    return new OpinionPriorityVO(value as OpinionPriority);
  }

  getValue(): OpinionPriority {
    return this.value;
  }

  // Get display label
  getLabel(): string {
    const labels: Record<OpinionPriority, string> = {
      [OpinionPriority.STANDARD]: 'Standard (7-10 days)',
      [OpinionPriority.EXPEDITED]: 'Expedited (3-5 days)',
      [OpinionPriority.RUSH]: 'Rush (24-48 hours)',
      [OpinionPriority.URGENT]: 'Urgent (within 24 hours)',
    };
    return labels[this.value];
  }

  // Get turnaround time in days
  getTurnaroundDays(): number {
    const days: Record<OpinionPriority, number> = {
      [OpinionPriority.STANDARD]: 10,
      [OpinionPriority.EXPEDITED]: 5,
      [OpinionPriority.RUSH]: 2,
      [OpinionPriority.URGENT]: 1,
    };
    return days[this.value];
  }

  // Get price multiplier
  getPriceMultiplier(): number {
    const multipliers: Record<OpinionPriority, number> = {
      [OpinionPriority.STANDARD]: 1.0,
      [OpinionPriority.EXPEDITED]: 1.5,
      [OpinionPriority.RUSH]: 2.0,
      [OpinionPriority.URGENT]: 3.0,
    };
    return multipliers[this.value];
  }

  isUrgent(): boolean {
    return (
      this.value === OpinionPriority.URGENT ||
      this.value === OpinionPriority.RUSH
    );
  }

  equals(other: OpinionPriorityVO): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
