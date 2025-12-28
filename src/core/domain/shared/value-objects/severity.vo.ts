// ============================================
// SEVERITY VALUE OBJECT
// src/core/domain/shared/value-objects/severity.vo.ts
// ============================================

/**
 * Severity enum matching Prisma schema
 * Used for system messages, notifications, and alerts
 */
export enum SeverityEnum {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * Severity Value Object
 * Represents the severity/importance level of a message or notification
 */
export class Severity {
  private static readonly validSeverities = Object.values(SeverityEnum);

  private constructor(private readonly value: SeverityEnum) {}

  static create(value: string): Severity {
    const normalizedValue = value.toLowerCase() as SeverityEnum;
    if (!Severity.validSeverities.includes(normalizedValue)) {
      throw new Error(
        `Invalid severity: ${value}. Must be one of: ${Severity.validSeverities.join(', ')}`,
      );
    }
    return new Severity(normalizedValue);
  }

  static info(): Severity {
    return new Severity(SeverityEnum.INFO);
  }

  static warning(): Severity {
    return new Severity(SeverityEnum.WARNING);
  }

  static error(): Severity {
    return new Severity(SeverityEnum.ERROR);
  }

  static success(): Severity {
    return new Severity(SeverityEnum.SUCCESS);
  }

  getValue(): SeverityEnum {
    return this.value;
  }

  // Severity checks
  isInfo(): boolean {
    return this.value === SeverityEnum.INFO;
  }

  isWarning(): boolean {
    return this.value === SeverityEnum.WARNING;
  }

  isError(): boolean {
    return this.value === SeverityEnum.ERROR;
  }

  isSuccess(): boolean {
    return this.value === SeverityEnum.SUCCESS;
  }

  /**
   * Check if this severity indicates a problem
   */
  isNegative(): boolean {
    return [SeverityEnum.WARNING, SeverityEnum.ERROR].includes(this.value);
  }

  /**
   * Check if this severity indicates a positive outcome
   */
  isPositive(): boolean {
    return this.value === SeverityEnum.SUCCESS;
  }

  /**
   * Check if this severity is neutral/informational
   */
  isNeutral(): boolean {
    return this.value === SeverityEnum.INFO;
  }

  /**
   * Get importance level (higher = more important)
   */
  getImportance(): number {
    const importanceMap: Record<SeverityEnum, number> = {
      [SeverityEnum.ERROR]: 4,
      [SeverityEnum.WARNING]: 3,
      [SeverityEnum.SUCCESS]: 2,
      [SeverityEnum.INFO]: 1,
    };
    return importanceMap[this.value];
  }

  /**
   * Check if this severity should trigger a notification
   */
  shouldNotify(): boolean {
    return [SeverityEnum.ERROR, SeverityEnum.WARNING].includes(this.value);
  }

  /**
   * Get display color for UI (CSS color name)
   */
  getDisplayColor(): string {
    const colorMap: Record<SeverityEnum, string> = {
      [SeverityEnum.INFO]: 'blue',
      [SeverityEnum.WARNING]: 'orange',
      [SeverityEnum.ERROR]: 'red',
      [SeverityEnum.SUCCESS]: 'green',
    };
    return colorMap[this.value];
  }

  /**
   * Get icon name for UI (common icon libraries)
   */
  getIconName(): string {
    const iconMap: Record<SeverityEnum, string> = {
      [SeverityEnum.INFO]: 'info-circle',
      [SeverityEnum.WARNING]: 'exclamation-triangle',
      [SeverityEnum.ERROR]: 'times-circle',
      [SeverityEnum.SUCCESS]: 'check-circle',
    };
    return iconMap[this.value];
  }

  equals(other: Severity): boolean {
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
 * Check if a string is a valid severity
 */
export function isValidSeverity(value: string): value is SeverityEnum {
  return Object.values(SeverityEnum).includes(value as SeverityEnum);
}

/**
 * Map Prisma enum to domain Severity
 */
export function mapSeverityFromPrisma(prismaSeverity: string): Severity {
  if (isValidSeverity(prismaSeverity)) {
    return Severity.create(prismaSeverity);
  }
  return Severity.info();
}

/**
 * Map domain Severity to Prisma enum value
 */
export function mapSeverityToPrisma(severity: Severity): string {
  return severity.getValue();
}

/**
 * Compare two severities by importance
 * @returns negative if a < b, 0 if equal, positive if a > b
 */
export function compareSeverities(a: Severity, b: Severity): number {
  return a.getImportance() - b.getImportance();
}
