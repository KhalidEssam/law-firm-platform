// ============================================
// PRISMA SPECIALIZATION REPOSITORY IMPLEMENTATIONS
// src/infrastructure/persistence/specialization/prisma.repository.ts
// ============================================

import { PrismaClient } from '@prisma/client/extension';
import {
    Specialization,
    ProviderSpecialization,
    CertificationDetail,
} from '../../../core/domain/specialization/entities';
import {
    ISpecializationRepository,
    IProviderSpecializationRepository,
    ListSpecializationsOptions,
    ListProviderSpecializationsOptions,
    ProvidersBySpecializationOptions,
} from '../../../core/domain/specialization/ports/specialization.repository';

// ============================================
// MAPPERS
// ============================================

class SpecializationMapper {
    static toDomain(raw: any): Specialization {
        return Specialization.create(
            {
                name: raw.name,
                nameAr: raw.nameAr,
                description: raw.description,
                descriptionAr: raw.descriptionAr,
                category: raw.category,
                isActive: raw.isActive,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
            },
            raw.id
        );
    }

    static toPersistence(domain: Specialization): any {
        return {
            id: domain.id,
            name: domain.name,
            nameAr: domain.nameAr,
            description: domain.description,
            descriptionAr: domain.descriptionAr,
            category: domain.category,
            isActive: domain.isActive,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}

class ProviderSpecializationMapper {
    static toDomain(raw: any): ProviderSpecialization {
        return ProviderSpecialization.create(
            {
                providerId: raw.providerId,
                specializationId: raw.specializationId,
                experienceYears: raw.experienceYears,
                isCertified: raw.isCertified,
                certifications: raw.certifications as CertificationDetail[] | undefined,
                caseCount: raw.caseCount,
                successRate: raw.successRate,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
            },
            raw.id
        );
    }

    static toPersistence(domain: ProviderSpecialization): any {
        return {
            id: domain.id,
            providerId: domain.providerId,
            specializationId: domain.specializationId,
            experienceYears: domain.experienceYears,
            isCertified: domain.isCertified,
            certifications: domain.certifications,
            caseCount: domain.caseCount,
            successRate: domain.successRate,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}

// ============================================
// PRISMA SPECIALIZATION REPOSITORY
// ============================================

export class PrismaSpecializationRepository implements ISpecializationRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(specialization: Specialization): Promise<Specialization> {
        const data = SpecializationMapper.toPersistence(specialization);
        const created = await this.prisma.specialization.create({ data });
        return SpecializationMapper.toDomain(created);
    }

    async findById(id: string): Promise<Specialization | null> {
        const record = await this.prisma.specialization.findUnique({
            where: { id },
        });
        return record ? SpecializationMapper.toDomain(record) : null;
    }

    async findByName(name: string): Promise<Specialization | null> {
        const record = await this.prisma.specialization.findUnique({
            where: { name },
        });
        return record ? SpecializationMapper.toDomain(record) : null;
    }

    async update(specialization: Specialization): Promise<Specialization> {
        const data = SpecializationMapper.toPersistence(specialization);
        const updated = await this.prisma.specialization.update({
            where: { id: specialization.id },
            data,
        });
        return SpecializationMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.specialization.delete({ where: { id } });
    }

    async list(options?: ListSpecializationsOptions): Promise<Specialization[]> {
        const records = await this.prisma.specialization.findMany({
            where: {
                ...(options?.category && { category: options.category }),
                ...(options?.isActive !== undefined && { isActive: options.isActive }),
                ...(options?.searchTerm && {
                    OR: [
                        { name: { contains: options.searchTerm, mode: 'insensitive' } },
                        { nameAr: { contains: options.searchTerm, mode: 'insensitive' } },
                        { description: { contains: options.searchTerm, mode: 'insensitive' } },
                    ],
                }),
            },
            take: options?.limit,
            skip: options?.offset,
            orderBy: { name: 'asc' },
        });
        return records.map(SpecializationMapper.toDomain);
    }

    async count(options?: Omit<ListSpecializationsOptions, 'limit' | 'offset'>): Promise<number> {
        return await this.prisma.specialization.count({
            where: {
                ...(options?.category && { category: options.category }),
                ...(options?.isActive !== undefined && { isActive: options.isActive }),
                ...(options?.searchTerm && {
                    OR: [
                        { name: { contains: options.searchTerm, mode: 'insensitive' } },
                        { nameAr: { contains: options.searchTerm, mode: 'insensitive' } },
                        { description: { contains: options.searchTerm, mode: 'insensitive' } },
                    ],
                }),
            },
        });
    }

    async findByCategory(category: string): Promise<Specialization[]> {
        const records = await this.prisma.specialization.findMany({
            where: { category, isActive: true },
            orderBy: { name: 'asc' },
        });
        return records.map(SpecializationMapper.toDomain);
    }

    async findActiveSpecializations(): Promise<Specialization[]> {
        const records = await this.prisma.specialization.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
        return records.map(SpecializationMapper.toDomain);
    }

    async existsByName(name: string): Promise<boolean> {
        const count = await this.prisma.specialization.count({
            where: { name },
        });
        return count > 0;
    }

    async getCategories(): Promise<string[]> {
        const results = await this.prisma.specialization.findMany({
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' },
        });
        return results.map(r => r.category);
    }

    async findByCategories(categories: string[]): Promise<Specialization[]> {
        const records = await this.prisma.specialization.findMany({
            where: {
                category: { in: categories },
                isActive: true,
            },
            orderBy: { name: 'asc' },
        });
        return records.map(SpecializationMapper.toDomain);
    }
}

// ============================================
// PRISMA PROVIDER SPECIALIZATION REPOSITORY
// ============================================

export class PrismaProviderSpecializationRepository implements IProviderSpecializationRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(providerSpecialization: ProviderSpecialization): Promise<ProviderSpecialization> {
        const data = ProviderSpecializationMapper.toPersistence(providerSpecialization);
        const created = await this.prisma.providerSpecialization.create({ data });
        return ProviderSpecializationMapper.toDomain(created);
    }

    async findById(id: string): Promise<ProviderSpecialization | null> {
        const record = await this.prisma.providerSpecialization.findUnique({
            where: { id },
        });
        return record ? ProviderSpecializationMapper.toDomain(record) : null;
    }

    async findByProviderAndSpecialization(
        providerId: string,
        specializationId: string
    ): Promise<ProviderSpecialization | null> {
        const record = await this.prisma.providerSpecialization.findUnique({
            where: {
                providerId_specializationId: { providerId, specializationId },
            },
        });
        return record ? ProviderSpecializationMapper.toDomain(record) : null;
    }

    async update(providerSpecialization: ProviderSpecialization): Promise<ProviderSpecialization> {
        const data = ProviderSpecializationMapper.toPersistence(providerSpecialization);
        const updated = await this.prisma.providerSpecialization.update({
            where: { id: providerSpecialization.id },
            data,
        });
        return ProviderSpecializationMapper.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.providerSpecialization.delete({ where: { id } });
    }

    async list(options?: ListProviderSpecializationsOptions): Promise<ProviderSpecialization[]> {
        const records = await this.prisma.providerSpecialization.findMany({
            where: {
                ...(options?.providerId && { providerId: options.providerId }),
                ...(options?.specializationId && { specializationId: options.specializationId }),
                ...(options?.isCertified !== undefined && { isCertified: options.isCertified }),
                ...(options?.minExperienceYears !== undefined && {
                    experienceYears: { gte: options.minExperienceYears },
                }),
            },
            take: options?.limit,
            skip: options?.offset,
            orderBy: [
                { caseCount: 'desc' },
                { successRate: 'desc' },
            ],
        });
        return records.map(ProviderSpecializationMapper.toDomain);
    }

    async count(options?: Omit<ListProviderSpecializationsOptions, 'limit' | 'offset'>): Promise<number> {
        return await this.prisma.providerSpecialization.count({
            where: {
                ...(options?.providerId && { providerId: options.providerId }),
                ...(options?.specializationId && { specializationId: options.specializationId }),
                ...(options?.isCertified !== undefined && { isCertified: options.isCertified }),
                ...(options?.minExperienceYears !== undefined && {
                    experienceYears: { gte: options.minExperienceYears },
                }),
            },
        });
    }

    async findByProvider(providerId: string): Promise<ProviderSpecialization[]> {
        const records = await this.prisma.providerSpecialization.findMany({
            where: { providerId },
            orderBy: { caseCount: 'desc' },
        });
        return records.map(ProviderSpecializationMapper.toDomain);
    }

    async findCertifiedByProvider(providerId: string): Promise<ProviderSpecialization[]> {
        const records = await this.prisma.providerSpecialization.findMany({
            where: { providerId, isCertified: true },
            orderBy: { caseCount: 'desc' },
        });
        return records.map(ProviderSpecializationMapper.toDomain);
    }

    async getProviderExpertise(providerId: string): Promise<{
        specializations: ProviderSpecialization[];
        totalCases: number;
        averageSuccessRate: number | null;
    }> {
        const records = await this.prisma.providerSpecialization.findMany({
            where: { providerId },
        });

        const specializations = records.map(ProviderSpecializationMapper.toDomain);
        const totalCases = records.reduce((sum, r) => sum + r.caseCount, 0);

        // Calculate weighted average success rate
        let weightedSum = 0;
        let totalWeight = 0;
        for (const r of records) {
            if (r.successRate !== null && r.caseCount > 0) {
                weightedSum += r.successRate * r.caseCount;
                totalWeight += r.caseCount;
            }
        }

        const averageSuccessRate = totalWeight > 0
            ? Math.round((weightedSum / totalWeight) * 100) / 100
            : null;

        return { specializations, totalCases, averageSuccessRate };
    }

    async findBySpecialization(options: ProvidersBySpecializationOptions): Promise<ProviderSpecialization[]> {
        const records = await this.prisma.providerSpecialization.findMany({
            where: {
                specializationId: options.specializationId,
                ...(options.isCertified !== undefined && { isCertified: options.isCertified }),
                ...(options.minExperienceYears !== undefined && {
                    experienceYears: { gte: options.minExperienceYears },
                }),
                ...(options.minSuccessRate !== undefined && {
                    successRate: { gte: options.minSuccessRate },
                }),
            },
            take: options.limit,
            skip: options.offset,
            orderBy: [
                { successRate: 'desc' },
                { caseCount: 'desc' },
            ],
        });
        return records.map(ProviderSpecializationMapper.toDomain);
    }

    async countProvidersBySpecialization(specializationId: string): Promise<number> {
        return await this.prisma.providerSpecialization.count({
            where: { specializationId },
        });
    }

    async findTopProvidersBySpecialization(
        specializationId: string,
        limit: number = 10
    ): Promise<ProviderSpecialization[]> {
        const records = await this.prisma.providerSpecialization.findMany({
            where: { specializationId },
            orderBy: [
                { successRate: 'desc' },
                { caseCount: 'desc' },
                { experienceYears: 'desc' },
            ],
            take: limit,
        });
        return records.map(ProviderSpecializationMapper.toDomain);
    }

    async existsByProviderAndSpecialization(providerId: string, specializationId: string): Promise<boolean> {
        const count = await this.prisma.providerSpecialization.count({
            where: { providerId, specializationId },
        });
        return count > 0;
    }

    async deleteByProvider(providerId: string): Promise<void> {
        await this.prisma.providerSpecialization.deleteMany({
            where: { providerId },
        });
    }

    async deleteBySpecialization(specializationId: string): Promise<void> {
        await this.prisma.providerSpecialization.deleteMany({
            where: { specializationId },
        });
    }

    async incrementCaseCount(id: string): Promise<ProviderSpecialization> {
        const updated = await this.prisma.providerSpecialization.update({
            where: { id },
            data: {
                caseCount: { increment: 1 },
                updatedAt: new Date(),
            },
        });
        return ProviderSpecializationMapper.toDomain(updated);
    }

    async updateSuccessRate(id: string, successRate: number): Promise<ProviderSpecialization> {
        const updated = await this.prisma.providerSpecialization.update({
            where: { id },
            data: {
                successRate,
                updatedAt: new Date(),
            },
        });
        return ProviderSpecializationMapper.toDomain(updated);
    }
}
