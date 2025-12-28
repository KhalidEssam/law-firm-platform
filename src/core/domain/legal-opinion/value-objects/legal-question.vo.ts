// ============================================
// VALUE OBJECT 4: LEGAL QUESTION
// The specific legal question(s) being asked
// ============================================

// import { DomainException } from '../shared/domain-exception';

/**
 * LegalQuestion - The specific legal question requiring an opinion
 *
 * Business Rules:
 * - Must be between 50 and 2000 characters
 * - Should be clear and specific
 * - Can contain multiple questions
 * - Must be phrased as a question
 * - Cannot be empty or whitespace only
 *
 * Examples:
 * - "Is our company liable for damages if we terminate this contract early?"
 * - "What are the legal implications of using this software license commercially?"
 * - "Can we enforce this non-compete clause against our former employee?"
 */
export class LegalQuestion {
  private readonly value: string;
  private static readonly MIN_LENGTH = 50;
  private static readonly MAX_LENGTH = 2000;

  private constructor(value: string) {
    this.validate(value);
    this.value = value.trim();
  }

  private validate(_value: string): void {
    // if (!value || value.trim().length === 0) {
    //   throw new DomainException('Legal question cannot be empty');
    // }
    // const trimmed = value.trim();
    // if (trimmed.length < LegalQuestion.MIN_LENGTH) {
    //   throw new DomainException(
    //     `Legal question must be at least ${LegalQuestion.MIN_LENGTH} characters. Please provide more detail.`
    //   );
    // }
    // if (trimmed.length > LegalQuestion.MAX_LENGTH) {
    //   throw new DomainException(
    //     `Legal question cannot exceed ${LegalQuestion.MAX_LENGTH} characters`
    //   );
    // }
    // // Business rule: Should contain at least one question mark
    // if (!trimmed.includes('?')) {
    //   throw new DomainException(
    //     'Legal question should be phrased as a question (include "?")'
    //   );
    // }
  }

  // Factory method
  static create(value: string): LegalQuestion {
    return new LegalQuestion(value);
  }

  // Get the raw value
  getValue(): string {
    return this.value;
  }

  // Get formatted value for display
  getDisplayValue(): string {
    return this.value;
  }

  // Extract individual questions if multiple
  getQuestions(): string[] {
    // Split by question marks and filter empty strings
    return this.value
      .split('?')
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .map((q) => q + '?');
  }

  // Count number of questions
  getQuestionCount(): number {
    return this.getQuestions().length;
  }

  // Check if contains multiple questions
  hasMultipleQuestions(): boolean {
    return this.getQuestionCount() > 1;
  }

  // Get summary (first question or truncated)
  getSummary(maxLength: number = 100): string {
    const firstQuestion = this.getQuestions()[0];
    if (firstQuestion.length <= maxLength) {
      return firstQuestion;
    }
    return firstQuestion.substring(0, maxLength - 3) + '...';
  }

  // Value object equality
  equals(other: LegalQuestion): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  // String representation
  toString(): string {
    return this.value;
  }

  // Get character count
  getLength(): number {
    return this.value.length;
  }
}
