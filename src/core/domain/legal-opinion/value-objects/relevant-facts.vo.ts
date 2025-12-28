// ============================================
// VALUE OBJECT 6: RELEVANT FACTS
// Key facts relevant to the legal opinion
// ============================================

// import { DomainException } from '../shared/domain-exception';

/**
 * RelevantFacts - Specific facts that are legally relevant
 *
 * Business Rules:
 * - Must be between 100 and 5000 characters
 * - Should be objective and factual (not opinions)
 * - Should include dates, names, amounts, etc.
 * - Cannot be empty or whitespace only
 * - Should be organized and clear
 *
 * Purpose:
 * - Provides the factual foundation for legal analysis
 * - Helps lawyer identify applicable laws and precedents
 * - Distinguishes from mere opinions or speculation
 *
 * Examples of good relevant facts:
 * - "On January 15, 2025, we signed a contract with ABC Corp for SAR 500,000"
 * - "The employee was terminated on March 1, 2025 after 3 years of employment"
 * - "The software was used commercially from June 2024 to present"
 */
export class RelevantFacts {
  private readonly value: string;
  private static readonly MIN_LENGTH = 100;
  private static readonly MAX_LENGTH = 5000;

  private constructor(value: string) {
    this.validate(value);
    this.value = value.trim();
  }

  private validate(value: string): void {
    // if (!value || value.trim().length === 0) {
    //   throw new DomainException('Relevant facts cannot be empty');
    // }
    // const trimmed = value.trim();
    // if (trimmed.length < RelevantFacts.MIN_LENGTH) {
    //   throw new DomainException(
    //     `Relevant facts must be at least ${RelevantFacts.MIN_LENGTH} characters. Please provide more specific facts.`
    //   );
    // }
    // if (trimmed.length > RelevantFacts.MAX_LENGTH) {
    //   throw new DomainException(
    //     `Relevant facts cannot exceed ${RelevantFacts.MAX_LENGTH} characters`
    //   );
    // }
  }

  // Factory method
  static create(value: string): RelevantFacts {
    return new RelevantFacts(value);
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

  // Extract facts as list (if formatted with bullets or numbers)
  getFacts(): string[] {
    // Split by common bullet markers or newlines
    const bulletPattern = /^[\s]*[-•*\d]+[.)]\s*/gm;
    const lines = this.value.split('\n');

    return lines
      .map((line) => line.replace(bulletPattern, '').trim())
      .filter((line) => line.length > 0);
  }

  // Count individual facts (rough estimate)
  getFactCount(): number {
    return this.getFacts().length;
  }

  // Check if facts contain dates (useful validation)
  containsDates(): boolean {
    const datePatterns = [
      /\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /\d{1,2}\/\d{1,2}\/\d{2,4}/, // MM/DD/YYYY or DD/MM/YYYY
      /\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i, // DD Month YYYY
    ];

    return datePatterns.some((pattern) => pattern.test(this.value));
  }

  // Check if facts contain monetary amounts
  containsMonetaryAmounts(): boolean {
    const moneyPatterns = [
      /SAR\s*[\d,]+/, // Saudi Riyal
      /\$[\d,]+/, // Dollar
      /€[\d,]+/, // Euro
      /[\d,]+\s*(SAR|USD|EUR|GBP)/, // Amount with currency
    ];

    return moneyPatterns.some((pattern) => pattern.test(this.value));
  }

  // Get quality score (0-100) based on content analysis
  getQualityScore(): number {
    let score = 50; // Base score

    // Longer, detailed facts score higher
    if (this.value.length > 500) score += 10;
    if (this.value.length > 1000) score += 10;

    // Contains dates (more specific)
    if (this.containsDates()) score += 15;

    // Contains monetary amounts (more specific)
    if (this.containsMonetaryAmounts()) score += 15;

    // Well-structured (bullet points)
    if (this.getFactCount() > 3) score += 10;

    return Math.min(score, 100);
  }

  // Value object equality
  equals(other: RelevantFacts): boolean {
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
}
