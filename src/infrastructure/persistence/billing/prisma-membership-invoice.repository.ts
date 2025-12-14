// ============================================
// PRISMA MEMBERSHIP INVOICE REPOSITORY
// src/infrastructure/persistence/billing/prisma-membership-invoice.repository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MembershipInvoice } from '../../../core/domain/billing/entities/membership-invoice.entity';
import { InvoiceStatusEnum } from '../../../core/domain/billing/value-objects/invoice-status.vo';
import {
    IMembershipInvoiceRepository,
    MembershipInvoiceListOptions,
    MembershipInvoiceCountOptions,
} from '../../../core/domain/billing/ports/membership-invoice.repository';
import { InvoiceStatusMapper, CurrencyMapper } from './billing-enum.mapper';

@Injectable()
export class PrismaMembershipInvoiceRepository implements IMembershipInvoiceRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ============================================
    // CREATE
    // ============================================
    async create(invoice: MembershipInvoice): Promise<MembershipInvoice> {
        const created = await this.prisma.membershipInvoice.create({
            data: {
                id: invoice.id,
                membershipId: invoice.membershipId,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.amount.amount,
                currency: CurrencyMapper.toPrisma(invoice.amount.currency),
                dueDate: invoice.dueDate,
                status: InvoiceStatusMapper.toPrisma(invoice.status.getValue()),
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
            },
        });
        return this.toDomain(created);
    }

    // ============================================
    // READ
    // ============================================
    async findById(id: string): Promise<MembershipInvoice | null> {
        const found = await this.prisma.membershipInvoice.findUnique({
            where: { id },
        });
        return found ? this.toDomain(found) : null;
    }

    async findByInvoiceNumber(invoiceNumber: string): Promise<MembershipInvoice | null> {
        const found = await this.prisma.membershipInvoice.findUnique({
            where: { invoiceNumber },
        });
        return found ? this.toDomain(found) : null;
    }

    async findByMembershipId(membershipId: string): Promise<MembershipInvoice[]> {
        const found = await this.prisma.membershipInvoice.findMany({
            where: { membershipId },
            orderBy: { createdAt: 'desc' },
        });
        return found.map(record => this.toDomain(record));
    }

    async list(options?: MembershipInvoiceListOptions): Promise<MembershipInvoice[]> {
        const found = await this.prisma.membershipInvoice.findMany({
            where: this.buildWhereClause(options),
            take: options?.limit ?? 20,
            skip: options?.offset ?? 0,
            orderBy: {
                [options?.orderBy ?? 'createdAt']: options?.orderDir ?? 'desc',
            },
        });
        return found.map(record => this.toDomain(record));
    }

    async count(options?: MembershipInvoiceCountOptions): Promise<number> {
        return await this.prisma.membershipInvoice.count({
            where: this.buildWhereClause(options),
        });
    }

    // ============================================
    // UPDATE
    // ============================================
    async update(invoice: MembershipInvoice): Promise<MembershipInvoice> {
        const updated = await this.prisma.membershipInvoice.update({
            where: { id: invoice.id },
            data: {
                status: InvoiceStatusMapper.toPrisma(invoice.status.getValue()),
                updatedAt: new Date(),
            },
        });
        return this.toDomain(updated);
    }

    async markAsPaid(id: string): Promise<MembershipInvoice> {
        const updated = await this.prisma.membershipInvoice.update({
            where: { id },
            data: {
                status: InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.PAID),
                updatedAt: new Date(),
            },
        });
        return this.toDomain(updated);
    }

    async markAsOverdue(id: string): Promise<MembershipInvoice> {
        const updated = await this.prisma.membershipInvoice.update({
            where: { id },
            data: {
                status: InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.OVERDUE),
                updatedAt: new Date(),
            },
        });
        return this.toDomain(updated);
    }

    async cancel(id: string): Promise<MembershipInvoice> {
        const updated = await this.prisma.membershipInvoice.update({
            where: { id },
            data: {
                status: InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.CANCELLED),
                updatedAt: new Date(),
            },
        });
        return this.toDomain(updated);
    }

    // ============================================
    // DELETE
    // ============================================
    async delete(id: string): Promise<void> {
        await this.prisma.membershipInvoice.delete({
            where: { id },
        });
    }

    // ============================================
    // BUSINESS QUERIES
    // ============================================
    async findOverdueInvoices(): Promise<MembershipInvoice[]> {
        const found = await this.prisma.membershipInvoice.findMany({
            where: {
                status: InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.UNPAID),
                dueDate: { lt: new Date() },
            },
            orderBy: { dueDate: 'asc' },
        });
        return found.map(record => this.toDomain(record));
    }

    async findDueSoon(daysAhead: number): Promise<MembershipInvoice[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const found = await this.prisma.membershipInvoice.findMany({
            where: {
                status: InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.UNPAID),
                dueDate: {
                    gte: new Date(),
                    lte: futureDate,
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        return found.map(record => this.toDomain(record));
    }

    async findUnpaidByMembershipId(membershipId: string): Promise<MembershipInvoice[]> {
        const found = await this.prisma.membershipInvoice.findMany({
            where: {
                membershipId,
                status: {
                    in: [
                        InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.UNPAID),
                        InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.OVERDUE),
                    ],
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        return found.map(record => this.toDomain(record));
    }

    async getTotalUnpaidAmount(membershipId: string): Promise<number> {
        const result = await this.prisma.membershipInvoice.aggregate({
            where: {
                membershipId,
                status: {
                    in: [
                        InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.UNPAID),
                        InvoiceStatusMapper.toPrisma(InvoiceStatusEnum.OVERDUE),
                    ],
                },
            },
            _sum: { amount: true },
        });
        return result._sum.amount ?? 0;
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================
    private buildWhereClause(options?: MembershipInvoiceListOptions | MembershipInvoiceCountOptions) {
        const where: any = {};

        if (options?.membershipId) {
            where.membershipId = options.membershipId;
        }

        if (options?.status) {
            where.status = InvoiceStatusMapper.toPrisma(options.status);
        }

        if (options?.dueBefore || options?.dueAfter) {
            where.dueDate = {};
            if (options?.dueBefore) {
                where.dueDate.lte = options.dueBefore;
            }
            if (options?.dueAfter) {
                where.dueDate.gte = options.dueAfter;
            }
        }

        return where;
    }

    private toDomain(record: any): MembershipInvoice {
        return MembershipInvoice.rehydrate({
            id: record.id,
            membershipId: record.membershipId,
            invoiceNumber: record.invoiceNumber,
            amount: record.amount,
            currency: CurrencyMapper.toDomain(record.currency),
            dueDate: record.dueDate,
            status: InvoiceStatusMapper.toDomain(record.status),
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }
}
