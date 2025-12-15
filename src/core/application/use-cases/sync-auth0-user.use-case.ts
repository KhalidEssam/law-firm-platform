import { Injectable, Inject } from '@nestjs/common';
import { type IUserRepository } from '../../domain/user/ports/user.repository';
import { User } from '../../domain/user/entities/user.entity';
import { Email } from 'src/core/domain/user/value-objects/email.vo';
import { Username } from 'src/core/domain/user/value-objects/username.vo';
import { PrismaService } from '../../../prisma/prisma.service';

export interface SyncAuth0UserCommand {
    auth0Id: string;
    email: string;
    username: string;
    fullName?: string;
    emailVerified?: boolean;
    roles?: string[];  // Roles from Auth0 JWT token
}

export interface SyncAuth0UserResult {
    user: User;
    rolesUpdated: boolean;
    rolesSynced: string[];
}

@Injectable()
export class SyncAuth0UserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(command: SyncAuth0UserCommand): Promise<User> {
        const result = await this.executeWithRoleSync(command);
        return result.user;
    }

    /**
     * Extended execute that returns role sync information
     */
    async executeWithRoleSync(command: SyncAuth0UserCommand): Promise<SyncAuth0UserResult> {
        let user: User;
        let isNewUser = false;

        // Check if user already exists
        const existing = await this.userRepository.findByAuth0Id(command.auth0Id);

        if (existing) {
            user = existing;
        } else {
            console.log('[SyncAuth0UserUseCase] Creating new user', command.auth0Id, command.email);
            // Create new user
            user = User.create({
                auth0Id: command.auth0Id,
                email: Email.create(command.email),
                username: Username.create(command.username),
                fullName: command.fullName,
                emailVerified: command.emailVerified || false,
                mobileVerified: false,
            });
            user = await this.userRepository.create(user);
            isNewUser = true;
        }

        // Sync roles from Auth0 JWT to local database
        let rolesUpdated = false;
        let rolesSynced: string[] = [];

        if (command.roles && command.roles.length > 0) {
            const syncResult = await this.syncRolesToLocalDb(user.id, command.roles);
            rolesUpdated = syncResult.updated;
            rolesSynced = syncResult.roles;

            if (rolesUpdated) {
                console.log(`[SyncAuth0UserUseCase] Synced ${rolesSynced.length} roles from Auth0 for user ${user.id}`);
            }
        }

        return {
            user,
            rolesUpdated,
            rolesSynced,
        };
    }

    /**
     * Sync roles from Auth0 (via JWT) to local database
     * This ensures local DB always reflects Auth0's current role assignments
     */
    private async syncRolesToLocalDb(
        userId: string,
        auth0Roles: string[],
    ): Promise<{ updated: boolean; roles: string[] }> {
        // Get current local roles for this user
        const currentUserRoles = await this.prisma.userRole.findMany({
            where: { userId, deletedAt: null },
            include: { role: true },
        });
        const currentRoleNames = currentUserRoles.map(ur => ur.role.name);

        // Find roles that exist in our database
        const localRoles = await this.prisma.role.findMany({
            where: {
                name: { in: auth0Roles },
                deletedAt: null,
            },
        });
        const validAuth0RoleNames = localRoles.map(r => r.name);

        // Check if roles need updating
        const rolesToAdd = validAuth0RoleNames.filter(r => !currentRoleNames.includes(r));
        const rolesToRemove = currentRoleNames.filter(r => !validAuth0RoleNames.includes(r));

        // No changes needed
        if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
            return { updated: false, roles: currentRoleNames };
        }

        // Perform updates in a transaction
        await this.prisma.$transaction(async (tx) => {
            // Remove roles that are no longer in Auth0
            if (rolesToRemove.length > 0) {
                const roleIdsToRemove = currentUserRoles
                    .filter(ur => rolesToRemove.includes(ur.role.name))
                    .map(ur => ur.roleId);

                await tx.userRole.deleteMany({
                    where: {
                        userId,
                        roleId: { in: roleIdsToRemove },
                    },
                });
                console.log(`[SyncAuth0UserUseCase] Removed roles: ${rolesToRemove.join(', ')}`);
            }

            // Add new roles from Auth0
            if (rolesToAdd.length > 0) {
                const roleIdsToAdd = localRoles
                    .filter(r => rolesToAdd.includes(r.name))
                    .map(r => r.id);

                await tx.userRole.createMany({
                    data: roleIdsToAdd.map(roleId => ({
                        userId,
                        roleId,
                    })),
                    skipDuplicates: true,
                });
                console.log(`[SyncAuth0UserUseCase] Added roles: ${rolesToAdd.join(', ')}`);
            }
        });

        return { updated: true, roles: validAuth0RoleNames };
    }
}
