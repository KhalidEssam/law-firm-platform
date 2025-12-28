// ============================================
// PROVIDER SPECIALIZATION ENTITY
// Provider expertise mapping with specializations
// src/core/domain/specialization/entities/provider-specialization.entity.ts
// ============================================

import { AggregateRoot } from '../../base/AggregateRoot';

export interface CertificationDetail {
  name: string;
  issuingAuthority: string;
  issueDate?: Date;
  expiryDate?: Date;
  certificateNumber?: string;
}

export interface ProviderSpecializationProps {
  providerId: string;
  specializationId: string;
  experienceYears?: number;
  isCertified: boolean;
  certifications?: CertificationDetail[];
  caseCount: number;
  successRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProviderSpecialization extends AggregateRoot<ProviderSpecializationProps> {
  get providerId(): string {
    return this.props.providerId;
  }

  get specializationId(): string {
    return this.props.specializationId;
  }

  get experienceYears(): number | undefined {
    return this.props.experienceYears;
  }

  get isCertified(): boolean {
    return this.props.isCertified;
  }

  get certifications(): CertificationDetail[] | undefined {
    return this.props.certifications;
  }

  get caseCount(): number {
    return this.props.caseCount;
  }

  get successRate(): number | undefined {
    return this.props.successRate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: ProviderSpecializationProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: ProviderSpecializationProps,
    id?: string,
  ): ProviderSpecialization {
    return new ProviderSpecialization(
      {
        ...props,
        isCertified: props.isCertified ?? false,
        caseCount: props.caseCount ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public updateExperience(years: number): void {
    if (years < 0) {
      throw new Error('Experience years cannot be negative');
    }
    this.props.experienceYears = years;
    this.props.updatedAt = new Date();
  }

  public addCertification(certification: CertificationDetail): void {
    if (!this.props.certifications) {
      this.props.certifications = [];
    }
    this.props.certifications.push(certification);
    this.props.isCertified = true;
    this.props.updatedAt = new Date();
  }

  public removeCertification(certificateName: string): void {
    if (this.props.certifications) {
      this.props.certifications = this.props.certifications.filter(
        (c) => c.name !== certificateName,
      );
      if (this.props.certifications.length === 0) {
        this.props.isCertified = false;
      }
    }
    this.props.updatedAt = new Date();
  }

  public incrementCaseCount(): void {
    this.props.caseCount += 1;
    this.props.updatedAt = new Date();
  }

  public updateSuccessRate(rate: number): void {
    if (rate < 0 || rate > 100) {
      throw new Error('Success rate must be between 0 and 100');
    }
    this.props.successRate = rate;
    this.props.updatedAt = new Date();
  }

  public updateDetails(params: {
    experienceYears?: number;
    isCertified?: boolean;
    certifications?: CertificationDetail[];
    caseCount?: number;
    successRate?: number;
  }): void {
    if (params.experienceYears !== undefined)
      this.props.experienceYears = params.experienceYears;
    if (params.isCertified !== undefined)
      this.props.isCertified = params.isCertified;
    if (params.certifications !== undefined)
      this.props.certifications = params.certifications;
    if (params.caseCount !== undefined) this.props.caseCount = params.caseCount;
    if (params.successRate !== undefined)
      this.props.successRate = params.successRate;
    this.props.updatedAt = new Date();
  }
}
