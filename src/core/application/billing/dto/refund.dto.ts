// ============================================
// REFUND DTOs
// src/core/application/billing/dto/refund.dto.ts
// ============================================

import {
    IsString,
    IsNumber,
    IsOptional,
    IsEnum,
    IsDateString,
    IsPositive,
    MinLength,
    Min,
} from 'class-validator';

// ============================================
// INPUT DTOs
// ============================================

export class RequestRefundDto {
    @IsString()
    userId: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsString()
    @MinLength(10)
    reason: string;

    @IsOptional()
    @IsString()
    transactionLogId?: string;

    @IsOptional()
    @IsString()
    paymentId?: string;
}

export class ReviewRefundDto {
    @IsString()
    reviewedBy: string;

    @IsOptional()
    @IsString()
    reviewNotes?: string;
}

export class ProcessRefundDto {
    @IsString()
    refundReference: string;
}

export class ListRefundsQueryDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsEnum(['pending', 'approved', 'rejected', 'processed'])
    status?: string;

    @IsOptional()
    @IsString()
    reviewedBy?: string;

    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @IsOptional()
    @IsDateString()
    toDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    offset?: number;

    @IsOptional()
    @IsEnum(['createdAt', 'amount', 'reviewedAt', 'processedAt'])
    orderBy?: string;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    orderDir?: string;
}

// ============================================
// OUTPUT DTOs
// ============================================

export class RefundResponseDto {
    id: string;
    userId: string;
    transactionLogId?: string;
    paymentId?: string;
    amount: number;
    currency: string;
    reason: string;
    status: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
    processedAt?: string;
    refundReference?: string;
    createdAt: string;
    updatedAt: string;
}

export class RefundListResponseDto {
    refunds: RefundResponseDto[];
    total: number;
    limit: number;
    offset: number;
}

export class RefundStatisticsResponseDto {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalProcessed: number;
    totalAmount: number;
    averageProcessingTime: number | null;
}
