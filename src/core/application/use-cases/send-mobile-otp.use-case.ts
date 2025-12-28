// ============================================
// SEND MOBILE OTP USE CASE
// src/core/application/use-cases/send-mobile-otp.use-case.ts
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import type { IUserRepository } from '../../domain/user/ports/user.repository';
import type { IOtpRepository } from '../../domain/user/ports/otp.repository';
import type { IWhatsAppService } from '../../domain/user/ports/whatsapp.service';

export interface SendMobileOtpDto {
  userId: string;
  phoneNumber: string;
}

export interface SendMobileOtpResult {
  success: boolean;
  message: string;
  expiresAt: Date;
}

/**
 * OTP Configuration
 */
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 3, // 3 minutes as requested
  RESEND_COOLDOWN_SECONDS: 60, // 1 minute cooldown between resends
};

@Injectable()
export class SendMobileOtpUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IOtpRepository')
    private readonly otpRepository: IOtpRepository,
    @Inject('IWhatsAppService')
    private readonly whatsAppService: IWhatsAppService,
  ) {}

  async execute(dto: SendMobileOtpDto): Promise<SendMobileOtpResult> {
    // 1. Verify user exists
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    // 2. Validate phone number format
    const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new BadRequestException(
        'Invalid phone number format. Use international format (e.g., +966501234567)',
      );
    }

    // 3. Check for existing OTP (cooldown period)
    const existingOtp = await this.otpRepository.getOtp(
      dto.userId,
      phoneNumber,
    );
    if (existingOtp && existingOtp.expiresAt > new Date()) {
      const secondsRemaining = Math.ceil(
        (existingOtp.expiresAt.getTime() - Date.now()) / 1000,
      );

      // If OTP was sent less than cooldown period ago, prevent resend
      const minSecondsBeforeResend =
        OTP_CONFIG.EXPIRY_MINUTES * 60 - OTP_CONFIG.RESEND_COOLDOWN_SECONDS;
      if (secondsRemaining > minSecondsBeforeResend) {
        throw new BadRequestException(
          `Please wait ${OTP_CONFIG.RESEND_COOLDOWN_SECONDS} seconds before requesting a new OTP`,
        );
      }
    }

    // 4. Generate OTP
    const otpCode = this.generateOtp();
    const expiresAt = new Date(
      Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000,
    );

    // 5. Store OTP
    await this.otpRepository.storeOtp(
      dto.userId,
      phoneNumber,
      otpCode,
      expiresAt,
    );

    // 6. Send OTP via WhatsApp
    const sent = await this.whatsAppService.sendOtp(phoneNumber, otpCode);

    if (!sent) {
      // Check if WhatsApp is connected
      const isConnected = await this.whatsAppService.isConnected();
      if (!isConnected) {
        throw new BadRequestException(
          'WhatsApp service is not connected. Please contact support or try again later.',
        );
      }
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }

    return {
      success: true,
      message: `OTP sent to WhatsApp number ${this.maskPhoneNumber(phoneNumber)}`,
      expiresAt,
    };
  }

  private generateOtp(): string {
    // Generate cryptographically secure random OTP using Node.js crypto module
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < OTP_CONFIG.LENGTH; i++) {
      // randomInt is cryptographically secure, unlike Math.random()
      const randomIndex = randomInt(0, digits.length);
      otp += digits[randomIndex];
    }

    return otp;
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove spaces, dashes, and parentheses
    let normalized = phone.replace(/[\s\-()]/g, '');

    // Ensure it starts with +
    if (!normalized.startsWith('+')) {
      // Assume Saudi Arabia if no country code
      if (normalized.startsWith('0')) {
        normalized = '+966' + normalized.substring(1);
      } else if (normalized.startsWith('966')) {
        normalized = '+' + normalized;
      } else {
        normalized = '+966' + normalized;
      }
    }

    return normalized;
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Basic validation: starts with + followed by 10-15 digits
    const phoneRegex = /^\+[1-9]\d{9,14}$/;

    return phoneRegex.test(phone);
  }

  private maskPhoneNumber(phone: string): string {
    // Mask middle digits for privacy: +966*****4567
    if (phone.length < 8) return phone;
    const start = phone.substring(0, 4);
    const end = phone.substring(phone.length - 4);
    const masked = '*'.repeat(phone.length - 8);
    return `${start}${masked}${end}`;
  }
}
