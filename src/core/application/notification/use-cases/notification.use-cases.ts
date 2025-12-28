// ============================================
// NOTIFICATION USE CASES
// src/core/application/notification/use-cases/notification.use-cases.ts
// ============================================

import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { Notification } from '../../../domain/notification/entities/notification.entity';
import {
  type INotificationRepository,
  NotificationListOptions,
} from '../../../domain/notification/ports/notification.repository';
import { type IMessageTemplateRepository } from '../../../domain/notification/ports/message-template.repository';
import { type INotificationPreferenceRepository } from '../../../domain/notification/ports/notification-preference.repository';
import { NotificationChannel } from '../../../domain/notification/value-objects/notification-channel.enum';
import { NotificationType } from '../../../domain/notification/value-objects/notification-type.enum';
import { NotificationSender } from '../interfaces/notification-sender.interface';

// ============================================
// DTOs
// ============================================

export interface SendNotificationDto {
  userId: string;
  type: NotificationType | string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  channels?: NotificationChannel[];
  email?: string;
}

export interface SendTemplatedNotificationDto {
  userId: string;
  templateCode: string;
  variables: Record<string, string>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  channels?: NotificationChannel[];
  email?: string;
}

export interface NotificationListDto {
  userId?: string;
  type?: string;
  isRead?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'readAt';
  orderDir?: 'asc' | 'desc';
}

// ============================================
// SEND NOTIFICATION USE CASE
// ============================================

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly preferenceRepository: INotificationPreferenceRepository,
    @Inject(NotificationSender)
    private readonly notificationSender: NotificationSender,
  ) {}

  async execute(dto: SendNotificationDto): Promise<Notification> {
    // Create in-app notification
    const notification = Notification.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      titleAr: dto.titleAr,
      message: dto.message,
      messageAr: dto.messageAr,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId,
    });

    // Save to database
    const saved = await this.notificationRepository.create(notification);

    // Determine which channels to send to
    const channels =
      dto.channels ??
      (await this.preferenceRepository.getEnabledChannelsForEvent(
        dto.userId,
        dto.type.toString(),
      ));

    // Send via enabled channels
    for (const channel of channels) {
      const isEnabled = await this.preferenceRepository.isNotificationEnabled(
        dto.userId,
        channel,
        dto.type.toString(),
      );

      if (isEnabled || dto.channels?.includes(channel)) {
        await this.sendViaChannel(channel, saved, dto.email);
      }
    }

    return saved;
  }

  private async sendViaChannel(
    channel: NotificationChannel,
    notification: Notification,
    email?: string,
  ): Promise<void> {
    try {
      switch (channel) {
        case NotificationChannel.EMAIL:
          if (email) {
            await this.notificationSender.send(notification, email);
          }
          break;
        case NotificationChannel.PUSH:
          // TODO: Implement push notification
          this.logger.debug(
            `Push notification queued for user ${notification.userId}`,
          );
          break;
        case NotificationChannel.SMS:
          // TODO: Implement SMS notification
          this.logger.debug(
            `SMS notification queued for user ${notification.userId}`,
          );
          break;
        case NotificationChannel.IN_APP:
          // Already saved to database, no additional action needed
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to send notification via ${channel}`,
        error.stack,
      );
      // Don't throw - notification was saved, just the delivery failed
    }
  }
}

// ============================================
// SEND TEMPLATED NOTIFICATION USE CASE
// ============================================

@Injectable()
export class SendTemplatedNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateRepository: IMessageTemplateRepository,
    private readonly preferenceRepository: INotificationPreferenceRepository,
    @Inject(NotificationSender)
    private readonly notificationSender: NotificationSender,
  ) {}

  async execute(dto: SendTemplatedNotificationDto): Promise<Notification> {
    // Get the template
    const template = await this.templateRepository.findActiveByCode(
      dto.templateCode,
    );
    if (!template) {
      throw new NotFoundException(
        `Active template '${dto.templateCode}' not found`,
      );
    }

    // Render the template
    const rendered = template.render(dto.variables);

    // Create notification
    const notification = Notification.create({
      userId: dto.userId,
      type: dto.templateCode,
      title: rendered.subject ?? template.name,
      titleAr: rendered.subjectAr,
      message: rendered.body,
      messageAr: rendered.bodyAr,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId,
    });

    // Save to database
    const saved = await this.notificationRepository.create(notification);

    // Determine channels
    const channels =
      dto.channels ??
      (await this.preferenceRepository.getEnabledChannelsForEvent(
        dto.userId,
        dto.templateCode,
      ));

    // Send via email if enabled and email provided
    if (channels.includes(NotificationChannel.EMAIL) && dto.email) {
      await this.notificationSender.send(saved, dto.email);
    }

    return saved;
  }
}

// ============================================
// GET NOTIFICATIONS USE CASE
// ============================================

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async byId(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }
    return notification;
  }

  async forUser(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    return await this.notificationRepository.findByUserId(userId, options);
  }

  async unreadForUser(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    return await this.notificationRepository.findUnreadByUserId(
      userId,
      options,
    );
  }

  async recentForUser(userId: string, limit?: number): Promise<Notification[]> {
    return await this.notificationRepository.getRecentByUserId(userId, limit);
  }

  async list(dto?: NotificationListDto): Promise<{
    notifications: Notification[];
    total: number;
  }> {
    const options: NotificationListOptions = {
      userId: dto?.userId,
      type: dto?.type,
      isRead: dto?.isRead,
      relatedEntityType: dto?.relatedEntityType,
      relatedEntityId: dto?.relatedEntityId,
      fromDate: dto?.fromDate,
      toDate: dto?.toDate,
      limit: dto?.limit ?? 50,
      offset: dto?.offset ?? 0,
      orderBy: dto?.orderBy ?? 'createdAt',
      orderDir: dto?.orderDir ?? 'desc',
    };

    const [notifications, total] = await Promise.all([
      this.notificationRepository.list(options),
      this.notificationRepository.count({
        userId: dto?.userId,
        type: dto?.type,
        isRead: dto?.isRead,
        relatedEntityType: dto?.relatedEntityType,
        fromDate: dto?.fromDate,
        toDate: dto?.toDate,
      }),
    ]);

    return { notifications, total };
  }

  async countUnread(userId: string): Promise<number> {
    return await this.notificationRepository.countUnread(userId);
  }

  async getStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    return await this.notificationRepository.getUserNotificationStats(userId);
  }
}

// ============================================
// MARK NOTIFICATION USE CASE
// ============================================

@Injectable()
export class MarkNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async asRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }
    return await this.notificationRepository.markAsRead(id);
  }

  async asUnread(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }
    return await this.notificationRepository.markAsUnread(id);
  }

  async allAsRead(userId: string): Promise<number> {
    return await this.notificationRepository.markAllAsRead(userId);
  }
}

// ============================================
// DELETE NOTIFICATION USE CASE
// ============================================

@Injectable()
export class DeleteNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async byId(_id: string, userId?: string): Promise<void> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }

    // Optionally verify ownership
    if (userId && notification.userId !== userId) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }

    await this.notificationRepository.delete(id);
  }

  async allForUser(userId: string): Promise<number> {
    return await this.notificationRepository.deleteByUserId(userId);
  }

  async olderThan(days: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return await this.notificationRepository.deleteOlderThan(date);
  }
}
