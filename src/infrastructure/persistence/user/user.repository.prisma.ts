import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUserRepository } from '../../../core/application/ports/user.repository';
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
                email: user.email.getValue(),         // ✅ Extract primitive
                username: user.username.getValue(),
                fullName: user.fullName,  // ✅ Handle optional value object
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
}
