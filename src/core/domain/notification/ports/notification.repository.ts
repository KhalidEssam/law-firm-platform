// ============================================
// NOTIFICATION REPOSITORY PORT
// src/core/domain/notification/ports/notification.repository.ts
// ============================================

import { Notification } from '../entities/notification.entity';

export interface NotificationListOptions {
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

export interface NotificationCountOptions {
    userId?: string;
    type?: string;
    isRead?: boolean;
    relatedEntityType?: string;
    fromDate?: Date;
    toDate?: Date;
}

export interface INotificationRepository {
    // ============================================
    // CREATE
    // ============================================
    create(notification: Notification): Promise<Notification>;
    createMany(notifications: Notification[]): Promise<Notification[]>;

    // ============================================
    // READ
    // ============================================
    findById(id: string): Promise<Notification | null>;
    findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<Notification[]>;
    findUnreadByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<Notification[]>;
    list(options?: NotificationListOptions): Promise<Notification[]>;
    count(options?: NotificationCountOptions): Promise<number>;
    countUnread(userId: string): Promise<number>;

    // ============================================
    // UPDATE
    // ============================================
    update(notification: Notification): Promise<Notification>;
    markAsRead(id: string): Promise<Notification>;
    markAsUnread(id: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<number>;

    // ============================================
    // DELETE
    // ============================================
    delete(id: string): Promise<void>;
    deleteByUserId(userId: string): Promise<number>;
    deleteOlderThan(date: Date): Promise<number>;

    // ============================================
    // BUSINESS QUERIES
    // ============================================
    findByRelatedEntity(
        entityType: string,
        entityId: string,
        options?: { limit?: number }
    ): Promise<Notification[]>;
    getRecentByUserId(userId: string, limit?: number): Promise<Notification[]>;
    getUserNotificationStats(userId: string): Promise<{
        total: number;
        unread: number;
        byType: Record<string, number>;
    }>;
}
