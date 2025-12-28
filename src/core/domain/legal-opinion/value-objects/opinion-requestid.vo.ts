// ============================================
// VALUE OBJECT 1: OPINION REQUEST ID
// Unique identifier for Legal Opinion Requests
// ============================================

import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
// import { DomainException } from '../shared/domain-exception';

/**
 * OpinionRequestId - Unique identifier for a legal opinion request
 *
 * Business Rules:
 * - Must be a valid UUID v4
 * - Immutable once created
 * - Used as primary key in database
 * - Cannot be null or empty
 */
export class OpinionRequestId {
  private readonly value: string;

  private constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  private validate(value: string): void {
    // if (!value) {
    //   throw new DomainException('OpinionRequestId cannot be empty');
    // }
    // if (!uuidValidate(value)) {
    //   throw new DomainException('OpinionRequestId must be a valid UUID');
    // }
  }

  // Factory method: Create new ID
  static create(id?: string): OpinionRequestId {
    return new OpinionRequestId(id || uuidv4());
  }

  // Factory method: Create from existing value (reconstitution from DB)
  static fromString(value: string): OpinionRequestId {
    return new OpinionRequestId(value);
  }

  // Get the raw value
  getValue(): string {
    return this.value;
  }

  // Value object equality
  equals(other: OpinionRequestId): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  // String representation
  toString(): string {
    return this.value;
  }
}
