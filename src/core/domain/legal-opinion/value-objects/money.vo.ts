// ============================================
// VALUE OBJECT: MONEY
// Monetary amount with currency
// ============================================

// import { DomainException } from '../shared/domain-exception';

export class Money {
  private readonly amount: number;
  private readonly currency: string;

  private constructor(amount: number, currency: string) {
    this.validate(amount, currency);
    this.amount = amount;
    this.currency = currency.toUpperCase();
  }

  private validate(amount: number, currency: string): void {
    // if (amount < 0) {
    //   throw new DomainException('Amount cannot be negative');
    // }
    // if (!currency || currency.trim().length === 0) {
    //   throw new DomainException('Currency is required');
    // }
    // if (currency.length !== 3) {
    //   throw new DomainException('Currency must be 3-letter ISO code (e.g., SAR, USD)');
    // }
  }

  static create(amount: number, currency: string = 'SAR'): Money {
    return new Money(amount, currency);
  }

  static sar(amount: number): Money {
    return new Money(amount, 'SAR');
  }

  static usd(amount: number): Money {
    return new Money(amount, 'USD');
  }

  static zero(currency: string = 'SAR'): Money {
    return new Money(0, currency);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  // Arithmetic operations (return new Money instances)
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  divide(divisor: number): Money {
    // if (divisor === 0) {
    //   throw new DomainException('Cannot divide by zero');
    // }
    return new Money(this.amount / divisor, this.currency);
  }

  // Comparisons
  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      //   throw new DomainException(
      //     `Cannot operate on different currencies: ${this.currency} and ${other.currency}`
      //   );
    }
  }

  // Formatting
  format(locale: string = 'ar-SA'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }

  formatWithoutSymbol(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }

  equals(other: Money): boolean {
    if (!other) return false;
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return this.formatWithoutSymbol();
  }

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  static fromJSON(data: { amount: number; currency: string }): Money {
    return new Money(data.amount, data.currency);
  }
}
