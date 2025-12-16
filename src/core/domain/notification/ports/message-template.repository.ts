// ============================================
// MESSAGE TEMPLATE REPOSITORY PORT
// src/core/domain/notification/ports/message-template.repository.ts
// ============================================

import { MessageTemplate } from '../entities/message-template.entity';
import { NotificationChannel } from '../value-objects/notification-channel.enum';

export interface MessageTemplateListOptions {
    channel?: NotificationChannel;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'code' | 'name' | 'createdAt' | 'updatedAt';
    orderDir?: 'asc' | 'desc';
}

export interface IMessageTemplateRepository {
    // ============================================
    // CREATE
    // ============================================
    create(template: MessageTemplate): Promise<MessageTemplate>;

    // ============================================
    // READ
    // ============================================
    findById(id: string): Promise<MessageTemplate | null>;
    findByCode(code: string): Promise<MessageTemplate | null>;
    findByCodeAndChannel(code: string, channel: NotificationChannel): Promise<MessageTemplate | null>;
    findActiveByCode(code: string): Promise<MessageTemplate | null>;
    findByChannel(channel: NotificationChannel): Promise<MessageTemplate[]>;
    list(options?: MessageTemplateListOptions): Promise<MessageTemplate[]>;
    count(options?: Omit<MessageTemplateListOptions, 'limit' | 'offset' | 'orderBy' | 'orderDir'>): Promise<number>;

    // ============================================
    // UPDATE
    // ============================================
    update(template: MessageTemplate): Promise<MessageTemplate>;
    activate(id: string): Promise<MessageTemplate>;
    deactivate(id: string): Promise<MessageTemplate>;

    // ============================================
    // DELETE
    // ============================================
    delete(id: string): Promise<void>;

    // ============================================
    // BUSINESS QUERIES
    // ============================================
    codeExists(code: string, excludeId?: string): Promise<boolean>;
    findAllActive(): Promise<MessageTemplate[]>;
    findActiveByChannel(channel: NotificationChannel): Promise<MessageTemplate[]>;
}
