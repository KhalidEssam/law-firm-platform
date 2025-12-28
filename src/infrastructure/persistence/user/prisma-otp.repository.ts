// ============================================
// OTP REPOSITORY IMPLEMENTATION (PRISMA)
// src/infrastructure/persistence/user/prisma-otp.repository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IOtpRepository,
  OtpData,
} from '../../../core/domain/user/ports/otp.repository';

/**
 * Prisma OTP Repository
 * Uses UserPhoneNumber model to store OTP codes
 */
@Injectable()
export class PrismaOtpRepository implements IOtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async storeOtp(
    userId: string,
    phoneNumber: string,
    otpCode: string,
    expiresAt: Date,
  ): Promise<void> {
    // Upsert phone number with OTP
    await this.prisma.userPhoneNumber.upsert({
      where: {
        phone: phoneNumber,
      },
      update: {
        otpCode,
        otpExpiry: expiresAt,
      },
      create: {
        userId,
        phone: phoneNumber,
        otpCode,
        otpExpiry: expiresAt,
        isPrimary: true,
        isVerified: false,
      },
    });
  }

  async getOtp(userId: string, phoneNumber: string): Promise<OtpData | null> {
    const record = await this.prisma.userPhoneNumber.findFirst({
      where: {
        userId,
        phone: phoneNumber,
        deletedAt: null,
      },
    });

    if (!record || !record.otpCode || !record.otpExpiry) {
      return null;
    }

    return {
      userId: record.userId,
      phoneNumber: record.phone,
      otpCode: record.otpCode,
      expiresAt: record.otpExpiry,
      isVerified: record.isVerified,
    };
  }

  async verifyOtp(
    userId: string,
    phoneNumber: string,
    otpCode: string,
  ): Promise<boolean> {
    const record = await this.prisma.userPhoneNumber.findFirst({
      where: {
        userId,
        phone: phoneNumber,
        deletedAt: null,
      },
    });

    if (!record) {
      return false;
    }

    // Check if OTP matches and is not expired
    if (
      record.otpCode !== otpCode ||
      !record.otpExpiry ||
      record.otpExpiry < new Date()
    ) {
      return false;
    }

    // Mark as verified and clear OTP
    await this.prisma.userPhoneNumber.update({
      where: { id: record.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    return true;
  }

  async clearOtp(userId: string, phoneNumber: string): Promise<void> {
    await this.prisma.userPhoneNumber.updateMany({
      where: {
        userId,
        phone: phoneNumber,
      },
      data: {
        otpCode: null,
        otpExpiry: null,
      },
    });
  }

  async phoneExists(userId: string, phoneNumber: string): Promise<boolean> {
    const count = await this.prisma.userPhoneNumber.count({
      where: {
        userId,
        phone: phoneNumber,
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async addPhoneNumber(userId: string, phoneNumber: string): Promise<void> {
    const exists = await this.phoneExists(userId, phoneNumber);
    if (!exists) {
      await this.prisma.userPhoneNumber.create({
        data: {
          userId,
          phone: phoneNumber,
          isPrimary: true,
          isVerified: false,
        },
      });
    }
  }
}
