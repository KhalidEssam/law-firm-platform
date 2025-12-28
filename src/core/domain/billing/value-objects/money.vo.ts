// ============================================
// MONEY VALUE OBJECT
// src/core/domain/billing/value-objects/money.vo.ts
// ============================================

export enum CurrencyEnum {
  SAR = 'SAR',
  USD = 'USD',
  EUR = 'EUR',
}

export class Money {
  private static readonly allowedCurrencies = Object.values(CurrencyEnum);

  private constructor(
    public readonly amount: number,
    public readonly currency: CurrencyEnum,
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }

  static create(params: { amount: number; currency: string }): Money {
    const normalizedCurrency = params.currency.toUpperCase() as CurrencyEnum;
    if (!Money.allowedCurrencies.includes(normalizedCurrency)) {
      throw new Error(`Invalid currency: ${params.currency}`);
    }
    return new Money(params.amount, normalizedCurrency);
  }

  static fromAmount(
    amount: number,
    currency: CurrencyEnum = CurrencyEnum.SAR,
  ): Money {
    return new Money(amount, currency);
  }

  static zero(currency: CurrencyEnum = CurrencyEnum.SAR): Money {
    return new Money(0, currency);
  }

  // Arithmetic operations
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Subtraction would result in negative amount');
    }
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Factor cannot be negative');
    }
    return new Money(this.amount * factor, this.currency);
  }

  percentage(percent: number): Money {
    if (percent < 0 || percent > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    return new Money((this.amount * percent) / 100, this.currency);
  }

  // Comparison methods
  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount >= other.amount;
  }

  isLessThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount <= other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot operate on different currencies: ${this.currency} vs ${other.currency}`,
      );
    }
  }

  // Formatting
  format(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }

  toString(): string {
    return this.format();
  }

  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }
}
