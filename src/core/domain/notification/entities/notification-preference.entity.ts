// ============================================
// NOTIFICATION PREFERENCE ENTITY
// src/core/domain/notification/entities/notification-preference.entity.ts
// ============================================

import { Entity } from '../../base/Entity';
import { NotificationChannel } from '../value-objects/notification-channel.enum';

interface NotificationPreferenceProps {
  userId: string;
  channel: NotificationChannel;
  eventType: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationPreferenceInput {
  userId: string;
  channel: NotificationChannel;
  eventType: string;
  enabled?: boolean;
}

/**
 * NotificationPreference Entity
 * Represents a user's preference for a specific notification channel and event type
 */
export class NotificationPreference extends Entity<NotificationPreferenceProps> {
  private constructor(props: NotificationPreferenceProps, id?: string) {
    super(props, id);
  }

  // ============================================
  // FACTORY METHODS
  // ============================================

  /**
   * Create a new notification preference
   */
  public static create(
    input: CreateNotificationPreferenceInput,
  ): NotificationPreference {
    if (!input.userId) {
      throw new Error('User ID is required');
    }
    if (!input.channel) {
      throw new Error('Notification channel is required');
    }
    if (!input.eventType || input.eventType.trim().length === 0) {
      throw new Error('Event type is required');
    }

    const now = new Date();

    return new NotificationPreference({
      userId: input.userId,
      channel: input.channel,
      eventType: input.eventType.trim(),
      enabled: input.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Rehydrate from persistence
   */
  public static rehydrate(data: {
    id: string;
    userId: string;
    channel: NotificationChannel;
    eventType: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): NotificationPreference {
    return new NotificationPreference(
      {
        userId: data.userId,
        channel: data.channel,
        eventType: data.eventType,
        enabled: data.enabled,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      data.id,
    );
  }

  /**
   * Create default preferences for a user
   * Returns a set of preferences with default enabled states for common event types
   */
  public static createDefaultsForUser(
    userId: string,
  ): NotificationPreference[] {
    const defaults: Array<{
      channel: NotificationChannel;
      eventType: string;
      enabled: boolean;
    }> = [
      // Email preferences
      {
        channel: NotificationChannel.EMAIL,
        eventType: 'CONSULTATION_ASSIGNED',
        enabled: true,
      },
      {
        channel: NotificationChannel.EMAIL,
        eventType: 'CONSULTATION_COMPLETED',
        enabled: true,
      },
      {
        channel: NotificationChannel.EMAIL,
        eventType: 'OPINION_ASSIGNED',
        enabled: true,
      },
      {
        channel: NotificationChannel.EMAIL,
        eventType: 'OPINION_COMPLETED',
        enabled: true,
      },
      {
        channel: NotificationChannel.EMAIL,
        eventType: 'INVOICE_GENERATED',
        enabled: true,
      },
      {
        channel: NotificationChannel.EMAIL,
        eventType: 'PAYMENT_RECEIVED',
        enabled: true,
      },
      {
        channel: NotificationChannel.EMAIL,
        eventType: 'SUBSCRIPTION_DUE',
        enabled: true,
      },
      {
        channel: NotificationChannel.EMAIL,
        eventType: 'TICKET_REPLY',
        enabled: true,
      },
      {
        channel: NotificationChannel.EMAIL,
        eventType: 'SYSTEM_ANNOUNCEMENT',
        enabled: true,
      },

      // In-app preferences
      {
        channel: NotificationChannel.IN_APP,
        eventType: 'CONSULTATION_ASSIGNED',
        enabled: true,
      },
      {
        channel: NotificationChannel.IN_APP,
        eventType: 'CONSULTATION_UPDATED',
        enabled: true,
      },
      {
        channel: NotificationChannel.IN_APP,
        eventType: 'CONSULTATION_COMPLETED',
        enabled: true,
      },
      {
        channel: NotificationChannel.IN_APP,
        eventType: 'OPINION_ASSIGNED',
        enabled: true,
      },
      {
        channel: NotificationChannel.IN_APP,
        eventType: 'OPINION_STATUS_CHANGED',
        enabled: true,
      },
      {
        channel: NotificationChannel.IN_APP,
        eventType: 'OPINION_COMPLETED',
        enabled: true,
      },
      {
        channel: NotificationChannel.IN_APP,
        eventType: 'REQUEST_MESSAGE',
        enabled: true,
      },
      {
        channel: NotificationChannel.IN_APP,
        eventType: 'TICKET_REPLY',
        enabled: true,
      },
      {
        channel: NotificationChannel.IN_APP,
        eventType: 'SYSTEM_ANNOUNCEMENT',
        enabled: true,
      },

      // Push preferences
      {
        channel: NotificationChannel.PUSH,
        eventType: 'CONSULTATION_ASSIGNED',
        enabled: true,
      },
      {
        channel: NotificationChannel.PUSH,
        eventType: 'REQUEST_MESSAGE',
        enabled: true,
      },
      {
        channel: NotificationChannel.PUSH,
        eventType: 'TICKET_REPLY',
        enabled: true,
      },

      // SMS preferences (disabled by default due to cost)
      {
        channel: NotificationChannel.SMS,
        eventType: 'SUBSCRIPTION_DUE',
        enabled: false,
      },
      {
        channel: NotificationChannel.SMS,
        eventType: 'PAYMENT_FAILED',
        enabled: true,
      },
    ];

    return defaults.map((pref) =>
      NotificationPreference.create({
        userId,
        channel: pref.channel,
        eventType: pref.eventType,
        enabled: pref.enabled,
      }),
    );
  }

  // ============================================
  // GETTERS
  // ============================================

  get userId(): string {
    return this.props.userId;
  }

  get channel(): NotificationChannel {
    return this.props.channel;
  }

  get eventType(): string {
    return this.props.eventType;
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ============================================
  // BUSINESS METHODS
  // ============================================

  /**
   * Enable this preference
   */
  public enable(): NotificationPreference {
    if (this.props.enabled) {
      return this;
    }

    return new NotificationPreference(
      {
        ...this.props,
        enabled: true,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Disable this preference
   */
  public disable(): NotificationPreference {
    if (!this.props.enabled) {
      return this;
    }

    return new NotificationPreference(
      {
        ...this.props,
        enabled: false,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Toggle this preference
   */
  public toggle(): NotificationPreference {
    return new NotificationPreference(
      {
        ...this.props,
        enabled: !this.props.enabled,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Get a unique key for this preference
   */
  get preferenceKey(): string {
    return `${this.props.channel}:${this.props.eventType}`;
  }
}

/**
 * Collection of preferences for a user with query methods
 */
export class UserNotificationPreferences {
  private readonly preferences: Map<string, NotificationPreference>;
  // userId stored for future use

  private constructor(_userId: string, preferences: NotificationPreference[]) {
    // userId stored in constructor
    this.preferences = new Map(preferences.map((p) => [p.preferenceKey, p]));
  }

  public static fromList(
    userId: string,
    preferences: NotificationPreference[],
  ): UserNotificationPreferences {
    return new UserNotificationPreferences(userId, preferences);
  }

  /**
   * Check if a specific channel + event type is enabled
   */
  public isEnabled(channel: NotificationChannel, eventType: string): boolean {
    const key = `${channel}:${eventType}`;
    const pref = this.preferences.get(key);

    // If no preference exists, default to true for in-app, email
    // and false for SMS, push
    if (!pref) {
      return (
        channel === NotificationChannel.IN_APP ||
        channel === NotificationChannel.EMAIL
      );
    }

    return pref.enabled;
  }

  /**
   * Get all preferences for a channel
   */
  public getByChannel(channel: NotificationChannel): NotificationPreference[] {
    return this.all.filter((p) => p.channel === channel);
  }

  /**
   * Get all preferences for an event type
   */
  public getByEventType(eventType: string): NotificationPreference[] {
    return this.all.filter((p) => p.eventType === eventType);
  }

  /**
   * Get enabled channels for an event type
   */
  public getEnabledChannelsForEvent(eventType: string): NotificationChannel[] {
    return Object.values(NotificationChannel).filter((channel) =>
      this.isEnabled(channel, eventType),
    );
  }

  /**
   * Get all preferences
   */
  get all(): NotificationPreference[] {
    return Array.from(this.preferences.values());
  }

  /**
   * Get all enabled preferences
   */
  get enabled(): NotificationPreference[] {
    return this.all.filter((p) => p.enabled);
  }

  /**
   * Get all disabled preferences
   */
  get disabled(): NotificationPreference[] {
    return this.all.filter((p) => !p.enabled);
  }
}
