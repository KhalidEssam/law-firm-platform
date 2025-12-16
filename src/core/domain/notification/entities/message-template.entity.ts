// ============================================
// MESSAGE TEMPLATE ENTITY
// src/core/domain/notification/entities/message-template.entity.ts
// ============================================

import { Entity } from '../../base/Entity';
import { NotificationChannel } from '../value-objects/notification-channel.enum';
import { TemplateVariables, TemplateVariable } from '../value-objects/template-variable.vo';

interface MessageTemplateProps {
    code: string;
    name: string;
    channel: NotificationChannel;
    subject?: string;
    subjectAr?: string;
    body: string;
    bodyAr: string;
    variables: TemplateVariables;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateMessageTemplateInput {
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

export interface UpdateMessageTemplateInput {
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

export interface RenderedTemplate {
    subject?: string;
    subjectAr?: string;
    body: string;
    bodyAr: string;
}

/**
 * MessageTemplate Entity
 * Represents a template for notification messages
 */
export class MessageTemplate extends Entity<MessageTemplateProps> {
    private constructor(props: MessageTemplateProps, id?: string) {
        super(props, id);
    }

    // ============================================
    // FACTORY METHODS
    // ============================================

    /**
     * Create a new message template
     */
    public static create(input: CreateMessageTemplateInput): MessageTemplate {
        if (!input.code || input.code.trim().length === 0) {
            throw new Error('Template code is required');
        }
        if (!input.name || input.name.trim().length === 0) {
            throw new Error('Template name is required');
        }
        if (!input.body || input.body.trim().length === 0) {
            throw new Error('Template body is required');
        }
        if (!input.bodyAr || input.bodyAr.trim().length === 0) {
            throw new Error('Arabic template body is required');
        }

        // Validate code format (alphanumeric with underscores, lowercase)
        const codePattern = /^[a-z][a-z0-9_]*$/;
        if (!codePattern.test(input.code)) {
            throw new Error('Template code must be lowercase alphanumeric with underscores');
        }

        const now = new Date();

        return new MessageTemplate({
            code: input.code.trim().toLowerCase(),
            name: input.name.trim(),
            channel: input.channel,
            subject: input.subject?.trim(),
            subjectAr: input.subjectAr?.trim(),
            body: input.body.trim(),
            bodyAr: input.bodyAr.trim(),
            variables: TemplateVariables.create(input.variables ?? []),
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Rehydrate from persistence
     */
    public static rehydrate(data: {
        id: string;
        code: string;
        name: string;
        channel: NotificationChannel;
        subject?: string;
        subjectAr?: string;
        body: string;
        bodyAr: string;
        variables: any;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): MessageTemplate {
        return new MessageTemplate(
            {
                code: data.code,
                name: data.name,
                channel: data.channel,
                subject: data.subject,
                subjectAr: data.subjectAr,
                body: data.body,
                bodyAr: data.bodyAr,
                variables: TemplateVariables.fromJSON(data.variables),
                isActive: data.isActive,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            },
            data.id
        );
    }

    // ============================================
    // GETTERS
    // ============================================

    get code(): string {
        return this.props.code;
    }

    get name(): string {
        return this.props.name;
    }

    get channel(): NotificationChannel {
        return this.props.channel;
    }

    get subject(): string | undefined {
        return this.props.subject;
    }

    get subjectAr(): string | undefined {
        return this.props.subjectAr;
    }

    get body(): string {
        return this.props.body;
    }

    get bodyAr(): string {
        return this.props.bodyAr;
    }

    get variables(): TemplateVariables {
        return this.props.variables;
    }

    get isActive(): boolean {
        return this.props.isActive;
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
     * Update the template
     */
    public update(input: UpdateMessageTemplateInput): MessageTemplate {
        return new MessageTemplate(
            {
                ...this.props,
                name: input.name ?? this.props.name,
                subject: input.subject !== undefined ? input.subject : this.props.subject,
                subjectAr: input.subjectAr !== undefined ? input.subjectAr : this.props.subjectAr,
                body: input.body ?? this.props.body,
                bodyAr: input.bodyAr ?? this.props.bodyAr,
                variables: input.variables
                    ? TemplateVariables.create(input.variables)
                    : this.props.variables,
                isActive: input.isActive ?? this.props.isActive,
                updatedAt: new Date(),
            },
            this.id
        );
    }

    /**
     * Activate the template
     */
    public activate(): MessageTemplate {
        if (this.props.isActive) {
            return this;
        }

        return new MessageTemplate(
            {
                ...this.props,
                isActive: true,
                updatedAt: new Date(),
            },
            this.id
        );
    }

    /**
     * Deactivate the template
     */
    public deactivate(): MessageTemplate {
        if (!this.props.isActive) {
            return this;
        }

        return new MessageTemplate(
            {
                ...this.props,
                isActive: false,
                updatedAt: new Date(),
            },
            this.id
        );
    }

    /**
     * Render the template with provided variables
     */
    public render(values: Record<string, string>): RenderedTemplate {
        // Validate required variables
        const validation = this.props.variables.validateValues(values);
        if (!validation.valid) {
            throw new Error(`Missing required template variables: ${validation.missing.join(', ')}`);
        }

        // Apply default values
        const finalValues = this.props.variables.applyDefaults(values);

        // Render each field
        return {
            subject: this.renderString(this.props.subject, finalValues),
            subjectAr: this.renderString(this.props.subjectAr, finalValues),
            body: this.renderString(this.props.body, finalValues)!,
            bodyAr: this.renderString(this.props.bodyAr, finalValues)!,
        };
    }

    /**
     * Validate that a string can be rendered with the given values
     */
    public canRender(values: Record<string, string>): boolean {
        const validation = this.props.variables.validateValues(values);
        return validation.valid;
    }

    /**
     * Get all variable placeholders found in the template
     */
    public extractPlaceholders(): string[] {
        const placeholderPattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
        const allText = [
            this.props.subject,
            this.props.subjectAr,
            this.props.body,
            this.props.bodyAr,
        ].filter(Boolean).join(' ');

        const matches = allText.matchAll(placeholderPattern);
        const placeholders = new Set<string>();

        for (const match of matches) {
            placeholders.add(match[1]);
        }

        return Array.from(placeholders);
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private renderString(
        template: string | undefined,
        values: Record<string, string>
    ): string | undefined {
        if (!template) {
            return undefined;
        }

        let result = template;
        for (const [key, value] of Object.entries(values)) {
            const placeholder = `{{${key}}}`;
            result = result.split(placeholder).join(value ?? '');
        }

        return result;
    }
}
