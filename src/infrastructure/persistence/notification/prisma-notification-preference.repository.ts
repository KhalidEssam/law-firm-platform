// ============================================
// PRISMA NOTIFICATION PREFERENCE REPOSITORY
// src/infrastructure/persistence/notification/prisma-notification-preference.repository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationPreference } from '../../../core/domain/notification/entities/notification-preference.entity';
import { INotificationPreferenceRepository } from '../../../core/domain/notification/ports/notification-preference.repository';
import {
  NotificationChannel,
  NotificationChannelMapper,
} from '../../../core/domain/notification/value-objects/notification-channel.enum';

@Injectable()
export class PrismaNotificationPreferenceRepository
  implements INotificationPreferenceRepository
{
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CREATE
  // ============================================
  async create(
    preference: NotificationPreference,
  ): Promise<NotificationPreference> {
    const created = await this.prisma.notificationPreference.create({
      data: {
        id: preference.id,
        userId: preference.userId,
        channel: NotificationChannelMapper.toPrisma(preference.channel) as any,
        eventType: preference.eventType,
        enabled: preference.enabled,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt,
      },
    });
    return this.toDomain(created);
  }

  async createMany(
    preferences: NotificationPreference[],
  ): Promise<NotificationPreference[]> {
    const data = preferences.map((p) => ({
      id: p.id,
      userId: p.userId,
      channel: NotificationChannelMapper.toPrisma(p.channel) as any,
      eventType: p.eventType,
      enabled: p.enabled,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    await this.prisma.notificationPreference.createMany({
      data,
      skipDuplicates: true,
    });

    // Fetch created records
    const ids = preferences.map((p) => p.id);
    const created = await this.prisma.notificationPreference.findMany({
      where: { id: { in: ids } },
    });
    return created.map((r) => this.toDomain(r));
  }

  async upsert(
    preference: NotificationPreference,
  ): Promise<NotificationPreference> {
    const upserted = await this.prisma.notificationPreference.upsert({
      where: {
        userId_channel_eventType: {
          userId: preference.userId,
          channel: NotificationChannelMapper.toPrisma(
            preference.channel,
          ) as any,
          eventType: preference.eventType,
        },
      },
      create: {
        id: preference.id,
        userId: preference.userId,
        channel: NotificationChannelMapper.toPrisma(preference.channel) as any,
        eventType: preference.eventType,
        enabled: preference.enabled,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt,
      },
      update: {
        enabled: preference.enabled,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(upserted);
  }

  // ============================================
  // READ
  // ============================================
  async findById(id: string): Promise<NotificationPreference | null> {
    const found = await this.prisma.notificationPreference.findUnique({
      where: { id },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByUserChannelAndEvent(
    userId: string,
    channel: NotificationChannel,
    eventType: string,
  ): Promise<NotificationPreference | null> {
    const found = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_channel_eventType: {
          userId,
          channel: NotificationChannelMapper.toPrisma(channel) as any,
          eventType,
        },
      },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByUserId(userId: string): Promise<NotificationPreference[]> {
    const found = await this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: [{ channel: 'asc' }, { eventType: 'asc' }],
    });
    return found.map((r) => this.toDomain(r));
  }

  async findByUserIdAndChannel(
    userId: string,
    channel: NotificationChannel,
  ): Promise<NotificationPreference[]> {
    const found = await this.prisma.notificationPreference.findMany({
      where: {
        userId,
        channel: NotificationChannelMapper.toPrisma(channel) as any,
      },
      orderBy: { eventType: 'asc' },
    });
    return found.map((r) => this.toDomain(r));
  }

  async findEnabledByUserId(userId: string): Promise<NotificationPreference[]> {
    const found = await this.prisma.notificationPreference.findMany({
      where: { userId, enabled: true },
      orderBy: [{ channel: 'asc' }, { eventType: 'asc' }],
    });
    return found.map((r) => this.toDomain(r));
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(
    preference: NotificationPreference,
  ): Promise<NotificationPreference> {
    const updated = await this.prisma.notificationPreference.update({
      where: { id: preference.id },
      data: {
        enabled: preference.enabled,
        updatedAt: preference.updatedAt,
      },
    });
    return this.toDomain(updated);
  }

  async enable(id: string): Promise<NotificationPreference> {
    const updated = await this.prisma.notificationPreference.update({
      where: { id },
      data: {
        enabled: true,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async disable(id: string): Promise<NotificationPreference> {
    const updated = await this.prisma.notificationPreference.update({
      where: { id },
      data: {
        enabled: false,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async bulkUpdateByUserId(
    userId: string,
    preferences: Array<{
      channel: NotificationChannel;
      eventType: string;
      enabled: boolean;
    }>,
  ): Promise<NotificationPreference[]> {
    const results: NotificationPreference[] = [];

    for (const pref of preferences) {
      const upserted = await this.prisma.notificationPreference.upsert({
        where: {
          userId_channel_eventType: {
            userId,
            channel: NotificationChannelMapper.toPrisma(pref.channel) as any,
            eventType: pref.eventType,
          },
        },
        create: {
          userId,
          channel: NotificationChannelMapper.toPrisma(pref.channel) as any,
          eventType: pref.eventType,
          enabled: pref.enabled,
        },
        update: {
          enabled: pref.enabled,
          updatedAt: new Date(),
        },
      });
      results.push(this.toDomain(upserted));
    }

    return results;
  }

  // ============================================
  // DELETE
  // ============================================
  async delete(id: string): Promise<void> {
    await this.prisma.notificationPreference.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.prisma.notificationPreference.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  // ============================================
  // BUSINESS QUERIES
  // ============================================
  async isNotificationEnabled(
    userId: string,
    channel: NotificationChannel,
    eventType: string,
  ): Promise<boolean> {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_channel_eventType: {
          userId,
          channel: NotificationChannelMapper.toPrisma(channel) as any,
          eventType,
        },
      },
      select: { enabled: true },
    });

    // If no preference exists, default to true for email/in_app, false for sms/push
    if (!pref) {
      return (
        channel === NotificationChannel.EMAIL ||
        channel === NotificationChannel.IN_APP
      );
    }

    return pref.enabled;
  }

  async getEnabledChannelsForEvent(
    userId: string,
    eventType: string,
  ): Promise<NotificationChannel[]> {
    const prefs = await this.prisma.notificationPreference.findMany({
      where: {
        userId,
        eventType,
        enabled: true,
      },
      select: { channel: true },
    });

    const enabledChannels = prefs.map((p) =>
      NotificationChannelMapper.toDomain(p.channel),
    );

    // Add default enabled channels if not explicitly set
    const allChannels = Object.values(NotificationChannel);
    for (const channel of allChannels) {
      const hasPreference = prefs.some(
        (p) => NotificationChannelMapper.toDomain(p.channel) === channel,
      );

      if (!hasPreference) {
        // Default behavior: email and in_app are enabled by default
        if (
          channel === NotificationChannel.EMAIL ||
          channel === NotificationChannel.IN_APP
        ) {
          if (!enabledChannels.includes(channel)) {
            enabledChannels.push(channel);
          }
        }
      }
    }

    return enabledChannels;
  }

  async hasPreferences(userId: string): Promise<boolean> {
    const count = await this.prisma.notificationPreference.count({
      where: { userId },
    });
    return count > 0;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================
  private toDomain(record: any): NotificationPreference {
    return NotificationPreference.rehydrate({
      id: record.id,
      userId: record.userId,
      channel: NotificationChannelMapper.toDomain(record.channel),
      eventType: record.eventType,
      enabled: record.enabled,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
