// ============================================
// WHATSAPP SERVICE IMPLEMENTATION (BAILEYS)
// src/infrastructure/services/whatsapp/whatsapp.service.ts
// ============================================

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { IWhatsAppService } from '../../../core/domain/user/ports/whatsapp.service';

/**
 * WhatsApp Service using Baileys (WhatsApp Web API)
 *
 * INSTALLATION REQUIRED:
 * npm install @whiskeysockets/baileys @hapi/boom qrcode-terminal
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
    private isConnecting = false;
    private authFolder = './whatsapp-auth';

    async onModuleInit() {
        await this.connectToWhatsApp();
    }

    async onModuleDestroy() {
        if (this.socket) {
            this.socket.end();
        }
    }

    /**
     * Create a silent logger compatible with Baileys
     * Must include child() method that returns a full logger
     */
    private createSilentLogger() {
        const silentLogger = {
            level: 'silent',
            trace: () => {},
            debug: () => {},
            info: () => {},
            warn: (msg: string) => this.logger.warn(msg),
            error: (msg: string) => this.logger.error(msg),
            fatal: (msg: string) => this.logger.error(msg),
            child: () => ({
                level: 'silent',
                trace: () => {},
                debug: () => {},
                info: () => {},
                warn: (msg: string) => this.logger.warn(msg),
                error: (msg: string) => this.logger.error(msg),
                fatal: (msg: string) => this.logger.error(msg),
                child: () => silentLogger,
            }),
        };
        return silentLogger;
    }

    private async connectToWhatsApp(): Promise<void> {
        if (this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        try {
            // Dynamic import to handle case where baileys is not installed
            const baileys = await this.importBaileys();
            if (!baileys) {
                this.logger.warn('Baileys not installed. WhatsApp service disabled.');
                this.logger.warn('Install with: npm install @whiskeysockets/baileys @hapi/boom qrcode-terminal');
                this.isConnecting = false;
                return;
            }

            const {
                default: makeWASocket,
                useMultiFileAuthState,
                DisconnectReason,
                fetchLatestBaileysVersion,
            } = baileys;

            // Load auth state
            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

            // Get latest version
            const { version } = await fetchLatestBaileysVersion();

            // Create socket connection with updated config
            this.socket = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false, // Deprecated - handle QR manually
                browser: ['Exoln Legal Platform', 'Chrome', '1.0.0'],
                connectTimeoutMs: 60_000,
                defaultQueryTimeoutMs: 60_000,
                keepAliveIntervalMs: 30_000,
                markOnlineOnConnect: true,
                syncFullHistory: false,
                logger: this.createSilentLogger() as any,
            });

            // Save credentials on update
            this.socket.ev.on('creds.update', saveCreds);

            // Handle connection updates
            this.socket.ev.on('connection.update', async (update: any) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.qrCode = qr;
                    this.logger.log('📱 QR Code received. Scan with WhatsApp mobile app.');
                    await this.printQrCode(qr);
                }

                if (connection === 'close') {
                    this.isConnecting = false;
                    this.isReady = false;

                    // Get status code from error
                    const statusCode = this.getDisconnectStatusCode(lastDisconnect?.error);
                    this.logger.warn(`❌ Connection closed. Status code: ${statusCode}`);

                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    if (shouldReconnect) {
                        this.logger.log('⏳ Reconnecting in 5 seconds...');
                        setTimeout(() => {
                            this.connectToWhatsApp();
                        }, 5000);
                    } else {
                        this.logger.warn('🚫 Logged out. Please restart and scan QR code.');
                    }
                } else if (connection === 'open') {
                    this.isConnecting = false;
                    this.isReady = true;
                    this.qrCode = null;
                    this.logger.log('✅ Connected to WhatsApp successfully!');
                }
            });

        } catch (error) {
            this.isConnecting = false;
            this.logger.error('❌ Error connecting to WhatsApp:', error);
        }
    }

    private getDisconnectStatusCode(error: any): number | undefined {
        // Handle @hapi/boom errors
        if (error?.output?.statusCode) {
            return error.output.statusCode;
        }
        // Handle regular errors with statusCode
        if (error?.statusCode) {
            return error.statusCode;
        }
        return undefined;
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

    private async printQrCode(qr: string): Promise<void> {
        try {
            // Try to use qrcode-terminal if available
            const qrTerminal = await import('qrcode-terminal');
            console.log('\n📱 Scan this QR code with WhatsApp:\n');
            qrTerminal.generate(qr, { small: true });

            // Also provide a URL for viewing QR code
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
            console.log('\n🔗 Or open this URL to view QR code:');
            console.log(qrUrl);
            console.log('');
        } catch {
            // Fallback - just log the QR string and URL
            this.logger.log('QR Code string:', qr);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
            this.logger.log(`View QR at: ${qrUrl}`);
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
            this.logger.log(`✅ Message sent to ${phoneNumber}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to send message to ${phoneNumber}:`, error);
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

    /**
     * Force reconnect to WhatsApp
     * Useful if connection was lost
     */
    async reconnect(): Promise<void> {
        if (this.socket) {
            this.socket.end();
            this.socket = null;
        }
        this.isReady = false;
        this.isConnecting = false;
        await this.connectToWhatsApp();
    }
}
