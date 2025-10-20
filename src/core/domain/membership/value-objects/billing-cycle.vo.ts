// ============================================
// BILLING CYCLE VALUE OBJECT
// src/core/domain/membership/value-objects/billing-cycle.vo.ts
// ============================================

export type BillingCycleType = 'monthly' | 'quarterly' | 'yearly';

export class BillingCycle {
    private static readonly allowedCycles: BillingCycleType[] = ['monthly', 'quarterly', 'yearly'];

    private static readonly cycleMonths: Record<BillingCycleType, number> = {
        monthly: 1,
        quarterly: 3,
        yearly: 12,
    };

    private constructor(private readonly _value: BillingCycleType) { }

    /**
     * Create a BillingCycle value object
     * @param value - The billing cycle string
     * @throws Error if invalid cycle
     */
    static create(value: string): BillingCycle {
        const normalizedValue = value.toLowerCase() as BillingCycleType;

        if (!BillingCycle.allowedCycles.includes(normalizedValue)) {
            throw new Error(
                `Invalid billing cycle: ${value}. Allowed values: ${BillingCycle.allowedCycles.join(', ')}`
            );
        }

        return new BillingCycle(normalizedValue);
    }

    /**
     * Get the string value of the billing cycle
     */
    get value(): string {
        return this._value;
    }

    /**
     * Get the number of months for this billing cycle
     * @returns Number of months (1 for monthly, 3 for quarterly, 12 for yearly)
     */
    getMonths(): number {
        return BillingCycle.cycleMonths[this._value];
    }

    /**
     * Check if this is a monthly cycle
     */
    isMonthly(): boolean {
        return this._value === 'monthly';
    }

    /**
     * Check if this is a quarterly cycle
     */
    isQuarterly(): boolean {
        return this._value === 'quarterly';
    }

    /**
     * Check if this is a yearly cycle
     */
    isYearly(): boolean {
        return this._value === 'yearly';
    }

    /**
     * Get human-readable label
     */
    getLabel(): string {
        const labels: Record<BillingCycleType, string> = {
            monthly: 'Monthly',
            quarterly: 'Quarterly',
            yearly: 'Yearly',
        };
        return labels[this._value];
    }

    /**
     * Calculate the end date from a start date
     * @param startDate - The start date
     * @returns The end date after adding the billing cycle months
     */
    calculateEndDate(startDate: Date): Date {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + this.getMonths());
        return endDate;
    }

    /**
     * Compare equality with another BillingCycle
     */
    equals(other: BillingCycle): boolean {
        return this._value === other._value;
    }

    /**
     * Convert to string
     */
    toString(): string {
        return this._value;
    }

    /**
     * Convert to JSON for serialization
     */
    toJSON(): string {
        return this._value;
    }

    /**
     * Get all allowed billing cycles
     */
    static getAllowedCycles(): BillingCycleType[] {
        return [...BillingCycle.allowedCycles];
    }
}