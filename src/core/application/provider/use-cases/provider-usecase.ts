// ============================================
// USE CASES (APPLICATION LAYER)
// ============================================

import {
    ProviderProfile,
} from '../../../domain/provider/entities/providerprofile.entity'

import { ProviderSchedule } from '../../../domain/provider/entities/provider-schedule.entity'
import { ProviderUser } from '../../../domain/provider/entities/provider-user.entity'
import { ProviderService } from '../../../domain/provider/entities/provider-service.entity'
import { OrganizationName } from '../../../domain/provider/value-objects/organization-name.vo'
import { LicenseNumber } from '../../../domain/provider/value-objects/license-number.vo'
import { VerificationStatusVO } from '../../../domain/provider/value-objects/verfication-status.vo'
import { ContactInfo } from '../../../domain/provider/value-objects/contact-info.vo'
// import { WorkingDays } from '../../../domain/provider/value-objects/working-days.vo'
// import { WorkingHours } from '../../../domain/provider/value-objects/working-hours.vo'
import { ProviderUserRoleVO } from '../../../domain/provider/value-objects/provider-user-role.vo'
import { ServiceTypeVO } from '../../../domain/provider/value-objects/service-type.vo'
import { Pricing } from '../../../domain/provider/value-objects/pricing.vo'
import { TimeSlot } from '../../../domain/provider/value-objects/time-slot.vo'
import { ProviderUserRole } from '../../../domain/provider/value-objects/provider-user-role.vo'
import { ServiceType } from '../../../domain/provider/value-objects/service-type.vo'

import {
    IProviderProfileRepository,
    IProviderUserRepository,
    IProviderServiceRepository,
    IProviderScheduleRepository,
    // IUnitOfWork,
} from '../ports/repository';

import { ListProviderProfilesOptions } from '../ports/repository'

// ============================================
// PROVIDER PROFILE USE CASES
// ============================================

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
    constructor(private readonly repository: IProviderProfileRepository) { }

    async execute(dto: CreateProviderProfileDTO): Promise<ProviderProfile> {
        // Check if user already has a provider profile
        const existing = await this.repository.findByUserId(dto.userId);
        if (existing) {
            throw new Error('User already has a provider profile');
        }

        // Check if license number is already in use
        const existingLicense = await this.repository.findByLicenseNumber(dto.licenseNumber);
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

export class GetProviderProfileUseCase {
    constructor(private readonly repository: IProviderProfileRepository) { }

    async execute(id: string): Promise<ProviderProfile | null> {
        return await this.repository.findById(id);
    }
}

export class UpdateProviderProfileUseCase {
    constructor(private readonly repository: IProviderProfileRepository) { }

    async execute(
        id: string,
        updates: {
            description?: string;
            descriptionAr?: string;
            businessEmail?: string;
            businessPhone?: string;
            website?: string;
        }
    ): Promise<ProviderProfile> {
        const profile = await this.repository.findById(id);
        if (!profile) {
            throw new Error('Provider profile not found');
        }

        if (updates.businessEmail || updates.businessPhone || updates.website) {
            const contactInfo = ContactInfo.create({
                businessEmail: updates.businessEmail ?? profile.contactInfo?.businessEmail,
                businessPhone: updates.businessPhone ?? profile.contactInfo?.businessPhone,
                website: updates.website ?? profile.contactInfo?.website,
            });
            profile.updateContactInfo(contactInfo);
        }

        return await this.repository.update(profile);
    }
}

export class DeleteProviderProfileUseCase {
    constructor(private readonly repository: IProviderProfileRepository) { }

    async execute(id: string, soft: boolean = true): Promise<void> {
        if (soft) {
            await this.repository.softDelete(id);
        } else {
            await this.repository.delete(id);
        }
    }
}

export class ApproveProviderProfileUseCase {
    constructor(private readonly repository: IProviderProfileRepository) { }

    async execute(id: string): Promise<ProviderProfile> {
        const profile = await this.repository.findById(id);
        if (!profile) {
            throw new Error('Provider profile not found');
        }

        profile.approve();
        return await this.repository.update(profile);
    }
}

export class RejectProviderProfileUseCase {
    constructor(private readonly repository: IProviderProfileRepository) { }

    async execute(id: string): Promise<ProviderProfile> {
        const profile = await this.repository.findById(id);
        if (!profile) {
            throw new Error('Provider profile not found');
        }

        profile.reject();
        return await this.repository.update(profile);
    }
}

export class ListProviderProfilesUseCase {
    constructor(private readonly repository: IProviderProfileRepository) { }


    async execute(options?: ListProviderProfilesOptions): Promise<{ profiles: ProviderProfile[]; total: number }> {
        const profiles = await this.repository.list(options);
        const total = await this.repository.count(options);
        return { profiles, total };
    }
}

// ============================================
// PROVIDER USER USE CASES
// ============================================

export interface CreateProviderUserDTO {
    providerId: string;
    userId: string;
    role: ProviderUserRole;
    specializations?: string[];
}

export class CreateProviderUserUseCase {
    constructor(private readonly repository: IProviderUserRepository) { }

    async execute(dto: CreateProviderUserDTO): Promise<ProviderUser> {
        // Check if association already exists
        const existing = await this.repository.findByProviderAndUser(dto.providerId, dto.userId);
        if (existing) {
            throw new Error('User is already associated with this provider');
        }

        const providerUser = ProviderUser.create({
            providerId: dto.providerId,
            userId: dto.userId,
            role: ProviderUserRoleVO.create(dto.role),
            specializations: dto.specializations,
            isActive: true,
            canAcceptRequests: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return await this.repository.create(providerUser);
    }
}

export class GetProviderUserUseCase {
    constructor(private readonly repository: IProviderUserRepository) { }

    async execute(id: string): Promise<ProviderUser | null> {
        return await this.repository.findById(id);
    }
}

export class UpdateProviderUserUseCase {
    constructor(private readonly repository: IProviderUserRepository) { }

    async execute(
        id: string,
        updates: {
            specializations?: string[];
            canAcceptRequests?: boolean;
        }
    ): Promise<ProviderUser> {
        const providerUser = await this.repository.findById(id);
        if (!providerUser) {
            throw new Error('Provider user not found');
        }

        if (updates.specializations !== undefined) {
            providerUser.updateSpecializations(updates.specializations);
        }

        if (updates.canAcceptRequests !== undefined) {
            if (updates.canAcceptRequests) {
                providerUser.enableRequestAcceptance();
            } else {
                providerUser.disableRequestAcceptance();
            }
        }

        return await this.repository.update(providerUser);
    }
}

export class DeleteProviderUserUseCase {
    constructor(private readonly repository: IProviderUserRepository) { }

    async execute(id: string, soft: boolean = true): Promise<void> {
        if (soft) {
            await this.repository.softDelete(id);
        } else {
            await this.repository.delete(id);
        }
    }
}

export class ListProviderUsersByProviderUseCase {
    constructor(private readonly repository: IProviderUserRepository) { }

    async execute(
        providerId: string,
        options?: { isActive?: boolean; limit?: number; offset?: number }
    ): Promise<{ users: ProviderUser[]; total: number }> {
        const users = await this.repository.list({ providerId, ...options });
        const total = await this.repository.count({ providerId, ...options });
        return { users, total };
    }
}

// ============================================
// PROVIDER SERVICE USE CASES
// ============================================

export interface CreateProviderServiceDTO {
    providerId: string;
    serviceType: ServiceType;
    category?: string;
    pricing?: {
        amount?: number;
        currency?: string;
        type?: 'fixed' | 'hourly' | 'range';
        minAmount?: number;
        maxAmount?: number;
    };
}

export class CreateProviderServiceUseCase {
    constructor(private readonly repository: IProviderServiceRepository) { }

    async execute(dto: CreateProviderServiceDTO): Promise<ProviderService> {
        const service = ProviderService.create({
            providerId: dto.providerId,
            serviceType: ServiceTypeVO.create(dto.serviceType, dto.category),
            isActive: true,
            pricing: dto.pricing ? Pricing.create(dto.pricing) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return await this.repository.create(service);
    }
}

export class GetProviderServiceUseCase {
    constructor(private readonly repository: IProviderServiceRepository) { }

    async execute(id: string): Promise<ProviderService | null> {
        return await this.repository.findById(id);
    }
}

export class UpdateProviderServiceUseCase {
    constructor(private readonly repository: IProviderServiceRepository) { }

    async execute(
        id: string,
        updates: {
            pricing?: {
                amount?: number;
                currency?: string;
                type?: 'fixed' | 'hourly' | 'range';
                minAmount?: number;
                maxAmount?: number;
            };
            isActive?: boolean;
        }
    ): Promise<ProviderService> {
        const service = await this.repository.findById(id);
        if (!service) {
            throw new Error('Provider service not found');
        }

        if (updates.pricing !== undefined) {
            service.updatePricing(Pricing.create(updates.pricing));
        }

        if (updates.isActive !== undefined) {
            if (updates.isActive) {
                service.activate();
            } else {
                service.deactivate();
            }
        }

        return await this.repository.update(service);
    }
}

export class DeleteProviderServiceUseCase {
    constructor(private readonly repository: IProviderServiceRepository) { }

    async execute(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}

export class ListProviderServicesByProviderUseCase {
    constructor(private readonly repository: IProviderServiceRepository) { }

    async execute(
        providerId: string,
        options?: { serviceType?: ServiceType; isActive?: boolean; limit?: number; offset?: number }
    ): Promise<{ services: ProviderService[]; total: number }> {
        const services = await this.repository.list({ providerId, ...options });
        const total = await this.repository.count({ providerId, ...options });
        return { services, total };
    }
}

// ============================================
// PROVIDER SCHEDULE USE CASES
// ============================================

export interface CreateProviderScheduleDTO {
    providerId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export class CreateProviderScheduleUseCase {
    constructor(private readonly repository: IProviderScheduleRepository) { }

    async execute(dto: CreateProviderScheduleDTO): Promise<ProviderSchedule> {
        // Check if schedule already exists for this day
        const existing = await this.repository.findByProviderAndDay(dto.providerId, dto.dayOfWeek);
        if (existing) {
            throw new Error('Schedule already exists for this day');
        }

        const schedule = ProviderSchedule.create({
            providerId: dto.providerId,
            dayOfWeek: dto.dayOfWeek,
            timeSlot: TimeSlot.create({
                startTime: dto.startTime,
                endTime: dto.endTime,
            }),
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return await this.repository.create(schedule);
    }
}

export class GetProviderScheduleUseCase {
    constructor(private readonly repository: IProviderScheduleRepository) { }

    async execute(id: string): Promise<ProviderSchedule | null> {
        return await this.repository.findById(id);
    }
}

export class UpdateProviderScheduleUseCase {
    constructor(private readonly repository: IProviderScheduleRepository) { }

    async execute(
        id: string,
        updates: {
            startTime?: string;
            endTime?: string;
            isAvailable?: boolean;
        }
    ): Promise<ProviderSchedule> {
        const schedule = await this.repository.findById(id);
        if (!schedule) {
            throw new Error('Provider schedule not found');
        }

        if (updates.startTime && updates.endTime) {
            schedule.updateTimeSlot(
                TimeSlot.create({
                    startTime: updates.startTime,
                    endTime: updates.endTime,
                })
            );
        }

        if (updates.isAvailable !== undefined) {
            if (updates.isAvailable) {
                schedule.markAvailable();
            } else {
                schedule.markUnavailable();
            }
        }

        return await this.repository.update(schedule);
    }
}

export class DeleteProviderScheduleUseCase {
    constructor(private readonly repository: IProviderScheduleRepository) { }

    async execute(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}

export class ListProviderSchedulesByProviderUseCase {
    constructor(private readonly repository: IProviderScheduleRepository) { }

    async execute(
        providerId: string,
        options?: { dayOfWeek?: number; isAvailable?: boolean }
    ): Promise<ProviderSchedule[]> {
        return await this.repository.list({ providerId, ...options });
    }
}