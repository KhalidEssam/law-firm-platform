// ============================================
// VALUE OBJECT: CONFIDENTIALITY LEVEL
// Confidentiality classification for the opinion
// ============================================

// import { DomainException } from '../shared/domain-exception';

/**
 * ConfidentialityLevel - Classification of confidentiality for the opinion
 * 
 * Business Rules:
 * - Determines access restrictions
 * - Affects handling and storage requirements
 * - May impact pricing (higher confidentiality = higher cost)
 */
export enum ConfidentialityLevelEnum {
  STANDARD = 'standard',           // Normal attorney-client privilege
  CONFIDENTIAL = 'confidential',   // Extra confidentiality measures
  HIGHLY_CONFIDENTIAL = 'highly_confidential', // Strict access controls
  ATTORNEY_EYES_ONLY = 'attorney_eyes_only',   // Only assigned lawyer can access
}

export class ConfidentialityLevel {
  private readonly value: ConfidentialityLevelEnum;

  private constructor(value: ConfidentialityLevelEnum) {
    this.validate(value);
    this.value = value;
  }

  private validate(value: ConfidentialityLevelEnum): void {
    // if (!Object.values(ConfidentialityLevelEnum).includes(value)) {
    //   throw new DomainException(`Invalid confidentiality level: ${value}`);
    // }
  }

  static create(value: ConfidentialityLevelEnum | string): ConfidentialityLevel {
    return new ConfidentialityLevel(value as ConfidentialityLevelEnum);
  }

  static standard(): ConfidentialityLevel {
    return new ConfidentialityLevel(ConfidentialityLevelEnum.STANDARD);
  }

  static confidential(): ConfidentialityLevel {
    return new ConfidentialityLevel(ConfidentialityLevelEnum.CONFIDENTIAL);
  }

  static highlyConfidential(): ConfidentialityLevel {
    return new ConfidentialityLevel(ConfidentialityLevelEnum.HIGHLY_CONFIDENTIAL);
  }

  static attorneyEyesOnly(): ConfidentialityLevel {
    return new ConfidentialityLevel(ConfidentialityLevelEnum.ATTORNEY_EYES_ONLY);
  }

  getValue(): ConfidentialityLevelEnum {
    return this.value;
  }

  getLabel(): string {
    const labels: Record<ConfidentialityLevelEnum, string> = {
      [ConfidentialityLevelEnum.STANDARD]: 'Standard',
      [ConfidentialityLevelEnum.CONFIDENTIAL]: 'Confidential',
      [ConfidentialityLevelEnum.HIGHLY_CONFIDENTIAL]: 'Highly Confidential',
      [ConfidentialityLevelEnum.ATTORNEY_EYES_ONLY]: 'Attorney Eyes Only',
    };
    return labels[this.value];
  }

  getDescription(): string {
    const descriptions: Record<ConfidentialityLevelEnum, string> = {
      [ConfidentialityLevelEnum.STANDARD]: 'Standard attorney-client privilege',
      [ConfidentialityLevelEnum.CONFIDENTIAL]: 'Additional confidentiality measures applied',
      [ConfidentialityLevelEnum.HIGHLY_CONFIDENTIAL]: 'Strict access controls and encryption',
      [ConfidentialityLevelEnum.ATTORNEY_EYES_ONLY]: 'Only assigned attorney can access',
    };
    return descriptions[this.value];
  }

  // Get price multiplier for additional security measures
  getPriceMultiplier(): number {
    const multipliers: Record<ConfidentialityLevelEnum, number> = {
      [ConfidentialityLevelEnum.STANDARD]: 1.0,
      [ConfidentialityLevelEnum.CONFIDENTIAL]: 1.1,
      [ConfidentialityLevelEnum.HIGHLY_CONFIDENTIAL]: 1.2,
      [ConfidentialityLevelEnum.ATTORNEY_EYES_ONLY]: 1.3,
    };
    return multipliers[this.value];
  }

  requiresEncryption(): boolean {
    return this.value === ConfidentialityLevelEnum.HIGHLY_CONFIDENTIAL ||
           this.value === ConfidentialityLevelEnum.ATTORNEY_EYES_ONLY;
  }

  restrictAccessToAssignedLawyer(): boolean {
    return this.value === ConfidentialityLevelEnum.ATTORNEY_EYES_ONLY;
  }

  equals(other: ConfidentialityLevel): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}