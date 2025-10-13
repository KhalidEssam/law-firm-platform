// src/core/domain/membership/value-objects/billing-cycle.vo.ts

export class BillingCycle {
    private static readonly allowedCycles = ['monthly', 'yearly'] as const;
    private constructor(private readonly _value: typeof BillingCycle.allowedCycles[number]) { }

    static create(value: string): BillingCycle {
        if (!BillingCycle.allowedCycles.includes(value as any)) {
            throw new Error(`Invalid billing cycle: ${value}`);
        }
        return new BillingCycle(value as any);
    }

    get value(): string {
        return this._value;
    }

    equals(other: BillingCycle): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }
}
