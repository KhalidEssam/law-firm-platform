// ============================================
// CREATE PROVIDER PROFILE USE CASE
// ============================================

import { ProviderProfile } from '../../../../domain/provider/entities/providerprofile.entity';
import { OrganizationName } from '../../../../domain/provider/value-objects/organization-name.vo';
import { LicenseNumber } from '../../../../domain/provider/value-objects/license-number.vo';
import { VerificationStatusVO } from '../../../../domain/provider/value-objects/verfication-status.vo';
import { ContactInfo } from '../../../../domain/provider/value-objects/contact-info.vo';
import { IProviderProfileRepository } from '../../ports/repository';

export interface CreateProviderProfileDTO {
  userId: string;
  organizationName: string;
  organizationNameAr?: string;
  licenseNumber: string;
  taxNumber?: string;
  description?: string;
  descriptionAr?: string;
  businessEmail?: string;
  businessPhone?: string;
  website?: string;
}

export class CreateProviderProfileUseCase {
  constructor(private readonly repository: IProviderProfileRepository) {}

  async execute(dto: CreateProviderProfileDTO): Promise<ProviderProfile> {
    // Check if user already has a provider profile
    const existing = await this.repository.findByUserId(dto.userId);
    if (existing) {
      throw new Error('User already has a provider profile');
    }

    // Check if license number is already in use
    const existingLicense = await this.repository.findByLicenseNumber(
      dto.licenseNumber,
    );
    if (existingLicense) {
      throw new Error('License number is already in use');
    }

    const profile = ProviderProfile.create({
      userId: dto.userId,
      organizationName: OrganizationName.create({
        name: dto.organizationName,
        nameAr: dto.organizationNameAr,
      }),
      licenseNumber: LicenseNumber.create(dto.licenseNumber),
      taxNumber: dto.taxNumber,
      description: dto.description,
      descriptionAr: dto.descriptionAr,
      verificationStatus: VerificationStatusVO.create('pending'),
      isActive: false,
      contactInfo: ContactInfo.create({
        businessEmail: dto.businessEmail,
        businessPhone: dto.businessPhone,
        website: dto.website,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repository.create(profile);
  }
}
