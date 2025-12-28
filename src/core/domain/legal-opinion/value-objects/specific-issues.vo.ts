// ============================================
// VALUE OBJECT: SPECIFIC ISSUES
// Specific legal issues to address in the opinion
// ============================================

// import { DomainException } from '../shared/domain-exception';

/**
 * SpecificIssues - Specific legal issues or sub-questions to address
 *
 * Business Rules:
 * - Optional field (not all opinions need this)
 * - Must be between 50 and 2000 characters if provided
 * - Should list specific issues/sub-questions
 * - Helps lawyer structure the opinion
 */
export class SpecificIssues {
  private readonly value: string;

  private constructor(value: string) {
    this.validate(value);
    this.value = value.trim();
  }

  private validate(_value: string): void {
    // if (!value || value.trim().length === 0) {
    //   throw new DomainException('Specific issues cannot be empty');
    // }
    // const trimmed = value.trim();
    // if (trimmed.length < SpecificIssues.MIN_LENGTH) {
    //   throw new DomainException(
    //     `Specific issues must be at least ${SpecificIssues.MIN_LENGTH} characters`
    //   );
    // }
    // if (trimmed.length > SpecificIssues.MAX_LENGTH) {
    //   throw new DomainException(
    //     `Specific issues cannot exceed ${SpecificIssues.MAX_LENGTH} characters`
    //   );
    // }
  }

  static create(value: string): SpecificIssues {
    return new SpecificIssues(value);
  }

  getValue(): string {
    return this.value;
  }

  // Extract individual issues if formatted as list
  getIssues(): string[] {
    const bulletPattern = /^[\s]*[-•*\d]+[.)]\s*/gm;
    const lines = this.value.split('\n');

    return lines
      .map((line) => line.replace(bulletPattern, '').trim())
      .filter((line) => line.length > 0);
  }

  getIssueCount(): number {
    return this.getIssues().length;
  }

  equals(other: SpecificIssues): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
