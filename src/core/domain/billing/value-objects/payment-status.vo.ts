// ============================================
// PAYMENT STATUS VALUE OBJECT
// src/core/domain/billing/value-objects/payment-status.vo.ts
// ============================================

export enum PaymentStatusEnum {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export class PaymentStatus {
  private static readonly allowedStatuses = Object.values(PaymentStatusEnum);

  private constructor(private readonly value: PaymentStatusEnum) {}

  static create(value: string): PaymentStatus {
    const normalizedValue = value.toLowerCase() as PaymentStatusEnum;
    if (!PaymentStatus.allowedStatuses.includes(normalizedValue)) {
      throw new Error(`Invalid payment status: ${value}`);
    }
    return new PaymentStatus(normalizedValue);
  }

  static pending(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.PENDING);
  }

  static paid(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.PAID);
  }

  static failed(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.FAILED);
  }

  static refunded(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.REFUNDED);
  }

  static partiallyRefunded(): PaymentStatus {
    return new PaymentStatus(PaymentStatusEnum.PARTIALLY_REFUNDED);
  }

  getValue(): PaymentStatusEnum {
    return this.value;
  }

  // State query methods
  isPending(): boolean {
    return this.value === PaymentStatusEnum.PENDING;
  }

  isPaid(): boolean {
    return this.value === PaymentStatusEnum.PAID;
  }

  isFailed(): boolean {
    return this.value === PaymentStatusEnum.FAILED;
  }

  isRefunded(): boolean {
    return this.value === PaymentStatusEnum.REFUNDED;
  }

  isPartiallyRefunded(): boolean {
    return this.value === PaymentStatusEnum.PARTIALLY_REFUNDED;
  }

  // Business rule methods
  isSuccessful(): boolean {
    return [
      PaymentStatusEnum.PAID,
      PaymentStatusEnum.PARTIALLY_REFUNDED,
    ].includes(this.value);
  }

  canBeRefunded(): boolean {
    return [
      PaymentStatusEnum.PAID,
      PaymentStatusEnum.PARTIALLY_REFUNDED,
    ].includes(this.value);
  }

  canBeRetried(): boolean {
    return [PaymentStatusEnum.PENDING, PaymentStatusEnum.FAILED].includes(
      this.value,
    );
  }

  isFinal(): boolean {
    return [PaymentStatusEnum.REFUNDED, PaymentStatusEnum.FAILED].includes(
      this.value,
    );
  }

  equals(other: PaymentStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
