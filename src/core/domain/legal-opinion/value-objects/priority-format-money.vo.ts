// ============================================
// VALUE OBJECT 10: OPINION PRIORITY
// Priority level of the legal opinion
// ============================================

// import { DomainException } from '../shared/domain-exception';

export enum OpinionPriority {
  STANDARD = 'standard',     // 7-10 business days
  EXPEDITED = 'expedited',   // 3-5 business days
  RUSH = 'rush',             // 24-48 hours
  URGENT = 'urgent',         // Within 24 hours
}

export class OpinionPriorityVO {
  private readonly value: OpinionPriority;

  private constructor(value: OpinionPriority) {
    this.validate(value);
    this.value = value;
  }

  private validate(value: OpinionPriority): void {
    // if (!Object.values(OpinionPriority).includes(value)) {
    //   throw new DomainException(`Invalid priority: ${value}`);
    // }
  }

  static create(value: OpinionPriority | string): OpinionPriorityVO {
    return new OpinionPriorityVO(value as OpinionPriority);
  }

  getValue(): OpinionPriority {
    return this.value;
  }

  // Get display label
  getLabel(): string {
    const labels: Record<OpinionPriority, string> = {
      [OpinionPriority.STANDARD]: 'Standard (7-10 days)',
      [OpinionPriority.EXPEDITED]: 'Expedited (3-5 days)',
      [OpinionPriority.RUSH]: 'Rush (24-48 hours)',
      [OpinionPriority.URGENT]: 'Urgent (within 24 hours)',
    };
    return labels[this.value];
  }

  // Get turnaround time in days
  getTurnaroundDays(): number {
    const days: Record<OpinionPriority, number> = {
      [OpinionPriority.STANDARD]: 10,
      [OpinionPriority.EXPEDITED]: 5,
      [OpinionPriority.RUSH]: 2,
      [OpinionPriority.URGENT]: 1,
    };
    return days[this.value];
  }

  // Get price multiplier
  getPriceMultiplier(): number {
    const multipliers: Record<OpinionPriority, number> = {
      [OpinionPriority.STANDARD]: 1.0,
      [OpinionPriority.EXPEDITED]: 1.5,
      [OpinionPriority.RUSH]: 2.0,
      [OpinionPriority.URGENT]: 3.0,
    };
    return multipliers[this.value];
  }

  isUrgent(): boolean {
    return this.value === OpinionPriority.URGENT || this.value === OpinionPriority.RUSH;
  }

  equals(other: OpinionPriorityVO): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

// ============================================
// VALUE OBJECT 11: DELIVERY FORMAT
// Format for opinion delivery
// ============================================

export enum DeliveryFormat {
  PDF = 'pdf',
  WORD = 'word',
  BOTH = 'both',
}

export class DeliveryFormatVO {
  private readonly value: DeliveryFormat;

  private constructor(value: DeliveryFormat) {
    this.validate(value);
    this.value = value;
  }

  private validate(value: DeliveryFormat): void {
    // if (!Object.values(DeliveryFormat).includes(value)) {
    //   throw new DomainException(`Invalid delivery format: ${value}`);
    // }
  }

  static create(value: DeliveryFormat | string): DeliveryFormatVO {
    return new DeliveryFormatVO(value as DeliveryFormat);
  }

  getValue(): DeliveryFormat {
    return this.value;
  }

  includesPDF(): boolean {
    return this.value === DeliveryFormat.PDF || this.value === DeliveryFormat.BOTH;
  }

  includesWord(): boolean {
    return this.value === DeliveryFormat.WORD || this.value === DeliveryFormat.BOTH;
  }

  getLabel(): string {
    const labels: Record<DeliveryFormat, string> = {
      [DeliveryFormat.PDF]: 'PDF only',
      [DeliveryFormat.WORD]: 'Word document only',
      [DeliveryFormat.BOTH]: 'PDF and Word',
    };
    return labels[this.value];
  }

  equals(other: DeliveryFormatVO): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

// ============================================
// VALUE OBJECT 12: MONEY
// Monetary amount with currency
// ============================================

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
    if (divisor === 0) {
      return Money.zero(this.currency);
    //   throw new DomainException('Cannot divide by zero');
    }
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
      // TODO: Add a custom exception
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