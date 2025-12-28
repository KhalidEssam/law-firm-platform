// ============================================
// TRANSACTION TYPE VALUE OBJECT
// src/core/domain/billing/value-objects/transaction-type.vo.ts
// ============================================

export enum TransactionTypeEnum {
  SUBSCRIPTION = 'subscription',
  WALLET_TOPUP = 'wallet_topup',
  SERVICE_PAYMENT = 'service_payment',
  REFUND = 'refund',
}

export class TransactionType {
  private static readonly allowedTypes = Object.values(TransactionTypeEnum);

  private constructor(private readonly value: TransactionTypeEnum) {}

  static create(value: string): TransactionType {
    const normalizedValue = value.toLowerCase() as TransactionTypeEnum;
    if (!TransactionType.allowedTypes.includes(normalizedValue)) {
      throw new Error(`Invalid transaction type: ${value}`);
    }
    return new TransactionType(normalizedValue);
  }

  static subscription(): TransactionType {
    return new TransactionType(TransactionTypeEnum.SUBSCRIPTION);
  }

  static walletTopup(): TransactionType {
    return new TransactionType(TransactionTypeEnum.WALLET_TOPUP);
  }

  static servicePayment(): TransactionType {
    return new TransactionType(TransactionTypeEnum.SERVICE_PAYMENT);
  }

  static refund(): TransactionType {
    return new TransactionType(TransactionTypeEnum.REFUND);
  }

  getValue(): TransactionTypeEnum {
    return this.value;
  }

  // State query methods
  isSubscription(): boolean {
    return this.value === TransactionTypeEnum.SUBSCRIPTION;
  }

  isWalletTopup(): boolean {
    return this.value === TransactionTypeEnum.WALLET_TOPUP;
  }

  isServicePayment(): boolean {
    return this.value === TransactionTypeEnum.SERVICE_PAYMENT;
  }

  isRefund(): boolean {
    return this.value === TransactionTypeEnum.REFUND;
  }

  // Business rule methods
  isCredit(): boolean {
    return [
      TransactionTypeEnum.WALLET_TOPUP,
      TransactionTypeEnum.REFUND,
    ].includes(this.value);
  }

  isDebit(): boolean {
    return [
      TransactionTypeEnum.SUBSCRIPTION,
      TransactionTypeEnum.SERVICE_PAYMENT,
    ].includes(this.value);
  }

  equals(other: TransactionType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
