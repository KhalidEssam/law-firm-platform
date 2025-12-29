// ============================================
// PAYMENT METHOD PRISMA REPOSITORY
// Infrastructure Layer - Database Adapter
// ============================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IPaymentMethodRepository,
  PaymentMethodFilters,
  PaginationParams,
  PaginatedResult,
  PaginationMeta,
  PaymentMethodStatistics,
} from '../../../core/domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../core/domain/payment-method/entities/payment-method.entities';
import {
  PaymentMethodId,
  UserId,
  PaymentMethodType,
  PaymentMethodTypeEnum,
  PaymentMethodDetailsFactory,
  PaymentNickname,
  // CardDetails,
} from '../../../core/domain/payment-method/value-objects/payment-method.vo';
import {
  PaymentMethod as PrismaPaymentMethod,
  PaymentMethodType as PrismaPaymentMethodType,
  Prisma,
} from '@prisma/client';

// ============================================
// PAYMENT METHOD TYPE MAPPER
// ============================================
class PaymentMethodTypeMapper {
  private static readonly toPrismaMap: Record<
    PaymentMethodTypeEnum,
    PrismaPaymentMethodType
  > = {
    [PaymentMethodTypeEnum.CREDIT_CARD]: PrismaPaymentMethodType.credit_card,
    [PaymentMethodTypeEnum.DEBIT_CARD]: PrismaPaymentMethodType.debit_card,
    [PaymentMethodTypeEnum.WALLET]: PrismaPaymentMethodType.wallet,
    [PaymentMethodTypeEnum.BANK_TRANSFER]:
      PrismaPaymentMethodType.bank_transfer,
    [PaymentMethodTypeEnum.GOOGLE_PAY]: PrismaPaymentMethodType.wallet,
    [PaymentMethodTypeEnum.APPLE_PAY]: PrismaPaymentMethodType.wallet,
    [PaymentMethodTypeEnum.MADA]: PrismaPaymentMethodType.wallet,
  };

  private static readonly toDomainMap: Record<
    PrismaPaymentMethodType,
    PaymentMethodTypeEnum
  > = {
    [PrismaPaymentMethodType.credit_card]: PaymentMethodTypeEnum.CREDIT_CARD,
    [PrismaPaymentMethodType.debit_card]: PaymentMethodTypeEnum.DEBIT_CARD,
    [PrismaPaymentMethodType.wallet]: PaymentMethodTypeEnum.WALLET,
    [PrismaPaymentMethodType.bank_transfer]:
      PaymentMethodTypeEnum.BANK_TRANSFER,
    [PrismaPaymentMethodType.mada]: PaymentMethodTypeEnum.MADA,
    [PrismaPaymentMethodType.google_pay]: PaymentMethodTypeEnum.GOOGLE_PAY,
    [PrismaPaymentMethodType.apple_pay]: PaymentMethodTypeEnum.APPLE_PAY,
  };

  static toPrisma(type: PaymentMethodType): PrismaPaymentMethodType {
    return this.toPrismaMap[type.getValue() as PaymentMethodTypeEnum];
  }

  static toPrismaFromString(type: string): PrismaPaymentMethodType {
    return type as PrismaPaymentMethodType;
  }

  static toDomain(prismaType: PrismaPaymentMethodType): PaymentMethodType {
    return PaymentMethodType.create(this.toDomainMap[prismaType]);
  }
}

@Injectable()
export class PrismaPaymentMethodRepository implements IPaymentMethodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(paymentMethod: PaymentMethod): Promise<PaymentMethod> {
    const data = this.toPrisma(paymentMethod);

    const created = await this.prisma.paymentMethod.create({
      data,
    });

    return this.toDomain(created);
  }

  async update(paymentMethod: PaymentMethod): Promise<PaymentMethod> {
    const data = this.toPrisma(paymentMethod);

    const updated = await this.prisma.paymentMethod.update({
      where: { id: paymentMethod.id.getValue() },
      data,
    });

    return this.toDomain(updated);
  }

  async findById(id: PaymentMethodId): Promise<PaymentMethod | null> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: id.getValue() },
    });

    if (!paymentMethod) return null;

    return this.toDomain(paymentMethod);
  }

  async findByUserId(
    userId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<PaymentMethod>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const where = {
      userId: userId.getValue(),
    };

    const [data, total] = await Promise.all([
      this.prisma.paymentMethod.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.paymentMethod.count({ where }),
    ]);

    return {
      data: data.map((pm) => this.toDomain(pm)),
      pagination: this.buildPaginationMeta(page, limit, total),
    };
  }

  async findDefaultByUserId(userId: UserId): Promise<PaymentMethod | null> {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: {
        userId: userId.getValue(),
        isDefault: true,
        deletedAt: null,
      },
    });

    if (!paymentMethod) return null;

    return this.toDomain(paymentMethod);
  }

  async findActiveByUserId(
    userId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<PaymentMethod>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const where = {
      userId: userId.getValue(),
      isActive: true,
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      this.prisma.paymentMethod.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.paymentMethod.count({ where }),
    ]);

    return {
      data: data.map((pm) => this.toDomain(pm)),
      pagination: this.buildPaginationMeta(page, limit, total),
    };
  }

  async findByType(
    type: PaymentMethodType,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<PaymentMethod>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const where: Prisma.PaymentMethodWhereInput = {
      type: PaymentMethodTypeMapper.toPrisma(type),
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      this.prisma.paymentMethod.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.paymentMethod.count({ where }),
    ]);

    return {
      data: data.map((pm) => this.toDomain(pm)),
      pagination: this.buildPaginationMeta(page, limit, total),
    };
  }

  async findExpiringSoon(
    days: number = 30,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<PaymentMethod>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    // Calculate expiry threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    // This is a simplified version - in production, you'd query JSON fields properly
    // For now, we'll fetch all cards and filter in memory (not ideal for large datasets)
    const allCards = await this.prisma.paymentMethod.findMany({
      where: {
        type: { in: ['credit_card', 'debit_card'] },
        deletedAt: null,
      },
      orderBy: { [sortBy]: sortOrder },
    });

    // Filter expiring cards
    const expiringCards = allCards.filter((pm) => {
      try {
        const details = pm.details;
        if (!details || typeof details !== 'object' || Array.isArray(details))
          return false;

        const detailsObj = details as Record<string, any>;
        if (!detailsObj.data || typeof detailsObj.data !== 'object')
          return false;

        const expiryMonth = parseInt(detailsObj.data.expiryMonth);
        const expiryYear = parseInt(detailsObj.data.expiryYear);

        if (!expiryMonth || !expiryYear) return false;

        const expiryDate = new Date(expiryYear, expiryMonth - 1, 1);
        const now = new Date();

        return expiryDate > now && expiryDate <= thresholdDate;
      } catch {
        return false;
      }
    });

    const total = expiringCards.length;
    const paginatedData = expiringCards.slice(skip, skip + limit);

    return {
      data: paginatedData.map((pm) => this.toDomain(pm)),
      pagination: this.buildPaginationMeta(page, limit, total),
    };
  }

  async findAll(
    filters: PaymentMethodFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<PaymentMethod>> {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.type) {
      if (Array.isArray(filters.type)) {
        where.type = { in: filters.type };
      } else {
        where.type = filters.type;
      }
    }

    if (filters.isDefault !== undefined) {
      where.isDefault = filters.isDefault;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {};
      if (filters.createdFrom) {
        where.createdAt.gte = filters.createdFrom;
      }
      if (filters.createdTo) {
        where.createdAt.lte = filters.createdTo;
      }
    }

    if (filters.lastUsedFrom || filters.lastUsedTo) {
      where.lastUsedAt = {};
      if (filters.lastUsedFrom) {
        where.lastUsedAt.gte = filters.lastUsedFrom;
      }
      if (filters.lastUsedTo) {
        where.lastUsedAt.lte = filters.lastUsedTo;
      }
    }

    // Exclude deleted unless explicitly requested
    if (!filters.searchTerm || !filters.searchTerm.includes('deleted')) {
      where.deletedAt = null;
    }

    const [data, total] = await Promise.all([
      this.prisma.paymentMethod.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.paymentMethod.count({ where }),
    ]);

    return {
      data: data.map((pm) => this.toDomain(pm)),
      pagination: this.buildPaginationMeta(page, limit, total),
    };
  }

  async delete(id: PaymentMethodId): Promise<boolean> {
    try {
      await this.prisma.paymentMethod.update({
        where: { id: id.getValue() },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async hardDelete(id: PaymentMethodId): Promise<boolean> {
    try {
      await this.prisma.paymentMethod.delete({
        where: { id: id.getValue() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: PaymentMethodId): Promise<boolean> {
    const count = await this.prisma.paymentMethod.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async existsDefaultForUser(userId: UserId): Promise<boolean> {
    const count = await this.prisma.paymentMethod.count({
      where: {
        userId: userId.getValue(),
        isDefault: true,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async countByUserId(userId: UserId): Promise<number> {
    return await this.prisma.paymentMethod.count({
      where: {
        userId: userId.getValue(),
        deletedAt: null,
      },
    });
  }

  async count(filters?: PaymentMethodFilters): Promise<number> {
    const where: any = { deletedAt: null };

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        where.type = { in: filters.type };
      } else {
        where.type = filters.type;
      }
    }

    if (filters?.isDefault !== undefined) {
      where.isDefault = filters.isDefault;
    }

    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return await this.prisma.paymentMethod.count({ where });
  }

  async getStatistics(
    filters?: PaymentMethodFilters,
  ): Promise<PaymentMethodStatistics> {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        where.type = { in: filters.type };
      } else {
        where.type = filters.type;
      }
    }

    const [total, paymentMethods] = await Promise.all([
      this.prisma.paymentMethod.count({ where }),
      this.prisma.paymentMethod.findMany({
        where,
        select: {
          type: true,
          isActive: true,
          isDefault: true,
          deletedAt: true,
          details: true,
        },
      }),
    ]);
    const byType: Record<string, number> = {};
    let active = 0;
    let inactive = 0;
    let verified = 0;
    let unverified = 0;
    let deleted = 0;
    let defaultMethods = 0;
    let totalFailedAttempts = 0;
    let expiringSoon = 0;
    let expired = 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const pm of paymentMethods) {
      // Count by type
      byType[pm.type] = (byType[pm.type] || 0) + 1;

      // Extract details JSON
      const details = pm.details as any;
      const isVerified = details?.isVerified ?? false;

      // Count by status
      if (pm.isActive) active++;
      else inactive++;

      if (isVerified) verified++;
      else unverified++;

      if (pm.deletedAt) deleted++;

      if (pm.isDefault) defaultMethods++;

      // Check expiry for cards
      if (['credit_card', 'debit_card', 'mada'].includes(pm.type)) {
        try {
          const details = pm.details as any;
          if (details && details.data) {
            const expiryMonth = parseInt(details.data.expiryMonth);
            const expiryYear = parseInt(details.data.expiryYear);

            if (expiryMonth && expiryYear) {
              const expiryDate = new Date(expiryYear, expiryMonth - 1, 1);

              if (expiryDate <= now) {
                expired++;
              } else if (expiryDate <= thirtyDaysFromNow) {
                expiringSoon++;
              }
            }
          }
        } catch {
          // Skip invalid data
        }
      }
    }

    // Get total failed attempts from details JSON
    for (const pm of paymentMethods) {
      try {
        const details = pm.details as any;
        if (details && details.failedAttempts) {
          totalFailedAttempts += details.failedAttempts;
        }
      } catch {
        // Skip invalid data
      }
    }

    return {
      total,
      byType,
      byStatus: {
        active,
        inactive,
        verified,
        unverified,
        deleted,
      },
      totalFailedAttempts,
      expiringSoon,
      expired,
      defaultMethods,
    };
  }

  async unsetAllDefaultsForUser(userId: UserId): Promise<void> {
    await this.prisma.paymentMethod.updateMany({
      where: {
        userId: userId.getValue(),
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  }

  // ============================================
  // MAPPING METHODS
  // ============================================

  private toPrisma(paymentMethod: PaymentMethod): any {
    const detailsJson = PaymentMethodDetailsFactory.toJSON(
      paymentMethod.details,
    );

    // Store extra fields in the details JSON since Prisma schema is minimal
    const enrichedDetails = {
      ...detailsJson,
      nickname: paymentMethod.nickname?.getValue(),
      isVerified: paymentMethod.isVerified,
      lastUsedAt: paymentMethod.lastUsedAt?.toISOString(),
      failedAttempts: paymentMethod.failedAttempts,
    };

    return {
      id: paymentMethod.id.getValue(),
      userId: paymentMethod.userId.getValue(),
      type: paymentMethod.type.getValue(),
      details: enrichedDetails,
      isDefault: paymentMethod.isDefault,
      isActive: paymentMethod.isActive,
      createdAt: paymentMethod.createdAt,
      updatedAt: paymentMethod.updatedAt,
      deletedAt: paymentMethod.deletedAt || null,
    };
  }

  private toDomain(prisma: PrismaPaymentMethod): PaymentMethod {
    const type = PaymentMethodType.create(prisma.type);
    const detailsJson = prisma.details as any;

    // Extract payment method details
    const details = PaymentMethodDetailsFactory.fromJSON({
      type: detailsJson.type,
      data: detailsJson.data,
    });

    // Extract extra fields stored in details JSON
    const nickname = detailsJson.nickname
      ? PaymentNickname.create(detailsJson.nickname)
      : undefined;
    const isVerified = detailsJson.isVerified ?? false;
    const lastUsedAt = detailsJson.lastUsedAt
      ? new Date(detailsJson.lastUsedAt)
      : undefined;
    const failedAttempts = detailsJson.failedAttempts ?? 0;

    return PaymentMethod.reconstitute({
      id: PaymentMethodId.create(prisma.id),
      userId: UserId.create(prisma.userId),
      type,
      details,
      nickname,
      isDefault: prisma.isDefault,
      isVerified,
      isActive: prisma.isActive,
      lastUsedAt,
      failedAttempts,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt || prisma.createdAt,
      deletedAt: prisma.deletedAt || undefined,
    });
  }

  private buildPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }
}
