import { PrismaService } from '../../../prisma/prisma.service';
import { IUserRepository } from '../../../core/application/ports/user.repository';
import { User } from '../../../core/domain/user/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(user: User): Promise<User> {
        const created = await this.prisma.user.create({
            data: {
                id: user.id,
                auth0Id: user.auth0Id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                gender: user.gender,
                city: user.city,
                emailVerified: user.emailVerified,
                mobileVerified: user.mobileVerified,
            },
        });
        return new User(
            created.id,
            created.email,
            created.username,
            created.auth0Id ?? undefined,
            created.fullName ?? undefined,
            created.gender ?? undefined,
            created.city ?? undefined,
            created.emailVerified,
            created.mobileVerified,
        );
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) return null;
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
    async findByAuth0Id(auth0Id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { auth0Id } });
        if (!user) return null;
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

}
