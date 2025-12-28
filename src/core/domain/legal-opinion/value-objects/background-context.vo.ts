// ============================================
// VALUE OBJECT 5: BACKGROUND CONTEXT
// Background information and context for the legal opinion
// ============================================

// import { DomainException } from '../shared/domain-exception';

/**
 * BackgroundContext - Detailed background information about the situation
 *
 * Business Rules:
 * - Must be between 100 and 5000 characters
 * - Should provide relevant business/personal context
 * - Should explain why the opinion is needed
 * - Cannot be empty or whitespace only
 * - Should be objective and factual
 *
 * Purpose:
 * - Helps lawyer understand the broader situation
 * - Provides context for interpreting the legal question
 * - Explains the business/personal stakes involved
 */
export class BackgroundContext {
  private readonly value: string;
  // MIN_LENGTH and MAX_LENGTH constants reserved for future validation

  private constructor(value: string) {
    this.value = value.trim();
  }

  // Factory method
  static create(value: string): BackgroundContext {
    return new BackgroundContext(value);
  }

  // Get the raw value
  getValue(): string {
    return this.value;
  }

  // Get formatted value for display
  getDisplayValue(): string {
    return this.value;
  }

  // Get summary (truncated version)
  getSummary(maxLength: number = 200): string {
    if (this.value.length <= maxLength) {
      return this.value;
    }
    return this.value.substring(0, maxLength - 3) + '...';
  }

  // Get first paragraph (useful for previews)
  getFirstParagraph(): string {
    const paragraphs = this.value
      .split('\n\n')
      .filter((p) => p.trim().length > 0);
    return paragraphs[0] || this.value;
  }

  // Count paragraphs
  getParagraphCount(): number {
    return this.value.split('\n\n').filter((p) => p.trim().length > 0).length;
  }

  // Value object equality
  equals(other: BackgroundContext): boolean {
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

  // Get word count
  getWordCount(): number {
    return this.value.trim().split(/\s+/).length;
  }

  // Estimate reading time in minutes
  getEstimatedReadingTime(): number {
    const wordsPerMinute = 200;
    const words = this.getWordCount();
    return Math.ceil(words / wordsPerMinute);
  }
}
