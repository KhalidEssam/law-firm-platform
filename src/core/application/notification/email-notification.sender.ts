import { Injectable } from "@nestjs/common";
import { NotificationSender } from "../../application/notification/interfaces/notification-sender.interface";
import { Notification } from "../../domain/notification/entities/notification.entity";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailNotificationSender implements NotificationSender {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: "mail.exoln.com", // example: use SES, Gmail, SendGrid
            port: 465,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
    }

    async send(notification: Notification, recipient: string): Promise<void> {
        await this.transporter.sendMail({
            from: '"NoReply"' + process.env.MAIL_USER,
            to: recipient,
            subject: `Notification: ${notification.getType()}`,
            text: notification.getMessage(),
        });

        console.log(`📧 Email notification sent to ${recipient}`);
    }
}
