// ============================================
// MEMBERSHIP DTOs
// core/application/membership/dto/
// ============================================

import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsEnum,
    IsDate,
    Min,
    Max,
    IsInt,
    IsPositive,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// CREATE MEMBERSHIP DTO
// ============================================

export class CreateMembershipDto {
    @IsString()
    userId: string;

    @IsInt()
    @IsPositive()
    tierId: number;

    @IsOptional()
    @IsString()
    couponCode?: string;
}

// ============================================
// CANCEL MEMBERSHIP DTO
// ============================================

export class CancelMembershipDto {
    @IsOptional()
    @IsString()
    reason?: string;
}

// ============================================
// RENEW MEMBERSHIP DTO
// ============================================

export class RenewMembershipDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    durationInMonths?: number;
}

// ============================================
// TOGGLE AUTO RENEW DTO
// ============================================

export class ToggleAutoRenewDto {
    @IsBoolean()
    autoRenew: boolean;
}

// ============================================
// APPLY COUPON DTO
// ============================================

export class ApplyCouponDto {
    @IsString()
    couponCode: string;
}

// ============================================
// CONSUME QUOTA DTO
// ============================================

export class ConsumeQuotaDto {
    @IsInt()
    @Min(1)
    amount: number;
}

// ============================================
// CREATE MEMBERSHIP TIER DTO
// ============================================

export class CreateMembershipTierDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    nameAr?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    descriptionAr?: string;

    @IsNumber()
    @IsPositive()
    price: number;

    @IsString()
    @IsEnum(['SAR', 'USD', 'EUR', 'GBP'])
    currency: string;

    @IsString()
    @IsEnum(['monthly', 'quarterly', 'yearly'])
    billingCycle: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    consultationsPerMonth?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    opinionsPerMonth?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    servicesPerMonth?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    casesPerMonth?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    callMinutesPerMonth?: number;

    @IsOptional()
    benefits?: Record<string, any>;
}

// ============================================
// UPDATE MEMBERSHIP TIER DTO
// ============================================

export class UpdateMembershipTierDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    nameAr?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    descriptionAr?: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    price?: number;

    @IsOptional()
    @IsString()
    @IsEnum(['SAR', 'USD', 'EUR', 'GBP'])
    currency?: string;

    @IsOptional()
    @IsString()
    @IsEnum(['monthly', 'quarterly', 'yearly'])
    billingCycle?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    consultationsPerMonth?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    opinionsPerMonth?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    servicesPerMonth?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    casesPerMonth?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    callMinutesPerMonth?: number;

    @IsOptional()
    benefits?: Record<string, any>;
}

// ============================================
// CREATE COUPON DTO
// ============================================

export class CreateCouponDto {
    @IsString()
    code: string;

    @IsNumber()
    @Min(1)
    @Max(100)
    discountPercentage: number;

    @Type(() => Date)
    @IsDate()
    validFrom: Date;

    @Type(() => Date)
    @IsDate()
    validUntil: Date;

    @IsInt()
    @Min(1)
    usageLimit: number;
}

// ============================================
// UPDATE COUPON DTO
// ============================================

export class UpdateCouponDto {
    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    discountPercentage?: number;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    validFrom?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    validUntil?: Date;

    @IsOptional()
    @IsInt()
    @Min(1)
    usageLimit?: number;
}

// ============================================
// CREATE PAYMENT DTO
// ============================================

export class CreatePaymentDto {
    @IsString()
    invoiceId: string;

    @IsEnum(['moyasar', 'hyperpay', 'stripe', 'paypal'])
    provider: 'moyasar' | 'hyperpay' | 'stripe' | 'paypal';

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsString()
    @IsEnum(['SAR', 'USD', 'EUR', 'GBP'])
    currency: string;

    @IsOptional()
    metadata?: Record<string, any>;
}

// ============================================
// COMPLETE PAYMENT DTO
// ============================================

export class CompletePaymentDto {
    @IsString()
    providerTxnId: string;
}

// ============================================
// QUERY DTOs
// ============================================

export class ListMembershipsQueryDto {
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    tierId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;
}

export class ListTiersQueryDto {
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;
}

export class ListCouponsQueryDto {
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    validAt?: Date;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;
}

// ============================================
// RESPONSE DTOs
// ============================================

export class MembershipResponseDto {
    id: string;
    userId: string;
    tierId: number;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
    autoRenew: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class MembershipTierResponseDto {
    id: number;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    price: number;
    currency: string;
    billingCycle: string;
    quota: {
        consultationsPerMonth?: number;
        opinionsPerMonth?: number;
        servicesPerMonth?: number;
        casesPerMonth?: number;
        callMinutesPerMonth?: number;
    };
    benefits?: Record<string, any>;
    isActive: boolean;
}

export class QuotaResponseDto {
    used: number;
    limit: number | null;
    remaining: number | null;
}

export class PaymentResponseDto {
    id: string;
    invoiceId: string;
    provider: string;
    providerTxnId?: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export class CouponResponseDto {
    id: string;
    code: string;
    discountPercentage: number;
    validFrom: Date;
    validUntil: Date;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
}

export class ApplyCouponResponseDto {
    discountAmount: number;
    message: string;
}

