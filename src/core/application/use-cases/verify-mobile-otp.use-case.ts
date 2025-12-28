// ============================================
// VERIFY MOBILE OTP USE CASE
// src/core/application/use-cases/verify-mobile-otp.use-case.ts
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User } from '../../domain/user/entities/user.entity';
import type { IUserRepository } from '../../domain/user/ports/user.repository';
import type { IOtpRepository } from '../../domain/user/ports/otp.repository';

export interface VerifyMobileOtpDto {
  userId: string;
  phoneNumber: string;
  otpCode: string;
}

export interface VerifyMobileOtpResult {
  success: boolean;
  message: string;
  user: User;
}

@Injectable()
export class VerifyMobileOtpUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IOtpRepository')
    private readonly otpRepository: IOtpRepository,
  ) {}

  async execute(dto: VerifyMobileOtpDto): Promise<VerifyMobileOtpResult> {
    // 1. Verify user exists
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    // 2. Normalize phone number
    const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);

    // 3. Get stored OTP
    const storedOtp = await this.otpRepository.getOtp(dto.userId, phoneNumber);
    if (!storedOtp) {
      throw new BadRequestException(
        'No OTP found for this phone number. Please request a new OTP.',
      );
    }

    // 4. Check if OTP has expired
    if (storedOtp.expiresAt < new Date()) {
      // Clear expired OTP
      await this.otpRepository.clearOtp(dto.userId, phoneNumber);
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    // 5. Verify OTP
    const isValid = await this.otpRepository.verifyOtp(
      dto.userId,
      phoneNumber,
      dto.otpCode,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    }

    // 6. Mark user's mobile as verified using existing verifyMobile method
    const updatedUser = await this.userRepository.verifyMobile(dto.userId);

    return {
      success: true,
      message: 'Mobile number verified successfully',
      user: updatedUser,
    };
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove spaces, dashes, and parentheses
    let normalized = phone.replace(/[\s\-\(\)]/g, '');

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
}
