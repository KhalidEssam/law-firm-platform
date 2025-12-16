// ============================================
// NOTIFICATION MODULE
// src/interface/notification/notification.module.ts
// ============================================

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

// Controller
import { NotificationController } from '../http/notification.controller';

// Notification Sender
import { EmailNotificationSender } from '../../core/application/notification/email-notification.sender';
import { NotificationSender } from '../../core/application/notification/interfaces/notification-sender.interface';

// Repositories
import { PrismaNotificationRepository } from '../../infrastructure/persistence/notification/prisma-notification.repository';
import { PrismaMessageTemplateRepository } from '../../infrastructure/persistence/notification/prisma-message-template.repository';
import { PrismaNotificationPreferenceRepository } from '../../infrastructure/persistence/notification/prisma-notification-preference.repository';
import { INotificationRepository } from '../../core/domain/notification/ports/notification.repository';
import { IMessageTemplateRepository } from '../../core/domain/notification/ports/message-template.repository';
import { INotificationPreferenceRepository } from '../../core/domain/notification/ports/notification-preference.repository';

// Notification Use Cases
import {
    SendNotificationUseCase,
    SendTemplatedNotificationUseCase,
    GetNotificationsUseCase,
    MarkNotificationUseCase,
    DeleteNotificationUseCase,
} from '../../core/application/notification/use-cases/notification.use-cases';

// Message Template Use Cases
import {
    CreateMessageTemplateUseCase,
    GetMessageTemplateUseCase,
    ListMessageTemplatesUseCase,
    UpdateMessageTemplateUseCase,
    DeleteMessageTemplateUseCase,
    RenderMessageTemplateUseCase,
} from '../../core/application/notification/use-cases/message-template.use-cases';

// Notification Preference Use Cases
import {
    GetNotificationPreferencesUseCase,
    SetNotificationPreferenceUseCase,
    BulkSetNotificationPreferencesUseCase,
    InitializeNotificationPreferencesUseCase,
    DeleteNotificationPreferencesUseCase,
} from '../../core/application/notification/use-cases/notification-preference.use-cases';

// Repository tokens
const NOTIFICATION_REPOSITORY = 'INotificationRepository';
const MESSAGE_TEMPLATE_REPOSITORY = 'IMessageTemplateRepository';
const NOTIFICATION_PREFERENCE_REPOSITORY = 'INotificationPreferenceRepository';

@Module({
    imports: [PrismaModule],
    controllers: [NotificationController],
    providers: [
        // ============================================
        // NOTIFICATION SENDER
        // ============================================
        {
            provide: NotificationSender,
            useClass: EmailNotificationSender,
        },

        // ============================================
        // REPOSITORIES
        // ============================================
        {
            provide: NOTIFICATION_REPOSITORY,
            useClass: PrismaNotificationRepository,
        },
        {
            provide: MESSAGE_TEMPLATE_REPOSITORY,
            useClass: PrismaMessageTemplateRepository,
        },
        {
            provide: NOTIFICATION_PREFERENCE_REPOSITORY,
            useClass: PrismaNotificationPreferenceRepository,
        },
        // Also provide concrete classes for direct injection
        PrismaNotificationRepository,
        PrismaMessageTemplateRepository,
        PrismaNotificationPreferenceRepository,

        // ============================================
        // NOTIFICATION USE CASES
        // ============================================
        {
            provide: SendNotificationUseCase,
            useFactory: (
                notificationRepo: INotificationRepository,
                preferenceRepo: INotificationPreferenceRepository,
                notificationSender: NotificationSender,
            ) => new SendNotificationUseCase(notificationRepo, preferenceRepo, notificationSender),
            inject: [NOTIFICATION_REPOSITORY, NOTIFICATION_PREFERENCE_REPOSITORY, NotificationSender],
        },
        {
            provide: SendTemplatedNotificationUseCase,
            useFactory: (
                notificationRepo: INotificationRepository,
                templateRepo: IMessageTemplateRepository,
                preferenceRepo: INotificationPreferenceRepository,
                notificationSender: NotificationSender,
            ) => new SendTemplatedNotificationUseCase(notificationRepo, templateRepo, preferenceRepo, notificationSender),
            inject: [NOTIFICATION_REPOSITORY, MESSAGE_TEMPLATE_REPOSITORY, NOTIFICATION_PREFERENCE_REPOSITORY, NotificationSender],
        },
        {
            provide: GetNotificationsUseCase,
            useFactory: (repo: INotificationRepository) => new GetNotificationsUseCase(repo),
            inject: [NOTIFICATION_REPOSITORY],
        },
        {
            provide: MarkNotificationUseCase,
            useFactory: (repo: INotificationRepository) => new MarkNotificationUseCase(repo),
            inject: [NOTIFICATION_REPOSITORY],
        },
        {
            provide: DeleteNotificationUseCase,
            useFactory: (repo: INotificationRepository) => new DeleteNotificationUseCase(repo),
            inject: [NOTIFICATION_REPOSITORY],
        },

        // ============================================
        // MESSAGE TEMPLATE USE CASES
        // ============================================
        {
            provide: CreateMessageTemplateUseCase,
            useFactory: (repo: IMessageTemplateRepository) => new CreateMessageTemplateUseCase(repo),
            inject: [MESSAGE_TEMPLATE_REPOSITORY],
        },
        {
            provide: GetMessageTemplateUseCase,
            useFactory: (repo: IMessageTemplateRepository) => new GetMessageTemplateUseCase(repo),
            inject: [MESSAGE_TEMPLATE_REPOSITORY],
        },
        {
            provide: ListMessageTemplatesUseCase,
            useFactory: (repo: IMessageTemplateRepository) => new ListMessageTemplatesUseCase(repo),
            inject: [MESSAGE_TEMPLATE_REPOSITORY],
        },
        {
            provide: UpdateMessageTemplateUseCase,
            useFactory: (repo: IMessageTemplateRepository) => new UpdateMessageTemplateUseCase(repo),
            inject: [MESSAGE_TEMPLATE_REPOSITORY],
        },
        {
            provide: DeleteMessageTemplateUseCase,
            useFactory: (repo: IMessageTemplateRepository) => new DeleteMessageTemplateUseCase(repo),
            inject: [MESSAGE_TEMPLATE_REPOSITORY],
        },
        {
            provide: RenderMessageTemplateUseCase,
            useFactory: (repo: IMessageTemplateRepository) => new RenderMessageTemplateUseCase(repo),
            inject: [MESSAGE_TEMPLATE_REPOSITORY],
        },

        // ============================================
        // NOTIFICATION PREFERENCE USE CASES
        // ============================================
        {
            provide: GetNotificationPreferencesUseCase,
            useFactory: (repo: INotificationPreferenceRepository) => new GetNotificationPreferencesUseCase(repo),
            inject: [NOTIFICATION_PREFERENCE_REPOSITORY],
        },
        {
            provide: SetNotificationPreferenceUseCase,
            useFactory: (repo: INotificationPreferenceRepository) => new SetNotificationPreferenceUseCase(repo),
            inject: [NOTIFICATION_PREFERENCE_REPOSITORY],
        },
        {
            provide: BulkSetNotificationPreferencesUseCase,
            useFactory: (repo: INotificationPreferenceRepository) => new BulkSetNotificationPreferencesUseCase(repo),
            inject: [NOTIFICATION_PREFERENCE_REPOSITORY],
        },
        {
            provide: InitializeNotificationPreferencesUseCase,
            useFactory: (repo: INotificationPreferenceRepository) => new InitializeNotificationPreferencesUseCase(repo),
            inject: [NOTIFICATION_PREFERENCE_REPOSITORY],
        },
        {
            provide: DeleteNotificationPreferencesUseCase,
            useFactory: (repo: INotificationPreferenceRepository) => new DeleteNotificationPreferencesUseCase(repo),
            inject: [NOTIFICATION_PREFERENCE_REPOSITORY],
        },
    ],
    exports: [
        // Export use cases for other modules
        SendNotificationUseCase,
        SendTemplatedNotificationUseCase,
        GetNotificationsUseCase,
        MarkNotificationUseCase,
        DeleteNotificationUseCase,
        CreateMessageTemplateUseCase,
        GetMessageTemplateUseCase,
        ListMessageTemplatesUseCase,
        UpdateMessageTemplateUseCase,
        DeleteMessageTemplateUseCase,
        RenderMessageTemplateUseCase,
        GetNotificationPreferencesUseCase,
        SetNotificationPreferenceUseCase,
        BulkSetNotificationPreferencesUseCase,
        InitializeNotificationPreferencesUseCase,
        DeleteNotificationPreferencesUseCase,
        // Export repositories for direct access if needed
        NOTIFICATION_REPOSITORY,
        MESSAGE_TEMPLATE_REPOSITORY,
        NOTIFICATION_PREFERENCE_REPOSITORY,
    ],
})
export class NotificationModule {}
