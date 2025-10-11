// src/core/applications/notification/interfaces/notification-sender.interface.ts
import { Notification } from "../../../domain/notification/entities/notification.entity";

export abstract class NotificationSender {
    abstract send(notification: Notification, email: string): Promise<void>;
}
