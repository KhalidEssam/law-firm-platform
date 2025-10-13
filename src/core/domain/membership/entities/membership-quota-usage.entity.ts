import crypto from 'crypto';
import { QuotaResource } from '../value-objects/quota-resource.vo';

// src/core/domain/membership/entities/membership-quota-usage.entity.ts
export class MembershipQuotaUsage {
    private constructor(
        public readonly id: string,
        public readonly membershipId: string,
        private readonly usage: Record<QuotaResource, number>,
        public readonly periodStart: Date,
        public readonly periodEnd: Date,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        membershipId: string;
        usage?: Partial<Record<QuotaResource, number>>;
        periodStart?: Date;
        periodEnd?: Date;
    }): MembershipQuotaUsage {
        const initialUsage: Record<QuotaResource, number> = {
            [QuotaResource.CONSULTATIONS]: 0,
            [QuotaResource.OPINIONS]: 0,
            [QuotaResource.SERVICES]: 0,
            [QuotaResource.CASES]: 0,
            [QuotaResource.CALL_MINUTES]: 0,
            ...(props.usage ?? {}),
        };

        return new MembershipQuotaUsage(
            crypto.randomUUID(),
            props.membershipId,
            initialUsage,
            props.periodStart ?? new Date(),
            props.periodEnd ?? new Date(),
            new Date(),
            new Date(),
        );
    }

    /** ✅ Returns how much of a specific resource is used */
    getUsage(resource: QuotaResource): number {
        return this.usage[resource] ?? 0;
    }

    /** ✅ Consumes a resource quota (immutably returns a new instance) */
    incrementUsage(resource: QuotaResource, amount: number): MembershipQuotaUsage {
        const newUsage = { ...this.usage };
        newUsage[resource] = (newUsage[resource] ?? 0) + amount;

        return new MembershipQuotaUsage(
            this.id,
            this.membershipId,
            newUsage,
            this.periodStart,
            this.periodEnd,
            this.createdAt,
            new Date(),
        );
    }

    /** ✅ Returns all usage data */
    getAllUsage(): Record<QuotaResource, number> {
        return { ...this.usage };
    }
}
