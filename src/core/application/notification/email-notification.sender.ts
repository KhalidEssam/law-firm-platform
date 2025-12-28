// ============================================
// EMAIL NOTIFICATION SENDER
// src/core/application/notification/email-notification.sender.ts
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { NotificationSender } from './interfaces/notification-sender.interface';
import { Notification } from '../../domain/notification/entities/notification.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailNotificationSender extends NotificationSender {
  private readonly logger = new Logger(EmailNotificationSender.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? 'mail.exoln.com',
      port: parseInt(process.env.MAIL_PORT ?? '465'),
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async send(notification: Notification, recipient: string): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${process.env.MAIL_FROM_NAME ?? 'Exoln Lex'}" <${process.env.MAIL_USER}>`,
      to: recipient,
      subject: notification.title,
      text: notification.message,
      html: this.buildHtmlContent(notification),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email notification sent to ${recipient}: ${notification.type}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${recipient}`, error.stack);
      throw error;
    }
  }

  private buildHtmlContent(notification: Notification): string {
    return `
            <!DOCTYPE html>
            <html dir="ltr" lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${notification.title}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px 8px 0 0;
                        text-align: center;
                    }
                    .content {
                        background: #f9f9f9;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-top: none;
                    }
                    .footer {
                        background: #333;
                        color: #999;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        border-radius: 0 0 8px 8px;
                    }
                    .notification-type {
                        background: rgba(255,255,255,0.2);
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        display: inline-block;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <span class="notification-type">${notification.type}</span>
                    <h1 style="margin: 10px 0;">${notification.title}</h1>
                </div>
                <div class="content">
                    <p>${notification.message.replace(/\n/g, '<br>')}</p>
                </div>
                <div class="footer">
                    <p>This is an automated notification from Exoln Lex</p>
                    <p>&copy; ${new Date().getFullYear()} Exoln. All rights reserved.</p>
                </div>
            </body>
            </html>
        `;
  }
}
