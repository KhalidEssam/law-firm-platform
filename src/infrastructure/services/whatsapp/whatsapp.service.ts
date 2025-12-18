// ============================================
// WHATSAPP SERVICE IMPLEMENTATION (BAILEYS)
// src/infrastructure/services/whatsapp/whatsapp.service.ts
// ============================================

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { IWhatsAppService } from '../../../core/domain/user/ports/whatsapp.service';

/**
 * WhatsApp Service using Baileys (WhatsApp Web API)
 *
 * INSTALLATION REQUIRED:
 * npm install @whiskeysockets/baileys qrcode-terminal
 *
 * This service connects to WhatsApp Web and allows sending messages.
 * On first run, scan the QR code with your WhatsApp mobile app.
 * Session is persisted in ./whatsapp-auth folder.
 */
@Injectable()
export class WhatsAppService implements IWhatsAppService, OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(WhatsAppService.name);
    private socket: any = null;
    private qrCode: string | null = null;
    private isReady = false;
    private authFolder = './whatsapp-auth';

    async onModuleInit() {
        await this.initialize();
    }

    async onModuleDestroy() {
        if (this.socket) {
            this.socket.end();
        }
    }

    private async initialize(): Promise<void> {
        try {
            // Dynamic import to handle case where baileys is not installed
            const baileys = await this.importBaileys();
            if (!baileys) {
                this.logger.warn('Baileys not installed. WhatsApp service disabled.');
                this.logger.warn('Install with: npm install @whiskeysockets/baileys');
                return;
            }

            const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

            // Load auth state
            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

            // Create socket connection
            this.socket = makeWASocket({
                auth: state,
                printQRInTerminal: true,
                logger: {
                    level: 'silent',
                    trace: () => {},
                    debug: () => {},
                    info: () => {},
                    warn: (msg: string) => this.logger.warn(msg),
                    error: (msg: string) => this.logger.error(msg),
                    fatal: (msg: string) => this.logger.error(msg),
                    child: () => this,
                } as any,
            });

            // Handle connection updates
            this.socket.ev.on('connection.update', (update: any) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.qrCode = qr;
                    this.logger.log('QR Code received. Scan with WhatsApp mobile app.');
                    this.printQrCode(qr);
                }

                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    this.logger.warn(`Connection closed. Reconnect: ${shouldReconnect}`);
                    this.isReady = false;

                    if (shouldReconnect) {
                        setTimeout(() => this.initialize(), 5000);
                    }
                } else if (connection === 'open') {
                    this.logger.log('WhatsApp connection established!');
                    this.isReady = true;
                    this.qrCode = null;
                }
            });

            // Save credentials on update
            this.socket.ev.on('creds.update', saveCreds);

        } catch (error) {
            this.logger.error('Failed to initialize WhatsApp service:', error);
        }
    }

    private async importBaileys(): Promise<any> {
        try {
            return await import('@whiskeysockets/baileys');
        } catch {
            try {
                return await import('baileys');
            } catch {
                return null;
            }
        }
    }

    private printQrCode(qr: string): void {
        try {
            // Try to use qrcode-terminal if available
            import('qrcode-terminal').then((qrTerminal) => {
                qrTerminal.generate(qr, { small: true });
            }).catch(() => {
                this.logger.log('QR Code (scan this with WhatsApp):');
                this.logger.log(qr);
            });
        } catch {
            this.logger.log('QR Code:', qr);
        }
    }

    async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
        if (!this.isReady || !this.socket) {
            this.logger.warn('WhatsApp not connected. Cannot send message.');
            return false;
        }

        try {
            // Format phone number (remove + and add @s.whatsapp.net)
            const formattedNumber = this.formatPhoneNumber(phoneNumber);

            await this.socket.sendMessage(formattedNumber, { text: message });
            this.logger.log(`Message sent to ${phoneNumber}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send message to ${phoneNumber}:`, error);
            return false;
        }
    }

    async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
        const message = this.formatOtpMessage(otp);
        return this.sendMessage(phoneNumber, message);
    }

    private formatOtpMessage(otp: string): string {
        return `🔐 *Exoln Verification Code*

Your verification code is: *${otp}*

This code expires in 3 minutes.

⚠️ Do not share this code with anyone.

If you didn't request this code, please ignore this message.`;
    }

    private formatPhoneNumber(phoneNumber: string): string {
        // Remove any non-digit characters except +
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');

        // Remove leading +
        if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
        }

        // Add WhatsApp suffix
        return `${cleaned}@s.whatsapp.net`;
    }

    async isConnected(): Promise<boolean> {
        return this.isReady;
    }

    async getQrCode(): Promise<string | null> {
        return this.qrCode;
    }
}
