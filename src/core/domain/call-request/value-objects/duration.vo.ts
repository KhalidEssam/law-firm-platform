// src/core/domain/call-request/value-objects/duration.vo.ts

/**
 * Duration Value Object
 * Represents a time duration in minutes with validation and formatting
 */
export class Duration {
    private constructor(
        public readonly minutes: number,
    ) {
        if (minutes < 0) {
            throw new Error('Duration cannot be negative');
        }
    }

    /**
     * Create a new Duration from minutes
     */
    static fromMinutes(minutes: number): Duration {
        return new Duration(Math.floor(minutes));
    }

    /**
     * Create a new Duration from hours
     */
    static fromHours(hours: number): Duration {
        return new Duration(Math.floor(hours * 60));
    }

    /**
     * Create a Duration from start and end times
     */
    static fromTimeRange(startTime: Date, endTime: Date): Duration {
        const diffMs = endTime.getTime() - startTime.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return new Duration(Math.max(0, diffMinutes));
    }

    /**
     * Create zero duration
     */
    static zero(): Duration {
        return new Duration(0);
    }

    /**
     * Get duration in hours (decimal)
     */
    toHours(): number {
        return this.minutes / 60;
    }

    /**
     * Get duration in seconds
     */
    toSeconds(): number {
        return this.minutes * 60;
    }

    /**
     * Get formatted duration string (e.g., "1h 30m")
     */
    format(): string {
        const hours = Math.floor(this.minutes / 60);
        const mins = this.minutes % 60;

        if (hours === 0) {
            return `${mins}m`;
        }
        if (mins === 0) {
            return `${hours}h`;
        }
        return `${hours}h ${mins}m`;
    }

    /**
     * Get formatted duration string in HH:MM format
     */
    formatHHMM(): string {
        const hours = Math.floor(this.minutes / 60);
        const mins = this.minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Add another duration
     */
    add(other: Duration): Duration {
        return new Duration(this.minutes + other.minutes);
    }

    /**
     * Subtract another duration
     */
    subtract(other: Duration): Duration {
        return new Duration(Math.max(0, this.minutes - other.minutes));
    }

    /**
     * Check if duration is zero
     */
    isZero(): boolean {
        return this.minutes === 0;
    }

    /**
     * Check if duration is greater than another
     */
    isGreaterThan(other: Duration): boolean {
        return this.minutes > other.minutes;
    }

    /**
     * Check if duration is less than another
     */
    isLessThan(other: Duration): boolean {
        return this.minutes < other.minutes;
    }

    /**
     * Check if duration exceeds a limit
     */
    exceedsLimit(limitMinutes: number): boolean {
        return this.minutes > limitMinutes;
    }

    /**
     * Check equality with another Duration
     */
    equals(other: Duration): boolean {
        return this.minutes === other.minutes;
    }

    /**
     * Get billable units (rounded up to nearest billing unit, default 15 mins)
     */
    getBillableUnits(unitMinutes: number = 15): number {
        return Math.ceil(this.minutes / unitMinutes);
    }
}

/**
 * Standard call duration presets
 */
export const CALL_DURATION_PRESETS = {
    QUICK: Duration.fromMinutes(15),
    SHORT: Duration.fromMinutes(30),
    STANDARD: Duration.fromMinutes(45),
    LONG: Duration.fromMinutes(60),
    EXTENDED: Duration.fromMinutes(90),
} as const;

/**
 * Maximum allowed call duration (2 hours)
 */
export const MAX_CALL_DURATION = Duration.fromMinutes(120);

/**
 * Minimum call duration for billing (15 minutes)
 */
export const MIN_BILLABLE_DURATION = Duration.fromMinutes(15);
