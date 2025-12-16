// ============================================
// NOTIFICATION PREFERENCE REPOSITORY PORT
// src/core/domain/notification/ports/notification-preference.repository.ts
// ============================================

import { NotificationPreference } from '../entities/notification-preference.entity';
import { NotificationChannel } from '../value-objects/notification-channel.enum';

export interface INotificationPreferenceRepository {
    // ============================================
    // CREATE
    // ============================================
    create(preference: NotificationPreference): Promise<NotificationPreference>;
    createMany(preferences: NotificationPreference[]): Promise<NotificationPreference[]>;
    upsert(preference: NotificationPreference): Promise<NotificationPreference>;

    // ============================================
    // READ
    // ============================================
    findById(id: string): Promise<NotificationPreference | null>;
    findByUserChannelAndEvent(
        userId: string,
        channel: NotificationChannel,
        eventType: string
    ): Promise<NotificationPreference | null>;
    findByUserId(userId: string): Promise<NotificationPreference[]>;
    findByUserIdAndChannel(userId: string, channel: NotificationChannel): Promise<NotificationPreference[]>;
    findEnabledByUserId(userId: string): Promise<NotificationPreference[]>;

    // ============================================
    // UPDATE
    // ============================================
    update(preference: NotificationPreference): Promise<NotificationPreference>;
    enable(id: string): Promise<NotificationPreference>;
    disable(id: string): Promise<NotificationPreference>;
    bulkUpdateByUserId(
        userId: string,
        preferences: Array<{
            channel: NotificationChannel;
            eventType: string;
            enabled: boolean;
        }>
    ): Promise<NotificationPreference[]>;

    // ============================================
    // DELETE
    // ============================================
    delete(id: string): Promise<void>;
    deleteByUserId(userId: string): Promise<number>;

    // ============================================
    // BUSINESS QUERIES
    // ============================================
    isNotificationEnabled(
        userId: string,
        channel: NotificationChannel,
        eventType: string
    ): Promise<boolean>;
    getEnabledChannelsForEvent(userId: string, eventType: string): Promise<NotificationChannel[]>;
    hasPreferences(userId: string): Promise<boolean>;
}
