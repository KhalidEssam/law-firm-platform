import { Injectable, Inject, Logger } from '@nestjs/common';
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
  roles?: string[]; // Roles from Auth0 JWT token
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
function parseAuth0Provider(auth0Id: string): {
  provider: AuthProvider;
  providerUserId: string;
} {
  // Auth0 IDs format: "provider|user_id" (e.g., "google-oauth2|123456789")
  const [providerPrefix, ...rest] = auth0Id.split('|');
  const providerUserId = auth0Id; // Keep the full ID as the provider user ID

  // Map Auth0 provider strings to our enum
  const providerMap: Record<string, AuthProvider> = {
    auth0: AuthProvider.auth0,
    'google-oauth2': AuthProvider.google_oauth2,
    facebook: AuthProvider.facebook,
    apple: AuthProvider.apple,
    windowslive: AuthProvider.microsoft,
    microsoft: AuthProvider.microsoft,
    twitter: AuthProvider.twitter,
    github: AuthProvider.github,
    linkedin: AuthProvider.linkedin,
    sms: AuthProvider.phone,
    email: AuthProvider.email,
  };

  const provider =
    providerMap[providerPrefix.toLowerCase()] || AuthProvider.auth0;

  return { provider, providerUserId };
}

@Injectable()
export class SyncAuth0UserUseCase {
  private readonly logger = new Logger(SyncAuth0UserUseCase.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: SyncAuth0UserCommand): Promise<User> {
    const result = await this.executeWithRoleSync(command);
    return result.user;
  }

  /**
   * Extended execute that returns role sync information and account linking details
   */
  async executeWithRoleSync(
    command: SyncAuth0UserCommand,
  ): Promise<SyncAuth0UserResult> {
    const { provider, providerUserId } = parseAuth0Provider(command.auth0Id);

    this.logger.debug(
      `Processing login: provider=${provider}, email=${command.email}`,
    );

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
      this.logger.debug(
        `Found existing identity, user: ${existingIdentity.userId}`,
      );

      // Update last login time
      await this.prisma.userIdentity.update({
        where: { id: existingIdentity.id },
        data: { lastLoginAt: new Date() },
      });

      user = await this.userRepository.findById(existingIdentity.userId);
    } else {
      // Step 2: Identity doesn't exist - check by auth0Id on User (backwards compatibility)
      const existingByAuth0Id = await this.userRepository.findByAuth0Id(
        command.auth0Id,
      );

      if (existingByAuth0Id) {
        this.logger.debug(
          `Found user by auth0Id, migrating to identity system: ${existingByAuth0Id.id}`,
        );
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
        const existingByEmail = await this.userRepository.findByEmail(
          command.email,
        );

        if (existingByEmail) {
          // Account linking: Link new auth provider to existing user
          this.logger.debug(
            `Linking new identity (${provider}) to existing user: ${existingByEmail.id}`,
          );
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
          this.logger.debug(`Creating new user: ${command.email}`);

          user = User.create({
            auth0Id: command.auth0Id,
            email: Email.create(command.email),
            username: Username.create(
              command.username || command.email.split('@')[0],
            ),
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
      throw new Error(
        'Failed to sync user: user is null after all sync attempts',
      );
    }

    // NOTE: Local DB is the source of truth for roles.
    // Roles are NOT synced FROM Auth0 on login.
    // Admin API changes sync TO Auth0 instead (see user-role-management.use-case.ts).
    // The roles from Auth0 JWT are ignored - local DB roles take precedence.
    if (command.roles && command.roles.length > 0) {
      this.logger.debug(
        `Auth0 JWT contains roles: ${command.roles.join(', ')}, but local DB is source of truth - ignoring`,
      );
    }

    return {
      user,
      rolesUpdated: false,
      rolesSynced: [],
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
    this.logger.debug(
      `Created identity: provider=${params.provider}, userId=${params.userId}, isPrimary=${params.isPrimary}`,
    );
  }
}
