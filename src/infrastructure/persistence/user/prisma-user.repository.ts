import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '../../../core/domain/user/user.entity';
import { Email } from '../../../core/domain/user/value-objects/email.vo';
import { Username } from '../../../core/domain/user/value-objects/username.vo';
import { City } from '../../../core/domain/user/value-objects/city.vo';
import { Biography } from '../../../core/domain/user/value-objects/biography.vo';
import { Profession } from '../../../core/domain/user/value-objects/profession.vo';
import { UserPhoto } from '../../../core/domain/user/value-objects/user-photo.vo';
import { UserAgeGroup } from '../../../core/domain/user/value-objects/age-group.vo';
import { Nationality } from '../../../core/domain/user/value-objects/nationality.vo';
import { UserEmploymentSector } from '../../../core/domain/user/value-objects/employment-sector.vo';
import type { IUserRepository, IUserFilters, IPaginationOptions, IPaginatedResult } from '../../../core/application/ports/user.repository';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) { }

    private mapToEntity(data: any): User {
        return new User(
            data.id,
            Email.create(data.email),
            Username.create(data.username),
            data.auth0Id,
            data.fullName,
            data.gender,
            data.city ? City.create(data.city) : undefined,
            data.emailVerified,
            data.mobileVerified,
            data.biography ? Biography.create(data.biography) : undefined,
            data.profession ? Profession.create(data.profession) : undefined,
            data.photo ? UserPhoto.create(data.photo) : undefined,
            data.ageGroup ? UserAgeGroup.create(data.ageGroup) : undefined,
            data.nationality ? Nationality.create(data.nationality) : undefined,
            data.employmentSector ? UserEmploymentSector.create(data.employmentSector) : undefined,
        );
    }

    private mapToPrisma(user: User): any {
        return {
            id: user.id,
            email: user.email.getValue(),
            username: user.username.getValue(),
            auth0Id: user.auth0Id,
            fullName: user.fullName,
            gender: user.gender,
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

    async create(user: User): Promise<User> {
        const created = await this.prisma.user.create({
            data: this.mapToPrisma(user),
        });
        return this.mapToEntity(created);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        return user ? this.mapToEntity(user) : null;
    }

    async findByAuth0Id(auth0Id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { auth0Id },
        });
        return user ? this.mapToEntity(user) : null;
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        return user ? this.mapToEntity(user) : null;
    }

    async findAll(filters?: IUserFilters, pagination?: IPaginationOptions): Promise<IPaginatedResult<User>> {
        const where = {
            ...(filters?.ageGroup && { ageGroup: filters.ageGroup }),
            ...(filters?.employmentSector && { employmentSector: filters.employmentSector }),
            ...(filters?.nationality && { nationality: filters.nationality }),
            ...(filters?.profession && { profession: filters.profession }),
        };

        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            items: items.map(item => this.mapToEntity(item)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async update(user: User): Promise<User> {
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: this.mapToPrisma(user),
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id },
        });
    }
}