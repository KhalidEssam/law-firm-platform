import { NotificationId } from "../value-objects/notification-id.vo";
import { NotificationType } from "../value-objects/notification-type.enum";
import { NotificationChannel } from "../value-objects/notification-channel.enum";

export class Notification {
    constructor(
        private readonly id: NotificationId,
        private readonly userId: string,
        private readonly type: NotificationType,
        private readonly channel: NotificationChannel,
        private readonly message: string,
        private readonly createdAt: Date = new Date(),
    ) { }

    getId() { return this.id; }
    getUserId() { return this.userId; }
    getType() { return this.type; }
    getChannel() { return this.channel; }
    getMessage() { return this.message; }
    getCreatedAt() { return this.createdAt; }
}
