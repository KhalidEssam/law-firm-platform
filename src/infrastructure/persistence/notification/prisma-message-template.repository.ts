// ============================================
// PRISMA MESSAGE TEMPLATE REPOSITORY
// src/infrastructure/persistence/notification/prisma-message-template.repository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MessageTemplate } from '../../../core/domain/notification/entities/message-template.entity';
import {
    IMessageTemplateRepository,
    MessageTemplateListOptions,
} from '../../../core/domain/notification/ports/message-template.repository';
import {
    NotificationChannel,
    NotificationChannelMapper,
} from '../../../core/domain/notification/value-objects/notification-channel.enum';

@Injectable()
export class PrismaMessageTemplateRepository implements IMessageTemplateRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ============================================
    // CREATE
    // ============================================
    async create(template: MessageTemplate): Promise<MessageTemplate> {
        const created = await this.prisma.messageTemplate.create({
            data: {
                id: template.id,
                code: template.code,
                name: template.name,
                channel: NotificationChannelMapper.toPrisma(template.channel) as any,
                subject: template.subject,
                subjectAr: template.subjectAr,
                body: template.body,
                bodyAr: template.bodyAr,
                variables: JSON.parse(JSON.stringify(template.variables.toJSON())),
                isActive: template.isActive,
                createdAt: template.createdAt,
                updatedAt: template.updatedAt,
            },
        });
        return this.toDomain(created);
    }

    // ============================================
    // READ
    // ============================================
    async findById(id: string): Promise<MessageTemplate | null> {
        const found = await this.prisma.messageTemplate.findUnique({
            where: { id },
        });
        return found ? this.toDomain(found) : null;
    }

    async findByCode(code: string): Promise<MessageTemplate | null> {
        const found = await this.prisma.messageTemplate.findUnique({
            where: { code },
        });
        return found ? this.toDomain(found) : null;
    }

    async findByCodeAndChannel(
        code: string,
        channel: NotificationChannel
    ): Promise<MessageTemplate | null> {
        const found = await this.prisma.messageTemplate.findFirst({
            where: {
                code,
                channel: NotificationChannelMapper.toPrisma(channel) as any,
            },
        });
        return found ? this.toDomain(found) : null;
    }

    async findActiveByCode(code: string): Promise<MessageTemplate | null> {
        const found = await this.prisma.messageTemplate.findFirst({
            where: { code, isActive: true },
        });
        return found ? this.toDomain(found) : null;
    }

    async findByChannel(channel: NotificationChannel): Promise<MessageTemplate[]> {
        const found = await this.prisma.messageTemplate.findMany({
            where: { channel: NotificationChannelMapper.toPrisma(channel) as any },
            orderBy: { name: 'asc' },
        });
        return found.map(r => this.toDomain(r));
    }

    async list(options?: MessageTemplateListOptions): Promise<MessageTemplate[]> {
        const found = await this.prisma.messageTemplate.findMany({
            where: this.buildWhereClause(options),
            take: options?.limit ?? 50,
            skip: options?.offset ?? 0,
            orderBy: {
                [options?.orderBy ?? 'code']: options?.orderDir ?? 'asc',
            },
        });
        return found.map(r => this.toDomain(r));
    }

    async count(
        options?: Omit<MessageTemplateListOptions, 'limit' | 'offset' | 'orderBy' | 'orderDir'>
    ): Promise<number> {
        return await this.prisma.messageTemplate.count({
            where: this.buildWhereClause(options),
        });
    }

    // ============================================
    // UPDATE
    // ============================================
    async update(template: MessageTemplate): Promise<MessageTemplate> {
        const updated = await this.prisma.messageTemplate.update({
            where: { id: template.id },
            data: {
                name: template.name,
                subject: template.subject,
                subjectAr: template.subjectAr,
                body: template.body,
                bodyAr: template.bodyAr,
                variables: JSON.parse(JSON.stringify(template.variables.toJSON())),
                isActive: template.isActive,
                updatedAt: template.updatedAt,
            },
        });
        return this.toDomain(updated);
    }

    async activate(id: string): Promise<MessageTemplate> {
        const updated = await this.prisma.messageTemplate.update({
            where: { id },
            data: {
                isActive: true,
                updatedAt: new Date(),
            },
        });
        return this.toDomain(updated);
    }

    async deactivate(id: string): Promise<MessageTemplate> {
        const updated = await this.prisma.messageTemplate.update({
            where: { id },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });
        return this.toDomain(updated);
    }

    // ============================================
    // DELETE
    // ============================================
    async delete(id: string): Promise<void> {
        await this.prisma.messageTemplate.delete({
            where: { id },
        });
    }

    // ============================================
    // BUSINESS QUERIES
    // ============================================
    async codeExists(code: string, excludeId?: string): Promise<boolean> {
        const count = await this.prisma.messageTemplate.count({
            where: {
                code,
                ...(excludeId && { id: { not: excludeId } }),
            },
        });
        return count > 0;
    }

    async findAllActive(): Promise<MessageTemplate[]> {
        const found = await this.prisma.messageTemplate.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' },
        });
        return found.map(r => this.toDomain(r));
    }

    async findActiveByChannel(channel: NotificationChannel): Promise<MessageTemplate[]> {
        const found = await this.prisma.messageTemplate.findMany({
            where: {
                channel: NotificationChannelMapper.toPrisma(channel) as any,
                isActive: true,
            },
            orderBy: { code: 'asc' },
        });
        return found.map(r => this.toDomain(r));
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================
    private buildWhereClause(options?: Partial<MessageTemplateListOptions>) {
        const where: any = {};

        if (options?.channel) {
            where.channel = NotificationChannelMapper.toPrisma(options.channel);
        }
        if (options?.isActive !== undefined) {
            where.isActive = options.isActive;
        }
        if (options?.search) {
            where.OR = [
                { code: { contains: options.search, mode: 'insensitive' } },
                { name: { contains: options.search, mode: 'insensitive' } },
            ];
        }

        return where;
    }

    private toDomain(record: any): MessageTemplate {
        return MessageTemplate.rehydrate({
            id: record.id,
            code: record.code,
            name: record.name,
            channel: NotificationChannelMapper.toDomain(record.channel),
            subject: record.subject ?? undefined,
            subjectAr: record.subjectAr ?? undefined,
            body: record.body,
            bodyAr: record.bodyAr,
            variables: record.variables,
            isActive: record.isActive,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }
}
