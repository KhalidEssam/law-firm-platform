// ============================================
// MEMBERSHIP INVOICE DTOs
// src/core/application/billing/dto/membership-invoice.dto.ts
// ============================================

import {
    IsString,
    IsNumber,
    IsOptional,
    IsEnum,
    IsDateString,
    IsPositive,
    Min,
} from 'class-validator';

// ============================================
// INPUT DTOs
// ============================================

export class CreateMembershipInvoiceDto {
    @IsString()
    membershipId: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsDateString()
    dueDate: string;
}

export class ListMembershipInvoicesQueryDto {
    @IsOptional()
    @IsString()
    membershipId?: string;

    @IsOptional()
    @IsEnum(['unpaid', 'paid', 'overdue', 'cancelled'])
    status?: string;

    @IsOptional()
    @IsDateString()
    dueBefore?: string;

    @IsOptional()
    @IsDateString()
    dueAfter?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    offset?: number;

    @IsOptional()
    @IsEnum(['createdAt', 'dueDate', 'amount'])
    orderBy?: string;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    orderDir?: string;
}

// ============================================
// OUTPUT DTOs
// ============================================

export class MembershipInvoiceResponseDto {
    id: string;
    membershipId: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: string;
    status: string;
    isOverdue: boolean;
    daysUntilDue: number;
    createdAt: string;
    updatedAt: string;
}

export class MembershipInvoiceListResponseDto {
    invoices: MembershipInvoiceResponseDto[];
    total: number;
    limit: number;
    offset: number;
}

export class InvoiceSummaryResponseDto {
    totalUnpaid: number;
    totalPaid: number;
    totalOverdue: number;
    totalAmount: number;
}
