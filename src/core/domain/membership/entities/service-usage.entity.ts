// src/core/domain/membership/entities/service-usage.entity.ts

import crypto from 'crypto';
import { Money } from '../value-objects/money.vo';

export class ServiceUsage {
    private constructor(
        public readonly id: string,
        public readonly membershipId: string,
        public readonly serviceId: string,
        public readonly consultationId: string | null,
        public readonly legalOpinionId: string | null,
        public readonly serviceRequestId: string | null,
        public readonly litigationCaseId: string | null,
        public readonly callRequestId: string | null,
        public readonly usedAt: Date,
        public readonly periodStart: Date,
        public readonly periodEnd: Date,
        public chargedAmount: number | null,
        public currency: string,
        public isBilled: boolean,
        public readonly createdAt: Date,
    ) {}

    /** Factory method for creating new service usage */
    static create(props: {
        membershipId: string;
        serviceId: string;
        consultationId?: string | null;
        legalOpinionId?: string | null;
        serviceRequestId?: string | null;
        litigationCaseId?: string | null;
        callRequestId?: string | null;
        periodStart: Date;
        periodEnd: Date;
        chargedAmount?: number | null;
        currency?: string;
    }): ServiceUsage {
        return new ServiceUsage(
            crypto.randomUUID(),
            props.membershipId,
            props.serviceId,
            props.consultationId ?? null,
            props.legalOpinionId ?? null,
            props.serviceRequestId ?? null,
            props.litigationCaseId ?? null,
            props.callRequestId ?? null,
            new Date(),
            props.periodStart,
            props.periodEnd,
            props.chargedAmount ?? null,
            props.currency ?? 'SAR',
            false,
            new Date(),
        );
    }

    /** Factory method for DB rehydration */
    static rehydrate(record: {
        id: string;
        membershipId: string;
        serviceId: string;
        consultationId: string | null;
        legalOpinionId: string | null;
        serviceRequestId: string | null;
        litigationCaseId: string | null;
        callRequestId: string | null;
        usedAt: Date;
        periodStart: Date;
        periodEnd: Date;
        chargedAmount: number | null;
        currency: string;
        isBilled: boolean;
    }): ServiceUsage {
        return new ServiceUsage(
            record.id,
            record.membershipId,
            record.serviceId,
            record.consultationId,
            record.legalOpinionId,
            record.serviceRequestId,
            record.litigationCaseId,
            record.callRequestId,
            record.usedAt,
            record.periodStart,
            record.periodEnd,
            record.chargedAmount,
            record.currency,
            record.isBilled,
            record.usedAt,
        );
    }

    /** Get the related request ID (whichever is set) */
    getRelatedRequestId(): string | null {
        return (
            this.consultationId ||
            this.legalOpinionId ||
            this.serviceRequestId ||
            this.litigationCaseId ||
            this.callRequestId
        );
    }

    /** Get the request type */
    getRequestType(): string | null {
        if (this.consultationId) return 'consultation';
        if (this.legalOpinionId) return 'legal_opinion';
        if (this.serviceRequestId) return 'service';
        if (this.litigationCaseId) return 'litigation';
        if (this.callRequestId) return 'call';
        return null;
    }

    /** Check if this usage is within period */
    isWithinPeriod(date: Date): boolean {
        return date >= this.periodStart && date <= this.periodEnd;
    }

    /** Mark as billed */
    markAsBilled(amount: number, currency: string = 'SAR'): void {
        this.chargedAmount = amount;
        this.currency = currency;
        this.isBilled = true;
    }

    /** Check if usage is free (covered by membership) */
    isFree(): boolean {
        return this.chargedAmount === null || this.chargedAmount === 0;
    }

    /** Get charged money object */
    getChargedMoney(): Money | null {
        if (this.chargedAmount === null) return null;
        return Money.create({ amount: this.chargedAmount, currency: this.currency });
    }
}
