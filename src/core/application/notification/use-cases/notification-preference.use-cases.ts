// ============================================
// NOTIFICATION PREFERENCE USE CASES
// src/core/application/notification/use-cases/notification-preference.use-cases.ts
// ============================================

import { Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationPreference,
  UserNotificationPreferences,
} from '../../../domain/notification/entities/notification-preference.entity';
import { type INotificationPreferenceRepository } from '../../../domain/notification/ports/notification-preference.repository';
import { NotificationChannel } from '../../../domain/notification/value-objects/notification-channel.enum';

// ============================================
// DTOs
// ============================================

export interface SetPreferenceDto {
  userId: string;
  channel: NotificationChannel;
  eventType: string;
  enabled: boolean;
}

export interface BulkSetPreferencesDto {
  userId: string;
  preferences: Array<{
    channel: NotificationChannel;
    eventType: string;
    enabled: boolean;
  }>;
}

export interface UserPreferencesResponseDto {
  userId: string;
  preferences: Array<{
    id: string;
    channel: NotificationChannel;
    eventType: string;
    enabled: boolean;
  }>;
  byChannel: Record<string, Array<{ eventType: string; enabled: boolean }>>;
}

// ============================================
// GET PREFERENCES USE CASE
// ============================================

@Injectable()
export class GetNotificationPreferencesUseCase {
  constructor(
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {}

  async forUser(userId: string): Promise<UserPreferencesResponseDto> {
    const preferences = await this.preferenceRepository.findByUserId(userId);

    const byChannel: Record<
      string,
      Array<{ eventType: string; enabled: boolean }>
    > = {};
    for (const pref of preferences) {
      const channel = pref.channel;
      if (!byChannel[channel]) {
        byChannel[channel] = [];
      }
      byChannel[channel].push({
        eventType: pref.eventType,
        enabled: pref.enabled,
      });
    }

    return {
      userId,
      preferences: preferences.map((p) => ({
        id: p.id,
        channel: p.channel,
        eventType: p.eventType,
        enabled: p.enabled,
      })),
      byChannel,
    };
  }

  async forUserAndChannel(
    userId: string,
    channel: NotificationChannel,
  ): Promise<NotificationPreference[]> {
    return await this.preferenceRepository.findByUserIdAndChannel(
      userId,
      channel,
    );
  }

  async isEnabled(
    userId: string,
    channel: NotificationChannel,
    eventType: string,
  ): Promise<boolean> {
    return await this.preferenceRepository.isNotificationEnabled(
      userId,
      channel,
      eventType,
    );
  }

  async getEnabledChannelsForEvent(
    userId: string,
    eventType: string,
  ): Promise<NotificationChannel[]> {
    return await this.preferenceRepository.getEnabledChannelsForEvent(
      userId,
      eventType,
    );
  }

  async getUserPreferencesCollection(
    userId: string,
  ): Promise<UserNotificationPreferences> {
    const preferences = await this.preferenceRepository.findByUserId(userId);
    return UserNotificationPreferences.fromList(userId, preferences);
  }
}

// ============================================
// SET PREFERENCE USE CASE
// ============================================

@Injectable()
export class SetNotificationPreferenceUseCase {
  constructor(
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {}

  async execute(dto: SetPreferenceDto): Promise<NotificationPreference> {
    const preference = NotificationPreference.create({
      userId: dto.userId,
      channel: dto.channel,
      eventType: dto.eventType,
      enabled: dto.enabled,
    });

    return await this.preferenceRepository.upsert(preference);
  }

  async enable(
    userId: string,
    channel: NotificationChannel,
    eventType: string,
  ): Promise<NotificationPreference> {
    const existing = await this.preferenceRepository.findByUserChannelAndEvent(
      userId,
      channel,
      eventType,
    );

    if (existing) {
      return await this.preferenceRepository.enable(existing.id);
    }

    const preference = NotificationPreference.create({
      userId,
      channel,
      eventType,
      enabled: true,
    });

    return await this.preferenceRepository.create(preference);
  }

  async disable(
    userId: string,
    channel: NotificationChannel,
    eventType: string,
  ): Promise<NotificationPreference> {
    const existing = await this.preferenceRepository.findByUserChannelAndEvent(
      userId,
      channel,
      eventType,
    );

    if (existing) {
      return await this.preferenceRepository.disable(existing.id);
    }

    const preference = NotificationPreference.create({
      userId,
      channel,
      eventType,
      enabled: false,
    });

    return await this.preferenceRepository.create(preference);
  }

  async toggle(
    userId: string,
    channel: NotificationChannel,
    eventType: string,
  ): Promise<NotificationPreference> {
    const isEnabled = await this.preferenceRepository.isNotificationEnabled(
      userId,
      channel,
      eventType,
    );

    if (isEnabled) {
      return this.disable(userId, channel, eventType);
    } else {
      return this.enable(userId, channel, eventType);
    }
  }
}

// ============================================
// BULK SET PREFERENCES USE CASE
// ============================================

@Injectable()
export class BulkSetNotificationPreferencesUseCase {
  constructor(
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {}

  async execute(dto: BulkSetPreferencesDto): Promise<NotificationPreference[]> {
    return await this.preferenceRepository.bulkUpdateByUserId(
      dto.userId,
      dto.preferences,
    );
  }

  async setChannelPreferences(
    userId: string,
    channel: NotificationChannel,
    preferences: Array<{ eventType: string; enabled: boolean }>,
  ): Promise<NotificationPreference[]> {
    const prefDtos = preferences.map((p) => ({
      channel,
      eventType: p.eventType,
      enabled: p.enabled,
    }));

    return await this.preferenceRepository.bulkUpdateByUserId(userId, prefDtos);
  }

  async enableAllForChannel(
    userId: string,
    channel: NotificationChannel,
  ): Promise<void> {
    const prefs = await this.preferenceRepository.findByUserIdAndChannel(
      userId,
      channel,
    );
    const updates = prefs.map((p) => ({
      channel: p.channel,
      eventType: p.eventType,
      enabled: true,
    }));

    if (updates.length > 0) {
      await this.preferenceRepository.bulkUpdateByUserId(userId, updates);
    }
  }

  async disableAllForChannel(
    userId: string,
    channel: NotificationChannel,
  ): Promise<void> {
    const prefs = await this.preferenceRepository.findByUserIdAndChannel(
      userId,
      channel,
    );
    const updates = prefs.map((p) => ({
      channel: p.channel,
      eventType: p.eventType,
      enabled: false,
    }));

    if (updates.length > 0) {
      await this.preferenceRepository.bulkUpdateByUserId(userId, updates);
    }
  }
}

// ============================================
// INITIALIZE PREFERENCES USE CASE
// ============================================

@Injectable()
export class InitializeNotificationPreferencesUseCase {
  constructor(
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {}

  async forUser(userId: string): Promise<NotificationPreference[]> {
    // Check if user already has preferences
    const hasPrefs = await this.preferenceRepository.hasPreferences(userId);
    if (hasPrefs) {
      // Return existing preferences
      return await this.preferenceRepository.findByUserId(userId);
    }

    // Create default preferences
    const defaults = NotificationPreference.createDefaultsForUser(userId);
    return await this.preferenceRepository.createMany(defaults);
  }

  async resetToDefaults(userId: string): Promise<NotificationPreference[]> {
    // Delete existing preferences
    await this.preferenceRepository.deleteByUserId(userId);

    // Create default preferences
    const defaults = NotificationPreference.createDefaultsForUser(userId);
    return await this.preferenceRepository.createMany(defaults);
  }
}

// ============================================
// DELETE PREFERENCES USE CASE
// ============================================

@Injectable()
export class DeleteNotificationPreferencesUseCase {
  constructor(
    private readonly preferenceRepository: INotificationPreferenceRepository,
  ) {}

  async byId(id: string): Promise<void> {
    await this.preferenceRepository.delete(id);
  }

  async forUser(userId: string): Promise<number> {
    return await this.preferenceRepository.deleteByUserId(userId);
  }
}
