// ============================================
// LOG LEVEL VALUE OBJECT
// src/core/domain/shared/value-objects/log-level.vo.ts
// ============================================

/**
 * LogLevel enum matching Prisma schema
 */
export enum LogLevelEnum {
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info',
    DEBUG = 'debug',
}

/**
 * LogLevel Value Object
 * Represents the severity level of a log entry
 */
export class LogLevel {
    private static readonly validLevels = Object.values(LogLevelEnum);

    private constructor(private readonly value: LogLevelEnum) {}

    static create(value: string): LogLevel {
        const normalizedValue = value.toLowerCase() as LogLevelEnum;
        if (!LogLevel.validLevels.includes(normalizedValue)) {
            throw new Error(
                `Invalid log level: ${value}. Must be one of: ${LogLevel.validLevels.join(', ')}`
            );
        }
        return new LogLevel(normalizedValue);
    }

    static error(): LogLevel {
        return new LogLevel(LogLevelEnum.ERROR);
    }

    static warning(): LogLevel {
        return new LogLevel(LogLevelEnum.WARNING);
    }

    static info(): LogLevel {
        return new LogLevel(LogLevelEnum.INFO);
    }

    static debug(): LogLevel {
        return new LogLevel(LogLevelEnum.DEBUG);
    }

    getValue(): LogLevelEnum {
        return this.value;
    }

    // Level checks
    isError(): boolean {
        return this.value === LogLevelEnum.ERROR;
    }

    isWarning(): boolean {
        return this.value === LogLevelEnum.WARNING;
    }

    isInfo(): boolean {
        return this.value === LogLevelEnum.INFO;
    }

    isDebug(): boolean {
        return this.value === LogLevelEnum.DEBUG;
    }

    /**
     * Get numeric severity (higher = more severe)
     */
    getSeverity(): number {
        const severityMap: Record<LogLevelEnum, number> = {
            [LogLevelEnum.DEBUG]: 0,
            [LogLevelEnum.INFO]: 1,
            [LogLevelEnum.WARNING]: 2,
            [LogLevelEnum.ERROR]: 3,
        };
        return severityMap[this.value];
    }

    /**
     * Check if this level is at least as severe as another
     */
    isAtLeast(other: LogLevel): boolean {
        return this.getSeverity() >= other.getSeverity();
    }

    /**
     * Check if this level requires immediate attention
     */
    requiresAttention(): boolean {
        return [LogLevelEnum.ERROR, LogLevelEnum.WARNING].includes(this.value);
    }

    /**
     * Check if this level should trigger an alert
     */
    shouldTriggerAlert(): boolean {
        return this.value === LogLevelEnum.ERROR;
    }

    /**
     * Get display color for UI (CSS color name)
     */
    getDisplayColor(): string {
        const colorMap: Record<LogLevelEnum, string> = {
            [LogLevelEnum.ERROR]: 'red',
            [LogLevelEnum.WARNING]: 'orange',
            [LogLevelEnum.INFO]: 'blue',
            [LogLevelEnum.DEBUG]: 'gray',
        };
        return colorMap[this.value];
    }

    equals(other: LogLevel): boolean {
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
 * Check if a string is a valid log level
 */
export function isValidLogLevel(value: string): value is LogLevelEnum {
    return Object.values(LogLevelEnum).includes(value as LogLevelEnum);
}

/**
 * Map Prisma enum to domain LogLevel
 */
export function mapLogLevelFromPrisma(prismaLevel: string): LogLevel {
    if (isValidLogLevel(prismaLevel)) {
        return LogLevel.create(prismaLevel);
    }
    return LogLevel.info();
}

/**
 * Map domain LogLevel to Prisma enum value
 */
export function mapLogLevelToPrisma(level: LogLevel): string {
    return level.getValue();
}

/**
 * Compare two log levels
 * @returns negative if a < b, 0 if equal, positive if a > b
 */
export function compareLogLevels(a: LogLevel, b: LogLevel): number {
    return a.getSeverity() - b.getSeverity();
}
