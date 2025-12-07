// ============================================
// PRISMA REPOSITORY IMPLEMENTATIONS
// ============================================

import { PrismaClient } from '@prisma/client/extension';
import {
    ProviderSchedule,
} from '../../../core/domain/provider/entities/provider-schedule.entity';

import { ServiceType } from 'src/core/domain/provider/value-objects/service-type.vo';
import { ProviderUserRole } from 'src/core/domain/provider/value-objects/provider-user-role.vo';
import { VerificationStatus } from 'src/core/domain/provider/value-objects/verfication-status.vo';
import { TimeSlot } from 'src/core/domain/provider/value-objects/time-slot.vo';
import { Pricing } from 'src/core/domain/provider/value-objects/pricing.vo';
import { ProviderProfile } from 'src/core/domain/provider/entities/providerprofile.entity';
import { ProviderUser } from 'src/core/domain/provider/entities/provider-user.entity';
import { ProviderService } from 'src/core/domain/provider/entities/provider-service.entity';
import { OrganizationName } from 'src/core/domain/provider/value-objects/organization-name.vo';
import { LicenseNumber } from 'src/core/domain/provider/value-objects/license-number.vo';
import { ContactInfo } from 'src/core/domain/provider/value-objects/contact-info.vo';
import { VerificationStatusVO } from 'src/core/domain/provider/value-objects/verfication-status.vo';
import { WorkingDays } from 'src/core/domain/provider/value-objects/working-days.vo';
import { WorkingHours } from 'src/core/domain/provider/value-objects/working-hours.vo';
import { ProviderUserRoleVO } from 'src/core/domain/provider/value-objects/provider-user-role.vo';
import { ServiceTypeVO } from 'src/core/domain/provider/value-objects/service-type.vo';
import {
    IProviderProfileRepository,
    IProviderUserRepository,
    IProviderServiceRepository,
    IProviderScheduleRepository,
    FindProviderProfileOptions,
    ListProviderProfilesOptions,
    FindProviderUserOptions,
    ListProviderUsersOptions,
    ListProviderServicesOptions,
    ListProviderSchedulesOptions,
} from '../../../core/application/provider/ports/repository';

// ============================================
// MAPPERS (Domain <-> Persistence)
// ============================================

class ProviderProfileMapper {
    static toDomain(raw: any): ProviderProfile {
        return ProviderProfile.create(
            {
                userId: raw.userId,
                organizationName: OrganizationName.create({
                    name: raw.organizationName,
                    nameAr: raw.organizationNameAr,
                }),
                licenseNumber: LicenseNumber.create(raw.licenseNumber),
                taxNumber: raw.taxNumber,
                description: raw.description,
                descriptionAr: raw.descriptionAr,
                verificationStatus: VerificationStatusVO.create(raw.verificationStatus as VerificationStatus),
                isActive: raw.isActive,
                workingDays: raw.workingDays ? WorkingDays.create(raw.workingDays) : undefined,
                workingHours: raw.workingHours ? WorkingHours.create(raw.workingHours) : undefined,
                contactInfo: ContactInfo.create({
                    businessEmail: raw.businessEmail,
                    businessPhone: raw.businessPhone,
                    website: raw.website,
                }),
                documents: raw.documents,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
                deletedAt: raw.deletedAt,
            },
            raw.id
        );
    }

    static toPersistence(domain: ProviderProfile): any {
        return {
            id: domain.id,
            userId: domain.userId,
            organizationName: domain.organizationName.name,
            organizationNameAr: domain.organizationName.nameAr,
            licenseNumber: domain.licenseNumber.value,
            taxNumber: domain.taxNumber,
            description: domain.description,
            descriptionAr: domain.descriptionAr,
            verificationStatus: domain.verificationStatus.status,
            isActive: domain.isActive,
            workingDays: domain.workingDays?.value,
            workingHours: domain.workingHours?.value,
            businessEmail: domain.contactInfo?.businessEmail,
            businessPhone: domain.contactInfo?.businessPhone,
            website: domain.contactInfo?.website,
            documents: domain.documents,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
            deletedAt: domain.deletedAt,
        };
    }
}

class ProviderUserMapper {
    static toDomain(raw: any): ProviderUser {
        return ProviderUser.create(
            {
                providerId: raw.providerId,
                userId: raw.userId,
                role: ProviderUserRoleVO.create(raw.role as ProviderUserRole),
                specializations: raw.specializations,
                isActive: raw.isActive,
                canAcceptRequests: raw.canAcceptRequests,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
                deletedAt: raw.deletedAt,
            },
            raw.id
        );
    }

    static toPersistence(domain: ProviderUser): any {
        return {
            id: domain.id,
            providerId: domain.providerId,
            userId: domain.userId,
            role: domain.role.role,
            specializations: domain.specializations,
            isActive: domain.isActive,
            canAcceptRequests: domain.canAcceptRequests,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
            deletedAt: domain.deletedAt,
        };
    }
}

class ProviderServiceMapper {
    static toDomain(raw: any): ProviderService {
        return ProviderService.create(
            {
                providerId: raw.providerId,
                serviceType: ServiceTypeVO.create(raw.serviceType as ServiceType, raw.category),
                isActive: raw.isActive,
                pricing: raw.pricing ? Pricing.create(raw.pricing) : undefined,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
            },
            raw.id
        );
    }

    static toPersistence(domain: ProviderService): any {
        return {
            id: domain.id,
            providerId: domain.providerId,
            serviceType: domain.serviceType.type,
            category: domain.serviceType.category,
            isActive: domain.isActive,
            pricing: domain.pricing?.value,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}

class ProviderScheduleMapper {
    static toDomain(raw: any): ProviderSchedule {
        return ProviderSchedule.create(
            {
                providerId: raw.providerId,
                dayOfWeek: raw.dayOfWeek,
                timeSlot: TimeSlot.create({
                    startTime: raw.startTime,
                    endTime: raw.endTime,
                }),
                isAvailable: raw.isAvailable,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
            },
            raw.id
        );
    }

    static toPersistence(domain: ProviderSchedule): any {
        return {
            id: domain.id,
            providerId: domain.providerId,
            dayOfWeek: domain.dayOfWeek,
            startTime: domain.timeSlot.startTime,
            endTime: domain.timeSlot.endTime,
            isAvailable: domain.isAvailable,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}

// ============================================
// PRISMA IMPLEMENTATIONS
// ============================================

export class PrismaProviderProfileRepository implements IProviderProfileRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(profile: ProviderProfile): Promise<ProviderProfile> {
        const data = ProviderProfileMapper.toPersistence(profile);
        const created = await this.prisma.providerProfile.create({ data });
        return ProviderProfileMapper.toDomain(created);
    }

    async findById(id: string, options?: FindProviderProfileOptions): Promise<ProviderProfile | null> {
        const profile = await this.prisma.providerProfile.findUnique({
            where: {
                id,
                ...(options?.includeDeleted ? {} : { deletedAt: null }),
            },
        });
        return profile ? ProviderProfileMapper.toDomain(profile) : null;
    }

    async findByUserId(userId: string, options?: FindProviderProfileOptions): Promise<ProviderProfile | null> {
        const profile = await this.prisma.providerProfile.findUnique({
            where: {
                userId,
                ...(options?.includeDeleted ? {} : { deletedAt: null }),
            },
        });
        return profile ? ProviderProfileMapper.toDomain(profile) : null;
    }

    async findByLicenseNumber(licenseNumber: string): Promise<ProviderProfile | null> {
        const profile = await this.prisma.providerProfile.findUnique({
            where: { licenseNumber, deletedAt: null },
        });
        return profile ? ProviderProfileMapper.toDomain(profile) : null;
    }

    async list(options?: ListProviderProfilesOptions): Promise<ProviderProfile[]> {
        const profiles = await this.prisma.providerProfile.findMany({
            where: {
                ...(options?.verificationStatus && { verificationStatus: options.verificationStatus }),
                ...(options?.isActive !== undefined && { isActive: options.isActive }),
                ...(options?.includeDeleted ? {} : { deletedAt: null }),
            },
            take: options?.limit,
            skip: options?.offset,
            orderBy: { createdAt: 'desc' },
        });
        return profiles.map(ProviderProfileMapper.toDomain);
    }

    async count(options?: Omit<ListProviderProfilesOptions, 'limit' | 'offset'>): Promise<number> {
        return await this.prisma.providerProfile.count({
            where: {
                ...(options?.verificationStatus && { verificationStatus: options.verificationStatus }),
                ...(options?.isActive !== undefined && { isActive: options.isActive }),
                ...(options?.includeDeleted ? {} : { deletedAt: null }),
            },
        });
    }

    async update(profile: ProviderProfile): Promise<ProviderProfile> {
        const data = ProviderProfileMapper.toPersistence(profile);
        const updated = await this.prisma.providerProfile.update({
            where: { id: profile.id },
            data,
        });
        return ProviderProfileMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.providerProfile.delete({ where: { id } });
    }

    async softDelete(id: string): Promise<void> {
        await this.prisma.providerProfile.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }

    async findApprovedAndActive(options?: { limit?: number; offset?: number }): Promise<ProviderProfile[]> {
        const profiles = await this.prisma.providerProfile.findMany({
            where: {
                verificationStatus: 'approved',
                isActive: true,
                deletedAt: null,
            },
            take: options?.limit,
            skip: options?.offset,
            orderBy: { createdAt: 'desc' },
        });
        return profiles.map(ProviderProfileMapper.toDomain);
    }

    async findPendingVerification(options?: { limit?: number; offset?: number }): Promise<ProviderProfile[]> {
        const profiles = await this.prisma.providerProfile.findMany({
            where: {
                verificationStatus: 'pending',
                deletedAt: null,
            },
            take: options?.limit,
            skip: options?.offset,
            orderBy: { createdAt: 'asc' },
        });
        return profiles.map(ProviderProfileMapper.toDomain);
    }
}

export class PrismaProviderUserRepository implements IProviderUserRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(providerUser: ProviderUser): Promise<ProviderUser> {
        const data = ProviderUserMapper.toPersistence(providerUser);
        const created = await this.prisma.providerUser.create({ data });
        return ProviderUserMapper.toDomain(created);
    }

    async findById(id: string, options?: FindProviderUserOptions): Promise<ProviderUser | null> {
        const user = await this.prisma.providerUser.findUnique({
            where: {
                id,
                ...(options?.includeDeleted ? {} : { deletedAt: null }),
            },
        });
        return user ? ProviderUserMapper.toDomain(user) : null;
    }

    async findByProviderAndUser(
        providerId: string,
        userId: string,
        options?: FindProviderUserOptions
    ): Promise<ProviderUser | null> {
        const user = await this.prisma.providerUser.findUnique({
            where: {
                providerId_userId: { providerId, userId },
                ...(options?.includeDeleted ? {} : { deletedAt: null }),
            },
        });
        return user ? ProviderUserMapper.toDomain(user) : null;
    }

    async list(options?: ListProviderUsersOptions): Promise<ProviderUser[]> {
        const users = await this.prisma.providerUser.findMany({
            where: {
                ...(options?.providerId && { providerId: options.providerId }),
                ...(options?.userId && { userId: options.userId }),
                ...(options?.isActive !== undefined && { isActive: options.isActive }),
                ...(options?.canAcceptRequests !== undefined && { canAcceptRequests: options.canAcceptRequests }),
                ...(options?.includeDeleted ? {} : { deletedAt: null }),
            },
            take: options?.limit,
            skip: options?.offset,
            orderBy: { createdAt: 'desc' },
        });
        return users.map(ProviderUserMapper.toDomain);
    }

    async count(options?: Omit<ListProviderUsersOptions, 'limit' | 'offset'>): Promise<number> {
        return await this.prisma.providerUser.count({
            where: {
                ...(options?.providerId && { providerId: options.providerId }),
                ...(options?.userId && { userId: options.userId }),
                ...(options?.isActive !== undefined && { isActive: options.isActive }),
                ...(options?.canAcceptRequests !== undefined && { canAcceptRequests: options.canAcceptRequests }),
                ...(options?.includeDeleted ? {} : { deletedAt: null }),
            },
        });
    }

    async update(providerUser: ProviderUser): Promise<ProviderUser> {
        const data = ProviderUserMapper.toPersistence(providerUser);
        const updated = await this.prisma.providerUser.update({
            where: { id: providerUser.id },
            data,
        });
        return ProviderUserMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.providerUser.delete({ where: { id } });
    }

    async softDelete(id: string): Promise<void> {
        await this.prisma.providerUser.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }

    async findActiveUsersByProvider(providerId: string): Promise<ProviderUser[]> {
        const users = await this.prisma.providerUser.findMany({
            where: {
                providerId,
                isActive: true,
                deletedAt: null,
            },
        });
        return users.map(ProviderUserMapper.toDomain);
    }

    async findUsersWhoCanAcceptRequests(providerId: string): Promise<ProviderUser[]> {
        const users = await this.prisma.providerUser.findMany({
            where: {
                providerId,
                isActive: true,
                canAcceptRequests: true,
                deletedAt: null,
            },
        });
        return users.map(ProviderUserMapper.toDomain);
    }

    async existsByProviderAndUser(providerId: string, userId: string): Promise<boolean> {
        const count = await this.prisma.providerUser.count({
            where: {
                providerId,
                userId,
                deletedAt: null,
            },
        });
        return count > 0;
    }
}

export class PrismaProviderServiceRepository implements IProviderServiceRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(service: ProviderService): Promise<ProviderService> {
        const data = ProviderServiceMapper.toPersistence(service);
        const created = await this.prisma.providerService.create({ data });
        return ProviderServiceMapper.toDomain(created);
    }

    async findById(id: string): Promise<ProviderService | null> {
        const service = await this.prisma.providerService.findUnique({
            where: { id },
        });
        return service ? ProviderServiceMapper.toDomain(service) : null;
    }

    async list(options?: ListProviderServicesOptions): Promise<ProviderService[]> {
        const services = await this.prisma.providerService.findMany({
            where: {
                ...(options?.providerId && { providerId: options.providerId }),
                ...(options?.serviceType && { serviceType: options.serviceType }),
                ...(options?.category && { category: options.category }),
                ...(options?.isActive !== undefined && { isActive: options.isActive }),
            },
            take: options?.limit,
            skip: options?.offset,
            orderBy: { createdAt: 'desc' },
        });
        return services.map(ProviderServiceMapper.toDomain);
    }

    async count(options?: Omit<ListProviderServicesOptions, 'limit' | 'offset'>): Promise<number> {
        return await this.prisma.providerService.count({
            where: {
                ...(options?.providerId && { providerId: options.providerId }),
                ...(options?.serviceType && { serviceType: options.serviceType }),
                ...(options?.category && { category: options.category }),
                ...(options?.isActive !== undefined && { isActive: options.isActive }),
            },
        });
    }

    async update(service: ProviderService): Promise<ProviderService> {
        const data = ProviderServiceMapper.toPersistence(service);
        const updated = await this.prisma.providerService.update({
            where: { id: service.id },
            data,
        });
        return ProviderServiceMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.providerService.delete({ where: { id } });
    }

    async findActiveServicesByProvider(providerId: string): Promise<ProviderService[]> {
        const services = await this.prisma.providerService.findMany({
            where: {
                providerId,
                isActive: true,
            },
        });
        return services.map(ProviderServiceMapper.toDomain);
    }

    async findByProviderAndServiceType(providerId: string, serviceType: ServiceType): Promise<ProviderService[]> {
        const services = await this.prisma.providerService.findMany({
            where: {
                providerId,
                // serviceType,
            },
        });
        return services.map(ProviderServiceMapper.toDomain);
    }

    async existsByProviderAndServiceType(providerId: string, serviceType: ServiceType): Promise<boolean> {
        const count = await this.prisma.providerService.count({
            where: {
                providerId,
                // serviceType,
            },
        });
        return count > 0;
    }
}

export class PrismaProviderScheduleRepository implements IProviderScheduleRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(schedule: ProviderSchedule): Promise<ProviderSchedule> {
        const data = ProviderScheduleMapper.toPersistence(schedule);
        const created = await this.prisma.providerSchedule.create({ data });
        return ProviderScheduleMapper.toDomain(created);
    }

    async findById(id: string): Promise<ProviderSchedule | null> {
        const schedule = await this.prisma.providerSchedule.findUnique({
            where: { id },
        });
        return schedule ? ProviderScheduleMapper.toDomain(schedule) : null;
    }

    async findByProviderAndDay(providerId: string, dayOfWeek: number): Promise<ProviderSchedule | null> {
        const schedule = await this.prisma.providerSchedule.findUnique({
            where: {
                providerId_dayOfWeek: { providerId, dayOfWeek },
            },
        });
        return schedule ? ProviderScheduleMapper.toDomain(schedule) : null;
    }

    async list(options?: ListProviderSchedulesOptions): Promise<ProviderSchedule[]> {
        const schedules = await this.prisma.providerSchedule.findMany({
            where: {
                ...(options?.providerId && { providerId: options.providerId }),
                ...(options?.dayOfWeek !== undefined && { dayOfWeek: options.dayOfWeek }),
                ...(options?.isAvailable !== undefined && { isAvailable: options.isAvailable }),
            },
            take: options?.limit,
            skip: options?.offset,
            orderBy: { dayOfWeek: 'asc' },
        });
        return schedules.map(ProviderScheduleMapper.toDomain);
    }

    async count(options?: Omit<ListProviderSchedulesOptions, 'limit' | 'offset'>): Promise<number> {
        return await this.prisma.providerSchedule.count({
            where: {
                ...(options?.providerId && { providerId: options.providerId }),
                ...(options?.dayOfWeek !== undefined && { dayOfWeek: options.dayOfWeek }),
                ...(options?.isAvailable !== undefined && { isAvailable: options.isAvailable }),
            },
        });
    }

    async update(schedule: ProviderSchedule): Promise<ProviderSchedule> {
        const data = ProviderScheduleMapper.toPersistence(schedule);
        const updated = await this.prisma.providerSchedule.update({
            where: { id: schedule.id },
            data,
        });
        return ProviderScheduleMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.providerSchedule.delete({ where: { id } });
    }

    async findAllByProvider(providerId: string): Promise<ProviderSchedule[]> {
        const schedules = await this.prisma.providerSchedule.findMany({
            where: { providerId },
            orderBy: { dayOfWeek: 'asc' },
        });
        return schedules.map(ProviderScheduleMapper.toDomain);
    }

    async findAvailableSchedulesByProvider(providerId: string): Promise<ProviderSchedule[]> {
        const schedules = await this.prisma.providerSchedule.findMany({
            where: {
                providerId,
                isAvailable: true,
            },
            orderBy: { dayOfWeek: 'asc' },
        });
        return schedules.map(ProviderScheduleMapper.toDomain);
    }

    async existsByProviderAndDay(providerId: string, dayOfWeek: number): Promise<boolean> {
        const count = await this.prisma.providerSchedule.count({
            where: {
                providerId,
                dayOfWeek,
            },
        });
        return count > 0;
    }
}

// ============================================
// UNIT OF WORK IMPLEMENTATION
// ============================================

export class PrismaUnitOfWork {
    public readonly providerProfiles: IProviderProfileRepository;
    public readonly providerUsers: IProviderUserRepository;
    public readonly providerServices: IProviderServiceRepository;
    public readonly providerSchedules: IProviderScheduleRepository;

    constructor(private readonly prisma: PrismaClient) {
        this.providerProfiles = new PrismaProviderProfileRepository(prisma);
        this.providerUsers = new PrismaProviderUserRepository(prisma);
        this.providerServices = new PrismaProviderServiceRepository(prisma);
        this.providerSchedules = new PrismaProviderScheduleRepository(prisma);
    }

    async begin(): Promise<void> {
        // Prisma handles transactions differently, typically using $transaction
    }

    async commit(): Promise<void> {
        // Handled by Prisma's transaction mechanism
    }

    async rollback(): Promise<void> {
        // Handled by Prisma's transaction mechanism
    }

    // Transaction helper method
    async transaction<T>(work: (uow: PrismaUnitOfWork) => Promise<T>): Promise<T> {
        return await this.prisma.$transaction(async (tx) => {
            const transactionalUow = new PrismaUnitOfWork(tx as PrismaClient);
            return await work(transactionalUow);
        });
    }
}