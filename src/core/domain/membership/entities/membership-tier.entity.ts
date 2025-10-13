// src/core/domain/membership/entities/membership-tier.entity.ts

import { Money } from '../value-objects/money.vo';
import { BillingCycle } from '../value-objects/billing-cycle.vo';

export interface TierQuota {
    consultationsPerMonth?: number;
    opinionsPerMonth?: number;
    servicesPerMonth?: number;
    casesPerMonth?: number;
    callMinutesPerMonth?: number;
}

export interface TierBenefits {
    [key: string]: any;
}

export class MembershipTier {
    private constructor(
        public readonly id: number,
        public readonly name: string,
        public readonly nameAr: string | null,
        public readonly description: string | null,
        public readonly descriptionAr: string | null,
        public readonly price: Money,
        public readonly billingCycle: BillingCycle,
        public readonly quota: TierQuota,
        public readonly benefits: TierBenefits | null,
        public readonly isActive: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    /** ✅ Factory method for DB rehydration */
    static rehydrate(record: {
        id: number;
        name: string;
        nameAr: string | null;
        description: string | null;
        descriptionAr: string | null;
        price: number;
        currency: string;
        billingCycle: string;
        consultationsPerMonth?: number | null;
        opinionsPerMonth?: number | null;
        servicesPerMonth?: number | null;
        casesPerMonth?: number | null;
        callMinutesPerMonth?: number | null;
        benefits: any;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): MembershipTier {
        return new MembershipTier(
            record.id,
            record.name,
            record.nameAr,
            record.description,
            record.descriptionAr,
            Money.create(record.price, record.currency),
            BillingCycle.create(record.billingCycle),
            {
                consultationsPerMonth: record.consultationsPerMonth ?? undefined,
                opinionsPerMonth: record.opinionsPerMonth ?? undefined,
                servicesPerMonth: record.servicesPerMonth ?? undefined,
                casesPerMonth: record.casesPerMonth ?? undefined,
                callMinutesPerMonth: record.callMinutesPerMonth ?? undefined,
            },
            record.benefits,
            record.isActive,
            record.createdAt,
            record.updatedAt,
        );
    }

    /** ✅ Check if tier is available for subscription */
    canBeSubscribed(): boolean {
        return this.isActive;
    }

    /** ✅ Get quota limit for specific resource */
    getQuotaLimit(resource: keyof TierQuota): number | undefined {
        return this.quota[resource];
    }

    /** ✅ Check if tier has unlimited quota for resource */
    hasUnlimitedQuota(resource: keyof TierQuota): boolean {
        return this.quota[resource] === undefined || this.quota[resource] === null;
    }
}