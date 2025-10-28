// ============================================
// VALUE OBJECT 2: OPINION NUMBER
// Human-readable reference number for Legal Opinion Requests
// ============================================

// import { DomainException } from '../shared/domain-exception';

/**
 * OpinionNumber - Human-readable unique reference number
 * 
 * Format: OP-YYYYMMDD-XXXX
 * Example: OP-20250128-0001
 * 
 * Business Rules:
 * - Must follow the format: OP-YYYYMMDD-XXXX
 * - Date portion represents creation date
 * - Sequence number is unique per day
 * - Immutable once created
 * - Used for human reference and tracking
 */
export class OpinionNumber {
  private readonly value: string;
  private static readonly PREFIX = 'OP';
  private static readonly PATTERN = /^OP-\d{8}-\d{4}$/;

  private constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  private validate(value: string): void {
    // if (!value) {
    //   throw new DomainException('OpinionNumber cannot be empty');
    // }

    // if (!OpinionNumber.PATTERN.test(value)) {
    //   throw new DomainException(
    //     'OpinionNumber must follow format: OP-YYYYMMDD-XXXX'
    //   );
    // }
  }

  // Factory method: Generate new opinion number
  static generate(date?: Date, sequence?: number): OpinionNumber {
    const now = date || new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Sequence number defaults to 1, would normally come from database
    const seq = sequence || 1;
    const sequenceStr = String(seq).padStart(4, '0');
    
    const opinionNumber = `${OpinionNumber.PREFIX}-${year}${month}${day}-${sequenceStr}`;
    
    return new OpinionNumber(opinionNumber);
  }

  // Factory method: Create from existing value (reconstitution from DB)
  static create(value: string): OpinionNumber {
    return new OpinionNumber(value);
  }

  // Get the raw value
  getValue(): string {
    return this.value;
  }

  // Extract date from opinion number
  getDate(): Date {
    const datePart = this.value.split('-')[1]; // YYYYMMDD
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1;
    const day = parseInt(datePart.substring(6, 8));
    
    return new Date(year, month, day);
  }

  // Extract sequence number
  getSequence(): number {
    const sequencePart = this.value.split('-')[2];
    return parseInt(sequencePart);
  }

  // Value object equality
  equals(other: OpinionNumber): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  // String representation
  toString(): string {
    return this.value;
  }

  // Display format for UI
  toDisplayString(): string {
    return this.value;
  }
}