// ============================================
// NOTIFICATION CHANNEL ENUM
// src/core/domain/notification/value-objects/notification-channel.enum.ts
// ============================================

/**
 * Notification delivery channels matching Prisma NotificationChannel enum
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WHATSAPP = 'whatsapp',
}

/**
 * Mapper for converting between domain and Prisma NotificationChannel
 */
export const NotificationChannelMapper = {
  toPrisma: (channel: NotificationChannel): string => {
    return channel;
  },
  toDomain: (prismaChannel: string): NotificationChannel => {
    const mapping: Record<string, NotificationChannel> = {
      email: NotificationChannel.EMAIL,
      sms: NotificationChannel.SMS,
      push: NotificationChannel.PUSH,
      in_app: NotificationChannel.IN_APP,
      whatsapp: NotificationChannel.WHATSAPP,
    };
    return mapping[prismaChannel] ?? NotificationChannel.IN_APP;
  },
};
