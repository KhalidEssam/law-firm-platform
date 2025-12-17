// ============================================
// MESSAGE TEMPLATE USE CASES
// src/core/application/notification/use-cases/message-template.use-cases.ts
// ============================================

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import {
    MessageTemplate,
    CreateMessageTemplateInput,
    UpdateMessageTemplateInput,
} from '../../../domain/notification/entities/message-template.entity';
import { type IMessageTemplateRepository, MessageTemplateListOptions } from '../../../domain/notification/ports/message-template.repository';
import { NotificationChannel } from '../../../domain/notification/value-objects/notification-channel.enum';

// ============================================
// DTOs
// ============================================

export interface CreateTemplateDto {
    code: string;
    name: string;
    channel: NotificationChannel;
    subject?: string;
    subjectAr?: string;
    body: string;
    bodyAr: string;
    variables?: Array<{
        name: string;
        description?: string;
        required: boolean;
        defaultValue?: string;
    }>;
}

export interface UpdateTemplateDto {
    name?: string;
    subject?: string;
    subjectAr?: string;
    body?: string;
    bodyAr?: string;
    variables?: Array<{
        name: string;
        description?: string;
        required: boolean;
        defaultValue?: string;
    }>;
    isActive?: boolean;
}

export interface TemplateListDto {
    channel?: NotificationChannel;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'code' | 'name' | 'createdAt' | 'updatedAt';
    orderDir?: 'asc' | 'desc';
}

export interface RenderTemplateDto {
    templateCode: string;
    variables: Record<string, string>;
}

// ============================================
// CREATE TEMPLATE USE CASE
// ============================================

@Injectable()
export class CreateMessageTemplateUseCase {
    constructor(private readonly templateRepository: IMessageTemplateRepository) {}

    async execute(dto: CreateTemplateDto): Promise<MessageTemplate> {
        // Check if code already exists
        const exists = await this.templateRepository.codeExists(dto.code);
        if (exists) {
            throw new ConflictException(`Template with code '${dto.code}' already exists`);
        }

        const template = MessageTemplate.create({
            code: dto.code,
            name: dto.name,
            channel: dto.channel,
            subject: dto.subject,
            subjectAr: dto.subjectAr,
            body: dto.body,
            bodyAr: dto.bodyAr,
            variables: dto.variables,
        });

        return await this.templateRepository.create(template);
    }
}

// ============================================
// GET TEMPLATE USE CASE
// ============================================

@Injectable()
export class GetMessageTemplateUseCase {
    constructor(private readonly templateRepository: IMessageTemplateRepository) {}

    async byId(id: string): Promise<MessageTemplate> {
        const template = await this.templateRepository.findById(id);
        if (!template) {
            throw new NotFoundException(`Template with ID '${id}' not found`);
        }
        return template;
    }

    async byCode(code: string): Promise<MessageTemplate> {
        const template = await this.templateRepository.findByCode(code);
        if (!template) {
            throw new NotFoundException(`Template with code '${code}' not found`);
        }
        return template;
    }

    async activeByCode(code: string): Promise<MessageTemplate> {
        const template = await this.templateRepository.findActiveByCode(code);
        if (!template) {
            throw new NotFoundException(`Active template with code '${code}' not found`);
        }
        return template;
    }
}

// ============================================
// LIST TEMPLATES USE CASE
// ============================================

@Injectable()
export class ListMessageTemplatesUseCase {
    constructor(private readonly templateRepository: IMessageTemplateRepository) {}

    async execute(dto?: TemplateListDto): Promise<{
        templates: MessageTemplate[];
        total: number;
    }> {
        const options: MessageTemplateListOptions = {
            channel: dto?.channel,
            isActive: dto?.isActive,
            search: dto?.search,
            limit: dto?.limit ?? 50,
            offset: dto?.offset ?? 0,
            orderBy: dto?.orderBy ?? 'code',
            orderDir: dto?.orderDir ?? 'asc',
        };

        const [templates, total] = await Promise.all([
            this.templateRepository.list(options),
            this.templateRepository.count({
                channel: dto?.channel,
                isActive: dto?.isActive,
                search: dto?.search,
            }),
        ]);

        return { templates, total };
    }

    async byChannel(channel: NotificationChannel): Promise<MessageTemplate[]> {
        return await this.templateRepository.findByChannel(channel);
    }

    async allActive(): Promise<MessageTemplate[]> {
        return await this.templateRepository.findAllActive();
    }

    async activeByChannel(channel: NotificationChannel): Promise<MessageTemplate[]> {
        return await this.templateRepository.findActiveByChannel(channel);
    }
}

// ============================================
// UPDATE TEMPLATE USE CASE
// ============================================

@Injectable()
export class UpdateMessageTemplateUseCase {
    constructor(private readonly templateRepository: IMessageTemplateRepository) {}

    async execute(id: string, dto: UpdateTemplateDto): Promise<MessageTemplate> {
        const template = await this.templateRepository.findById(id);
        if (!template) {
            throw new NotFoundException(`Template with ID '${id}' not found`);
        }

        const updated = template.update({
            name: dto.name,
            subject: dto.subject,
            subjectAr: dto.subjectAr,
            body: dto.body,
            bodyAr: dto.bodyAr,
            variables: dto.variables,
            isActive: dto.isActive,
        });

        return await this.templateRepository.update(updated);
    }

    async activate(id: string): Promise<MessageTemplate> {
        const template = await this.templateRepository.findById(id);
        if (!template) {
            throw new NotFoundException(`Template with ID '${id}' not found`);
        }
        return await this.templateRepository.activate(id);
    }

    async deactivate(id: string): Promise<MessageTemplate> {
        const template = await this.templateRepository.findById(id);
        if (!template) {
            throw new NotFoundException(`Template with ID '${id}' not found`);
        }
        return await this.templateRepository.deactivate(id);
    }
}

// ============================================
// DELETE TEMPLATE USE CASE
// ============================================

@Injectable()
export class DeleteMessageTemplateUseCase {
    constructor(private readonly templateRepository: IMessageTemplateRepository) {}

    async execute(id: string): Promise<void> {
        const template = await this.templateRepository.findById(id);
        if (!template) {
            throw new NotFoundException(`Template with ID '${id}' not found`);
        }
        await this.templateRepository.delete(id);
    }
}

// ============================================
// RENDER TEMPLATE USE CASE
// ============================================

@Injectable()
export class RenderMessageTemplateUseCase {
    constructor(private readonly templateRepository: IMessageTemplateRepository) {}

    async execute(dto: RenderTemplateDto): Promise<{
        subject?: string;
        subjectAr?: string;
        body: string;
        bodyAr: string;
    }> {
        const template = await this.templateRepository.findActiveByCode(dto.templateCode);
        if (!template) {
            throw new NotFoundException(`Active template with code '${dto.templateCode}' not found`);
        }

        if (!template.canRender(dto.variables)) {
            const validation = template.variables.validateValues(dto.variables);
            throw new BadRequestException(
                `Missing required template variables: ${validation.missing.join(', ')}`
            );
        }

        return template.render(dto.variables);
    }

    async preview(id: string, variables: Record<string, string>): Promise<{
        subject?: string;
        subjectAr?: string;
        body: string;
        bodyAr: string;
    }> {
        const template = await this.templateRepository.findById(id);
        if (!template) {
            throw new NotFoundException(`Template with ID '${id}' not found`);
        }

        // For preview, use empty strings for missing variables
        const filledVariables = { ...variables };
        for (const v of template.variables.all) {
            if (!filledVariables[v.name]) {
                filledVariables[v.name] = v.defaultValue ?? `{{${v.name}}}`;
            }
        }

        return template.render(filledVariables);
    }
}
