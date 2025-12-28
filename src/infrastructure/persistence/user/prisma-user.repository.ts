// ============================================
// PRISMA USER REPOSITORY IMPLEMENTATION
// infrastructure/persistence/repositories/PrismaUserRepository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUserRepository } from '../../../core/domain/user/ports/user.repository';
import {
  User,
  ProfileStatus,
  UserProps,
} from '../../../core/domain/user/entities/user.entity';
import { Email } from '../../../core/domain/user/value-objects/email.vo';
import { Username } from '../../../core/domain/user/value-objects/username.vo';
import { City } from '../../../core/domain/user/value-objects/city.vo';
import { Biography } from '../../../core/domain/user/value-objects/biography.vo';
import { Profession } from '../../../core/domain/user/value-objects/profession.vo';
import { UserPhoto } from '../../../core/domain/user/value-objects/user-photo.vo';
import { UserAgeGroup } from '../../../core/domain/user/value-objects/age-group.vo';
import { Nationality } from '../../../core/domain/user/value-objects/nationality.vo';
import { UserEmploymentSector } from '../../../core/domain/user/value-objects/employment-sector.vo';

// Prisma 7 imports from generated path
import {
  Prisma,
  Gender as PrismaGender,
  ProfileStatus as PrismaProfileStatus,
} from '@prisma/client';

// ============================================
// ENUM MAPPERS
// ============================================

class GenderMapper {
  private static readonly toPrismaMap: Record<string, PrismaGender> = {
    male: PrismaGender.male,
    female: PrismaGender.female,
    other: PrismaGender.other,
    prefer_not_to_say: PrismaGender.prefer_not_to_say,
  };

  private static readonly toDomainMap: Record<PrismaGender, string> = {
    [PrismaGender.male]: 'male',
    [PrismaGender.female]: 'female',
    [PrismaGender.other]: 'other',
    [PrismaGender.prefer_not_to_say]: 'prefer_not_to_say',
  };

  static toPrisma(gender: string | undefined): PrismaGender | undefined {
    if (!gender) return undefined;
    return this.toPrismaMap[gender.toLowerCase()];
  }

  static toDomain(prismaGender: PrismaGender | null): string | undefined {
    if (!prismaGender) return undefined;
    return this.toDomainMap[prismaGender];
  }
}

class ProfileStatusMapper {
  private static readonly toPrismaMap: Record<
    ProfileStatus,
    PrismaProfileStatus
  > = {
    [ProfileStatus.PENDING]: PrismaProfileStatus.pending,
    [ProfileStatus.ACTIVE]: PrismaProfileStatus.active,
    [ProfileStatus.SUSPENDED]: PrismaProfileStatus.suspended,
    [ProfileStatus.DEACTIVATED]: PrismaProfileStatus.deactivated,
  };

  private static readonly toDomainMap: Record<
    PrismaProfileStatus,
    ProfileStatus
  > = {
    [PrismaProfileStatus.pending]: ProfileStatus.PENDING,
    [PrismaProfileStatus.active]: ProfileStatus.ACTIVE,
    [PrismaProfileStatus.suspended]: ProfileStatus.SUSPENDED,
    [PrismaProfileStatus.deactivated]: ProfileStatus.DEACTIVATED,
  };

  static toPrisma(status: ProfileStatus): PrismaProfileStatus {
    return this.toPrismaMap[status];
  }

  static toDomain(prismaStatus: PrismaProfileStatus): ProfileStatus {
    return this.toDomainMap[prismaStatus];
  }
}

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // MAPPERS
  // ============================================

  /**
   * Map Prisma data to Domain Entity
   */
  private mapToDomain(data: any): User {
    const props: UserProps = {
      id: data.id,
      email: Email.create(data.email),
      username: Username.create(data.username),
      auth0Id: data.auth0Id ?? undefined,
      nickname: data.nickname ?? undefined,
      fullName: data.fullName ?? undefined,
      gender: GenderMapper.toDomain(data.gender),
      city: data.city ? City.create(data.city) : undefined,
      personalEmail: data.personalEmail ?? undefined,
      emailVerified: data.emailVerified,
      mobileVerified: data.mobileVerified,
      biography: data.biography ? Biography.create(data.biography) : undefined,
      profession: data.profession
        ? Profession.create(data.profession)
        : undefined,
      photo: data.photo ? UserPhoto.create(data.photo) : undefined,
      ageGroup: data.ageGroup ? UserAgeGroup.create(data.ageGroup) : undefined,
      nationality: data.nationality
        ? Nationality.create(data.nationality)
        : undefined,
      employmentSector: data.employmentSector
        ? UserEmploymentSector.create(data.employmentSector)
        : undefined,
      profileStatus: ProfileStatusMapper.toDomain(data.profileStatus),
      loyaltyTier: data.loyaltyTier ?? undefined,
      subscriptionTier: data.subscriptionTier ?? undefined,
      pointsBalance: data.pointsBalance ?? 0,
      walletBalance: data.walletBalance ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? undefined,
    };

    return User.reconstitute(props);
  }

  /**
   * Map Domain Entity to Prisma data for create
   */
  private mapToPrismaCreate(user: User): Prisma.UserCreateInput {
    return {
      id: user.id,
      email: user.email.getValue(),
      username: user.username.getValue(),
      auth0Id: user.auth0Id,
      nickname: user.nickname,
      fullName: user.fullName,
      gender: GenderMapper.toPrisma(user.gender),
      city: user.city?.getValue(),
      personalEmail: user.personalEmail,
      emailVerified: user.emailVerified,
      mobileVerified: user.mobileVerified,
      biography: user.biography?.getValue(),
      profession: user.profession?.getValue(),
      photo: user.photo?.getUrl(),
      ageGroup: user.ageGroup?.getValue(),
      nationality: user.nationality?.getValue(),
      employmentSector: user.employmentSector?.getValue(),
      profileStatus: ProfileStatusMapper.toPrisma(user.profileStatus),
      loyaltyTier: user.loyaltyTier,
      subscriptionTier: user.subscriptionTier,
      pointsBalance: user.pointsBalance,
      walletBalance: user.walletBalance,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  /**
   * Map Domain Entity to Prisma data for update
   */
  private mapToPrismaUpdate(user: User): Prisma.UserUpdateInput {
    return {
      email: user.email.getValue(),
      username: user.username.getValue(),
      auth0Id: user.auth0Id,
      nickname: user.nickname,
      fullName: user.fullName,
      gender: GenderMapper.toPrisma(user.gender),
      city: user.city?.getValue(),
      personalEmail: user.personalEmail,
      emailVerified: user.emailVerified,
      mobileVerified: user.mobileVerified,
      biography: user.biography?.getValue(),
      profession: user.profession?.getValue(),
      photo: user.photo?.getUrl(),
      ageGroup: user.ageGroup?.getValue(),
      nationality: user.nationality?.getValue(),
      employmentSector: user.employmentSector?.getValue(),
      profileStatus: ProfileStatusMapper.toPrisma(user.profileStatus),
      loyaltyTier: user.loyaltyTier,
      subscriptionTier: user.subscriptionTier,
      pointsBalance: user.pointsBalance,
      walletBalance: user.walletBalance,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  // ============================================
  // CREATE
  // ============================================

  async create(user: User): Promise<User> {
    const data = this.mapToPrismaCreate(user);
    const created = await this.prisma.user.create({ data });
    return this.mapToDomain(created);
  }

  // ============================================
  // READ
  // ============================================

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    return user ? this.mapToDomain(user) : null;
  }

  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { auth0Id, deletedAt: null },
    });
    return user ? this.mapToDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
    return user ? this.mapToDomain(user) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { username, deletedAt: null },
    });
    return user ? this.mapToDomain(user) : null;
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email, deletedAt: null },
    });
    return count > 0;
  }

  async usernameExists(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username, deletedAt: null },
    });
    return count > 0;
  }

  async list(options?: {
    limit?: number;
    offset?: number;
    emailVerified?: boolean;
    mobileVerified?: boolean;
    gender?: string;
    city?: string;
    nationality?: string;
    ageGroup?: string;
    profileStatus?: ProfileStatus;
    includeDeleted?: boolean;
  }): Promise<User[]> {
    const where: Prisma.UserWhereInput = {};

    // Build where clause
    if (options?.emailVerified !== undefined) {
      where.emailVerified = options.emailVerified;
    }
    if (options?.mobileVerified !== undefined) {
      where.mobileVerified = options.mobileVerified;
    }
    if (options?.gender) {
      where.gender = GenderMapper.toPrisma(options.gender);
    }
    if (options?.city) {
      where.city = options.city;
    }
    if (options?.nationality) {
      where.nationality = options.nationality;
    }
    if (options?.ageGroup) {
      where.ageGroup = options.ageGroup;
    }
    if (options?.profileStatus) {
      where.profileStatus = ProfileStatusMapper.toPrisma(options.profileStatus);
    }

    // Handle soft delete
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    const users = await this.prisma.user.findMany({
      where,
      take: options?.limit || 10,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.mapToDomain(u));
  }

  async count(options?: {
    emailVerified?: boolean;
    mobileVerified?: boolean;
    gender?: string;
    city?: string;
    nationality?: string;
    ageGroup?: string;
    profileStatus?: ProfileStatus;
    includeDeleted?: boolean;
  }): Promise<number> {
    const where: Prisma.UserWhereInput = {};

    // Build where clause
    if (options?.emailVerified !== undefined) {
      where.emailVerified = options.emailVerified;
    }
    if (options?.mobileVerified !== undefined) {
      where.mobileVerified = options.mobileVerified;
    }
    if (options?.gender) {
      where.gender = GenderMapper.toPrisma(options.gender);
    }
    if (options?.city) {
      where.city = options.city;
    }
    if (options?.nationality) {
      where.nationality = options.nationality;
    }
    if (options?.ageGroup) {
      where.ageGroup = options.ageGroup;
    }
    if (options?.profileStatus) {
      where.profileStatus = ProfileStatusMapper.toPrisma(options.profileStatus);
    }

    // Handle soft delete
    if (!options?.includeDeleted) {
      where.deletedAt = null;
    }

    return await this.prisma.user.count({ where });
  }

  // ============================================
  // UPDATE
  // ============================================

  async update(user: User): Promise<User> {
    const data = this.mapToPrismaUpdate(user);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data,
    });
    return this.mapToDomain(updated);
  }

  async verifyEmail(userId: string): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async verifyMobile(userId: string): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        mobileVerified: true,
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async updateProfileStatus(
    userId: string,
    status: ProfileStatus,
  ): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profileStatus: ProfileStatusMapper.toPrisma(status),
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  // ============================================
  // BALANCE OPERATIONS
  // ============================================

  async updatePointsBalance(userId: string, points: number): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        pointsBalance: points,
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async updateWalletBalance(userId: string, balance: number): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: balance,
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async incrementPoints(userId: string, points: number): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        pointsBalance: { increment: points },
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async decrementPoints(userId: string, points: number): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        pointsBalance: { decrement: points },
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async incrementWallet(userId: string, amount: number): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: { increment: amount },
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async decrementWallet(userId: string, amount: number): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: { decrement: amount },
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  // ============================================
  // DELETE
  // ============================================

  async softDelete(userId: string): Promise<User> {
    const deleted = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(deleted);
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async restore(userId: string): Promise<User> {
    const restored = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(restored);
  }

  // ============================================
  // SEARCH
  // ============================================

  async search(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
      fields?: ('email' | 'username' | 'fullName' | 'nickname')[];
    },
  ): Promise<User[]> {
    const fields = options?.fields || [
      'email',
      'username',
      'fullName',
      'nickname',
    ];
    const searchConditions: Prisma.UserWhereInput[] = [];

    // Build OR conditions for each field
    if (fields.includes('email')) {
      searchConditions.push({
        email: { contains: query, mode: 'insensitive' },
      });
    }
    if (fields.includes('username')) {
      searchConditions.push({
        username: { contains: query, mode: 'insensitive' },
      });
    }
    if (fields.includes('fullName')) {
      searchConditions.push({
        fullName: { contains: query, mode: 'insensitive' },
      });
    }
    if (fields.includes('nickname')) {
      searchConditions.push({
        nickname: { contains: query, mode: 'insensitive' },
      });
    }

    const users = await this.prisma.user.findMany({
      where: {
        AND: [{ deletedAt: null }, { OR: searchConditions }],
      },
      take: options?.limit || 10,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.mapToDomain(u));
  }
}
