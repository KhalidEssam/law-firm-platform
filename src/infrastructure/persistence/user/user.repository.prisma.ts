import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUserRepository, IUserFilters, IPaginationOptions, IPaginatedResult } from '../../../core/application/ports/user.repository';
import { User } from '../../../core/domain/user/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) { }

    private mapToDomain(user: any): User {
        return new User(
            user.id,
            user.email,
            user.username,
            user.auth0Id ?? undefined,
            user.fullName ?? undefined,
            user.gender ?? undefined,
            user.city ?? undefined,
            user.emailVerified,
            user.mobileVerified,
        );
    }

    async create(user: User): Promise<User> {
        const created = await this.prisma.user.create({
            data: {
                id: user.id,
                auth0Id: user.auth0Id,
                email: user.email.getValue(),
                username: user.username.getValue(),
                fullName: user.fullName,
                gender: user.gender,
                city: user.city?.getValue(),
                emailVerified: user.emailVerified,
                mobileVerified: user.mobileVerified,
            },
        });

        return this.mapToDomain(created);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        return user ? this.mapToDomain(user) : null;
    }

    async findByAuth0Id(auth0Id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { auth0Id } });
        return user ? this.mapToDomain(user) : null;
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user ? this.mapToDomain(user) : null;
    }

    async update(user: User): Promise<User> {
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                fullName: user.fullName,
                gender: user.gender,
                city: user.city?.getValue(),
                emailVerified: user.emailVerified,
                mobileVerified: user.mobileVerified,
                updatedAt: new Date(),
            },
        });
        return this.mapToDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({ where: { id } });
    }

    // ✅ Updated version with filters + pagination
    async findAll(
        filters: IUserFilters = {},
        pagination: IPaginationOptions = { page: 1, limit: 10 },
    ): Promise<IPaginatedResult<User>> {
        const { page = 1, limit = 10 } = pagination;

        const where: any = {};

        if (filters.ageGroup) where.ageGroup = filters.ageGroup;
        if (filters.employmentSector) where.employmentSector = filters.employmentSector;
        if (filters.nationality) where.nationality = filters.nationality;
        if (filters.profession) where.profession = filters.profession;

        const [total, users] = await this.prisma.$transaction([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            items: users.map((u) => this.mapToDomain(u)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
