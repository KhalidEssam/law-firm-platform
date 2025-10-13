import { IAuthRepository } from '../../../auth/auth.repository';
import { Auth } from '../../../auth/auth.entity';
import { PrismaService } from '../../../prisma/prisma.service'; // your Prisma service
import { Injectable } from '@nestjs/common';

@Injectable()

export class AuthRepository implements IAuthRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByExternalId(externalId: string): Promise<Auth | null> {
        const user = await this.prisma.user.findUnique({
            where: { auth0Id: externalId },
            include: {
                roles: { include: { role: true } }, // ✅ include the Role object
            },
        });

        if (!user || !user.auth0Id) return null;

        const roleNames = user.roles.map(r => r.role.name); // use r.role.name

        return new Auth(user.id, user.auth0Id, user.email, roleNames);
    }

    async save(auth: Auth): Promise<void> {
        await this.prisma.user.upsert({
            where: { id: auth.userId },
            update: {
                email: auth.email,
                auth0Id: auth.externalId,
                roles: {
                    // Remove old roles and recreate
                    deleteMany: {},
                    create: auth.roles.map((roleName) => ({
                        role: { connect: { name: roleName } },
                    })),
                },
            },
            create: {
                id: auth.userId,
                email: auth.email,
                auth0Id: auth.externalId,
                username: auth.email, // temporary username
                roles: {
                    create: auth.roles.map((roleName) => ({
                        role: { connect: { name: roleName } },
                    })),
                },
            },
        });
    }
}
