// ============================================
// PAYMENT METHOD DTOs
// Request/Response Data Transfer Objects
// ============================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// ADD PAYMENT METHOD
// ============================================

export class CardDetailsDto {
  @ApiProperty({ example: '1234', description: 'Last 4 digits of card' })
  @IsString()
  @IsOptional()
  cardNumber?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  cardHolderName?: string;

  @ApiProperty({ example: '12' })
  @IsString()
  @IsOptional()
  expiryMonth?: string;

  @ApiProperty({ example: '2025' })
  @IsString()
  @IsOptional()
  expiryYear?: string;

  @ApiProperty({ example: 'visa', description: 'Card brand' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 'Al Rajhi Bank' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({ example: 'SA' })
  @IsString()
  @IsOptional()
  issuerCountry?: string;

  @ApiProperty({ example: 'tok_abc123' })
  @IsString()
  @IsOptional()
  token?: string;
}

export class WalletDetailsDto {
  @ApiProperty({ example: 'stc_pay' })
  @IsString()
  @IsOptional()
  walletProvider?: string;

  @ApiProperty({ example: 'wallet_123' })
  @IsString()
  @IsOptional()
  walletId?: string;

  @ApiProperty({ example: '+966501234567' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  verified?: boolean;
}

export class BankTransferDetailsDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @ApiProperty({ example: '1234', description: 'Last 4 digits' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiProperty({ example: 'Al Rajhi Bank' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({ example: '80' })
  @IsString()
  @IsOptional()
  bankCode?: string;

  @ApiProperty({ example: 'SA0380000000608010167519' })
  @IsString()
  @IsOptional()
  iban?: string;

  @ApiProperty({ example: 'RJHISARI' })
  @IsString()
  @IsOptional()
  swiftCode?: string;
}

export class AddPaymentMethodDto {
  @ApiProperty({
    example: 'credit_card',
    enum: [
      'credit_card',
      'debit_card',
      'wallet',
      'bank_transfer',
      'apple_pay',
      'google_pay',
      'mada',
    ],
  })
  @IsString()
  type: string;

  // @ApiProperty({ type: 'object', description: 'Payment method details (varies by type)' })
  @IsObject()
  details: CardDetailsDto | WalletDetailsDto | BankTransferDetailsDto;

  @ApiPropertyOptional({ example: 'My Visa Card' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  setAsDefault?: boolean;
}

// ============================================
// UPDATE PAYMENT METHOD
// ============================================

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ example: 'My Primary Card' })
  @IsString()
  @IsOptional()
  nickname?: string;

  // @ApiPropertyOptional({ type: 'object', description: 'Updated card details (for card renewal)' })
  @IsObject()
  @IsOptional()
  details?: CardDetailsDto;
}

// ============================================
// VERIFY PAYMENT METHOD
// ============================================

export class VerifyPaymentMethodDto {
  @ApiPropertyOptional({ example: '123456' })
  @IsString()
  @IsOptional()
  verificationCode?: string;
}

// ============================================
// RESET FAILED ATTEMPTS
// ============================================

export class ResetFailedAttemptsDto {
  // No body required
}

// ============================================
// GET MY PAYMENT METHODS
// ============================================

export class GetMyPaymentMethodsDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Include inactive payment methods',
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeInactive?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 'createdAt', default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// LIST PAYMENT METHODS (ADMIN)
// ============================================

export class ListPaymentMethodsDto {
  @ApiPropertyOptional({ example: 'user-uuid-123' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    example: 'credit_card',
    enum: [
      'credit_card',
      'debit_card',
      'wallet',
      'bank_transfer',
      'apple_pay',
      'google_pay',
      'mada',
    ],
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isVerified?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'visa' })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  createdFrom?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  createdTo?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 'createdAt', default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// GET EXPIRING PAYMENT METHODS
// ============================================

export class GetExpiringPaymentMethodsDto {
  @ApiPropertyOptional({
    example: 30,
    default: 30,
    description: 'Days until expiry',
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  days?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 'createdAt', default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
