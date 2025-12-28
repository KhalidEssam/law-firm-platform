// ============================================
// SYSTEM MESSAGE TYPE VALUE OBJECT
// src/core/domain/shared/value-objects/system-message-type.vo.ts
// ============================================

/**
 * SystemMessageType enum matching Prisma schema
 */
export enum SystemMessageTypeEnum {
  BANNER = 'banner',
  MODAL = 'modal',
  ALERT = 'alert',
}

/**
 * SystemMessageType Value Object
 * Represents how a system message should be displayed to users
 */
export class SystemMessageType {
  private static readonly validTypes = Object.values(SystemMessageTypeEnum);

  private constructor(private readonly value: SystemMessageTypeEnum) {}

  static create(value: string): SystemMessageType {
    const normalizedValue = value.toLowerCase() as SystemMessageTypeEnum;
    if (!SystemMessageType.validTypes.includes(normalizedValue)) {
      throw new Error(
        `Invalid system message type: ${value}. Must be one of: ${SystemMessageType.validTypes.join(', ')}`,
      );
    }
    return new SystemMessageType(normalizedValue);
  }

  static banner(): SystemMessageType {
    return new SystemMessageType(SystemMessageTypeEnum.BANNER);
  }

  static modal(): SystemMessageType {
    return new SystemMessageType(SystemMessageTypeEnum.MODAL);
  }

  static alert(): SystemMessageType {
    return new SystemMessageType(SystemMessageTypeEnum.ALERT);
  }

  getValue(): SystemMessageTypeEnum {
    return this.value;
  }

  // Type checks
  isBanner(): boolean {
    return this.value === SystemMessageTypeEnum.BANNER;
  }

  isModal(): boolean {
    return this.value === SystemMessageTypeEnum.MODAL;
  }

  isAlert(): boolean {
    return this.value === SystemMessageTypeEnum.ALERT;
  }

  /**
   * Check if this message type is dismissible by default
   */
  isDismissibleByDefault(): boolean {
    // Banners and alerts are typically dismissible, modals may require action
    return [SystemMessageTypeEnum.BANNER, SystemMessageTypeEnum.ALERT].includes(
      this.value,
    );
  }

  /**
   * Check if this message type blocks user interaction
   */
  isBlocking(): boolean {
    return this.value === SystemMessageTypeEnum.MODAL;
  }

  /**
   * Check if this message type is persistent on page
   */
  isPersistent(): boolean {
    return this.value === SystemMessageTypeEnum.BANNER;
  }

  /**
   * Get default duration in seconds (0 = no auto-dismiss)
   */
  getDefaultDuration(): number {
    const durationMap: Record<SystemMessageTypeEnum, number> = {
      [SystemMessageTypeEnum.BANNER]: 0, // Persistent until dismissed
      [SystemMessageTypeEnum.MODAL]: 0, // Requires user action
      [SystemMessageTypeEnum.ALERT]: 5, // Auto-dismiss after 5 seconds
    };
    return durationMap[this.value];
  }

  /**
   * Get display priority (higher = more prominent)
   */
  getPriority(): number {
    const priorityMap: Record<SystemMessageTypeEnum, number> = {
      [SystemMessageTypeEnum.MODAL]: 3, // Highest - requires attention
      [SystemMessageTypeEnum.ALERT]: 2, // Medium
      [SystemMessageTypeEnum.BANNER]: 1, // Lowest - informational
    };
    return priorityMap[this.value];
  }

  equals(other: SystemMessageType): boolean {
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
 * Check if a string is a valid system message type
 */
export function isValidSystemMessageType(
  value: string,
): value is SystemMessageTypeEnum {
  return Object.values(SystemMessageTypeEnum).includes(
    value as SystemMessageTypeEnum,
  );
}

/**
 * Map Prisma enum to domain SystemMessageType
 */
export function mapSystemMessageTypeFromPrisma(
  prismaType: string,
): SystemMessageType {
  if (isValidSystemMessageType(prismaType)) {
    return SystemMessageType.create(prismaType);
  }
  return SystemMessageType.banner();
}

/**
 * Map domain SystemMessageType to Prisma enum value
 */
export function mapSystemMessageTypeToPrisma(type: SystemMessageType): string {
  return type.getValue();
}
