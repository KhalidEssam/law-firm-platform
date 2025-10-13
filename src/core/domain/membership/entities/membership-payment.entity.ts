// src/core/domain/membership/entities/membership-payment.entity.ts

import crypto from 'crypto';
import { Money } from '../value-objects/money.vo';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentProvider = 'moyasar' | 'hyperpay' | 'stripe' | 'paypal';

export class MembershipPayment {
    private constructor(
        public readonly id: string,
        public readonly invoiceId: string,
        public readonly provider: PaymentProvider,
        public readonly providerTxnId: string | null,
        public readonly amount: Money,
        public readonly status: PaymentStatus,
        public readonly metadata: Record<string, any> | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    /** ✅ Factory method for new payment */
    static create(props: {
        invoiceId: string;
        provider: PaymentProvider;
        amount: Money;
        metadata?: Record<string, any>;
    }): MembershipPayment {
        return new MembershipPayment(
            crypto.randomUUID(),
            props.invoiceId,
            props.provider,
            null,
            props.amount,
            'pending',
            props.metadata ?? null,
            new Date(),
            new Date(),
        );
    }

    /** ✅ Factory method for DB rehydration */
    static rehydrate(record: {
        id: string;
        invoiceId: string;
        provider: string;
        providerTxnId: string | null;
        amount: number;
        currency: string;
        status: string;
        metadata: any;
        createdAt: Date;
        updatedAt: Date;
    }): MembershipPayment {
        return new MembershipPayment(
            record.id,
            record.invoiceId,
            record.provider as PaymentProvider,
            record.providerTxnId,
            Money.create(record.amount, record.currency),
            record.status as PaymentStatus,
            record.metadata,
            record.createdAt,
            record.updatedAt,
        );
    }

    /** ✅ Mark payment as completed */
    markAsCompleted(providerTxnId: string): MembershipPayment {
        return new MembershipPayment(
            this.id,
            this.invoiceId,
            this.provider,
            providerTxnId,
            this.amount,
            'completed',
            this.metadata,
            this.createdAt,
            new Date(),
        );
    }

    /** ✅ Mark payment as failed */
    markAsFailed(reason?: string): MembershipPayment {
        const updatedMetadata = {
            ...this.metadata,
            failureReason: reason,
        };

        return new MembershipPayment(
            this.id,
            this.invoiceId,
            this.provider,
            this.providerTxnId,
            this.amount,
            'failed',
            updatedMetadata,
            this.createdAt,
            new Date(),
        );
    }

    /** ✅ Mark payment as refunded */
    markAsRefunded(refundReason?: string): MembershipPayment {
        const updatedMetadata = {
            ...this.metadata,
            refundReason,
            refundedAt: new Date().toISOString(),
        };

        return new MembershipPayment(
            this.id,
            this.invoiceId,
            this.provider,
            this.providerTxnId,
            this.amount,
            'refunded',
            updatedMetadata,
            this.createdAt,
            new Date(),
        );
    }

    /** ✅ Check if payment is successful */
    isSuccessful(): boolean {
        return this.status === 'completed';
    }

    /** ✅ Check if payment is pending */
    isPending(): boolean {
        return this.status === 'pending';
    }
}