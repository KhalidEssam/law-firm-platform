// ============================================
// DISCOUNT TYPE VALUE OBJECT
// src/core/domain/shared/value-objects/discount-type.vo.ts
// ============================================

/**
 * DiscountType enum matching Prisma schema
 */
export enum DiscountTypeEnum {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

/**
 * DiscountType Value Object
 * Represents the type of discount applied to a price
 */
export class DiscountType {
  private static readonly validTypes = Object.values(DiscountTypeEnum);

  private constructor(private readonly value: DiscountTypeEnum) {}

  static create(value: string): DiscountType {
    const normalizedValue = value.toLowerCase() as DiscountTypeEnum;
    if (!DiscountType.validTypes.includes(normalizedValue)) {
      throw new Error(
        `Invalid discount type: ${value}. Must be one of: ${DiscountType.validTypes.join(', ')}`,
      );
    }
    return new DiscountType(normalizedValue);
  }

  static percentage(): DiscountType {
    return new DiscountType(DiscountTypeEnum.PERCENTAGE);
  }

  static fixed(): DiscountType {
    return new DiscountType(DiscountTypeEnum.FIXED);
  }

  getValue(): DiscountTypeEnum {
    return this.value;
  }

  isPercentage(): boolean {
    return this.value === DiscountTypeEnum.PERCENTAGE;
  }

  isFixed(): boolean {
    return this.value === DiscountTypeEnum.FIXED;
  }

  /**
   * Calculate the discount amount based on the original price
   * @param originalPrice The original price before discount
   * @param discountValue The discount value (percentage or fixed amount)
   * @returns The discount amount
   */
  calculateDiscount(originalPrice: number, discountValue: number): number {
    if (originalPrice < 0) {
      throw new Error('Original price cannot be negative');
    }
    if (discountValue < 0) {
      throw new Error('Discount value cannot be negative');
    }

    if (this.isPercentage()) {
      if (discountValue > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
      return (originalPrice * discountValue) / 100;
    } else {
      // Fixed discount cannot exceed original price
      return Math.min(discountValue, originalPrice);
    }
  }

  /**
   * Calculate the final price after discount
   * @param originalPrice The original price before discount
   * @param discountValue The discount value (percentage or fixed amount)
   * @returns The final price after discount
   */
  calculateFinalPrice(originalPrice: number, discountValue: number): number {
    const discount = this.calculateDiscount(originalPrice, discountValue);
    return Math.max(0, originalPrice - discount);
  }

  equals(other: DiscountType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}

/**
 * Check if a string is a valid discount type
 */
export function isValidDiscountType(value: string): value is DiscountTypeEnum {
  return Object.values(DiscountTypeEnum).includes(value as DiscountTypeEnum);
}

/**
 * Map Prisma enum to domain DiscountType
 */
export function mapDiscountTypeFromPrisma(prismaType: string): DiscountType {
  if (isValidDiscountType(prismaType)) {
    return DiscountType.create(prismaType);
  }
  return DiscountType.percentage();
}

/**
 * Map domain DiscountType to Prisma enum value
 */
export function mapDiscountTypeToPrisma(type: DiscountType): string {
  return type.getValue();
}
