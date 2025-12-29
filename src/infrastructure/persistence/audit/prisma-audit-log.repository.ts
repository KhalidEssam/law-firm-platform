// ============================================
// PRISMA AUDIT LOG REPOSITORY
// src/infrastructure/persistence/audit/prisma-audit-log.repository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AuditLog,
  AuditEntityType,
  IAuditLogRepository,
  AuditLogFilters,
  AuditLogPaginationOptions,
  AuditLogStatistics,
} from '../../../core/domain/audit';
import { RequestType as PrismaRequestType } from '@prisma/client';

// Re-export as a type to avoid lint errors with Prisma enums
type RequestTypeEnum = PrismaRequestType;

/**
 * Map domain entity type to Prisma RequestType enum
 */
function mapEntityTypeToPrisma(
  entityType: AuditEntityType | undefined,
): RequestTypeEnum | undefined {
  if (!entityType) return undefined;

  const mapping: Record<string, PrismaRequestType> = {
    consultation: PrismaRequestType.consultation,
    legal_opinion: PrismaRequestType.legal_opinion,
    litigation: PrismaRequestType.litigation,
    call: PrismaRequestType.call,
    service: PrismaRequestType.service,
  };

  return mapping[entityType];
}

/**
 * Map Prisma RequestType to domain entity type
 */
function mapPrismaToEntityType(
  requestType: RequestTypeEnum | null,
): AuditEntityType | null {
  if (!requestType) return null;

  const mapping: Record<PrismaRequestType, AuditEntityType> = {
    [PrismaRequestType.consultation]: 'consultation',
    [PrismaRequestType.legal_opinion]: 'legal_opinion',
    [PrismaRequestType.litigation]: 'litigation',
    [PrismaRequestType.call]: 'call',
    [PrismaRequestType.service]: 'service',
  };

  return mapping[requestType] || null;
}

@Injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(auditLog: AuditLog): Promise<AuditLog> {
    const obj = auditLog.toObject();

    const created = await this.prisma.auditLog.create({
      data: {
        id: obj.id,
        userId: obj.userId,
        action: obj.action,
        entityType: mapEntityTypeToPrisma(obj.entityType as AuditEntityType),
        entityId: obj.entityId,
        details: obj.details as any,
        ipAddress: obj.ipAddress,
        userAgent: obj.userAgent,
        createdAt: obj.createdAt,
      },
    });

    return this.mapToDomain(created);
  }

  async createMany(auditLogs: AuditLog[]): Promise<AuditLog[]> {
    const data = auditLogs.map((log) => {
      const obj = log.toObject();
      return {
        id: obj.id,
        userId: obj.userId,
        action: obj.action,
        entityType: mapEntityTypeToPrisma(obj.entityType as AuditEntityType),
        entityId: obj.entityId,
        details: obj.details as any,
        ipAddress: obj.ipAddress,
        userAgent: obj.userAgent,
        createdAt: obj.createdAt,
      };
    });

    await this.prisma.auditLog.createMany({ data });

    // Fetch created records
    const ids = data.map((d) => d.id);
    const created = await this.prisma.auditLog.findMany({
      where: { id: { in: ids } },
    });

    return created.map(this.mapToDomain);
  }

  async findById(id: string): Promise<AuditLog | null> {
    const record = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    return record ? this.mapToDomain(record) : null;
  }

  async findByUserId(
    userId: string,
    options?: AuditLogPaginationOptions,
  ): Promise<AuditLog[]> {
    const records = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.orderDir || 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return records.map(this.mapToDomain);
  }

  async findByEntity(
    entityType: AuditEntityType,
    entityId: string,
    options?: AuditLogPaginationOptions,
  ): Promise<AuditLog[]> {
    const records = await this.prisma.auditLog.findMany({
      where: {
        entityType: mapEntityTypeToPrisma(entityType),
        entityId,
      },
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.orderDir || 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return records.map(this.mapToDomain);
  }

  async findByAction(
    action: string,
    options?: AuditLogPaginationOptions,
  ): Promise<AuditLog[]> {
    const records = await this.prisma.auditLog.findMany({
      where: { action },
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.orderDir || 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return records.map(this.mapToDomain);
  }

  async list(
    filters?: AuditLogFilters,
    options?: AuditLogPaginationOptions,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const where = this.buildWhereClause(filters);

    const [records, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: {
          [options?.orderBy || 'createdAt']: options?.orderDir || 'desc',
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: records.map(this.mapToDomain),
      total,
    };
  }

  async count(filters?: AuditLogFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.auditLog.count({ where });
  }

  async getStatistics(filters?: AuditLogFilters): Promise<AuditLogStatistics> {
    const where = this.buildWhereClause(filters);

    const [totalCount, byAction, byEntityType, byUser, recentActivity] =
      await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: true,
        }),
        this.prisma.auditLog.groupBy({
          by: ['entityType'],
          where,
          _count: true,
        }),
        this.prisma.auditLog.groupBy({
          by: ['userId'],
          where: { ...where, userId: { not: null } },
          _count: true,
          orderBy: { _count: { userId: 'desc' } },
          take: 10,
        }),
        this.getRecentActivityByDay(where),
      ]);

    return {
      totalCount,
      byAction: Object.fromEntries(byAction.map((r) => [r.action, r._count])),
      byEntityType: Object.fromEntries(
        byEntityType
          .filter((r) => r.entityType)
          .map((r) => [r.entityType!, r._count]),
      ),
      byUser: byUser
        .filter((r) => r.userId)
        .map((r) => ({ userId: r.userId!, count: r._count })),
      recentActivity,
    };
  }

  async getRecentActivityForEntity(
    entityType: AuditEntityType,
    entityId: string,
    limit: number = 10,
  ): Promise<AuditLog[]> {
    const records = await this.prisma.auditLog.findMany({
      where: {
        entityType: mapEntityTypeToPrisma(entityType),
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map(this.mapToDomain);
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: date },
      },
    });

    return result.count;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private buildWhereClause(filters?: AuditLogFilters): any {
    if (!filters) return {};

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.actionCategory) {
      where.action = { startsWith: `${filters.actionCategory}.` };
    }

    if (filters.entityType) {
      where.entityType = mapEntityTypeToPrisma(filters.entityType);
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.ipAddress) {
      where.ipAddress = filters.ipAddress;
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    return where;
  }

  private async getRecentActivityByDay(
    where: any,
  ): Promise<{ date: string; count: number }[]> {
    // Get last 7 days of activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const records = await this.prisma.auditLog.groupBy({
      by: ['createdAt'],
      where: {
        ...where,
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    });

    // Aggregate by day
    const byDay = new Map<string, number>();
    for (const record of records) {
      const date = record.createdAt.toISOString().split('T')[0];
      byDay.set(date, (byDay.get(date) || 0) + record._count);
    }

    return Array.from(byDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private mapToDomain(record: any): AuditLog {
    return AuditLog.reconstitute({
      id: record.id,
      userId: record.userId,
      action: record.action,
      entityType: mapPrismaToEntityType(record.entityType),
      entityId: record.entityId,
      details: record.details as Record<string, unknown> | null,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      createdAt: record.createdAt,
    });
  }
}
