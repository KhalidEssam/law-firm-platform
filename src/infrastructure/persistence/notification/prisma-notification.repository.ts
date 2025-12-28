// ============================================
// PRISMA NOTIFICATION REPOSITORY
// src/infrastructure/persistence/notification/prisma-notification.repository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Notification } from '../../../core/domain/notification/entities/notification.entity';
import {
  INotificationRepository,
  NotificationListOptions,
  NotificationCountOptions,
} from '../../../core/domain/notification/ports/notification.repository';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CREATE
  // ============================================
  async create(notification: Notification): Promise<Notification> {
    const created = await this.prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        titleAr: notification.titleAr,
        message: notification.message,
        messageAr: notification.messageAr,
        relatedEntityType: notification.relatedEntityType as any,
        relatedEntityId: notification.relatedEntityId,
        isRead: notification.isRead,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      },
    });
    return this.toDomain(created);
  }

  async createMany(notifications: Notification[]): Promise<Notification[]> {
    const data = notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      titleAr: n.titleAr,
      message: n.message,
      messageAr: n.messageAr,
      relatedEntityType: n.relatedEntityType as any,
      relatedEntityId: n.relatedEntityId,
      isRead: n.isRead,
      readAt: n.readAt,
      createdAt: n.createdAt,
    }));

    await this.prisma.notification.createMany({ data });

    // Fetch created records
    const ids = notifications.map((n) => n.id);
    const created = await this.prisma.notification.findMany({
      where: { id: { in: ids } },
    });
    return created.map((r) => this.toDomain(r));
  }

  // ============================================
  // READ
  // ============================================
  async findById(_id: string): Promise<Notification | null> {
    const found = await this.prisma.notification.findUnique({
      where: { id },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const found = await this.prisma.notification.findMany({
      where: { userId },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    });
    return found.map((r) => this.toDomain(r));
  }

  async findUnreadByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const found = await this.prisma.notification.findMany({
      where: { userId, isRead: false },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    });
    return found.map((r) => this.toDomain(r));
  }

  async list(options?: NotificationListOptions): Promise<Notification[]> {
    const found = await this.prisma.notification.findMany({
      where: this.buildWhereClause(options),
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      orderBy: {
        [options?.orderBy ?? 'createdAt']: options?.orderDir ?? 'desc',
      },
    });
    return found.map((r) => this.toDomain(r));
  }

  async count(options?: NotificationCountOptions): Promise<number> {
    return await this.prisma.notification.count({
      where: this.buildWhereClause(options),
    });
  }

  async countUnread(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(notification: Notification): Promise<Notification> {
    const updated = await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        isRead: notification.isRead,
        readAt: notification.readAt,
      },
    });
    return this.toDomain(updated);
  }

  async markAsRead(_id: string): Promise<Notification> {
    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async markAsUnread(_id: string): Promise<Notification> {
    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: false,
        readAt: null,
      },
    });
    return this.toDomain(updated);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return result.count;
  }

  // ============================================
  // DELETE
  // ============================================
  async delete(_id: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: date } },
    });
    return result.count;
  }

  // ============================================
  // BUSINESS QUERIES
  // ============================================
  async findByRelatedEntity(
    entityType: string,
    entityId: string,
    options?: { limit?: number },
  ): Promise<Notification[]> {
    const found = await this.prisma.notification.findMany({
      where: {
        relatedEntityType: entityType as any,
        relatedEntityId: entityId,
      },
      take: options?.limit ?? 50,
      orderBy: { createdAt: 'desc' },
    });
    return found.map((r) => this.toDomain(r));
  }

  async getRecentByUserId(
    userId: string,
    limit: number = 10,
  ): Promise<Notification[]> {
    const found = await this.prisma.notification.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return found.map((r) => this.toDomain(r));
  }

  async getUserNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    const [total, unread, byTypeRaw] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true },
      }),
    ]);

    const byType: Record<string, number> = {};
    for (const item of byTypeRaw) {
      byType[item.type] = item._count.type;
    }

    return { total, unread, byType };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================
  private buildWhereClause(
    options?: NotificationListOptions | NotificationCountOptions,
  ) {
    const where: any = {};

    if (options?.userId) where.userId = options.userId;
    if (options?.type) where.type = options.type;
    if (options?.isRead !== undefined) where.isRead = options.isRead;
    if (options?.relatedEntityType)
      where.relatedEntityType = options.relatedEntityType;
    if ((options as NotificationListOptions)?.relatedEntityId) {
      where.relatedEntityId = (
        options as NotificationListOptions
      ).relatedEntityId;
    }

    if (options?.fromDate || options?.toDate) {
      where.createdAt = {};
      if (options?.fromDate) where.createdAt.gte = options.fromDate;
      if (options?.toDate) where.createdAt.lte = options.toDate;
    }

    return where;
  }

  private toDomain(record: any): Notification {
    return Notification.rehydrate({
      id: record.id,
      userId: record.userId,
      type: record.type,
      title: record.title,
      titleAr: record.titleAr ?? undefined,
      message: record.message,
      messageAr: record.messageAr ?? undefined,
      relatedEntityType: record.relatedEntityType ?? undefined,
      relatedEntityId: record.relatedEntityId ?? undefined,
      isRead: record.isRead,
      readAt: record.readAt ?? undefined,
      createdAt: record.createdAt,
    });
  }
}
