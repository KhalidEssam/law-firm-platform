// src/core/domain/membership/entities/tier-service.entity.ts

import crypto from 'crypto';

export class TierService {
  private constructor(
    public readonly id: string,
    public readonly tierId: number,
    public readonly serviceId: string,
    public quotaPerMonth: number | null, // null = unlimited
    public quotaPerYear: number | null,
    public rolloverUnused: boolean,
    public discountPercent: number,
    public isActive: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  /** Factory method for creating new tier service */
  static create(props: {
    tierId: number;
    serviceId: string;
    quotaPerMonth?: number | null;
    quotaPerYear?: number | null;
    rolloverUnused?: boolean;
    discountPercent?: number;
    isActive?: boolean;
  }): TierService {
    return new TierService(
      crypto.randomUUID(),
      props.tierId,
      props.serviceId,
      props.quotaPerMonth ?? null,
      props.quotaPerYear ?? null,
      props.rolloverUnused ?? false,
      props.discountPercent ?? 0,
      props.isActive ?? true,
      new Date(),
      new Date(),
    );
  }

  /** Factory method for DB rehydration */
  static rehydrate(record: {
    id: string;
    tierId: number;
    serviceId: string;
    quotaPerMonth: number | null;
    quotaPerYear: number | null;
    rolloverUnused: boolean;
    discountPercent: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): TierService {
    return new TierService(
      record.id,
      record.tierId,
      record.serviceId,
      record.quotaPerMonth,
      record.quotaPerYear,
      record.rolloverUnused,
      record.discountPercent ?? 0,
      record.isActive,
      record.createdAt,
      record.updatedAt,
    );
  }

  /** Check if quota is unlimited for monthly */
  hasUnlimitedMonthlyQuota(): boolean {
    return this.quotaPerMonth === null;
  }

  /** Check if quota is unlimited for yearly */
  hasUnlimitedYearlyQuota(): boolean {
    return this.quotaPerYear === null;
  }

  /** Get effective monthly quota */
  getEffectiveMonthlyQuota(): number | null {
    return this.quotaPerMonth;
  }

  /** Get effective yearly quota */
  getEffectiveYearlyQuota(): number | null {
    return this.quotaPerYear;
  }

  /** Calculate discounted price */
  calculateDiscountedPrice(basePrice: number): number {
    if (this.discountPercent <= 0) return basePrice;
    return basePrice * (1 - this.discountPercent / 100);
  }

  /** Update quota settings */
  updateQuota(props: {
    quotaPerMonth?: number | null;
    quotaPerYear?: number | null;
    rolloverUnused?: boolean;
  }): void {
    if (props.quotaPerMonth !== undefined)
      this.quotaPerMonth = props.quotaPerMonth;
    if (props.quotaPerYear !== undefined)
      this.quotaPerYear = props.quotaPerYear;
    if (props.rolloverUnused !== undefined)
      this.rolloverUnused = props.rolloverUnused;
    this.updatedAt = new Date();
  }

  /** Update discount */
  updateDiscount(discountPercent: number): void {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error('Discount percent must be between 0 and 100');
    }
    this.discountPercent = discountPercent;
    this.updatedAt = new Date();
  }

  /** Activate tier service */
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /** Deactivate tier service */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}
