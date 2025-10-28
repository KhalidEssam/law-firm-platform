// ============================================
// VALUE OBJECT 9: OPINION TYPE
// Type of legal opinion requested
// ============================================

// import { DomainException } from '../shared/domain-exception';

export enum OpinionType {
  LEGAL_ANALYSIS = 'legal_analysis',
  CONTRACT_REVIEW = 'contract_review',
  COMPLIANCE_OPINION = 'compliance_opinion',
  DUE_DILIGENCE = 'due_diligence',
  LITIGATION_RISK = 'litigation_risk',
  REGULATORY_OPINION = 'regulatory_opinion',
  CUSTOM = 'custom',
}

export class OpinionTypeVO {
  private readonly value: OpinionType;

  private constructor(value: OpinionType) {
    this.validate(value);
    this.value = value;
  }

  private validate(value: OpinionType): void {
    // if (!Object.values(OpinionType).includes(value)) {
    //   throw new DomainException(`Invalid opinion type: ${value}`);
    // }
  }

  static create(value: OpinionType | string): OpinionTypeVO {
    return new OpinionTypeVO(value as OpinionType);
  }

  getValue(): OpinionType {
    return this.value;
  }

  // Type checks
  isContractReview(): boolean {
    return this.value === OpinionType.CONTRACT_REVIEW;
  }

  isDueDiligence(): boolean {
    return this.value === OpinionType.DUE_DILIGENCE;
  }

  isCustom(): boolean {
    return this.value === OpinionType.CUSTOM;
  }

  // Get display label
  getLabel(): string {
    const labels: Record<OpinionType, string> = {
      [OpinionType.LEGAL_ANALYSIS]: 'Legal Analysis',
      [OpinionType.CONTRACT_REVIEW]: 'Contract Review',
      [OpinionType.COMPLIANCE_OPINION]: 'Compliance Opinion',
      [OpinionType.DUE_DILIGENCE]: 'Due Diligence',
      [OpinionType.LITIGATION_RISK]: 'Litigation Risk Assessment',
      [OpinionType.REGULATORY_OPINION]: 'Regulatory Opinion',
      [OpinionType.CUSTOM]: 'Custom Opinion',
    };
    return labels[this.value];
  }

  // Get description
  getDescription(): string {
    const descriptions: Record<OpinionType, string> = {
      [OpinionType.LEGAL_ANALYSIS]: 'Comprehensive analysis of a legal issue or situation',
      [OpinionType.CONTRACT_REVIEW]: 'Review and analysis of contract terms and conditions',
      [OpinionType.COMPLIANCE_OPINION]: 'Assessment of compliance with applicable laws and regulations',
      [OpinionType.DUE_DILIGENCE]: 'Legal due diligence for transactions or investments',
      [OpinionType.LITIGATION_RISK]: 'Assessment of litigation risks and potential outcomes',
      [OpinionType.REGULATORY_OPINION]: 'Opinion on regulatory requirements and compliance',
      [OpinionType.CUSTOM]: 'Custom legal opinion tailored to specific needs',
    };
    return descriptions[this.value];
  }

  // Get estimated base price multiplier (relative to standard)
  getPriceMultiplier(): number {
    const multipliers: Record<OpinionType, number> = {
      [OpinionType.LEGAL_ANALYSIS]: 1.0,
      [OpinionType.CONTRACT_REVIEW]: 1.2,
      [OpinionType.COMPLIANCE_OPINION]: 1.5,
      [OpinionType.DUE_DILIGENCE]: 2.0,
      [OpinionType.LITIGATION_RISK]: 1.8,
      [OpinionType.REGULATORY_OPINION]: 1.7,
      [OpinionType.CUSTOM]: 1.3,
    };
    return multipliers[this.value];
  }

  // Get typical turnaround time in days
  getTypicalTurnaround(): number {
    const turnarounds: Record<OpinionType, number> = {
      [OpinionType.LEGAL_ANALYSIS]: 7,
      [OpinionType.CONTRACT_REVIEW]: 5,
      [OpinionType.COMPLIANCE_OPINION]: 10,
      [OpinionType.DUE_DILIGENCE]: 14,
      [OpinionType.LITIGATION_RISK]: 7,
      [OpinionType.REGULATORY_OPINION]: 10,
      [OpinionType.CUSTOM]: 7,
    };
    return turnarounds[this.value];
  }

  equals(other: OpinionTypeVO): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}