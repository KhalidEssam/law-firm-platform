// ============================================
// MEMBERSHIP INVOICE REPOSITORY PORT
// src/core/domain/billing/ports/membership-invoice.repository.ts
// ============================================

import { MembershipInvoice } from '../entities/membership-invoice.entity';
import { InvoiceStatusEnum } from '../value-objects/invoice-status.vo';

export interface MembershipInvoiceListOptions {
    membershipId?: string;
    status?: InvoiceStatusEnum;
    dueBefore?: Date;
    dueAfter?: Date;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'dueDate' | 'amount';
    orderDir?: 'asc' | 'desc';
}

export interface MembershipInvoiceCountOptions {
    membershipId?: string;
    status?: InvoiceStatusEnum;
    dueBefore?: Date;
    dueAfter?: Date;
}

export interface IMembershipInvoiceRepository {
    // ============================================
    // CREATE
    // ============================================
    create(invoice: MembershipInvoice): Promise<MembershipInvoice>;

    // ============================================
    // READ
    // ============================================
    findById(id: string): Promise<MembershipInvoice | null>;
    findByInvoiceNumber(invoiceNumber: string): Promise<MembershipInvoice | null>;
    findByMembershipId(membershipId: string): Promise<MembershipInvoice[]>;
    list(options?: MembershipInvoiceListOptions): Promise<MembershipInvoice[]>;
    count(options?: MembershipInvoiceCountOptions): Promise<number>;

    // ============================================
    // UPDATE
    // ============================================
    update(invoice: MembershipInvoice): Promise<MembershipInvoice>;
    markAsPaid(id: string): Promise<MembershipInvoice>;
    markAsOverdue(id: string): Promise<MembershipInvoice>;
    cancel(id: string): Promise<MembershipInvoice>;

    // ============================================
    // DELETE
    // ============================================
    delete(id: string): Promise<void>;

    // ============================================
    // BUSINESS QUERIES
    // ============================================
    findOverdueInvoices(): Promise<MembershipInvoice[]>;
    findDueSoon(daysAhead: number): Promise<MembershipInvoice[]>;
    findUnpaidByMembershipId(membershipId: string): Promise<MembershipInvoice[]>;
    getTotalUnpaidAmount(membershipId: string): Promise<number>;
}
