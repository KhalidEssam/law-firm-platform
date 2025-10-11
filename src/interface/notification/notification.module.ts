// src/core/applications/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { SendNotificationUseCase } from '../../core/application/notification/send-notification.usecase';
import { EmailNotificationSender } from '../../core/application/notification/email-notification.sender';
import { NotificationSender } from '../../core/application/notification/interfaces/notification-sender.interface';

@Module({
    providers: [
        SendNotificationUseCase,
        { provide: NotificationSender, useClass: EmailNotificationSender },
    ],
    exports: [SendNotificationUseCase],
})
export class NotificationModule { }
