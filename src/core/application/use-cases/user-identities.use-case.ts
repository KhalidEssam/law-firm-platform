import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthProvider } from '@prisma/client';

export interface UserIdentityDto {
  id: string;
  provider: AuthProvider;
  providerUserId: string;
  email: string | null;
  displayName: string | null;
  isPrimary: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class GetUserIdentitiesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<UserIdentityDto[]> {
    const identities = await this.prisma.userIdentity.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return identities.map((identity) => ({
      id: identity.id,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      email: identity.email,
      displayName: identity.displayName,
      isPrimary: identity.isPrimary,
      lastLoginAt: identity.lastLoginAt,
      createdAt: identity.createdAt,
    }));
  }
}

@Injectable()
export class SetPrimaryIdentityUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, identityId: string): Promise<void> {
    // Verify identity belongs to user
    const identity = await this.prisma.userIdentity.findFirst({
      where: {
        id: identityId,
        userId,
        deletedAt: null,
      },
    });

    if (!identity) {
      throw new Error('Identity not found or does not belong to user');
    }

    // Update in transaction
    await this.prisma.$transaction(async (tx) => {
      // Remove primary from all user identities
      await tx.userIdentity.updateMany({
        where: { userId, deletedAt: null },
        data: { isPrimary: false },
      });

      // Set new primary
      await tx.userIdentity.update({
        where: { id: identityId },
        data: { isPrimary: true },
      });
    });
  }
}

@Injectable()
export class UnlinkIdentityUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, identityId: string): Promise<void> {
    // Count active identities
    const identityCount = await this.prisma.userIdentity.count({
      where: { userId, deletedAt: null },
    });

    if (identityCount <= 1) {
      throw new Error(
        'Cannot unlink the only identity. User must have at least one login method.',
      );
    }

    // Verify identity belongs to user
    const identity = await this.prisma.userIdentity.findFirst({
      where: {
        id: identityId,
        userId,
        deletedAt: null,
      },
    });

    if (!identity) {
      throw new Error('Identity not found or does not belong to user');
    }

    // Soft delete the identity
    await this.prisma.userIdentity.update({
      where: { id: identityId },
      data: { deletedAt: new Date() },
    });

    // If this was the primary identity, set another as primary
    if (identity.isPrimary) {
      const nextIdentity = await this.prisma.userIdentity.findFirst({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });

      if (nextIdentity) {
        await this.prisma.userIdentity.update({
          where: { id: nextIdentity.id },
          data: { isPrimary: true },
        });
      }
    }
  }
}

/**
 * Helper function to get a friendly provider name
 */
export function getProviderDisplayName(provider: AuthProvider): string {
  const displayNames: Record<AuthProvider, string> = {
    [AuthProvider.auth0]: 'Email & Password',
    [AuthProvider.google_oauth2]: 'Google',
    [AuthProvider.facebook]: 'Facebook',
    [AuthProvider.apple]: 'Apple',
    [AuthProvider.microsoft]: 'Microsoft',
    [AuthProvider.twitter]: 'Twitter/X',
    [AuthProvider.github]: 'GitHub',
    [AuthProvider.linkedin]: 'LinkedIn',
    [AuthProvider.phone]: 'Phone Number',
    [AuthProvider.email]: 'Magic Link',
  };

  return displayNames[provider] || provider;
}
