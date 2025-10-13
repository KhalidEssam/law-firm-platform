// src/infrastructure/persistence/prisma/repositories/prisma-membership-payment.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IMembershipPaymentRepository } from '../../../core/domain/membership/repositories/membership-payment.repository';
import { MembershipPayment } from '../../../core/domain/membership/entities/membership-payment.entity';
@Injectable()
export class PrismaMembershipPaymentRepository implements IMembershipPaymentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(payment: MembershipPayment): Promise<MembershipPayment> {
        const created = await this.prisma.membershipPayment.create({
            data: {
                id: payment.id,
                invoiceId: payment.invoiceId,
                provider: payment.provider,
                providerTxnId: payment.providerTxnId,
                amount: payment.amount.amount,
                currency: payment.amount.currency,
                status: payment.status,
                metadata: payment.metadata || {},
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
            },
        });
        return this.toDomain(created);
    }

    async findById(id: string): Promise<MembershipPayment | null> {
        const payment = await this.prisma.membershipPayment.findUnique({
            where: { id },
        });
        return payment ? this.toDomain(payment) : null;
    }

    async findByInvoice(invoiceId: string): Promise<MembershipPayment[]> {
        const payments = await this.prisma.membershipPayment.findMany({
            where: { invoiceId },
            orderBy: { createdAt: 'desc' },
        });
        return payments.map(this.toDomain);
    }

    async findByProviderTxnId(providerTxnId: string): Promise<MembershipPayment | null> {
        const payment = await this.prisma.membershipPayment.findFirst({
            where: { providerTxnId },
        });
        return payment ? this.toDomain(payment) : null;
    }

    async findPendingPayments(): Promise<MembershipPayment[]> {
        const payments = await this.prisma.membershipPayment.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'asc' },
        });
        return payments.map(this.toDomain);
    }

    async update(payment: MembershipPayment): Promise<MembershipPayment> {
        const updated = await this.prisma.membershipPayment.update({
            where: { id: payment.id },
            data: {
                providerTxnId: payment.providerTxnId,
                status: payment.status,
                metadata: payment.metadata || {},
                updatedAt: new Date(),
            },
        });
        return this.toDomain(updated);
    }

    private toDomain(record: any): MembershipPayment {
        return MembershipPayment.rehydrate({
            id: record.id,
            invoiceId: record.invoiceId,
            provider: record.provider,
            providerTxnId: record.providerTxnId,
            amount: record.amount,
            currency: record.currency,
            status: record.status,
            metadata: record.metadata,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }
}