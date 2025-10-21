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

export class MembershipTier {
    private constructor(
        public readonly id: number,           // 👈 ID stays readonly
        public name: string,                   // 👈 Removed readonly
        public nameAr: string | null,         // 👈 Removed readonly
        public description: string | null,    // 👈 Removed readonly
        public descriptionAr: string | null,  // 👈 Removed readonly
        public price: Money,                   // 👈 Removed readonly
        public billingCycle: BillingCycle,    // 👈 Removed readonly
        public quota: TierQuota,              // 👈 Removed readonly
        public benefits: string[],            // 👈 Changed from TierBenefits to string[]
        public isActive: boolean,             // 👈 Removed readonly
        public createdAt: Date,               // 👈 Removed readonly (for updatedAt changes)
        public updatedAt: Date,               // 👈 Removed readonly
    ) { }

    /** ✅ Factory method for creating new tier */
    static create(params: {
        id?: number;
        name: string;
        nameAr?: string;
        description?: string;
        descriptionAr?: string;
        price: Money;
        billingCycle: BillingCycle;
        quota?: TierQuota;
        benefits?: string[];
        isActive?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
    }): MembershipTier {
        return new MembershipTier(
            params.id ?? 0,
            params.name,
            params.nameAr ?? null,
            params.description ?? null,
            params.descriptionAr ?? null,
            params.price,
            params.billingCycle,
            params.quota ?? {},
            params.benefits ?? [],
            params.isActive ?? true,
            params.createdAt ?? new Date(),
            params.updatedAt ?? new Date(),
        );
    }

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
        quota?: TierQuota;
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
            Money.create({ amount: record.price, currency: record.currency }),
            BillingCycle.fromValue(record.billingCycle),
            record.quota ?? {},
            Array.isArray(record.benefits) ? record.benefits : [],
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

    /** ✅ Update tier details */
    updateDetails(params: {
        name?: string;
        nameAr?: string;
        description?: string;
        descriptionAr?: string;
    }): void {
        if (params.name !== undefined) this.name = params.name;
        if (params.nameAr !== undefined) this.nameAr = params.nameAr;
        if (params.description !== undefined) this.description = params.description;
        if (params.descriptionAr !== undefined) this.descriptionAr = params.descriptionAr;
        this.updatedAt = new Date();
    }

    /** ✅ Update price */
    updatePrice(price: Money): void {
        this.price = price;
        this.updatedAt = new Date();
    }

    /** ✅ Update billing cycle */
    updateBillingCycle(billingCycle: BillingCycle): void {
        this.billingCycle = billingCycle;
        this.updatedAt = new Date();
    }

    /** ✅ Update quota */
    updateQuota(quota: TierQuota): void {
        this.quota = quota;
        this.updatedAt = new Date();
    }

    /** ✅ Update benefits */
    updateBenefits(benefits: string[]): void {
        this.benefits = benefits;
        this.updatedAt = new Date();
    }

    /** ✅ Activate tier */
    activate(): void {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    /** ✅ Deactivate tier */
    deactivate(): void {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    /** ✅ Convert to persistence format */
    toPersistence() {
        return {
            id: this.id,
            name: this.name,
            nameAr: this.nameAr,
            description: this.description,
            descriptionAr: this.descriptionAr,
            price: this.price.amount,
            currency: this.price.currency,
            billingCycle: this.billingCycle.value,
            benefits: this.benefits,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}