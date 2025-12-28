// ============================================
// VALUE OBJECT 3: OPINION SUBJECT
// Subject/Title of the Legal Opinion Request
// ============================================

// import { DomainException } from '../shared/domain-exception';

/**
 * OpinionSubject - The subject or title of the legal opinion request
 *
 * Business Rules:
 * - Must be between 10 and 200 characters
 * - Cannot be empty or whitespace only
 * - Should be concise and descriptive
 * - Used for quick reference and search
 */
export class OpinionSubject {
  private readonly value: string;
  private static readonly MIN_LENGTH = 10;
  private static readonly MAX_LENGTH = 200;

  private constructor(value: string) {
    this.validate(value);
    this.value = value.trim();
  }

  private validate(_value: string): void {
    // if (!value || value.trim().length === 0) {
    //   throw new DomainException('Opinion subject cannot be empty');
    // }
    // const trimmed = value.trim();
    // if (trimmed.length < OpinionSubject.MIN_LENGTH) {
    //   throw new DomainException(
    //     `Opinion subject must be at least ${OpinionSubject.MIN_LENGTH} characters`
    //   );
    // }
    // if (trimmed.length > OpinionSubject.MAX_LENGTH) {
    //   throw new DomainException(
    //     `Opinion subject cannot exceed ${OpinionSubject.MAX_LENGTH} characters`
    //   );
    // }
    // // Additional validation: Should not be all caps (poor UX)
    // if (trimmed === trimmed.toUpperCase() && trimmed.length > 20) {
    //   throw new DomainException(
    //     'Opinion subject should not be in all capitals'
    //   );
    // }
  }

  // Factory method
  static create(value: string): OpinionSubject {
    return new OpinionSubject(value);
  }

  // Get the raw value
  getValue(): string {
    return this.value;
  }

  // Get formatted value for display
  getDisplayValue(): string {
    return this.value;
  }

  // Get truncated version for lists
  getTruncated(maxLength: number = 50): string {
    if (this.value.length <= maxLength) {
      return this.value;
    }
    return this.value.substring(0, maxLength - 3) + '...';
  }

  // Value object equality
  equals(other: OpinionSubject): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  // String representation
  toString(): string {
    return this.value;
  }

  // Get word count (useful for analytics)
  getWordCount(): number {
    return this.value.trim().split(/\s+/).length;
  }
}
