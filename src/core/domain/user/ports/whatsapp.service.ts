// ============================================
// WHATSAPP SERVICE INTERFACE (PORT)
// src/core/domain/user/ports/whatsapp.service.ts
// ============================================

/**
 * WhatsApp Service Interface
 * Defines the contract for sending WhatsApp messages
 */
export interface IWhatsAppService {
  /**
   * Send a text message via WhatsApp
   * @param phoneNumber - Phone number with country code (e.g., +966501234567)
   * @param message - Message content to send
   * @returns Promise<boolean> - True if message sent successfully
   */
  sendMessage(phoneNumber: string, message: string): Promise<boolean>;

  /**
   * Send OTP message via WhatsApp
   * @param phoneNumber - Phone number with country code
   * @param otp - OTP code to send
   * @returns Promise<boolean> - True if message sent successfully
   */
  sendOtp(phoneNumber: string, otp: string): Promise<boolean>;

  /**
   * Check if WhatsApp service is connected and ready
   * @returns Promise<boolean> - True if connected
   */
  isConnected(): Promise<boolean>;

  /**
   * Get QR code for authentication (if not connected)
   * @returns Promise<string | null> - QR code string or null if already connected
   */
  getQrCode(): Promise<string | null>;
}

export const IWhatsAppService = Symbol('IWhatsAppService');
