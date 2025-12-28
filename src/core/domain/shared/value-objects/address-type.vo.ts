// ============================================
// ADDRESS TYPE VALUE OBJECT
// src/core/domain/shared/value-objects/address-type.vo.ts
// ============================================

/**
 * AddressType enum matching Prisma schema
 */
export enum AddressTypeEnum {
  HOME = 'home',
  WORK = 'work',
  BILLING = 'billing',
}

/**
 * AddressType Value Object
 * Represents the type/purpose of a user's address
 */
export class AddressType {
  private static readonly validTypes = Object.values(AddressTypeEnum);

  private constructor(private readonly value: AddressTypeEnum) {}

  static create(value: string): AddressType {
    const normalizedValue = value.toLowerCase() as AddressTypeEnum;
    if (!AddressType.validTypes.includes(normalizedValue)) {
      throw new Error(
        `Invalid address type: ${value}. Must be one of: ${AddressType.validTypes.join(', ')}`,
      );
    }
    return new AddressType(normalizedValue);
  }

  static home(): AddressType {
    return new AddressType(AddressTypeEnum.HOME);
  }

  static work(): AddressType {
    return new AddressType(AddressTypeEnum.WORK);
  }

  static billing(): AddressType {
    return new AddressType(AddressTypeEnum.BILLING);
  }

  getValue(): AddressTypeEnum {
    return this.value;
  }

  isHome(): boolean {
    return this.value === AddressTypeEnum.HOME;
  }

  isWork(): boolean {
    return this.value === AddressTypeEnum.WORK;
  }

  isBilling(): boolean {
    return this.value === AddressTypeEnum.BILLING;
  }

  /**
   * Check if this address type can be used for billing
   */
  canBeUsedForBilling(): boolean {
    // Home and billing addresses can be used for billing
    return [AddressTypeEnum.HOME, AddressTypeEnum.BILLING].includes(this.value);
  }

  /**
   * Check if this address type can be used for shipping
   */
  canBeUsedForShipping(): boolean {
    // Home and work addresses can be used for shipping
    return [AddressTypeEnum.HOME, AddressTypeEnum.WORK].includes(this.value);
  }

  equals(other: AddressType): boolean {
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
 * Check if a string is a valid address type
 */
export function isValidAddressType(value: string): value is AddressTypeEnum {
  return Object.values(AddressTypeEnum).includes(value as AddressTypeEnum);
}

/**
 * Map Prisma enum to domain AddressType
 */
export function mapAddressTypeFromPrisma(prismaType: string): AddressType {
  if (isValidAddressType(prismaType)) {
    return AddressType.create(prismaType);
  }
  return AddressType.home();
}

/**
 * Map domain AddressType to Prisma enum value
 */
export function mapAddressTypeToPrisma(type: AddressType): string {
  return type.getValue();
}
