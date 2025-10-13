import crypto from 'crypto';
import { Money } from '../value-objects/money.vo';
import { BillingCycle } from '../value-objects/billing-cycle.vo';

export class Membership {
    private constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly tierId: number,
        public readonly price: Money | undefined,
        public readonly billingCycle: BillingCycle | undefined,
        public readonly startDate: Date,
        public readonly endDate?: Date,
        public readonly isActive: boolean = true,
        public readonly autoRenew: boolean = true,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) { }

    /** ✅ Factory method for new membership creation */
    static create(props: {
        userId: string;
        tierId: number;
        price?: Money;
        billingCycle?: BillingCycle;
        startDate?: Date;
        endDate?: Date;
        isActive?: boolean;
        autoRenew?: boolean;
    }): Membership {
        return new Membership(
            crypto.randomUUID(),
            props.userId,
            props.tierId,
            props.price,
            props.billingCycle,
            props.startDate ?? new Date(),
            props.endDate,
            props.isActive ?? true,
            props.autoRenew ?? true,
            new Date(),
            new Date(),
        );
    }

    /** ✅ Factory method for DB rehydration */
    static rehydrate(record: {
        id: string;
        userId: string;
        tierId: number;
        startDate: Date;
        endDate?: Date;
        isActive: boolean;
        autoRenew: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Membership {
        return new Membership(
            record.id,
            record.userId,
            record.tierId,
            undefined,
            undefined,
            record.startDate,
            record.endDate,
            record.isActive,
            record.autoRenew,
            record.createdAt,
            record.updatedAt,
        );
    }

    cancel(): Membership {
        return new Membership(
            this.id,
            this.userId,
            this.tierId,
            this.price,
            this.billingCycle,
            this.startDate,
            new Date(),
            false,
            false,
        );
    }

    renew(durationInMonths: number): Membership {
        const newEnd = new Date(this.endDate || new Date());
        newEnd.setMonth(newEnd.getMonth() + durationInMonths);
        return new Membership(
            this.id,
            this.userId,
            this.tierId,
            this.price,
            this.billingCycle,
            this.startDate,
            newEnd,
            true,
            this.autoRenew,
        );
    }
}
