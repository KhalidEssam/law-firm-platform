// ============================================
// NOTIFICATION ENTITY
// src/core/domain/notification/entities/notification.entity.ts
// ============================================

import { Entity } from '../../base/Entity';
import { NotificationType } from '../value-objects/notification-type.enum';

interface NotificationProps {
    userId: string;
    type: string;
    title: string;
    titleAr?: string;
    message: string;
    messageAr?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
}

export interface CreateNotificationInput {
    userId: string;
    type: NotificationType | string;
    title: string;
    titleAr?: string;
    message: string;
    messageAr?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
}

/**
 * Notification Entity - Aggregate Root
 * Represents a notification sent to a user
 */
export class Notification extends Entity<NotificationProps> {
    private constructor(props: NotificationProps, id?: string) {
        super(props, id);
    }

    // ============================================
    // FACTORY METHODS
    // ============================================

    /**
     * Create a new notification
     */
    public static create(input: CreateNotificationInput): Notification {
        if (!input.userId) {
            throw new Error('User ID is required');
        }
        if (!input.type) {
            throw new Error('Notification type is required');
        }
        if (!input.title || input.title.trim().length === 0) {
            throw new Error('Notification title is required');
        }
        if (!input.message || input.message.trim().length === 0) {
            throw new Error('Notification message is required');
        }

        return new Notification({
            userId: input.userId,
            type: input.type,
            title: input.title.trim(),
            titleAr: input.titleAr?.trim(),
            message: input.message.trim(),
            messageAr: input.messageAr?.trim(),
            relatedEntityType: input.relatedEntityType,
            relatedEntityId: input.relatedEntityId,
            isRead: false,
            createdAt: new Date(),
        });
    }

    /**
     * Rehydrate from persistence
     */
    public static rehydrate(data: {
        id: string;
        userId: string;
        type: string;
        title: string;
        titleAr?: string;
        message: string;
        messageAr?: string;
        relatedEntityType?: string;
        relatedEntityId?: string;
        isRead: boolean;
        readAt?: Date;
        createdAt: Date;
    }): Notification {
        return new Notification(
            {
                userId: data.userId,
                type: data.type,
                title: data.title,
                titleAr: data.titleAr,
                message: data.message,
                messageAr: data.messageAr,
                relatedEntityType: data.relatedEntityType,
                relatedEntityId: data.relatedEntityId,
                isRead: data.isRead,
                readAt: data.readAt,
                createdAt: data.createdAt,
            },
            data.id
        );
    }

    // ============================================
    // GETTERS
    // ============================================

    get userId(): string {
        return this.props.userId;
    }

    get type(): string {
        return this.props.type;
    }

    get title(): string {
        return this.props.title;
    }

    get titleAr(): string | undefined {
        return this.props.titleAr;
    }

    get message(): string {
        return this.props.message;
    }

    get messageAr(): string | undefined {
        return this.props.messageAr;
    }

    get relatedEntityType(): string | undefined {
        return this.props.relatedEntityType;
    }

    get relatedEntityId(): string | undefined {
        return this.props.relatedEntityId;
    }

    get isRead(): boolean {
        return this.props.isRead;
    }

    get readAt(): Date | undefined {
        return this.props.readAt;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    // ============================================
    // BUSINESS METHODS
    // ============================================

    /**
     * Mark notification as read
     */
    public markAsRead(): Notification {
        if (this.props.isRead) {
            return this;
        }

        return new Notification(
            {
                ...this.props,
                isRead: true,
                readAt: new Date(),
            },
            this.id
        );
    }

    /**
     * Mark notification as unread
     */
    public markAsUnread(): Notification {
        if (!this.props.isRead) {
            return this;
        }

        return new Notification(
            {
                ...this.props,
                isRead: false,
                readAt: undefined,
            },
            this.id
        );
    }

    /**
     * Get localized title
     */
    public getLocalizedTitle(locale: 'en' | 'ar' = 'en'): string {
        if (locale === 'ar' && this.props.titleAr) {
            return this.props.titleAr;
        }
        return this.props.title;
    }

    /**
     * Get localized message
     */
    public getLocalizedMessage(locale: 'en' | 'ar' = 'en'): string {
        if (locale === 'ar' && this.props.messageAr) {
            return this.props.messageAr;
        }
        return this.props.message;
    }
}
