import { Injectable, Inject } from '@nestjs/common';
import { type IUserRepository } from '../../domain/user/ports/user.repository';
import { User } from '../../domain/user/entities/user.entity';
import { Email } from 'src/core/domain/user/value-objects/email.vo';
import { Username } from 'src/core/domain/user/value-objects/username.vo';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthProvider } from '@prisma/client';

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
    isNewUser: boolean;
    isNewIdentity: boolean;
    linkedToExistingAccount: boolean;
}

/**
 * Maps Auth0 connection/provider strings to our AuthProvider enum
 */
function parseAuth0Provider(auth0Id: string): { provider: AuthProvider; providerUserId: string } {
    // Auth0 IDs format: "provider|user_id" (e.g., "google-oauth2|123456789")
    const [providerPrefix, ...rest] = auth0Id.split('|');
    const providerUserId = auth0Id; // Keep the full ID as the provider user ID

    // Map Auth0 provider strings to our enum
    const providerMap: Record<string, AuthProvider> = {
        'auth0': AuthProvider.auth0,
        'google-oauth2': AuthProvider.google_oauth2,
        'facebook': AuthProvider.facebook,
        'apple': AuthProvider.apple,
        'windowslive': AuthProvider.microsoft,
        'microsoft': AuthProvider.microsoft,
        'twitter': AuthProvider.twitter,
        'github': AuthProvider.github,
        'linkedin': AuthProvider.linkedin,
        'sms': AuthProvider.phone,
        'email': AuthProvider.email,
    };

    const provider = providerMap[providerPrefix.toLowerCase()] || AuthProvider.auth0;

    return { provider, providerUserId };
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
     * Extended execute that returns role sync information and account linking details
     */
    async executeWithRoleSync(command: SyncAuth0UserCommand): Promise<SyncAuth0UserResult> {
        const { provider, providerUserId } = parseAuth0Provider(command.auth0Id);

        console.log(`[SyncAuth0UserUseCase] Processing login: provider=${provider}, email=${command.email}`);

        let user: User | null = null;
        let isNewUser = false;
        let isNewIdentity = false;
        let linkedToExistingAccount = false;

        // Step 1: Check if this identity already exists in UserIdentity table
        const existingIdentity = await this.prisma.userIdentity.findUnique({
            where: {
                provider_providerUserId: {
                    provider,
                    providerUserId,
                },
            },
            include: { user: true },
        });

        if (existingIdentity) {
            // Identity exists - return the linked user
            console.log(`[SyncAuth0UserUseCase] Found existing identity, user: ${existingIdentity.userId}`);

            // Update last login time
            await this.prisma.userIdentity.update({
                where: { id: existingIdentity.id },
                data: { lastLoginAt: new Date() },
            });

            user = await this.userRepository.findById(existingIdentity.userId);
        } else {
            // Step 2: Identity doesn't exist - check by auth0Id on User (backwards compatibility)
            const existingByAuth0Id = await this.userRepository.findByAuth0Id(command.auth0Id);

            if (existingByAuth0Id) {
                console.log(`[SyncAuth0UserUseCase] Found user by auth0Id, migrating to identity system: ${existingByAuth0Id.id}`);
                user = existingByAuth0Id;

                // Create identity record for backwards compatibility migration
                await this.createIdentity({
                    userId: user.id,
                    provider,
                    providerUserId,
                    email: command.email,
                    displayName: command.fullName,
                    isPrimary: true,
                });
                isNewIdentity = true;
            } else {
                // Step 3: Check if a user with the same email already exists
                const existingByEmail = await this.userRepository.findByEmail(command.email);

                if (existingByEmail) {
                    // Account linking: Link new auth provider to existing user
                    console.log(`[SyncAuth0UserUseCase] Linking new identity (${provider}) to existing user: ${existingByEmail.id}`);
                    user = existingByEmail;
                    linkedToExistingAccount = true;

                    // Create identity for this new auth method
                    const existingIdentitiesCount = await this.prisma.userIdentity.count({
                        where: { userId: user.id, deletedAt: null },
                    });

                    await this.createIdentity({
                        userId: user.id,
                        provider,
                        providerUserId,
                        email: command.email,
                        displayName: command.fullName,
                        isPrimary: existingIdentitiesCount === 0, // Primary if first identity
                    });
                    isNewIdentity = true;

                    // Update the user's auth0Id if not set (for backwards compatibility)
                    if (!user.auth0Id) {
                        await this.prisma.user.update({
                            where: { id: user.id },
                            data: { auth0Id: command.auth0Id },
                        });
                    }
                } else {
                    // Step 4: No existing user - create new user and identity
                    console.log(`[SyncAuth0UserUseCase] Creating new user: ${command.email}`);

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

                    // Create identity for the new user
                    await this.createIdentity({
                        userId: user.id,
                        provider,
                        providerUserId,
                        email: command.email,
                        displayName: command.fullName,
                        isPrimary: true,
                    });
                    isNewIdentity = true;
                }
            }
        }

        if (!user) {
            throw new Error('Failed to sync user: user is null after all sync attempts');
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
            isNewUser,
            isNewIdentity,
            linkedToExistingAccount,
        };
    }

    /**
     * Create a new user identity record
     */
    private async createIdentity(params: {
        userId: string;
        provider: AuthProvider;
        providerUserId: string;
        email?: string;
        displayName?: string;
        isPrimary: boolean;
    }): Promise<void> {
        await this.prisma.userIdentity.create({
            data: {
                userId: params.userId,
                provider: params.provider,
                providerUserId: params.providerUserId,
                email: params.email,
                displayName: params.displayName,
                isPrimary: params.isPrimary,
                lastLoginAt: new Date(),
            },
        });
        console.log(`[SyncAuth0UserUseCase] Created identity: provider=${params.provider}, userId=${params.userId}, isPrimary=${params.isPrimary}`);
    }

    /**
     * Normalize Auth0 role name to local DB format
     * Auth0 uses spaces (e.g., "system admin"), local DB uses underscores ("system_admin")
     */
    private normalizeRoleName(auth0RoleName: string): string {
        return auth0RoleName.toLowerCase().replace(/\s+/g, '_');
    }

    /**
     * Sync roles from Auth0 (via JWT) to local database
     * This ensures local DB always reflects Auth0's current role assignments
     */
    private async syncRolesToLocalDb(
        userId: string,
        auth0Roles: string[],
    ): Promise<{ updated: boolean; roles: string[] }> {
        // Normalize Auth0 role names to match local DB format (spaces → underscores)
        const normalizedAuth0Roles = auth0Roles.map(r => this.normalizeRoleName(r));
        console.log(`[SyncAuth0UserUseCase] Auth0 roles: ${auth0Roles.join(', ')} → Normalized: ${normalizedAuth0Roles.join(', ')}`);

        // Get current local roles for this user
        const currentUserRoles = await this.prisma.userRole.findMany({
            where: { userId, deletedAt: null },
            include: { role: true },
        });
        const currentRoleNames = currentUserRoles.map(ur => ur.role.name);

        // Find roles that exist in our database (using normalized names)
        const localRoles = await this.prisma.role.findMany({
            where: {
                name: { in: normalizedAuth0Roles },
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
