// src/core/domain/common/value-objects/money.vo.ts

export class Money {
    private constructor(
        private readonly _amount: number,
        private readonly _currency: string,
    ) {
        if (_amount < 0) throw new Error('Amount cannot be negative');
        if (!_currency.match(/^[A-Z]{3}$/))
            throw new Error('Currency must be a valid ISO 4217 code');
    }

    static create(amount: number, currency: string = 'USD'): Money {
        return new Money(amount, currency);
    }

    get amount(): number {
        return this._amount;
    }

    get currency(): string {
        return this._currency;
    }

    // ✅ Domain methods
    add(other: Money): Money {
        this.ensureSameCurrency(other);
        return new Money(this._amount + other._amount, this._currency);
    }

    subtract(other: Money): Money {
        this.ensureSameCurrency(other);
        if (this._amount < other._amount) throw new Error('Insufficient amount');
        return new Money(this._amount - other._amount, this._currency);
    }

    equals(other: Money): boolean {
        return this._amount === other._amount && this._currency === other._currency;
    }

    private ensureSameCurrency(other: Money): void {
        if (this._currency !== other._currency)
            throw new Error('Currencies do not match');
    }

    toString(): string {
        return `${this._amount.toFixed(2)} ${this._currency}`;
    }
}
