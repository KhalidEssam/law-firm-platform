// ============================================
// UPDATE PROVIDER PROFILE USE CASE
// ============================================

import { ProviderProfile } from '../../../../domain/provider/entities/providerprofile.entity';
import { ContactInfo } from '../../../../domain/provider/value-objects/contact-info.vo';
import { IProviderProfileRepository } from '../../ports/repository';

export interface UpdateProviderProfileDTO {
  description?: string;
  descriptionAr?: string;
  businessEmail?: string;
  businessPhone?: string;
  website?: string;
}

export class UpdateProviderProfileUseCase {
  constructor(private readonly repository: IProviderProfileRepository) {}

  async execute(
    id: string,
    updates: UpdateProviderProfileDTO,
  ): Promise<ProviderProfile> {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new Error('Provider profile not found');
    }

    if (updates.businessEmail || updates.businessPhone || updates.website) {
      const contactInfo = ContactInfo.create({
        businessEmail:
          updates.businessEmail ?? profile.contactInfo?.businessEmail,
        businessPhone:
          updates.businessPhone ?? profile.contactInfo?.businessPhone,
        website: updates.website ?? profile.contactInfo?.website,
      });
      profile.updateContactInfo(contactInfo);
    }

    return await this.repository.update(profile);
  }
}
