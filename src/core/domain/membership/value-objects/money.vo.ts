// core/domain/membership/value-objects/money.vo.ts

export class Money {
    private constructor(
        public readonly amount: number,
        public readonly currency: string,
    ) {
        if (amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        if (!currency || currency.trim().length === 0) {
            throw new Error('Currency is required');
        }
    }

    static create(params: { amount: number; currency: string }): Money {
        return new Money(params.amount, params.currency);
    }

    // Alternative: Support both formats
    static fromAmount(amount: number, currency: string = 'SAR'): Money {
        return new Money(amount, currency);
    }

    equals(other: Money): boolean {
        return this.amount === other.amount && this.currency === other.currency;
    }

    add(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error('Cannot add money with different currencies');
        }
        return new Money(this.amount + other.amount, this.currency);
    }

    subtract(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error('Cannot subtract money with different currencies');
        }
        return new Money(this.amount - other.amount, this.currency);
    }

    multiply(factor: number): Money {
        return new Money(this.amount * factor, this.currency);
    }

    toString(): string {
        return `${this.amount} ${this.currency}`;
    }

    toJSON() {
        return {
            amount: this.amount,
            currency: this.currency,
        };
    }
}