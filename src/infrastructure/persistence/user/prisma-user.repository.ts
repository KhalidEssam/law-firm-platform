// ============================================
// PRISMA USER REPOSITORY IMPLEMENTATION
// infrastructure/persistence/repositories/PrismaUserRepository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUserRepository } from '../../../core/domain/user/ports/user.repository';
import { User } from '../../../core/domain/user/entities/user.entity';
import { Email } from '../../../core/domain/user/value-objects/email.vo';
import { Username } from '../../../core/domain/user/value-objects/username.vo';
import { City } from '../../../core/domain/user/value-objects/city.vo';
import { Biography } from '../../../core/domain/user/value-objects/biography.vo';
import { Profession } from '../../../core/domain/user/value-objects/profession.vo';
import { UserPhoto } from '../../../core/domain/user/value-objects/user-photo.vo';
import { UserAgeGroup } from '../../../core/domain/user/value-objects/age-group.vo';
import { Nationality } from '../../../core/domain/user/value-objects/nationality.vo';
import { UserEmploymentSector } from '../../../core/domain/user/value-objects/employment-sector.vo';

// Prisma 7 imports from generated path
import {
    Prisma,
    Gender as PrismaGender,
    ProfileStatus as PrismaProfileStatus,
} from '@prisma/client';

// ============================================
// ENUM MAPPERS
// ============================================

class GenderMapper {
    private static readonly toPrismaMap: Record<string, PrismaGender> = {
        'male': PrismaGender.male,
        'female': PrismaGender.female,
        'other': PrismaGender.other,
        'prefer_not_to_say': PrismaGender.prefer_not_to_say,
    };

    private static readonly toDomainMap: Record<PrismaGender, string> = {
        [PrismaGender.male]: 'male',
        [PrismaGender.female]: 'female',
        [PrismaGender.other]: 'other',
        [PrismaGender.prefer_not_to_say]: 'prefer_not_to_say',
    };

    static toPrisma(gender: string | undefined): PrismaGender | undefined {
        if (!gender) return undefined;
        return this.toPrismaMap[gender.toLowerCase()];
    }

    static toDomain(prismaGender: PrismaGender | null): string | undefined {
        if (!prismaGender) return undefined;
        return this.toDomainMap[prismaGender];
    }
}

class ProfileStatusMapper {
    private static readonly toPrismaMap: Record<string, PrismaProfileStatus> = {
        'pending': PrismaProfileStatus.pending,
        'active': PrismaProfileStatus.active,
        'suspended': PrismaProfileStatus.suspended,
        'deactivated': PrismaProfileStatus.deactivated,
    };

    private static readonly toDomainMap: Record<PrismaProfileStatus, string> = {
        [PrismaProfileStatus.pending]: 'pending',
        [PrismaProfileStatus.active]: 'active',
        [PrismaProfileStatus.suspended]: 'suspended',
        [PrismaProfileStatus.deactivated]: 'deactivated',
    };

    static toPrisma(status: string | undefined): PrismaProfileStatus | undefined {
        if (!status) return undefined;
        return this.toPrismaMap[status.toLowerCase()];
    }

    static toDomain(prismaStatus: PrismaProfileStatus | null): string | undefined {
        if (!prismaStatus) return undefined;
        return this.toDomainMap[prismaStatus];
    }
}

@Injectable()
export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ============================================
    // MAPPERS
    // ============================================

    /**
     * Map Prisma data to Domain Entity
     */
    private mapToDomain(data: any): User {
        return new User(
            data.id,
            Email.create(data.email),
            Username.create(data.username),
            data.auth0Id ?? undefined,
            data.fullName ?? undefined,
            GenderMapper.toDomain(data.gender),
            data.city ? City.create(data.city) : undefined,
            data.emailVerified,
            data.mobileVerified,
            data.biography ? Biography.create(data.biography) : undefined,
            data.profession ? Profession.create(data.profession) : undefined,
            data.photo ? UserPhoto.create(data.photo) : undefined,
            data.ageGroup ? UserAgeGroup.create(data.ageGroup) : undefined,
            data.nationality ? Nationality.create(data.nationality) : undefined,
            data.employmentSector
                ? UserEmploymentSector.create(data.employmentSector)
                : undefined,
        );
    }

    /**
     * Map Domain Entity to Prisma data
     */
    private mapToPrisma(user: User): Prisma.UserCreateInput {
        return {
            id: user.id,
            email: user.email.getValue(),
            username: user.username.getValue(),
            auth0Id: user.auth0Id,
            fullName: user.fullName,
            gender: GenderMapper.toPrisma(user.gender),
            city: user.city?.getValue(),
            emailVerified: user.emailVerified,
            mobileVerified: user.mobileVerified,
            biography: user.biography?.getValue(),
            profession: user.profession?.getValue(),
            photo: user.photo?.getUrl(),
            ageGroup: user.ageGroup?.getValue(),
            nationality: user.nationality?.getValue(),
            employmentSector: user.employmentSector?.getValue(),
        };
    }

    // ============================================
    // CREATE
    // ============================================

    async create(user: User): Promise<User> {
        const data = this.mapToPrisma(user);
        const created = await this.prisma.user.create({
            data: {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(created);
    }

    // ============================================
    // READ
    // ============================================

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id, deletedAt: null },
        });
        return user ? this.mapToDomain(user) : null;
    }

    async findByAuth0Id(auth0Id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { auth0Id, deletedAt: null },
        });
        return user ? this.mapToDomain(user) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { email, deletedAt: null },
        });
        return user ? this.mapToDomain(user) : null;
    }

    async findByUsername(username: string): Promise<User | null> {
        const user = await this.prisma.user.findFirst({
            where: { username, deletedAt: null },
        });
        return user ? this.mapToDomain(user) : null;
    }

    async emailExists(email: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { email, deletedAt: null },
        });
        return count > 0;
    }

    async usernameExists(username: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { username, deletedAt: null },
        });
        return count > 0;
    }

    async list(options?: {
        limit?: number;
        offset?: number;
        emailVerified?: boolean;
        mobileVerified?: boolean;
        gender?: string;
        city?: string;
        nationality?: string;
        ageGroup?: string;
        includeDeleted?: boolean;
    }): Promise<User[]> {
        const where: Prisma.UserWhereInput = {};

        // Build where clause
        if (options?.emailVerified !== undefined) {
            where.emailVerified = options.emailVerified;
        }
        if (options?.mobileVerified !== undefined) {
            where.mobileVerified = options.mobileVerified;
        }
        if (options?.gender) {
            where.gender = GenderMapper.toPrisma(options.gender);
        }
        if (options?.city) {
            where.city = options.city;
        }
        if (options?.nationality) {
            where.nationality = options.nationality;
        }
        if (options?.ageGroup) {
            where.ageGroup = options.ageGroup;
        }

        // Handle soft delete
        if (!options?.includeDeleted) {
            where.deletedAt = null;
        }

        const users = await this.prisma.user.findMany({
            where,
            take: options?.limit || 10,
            skip: options?.offset || 0,
            orderBy: { createdAt: 'desc' },
        });

        return users.map((u) => this.mapToDomain(u));
    }

    async count(options?: {
        emailVerified?: boolean;
        mobileVerified?: boolean;
        gender?: string;
        city?: string;
        nationality?: string;
        ageGroup?: string;
        includeDeleted?: boolean;
    }): Promise<number> {
        const where: Prisma.UserWhereInput = {};

        // Build where clause
        if (options?.emailVerified !== undefined) {
            where.emailVerified = options.emailVerified;
        }
        if (options?.mobileVerified !== undefined) {
            where.mobileVerified = options.mobileVerified;
        }
        if (options?.gender) {
            where.gender = GenderMapper.toPrisma(options.gender);
        }
        if (options?.city) {
            where.city = options.city;
        }
        if (options?.nationality) {
            where.nationality = options.nationality;
        }
        if (options?.ageGroup) {
            where.ageGroup = options.ageGroup;
        }

        // Handle soft delete
        if (!options?.includeDeleted) {
            where.deletedAt = null;
        }

        return await this.prisma.user.count({ where });
    }

    // ============================================
    // UPDATE
    // ============================================

    async update(user: User): Promise<User> {
        const data = this.mapToPrisma(user);
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async verifyEmail(userId: string): Promise<User> {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                emailVerified: true,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async verifyMobile(userId: string): Promise<User> {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                mobileVerified: true,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async updateProfileStatus(userId: string, status: string): Promise<User> {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                profileStatus: ProfileStatusMapper.toPrisma(status),
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    // ============================================
    // DELETE
    // ============================================

    async softDelete(userId: string): Promise<User> {
        const deleted = await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(deleted);
    }

    async delete(userId: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id: userId },
        });
    }

    async restore(userId: string): Promise<User> {
        const restored = await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: null,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(restored);
    }

    // ============================================
    // SEARCH
    // ============================================

    async search(
        query: string,
        options?: {
            limit?: number;
            offset?: number;
            fields?: ('email' | 'username' | 'fullName')[];
        },
    ): Promise<User[]> {
        const fields = options?.fields || ['email', 'username', 'fullName'];
        const searchConditions: Prisma.UserWhereInput[] = [];

        // Build OR conditions for each field
        if (fields.includes('email')) {
            searchConditions.push({
                email: { contains: query, mode: 'insensitive' },
            });
        }
        if (fields.includes('username')) {
            searchConditions.push({
                username: { contains: query, mode: 'insensitive' },
            });
        }
        if (fields.includes('fullName')) {
            searchConditions.push({
                fullName: { contains: query, mode: 'insensitive' },
            });
        }

        const users = await this.prisma.user.findMany({
            where: {
                AND: [{ deletedAt: null }, { OR: searchConditions }],
            },
            take: options?.limit || 10,
            skip: options?.offset || 0,
            orderBy: { createdAt: 'desc' },
        });

        return users.map((u) => this.mapToDomain(u));
    }
}