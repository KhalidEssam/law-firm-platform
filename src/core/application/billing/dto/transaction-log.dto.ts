// ============================================
// TRANSACTION LOG DTOs
// src/core/application/billing/dto/transaction-log.dto.ts
// ============================================

import {
    IsString,
    IsNumber,
    IsOptional,
    IsEnum,
    IsDateString,
    IsPositive,
    IsObject,
    Min,
} from 'class-validator';

// ============================================
// INPUT DTOs
// ============================================

export class CreateTransactionLogDto {
    @IsString()
    userId: string;

    @IsEnum(['subscription', 'wallet_topup', 'service_payment', 'refund'])
    type: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    reference?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;
}

export class CreateSubscriptionPaymentDto {
    @IsString()
    userId: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    membershipId?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;
}

export class CreateWalletTopupDto {
    @IsString()
    userId: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    paymentMethodId?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;
}

export class CreateServicePaymentDto {
    @IsString()
    userId: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    serviceRequestId?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;
}

export class ListTransactionLogsQueryDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsEnum(['subscription', 'wallet_topup', 'service_payment', 'refund'])
    type?: string;

    @IsOptional()
    @IsEnum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded'])
    status?: string;

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
    @IsEnum(['createdAt', 'amount'])
    orderBy?: string;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    orderDir?: string;
}

// ============================================
// OUTPUT DTOs
// ============================================

export class TransactionLogResponseDto {
    id: string;
    userId: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    reference?: string;
    metadata?: Record<string, unknown>;
    isCredit: boolean;
    isDebit: boolean;
    createdAt: string;
}

export class TransactionLogListResponseDto {
    transactions: TransactionLogResponseDto[];
    total: number;
    limit: number;
    offset: number;
}

export class TransactionSummaryResponseDto {
    totalCredits: number;
    totalDebits: number;
    netAmount: number;
    transactionCount: number;
}
