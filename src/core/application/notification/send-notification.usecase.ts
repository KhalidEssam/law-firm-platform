import { Injectable } from "@nestjs/common";
import { Notification } from "../../domain/notification/entities/notification.entity";
import { NotificationId } from "../../domain/notification/value-objects/notification-id.vo";
import { NotificationType } from "../../domain/notification/value-objects/notification-type.enum";
import { NotificationChannel } from "../../domain/notification/value-objects/notification-channel.enum";
import { NotificationSender } from "./interfaces/notification-sender.interface";

@Injectable()
export class SendNotificationUseCase {
    constructor(private readonly notificationSender: NotificationSender) { }

    async execute(input: {
        userId: string;
        email: string;
        type: NotificationType;
        channel: NotificationChannel;
        message: string;
    }): Promise<void> {
        const notification = new Notification(
            // new NotificationId(),
            await NotificationId.create(),
            input.userId,
            input.type,
            input.channel,
            input.message
        );

        await this.notificationSender.send(notification, input.email);
    }
}
