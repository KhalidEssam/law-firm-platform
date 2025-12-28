// src/core/domain/sla/value-objects/sla-times.vo.ts

import { Priority, getAdjustedTimeForPriority } from './priority.vo';

/**
 * SLA Times Value Object
 * Immutable object representing SLA time thresholds in minutes
 */
export interface SLATimesData {
  responseTime: number; // Minutes to first response
  resolutionTime: number; // Minutes to resolution
  escalationTime?: number; // Minutes before escalation (optional)
}

export class SLATimes {
  private constructor(
    public readonly responseTime: number,
    public readonly resolutionTime: number,
    public readonly escalationTime: number | null,
  ) {
    this.validate();
  }

  /**
   * Create SLA times from data
   */
  static create(data: SLATimesData): SLATimes {
    return new SLATimes(
      data.responseTime,
      data.resolutionTime,
      data.escalationTime ?? null,
    );
  }

  /**
   * Validate the SLA times
   */
  private validate(): void {
    if (this.responseTime <= 0) {
      throw new Error('Response time must be positive');
    }
    if (this.resolutionTime <= 0) {
      throw new Error('Resolution time must be positive');
    }
    if (this.resolutionTime < this.responseTime) {
      throw new Error(
        'Resolution time must be greater than or equal to response time',
      );
    }
    if (this.escalationTime !== null && this.escalationTime <= 0) {
      throw new Error('Escalation time must be positive');
    }
    if (
      this.escalationTime !== null &&
      this.escalationTime >= this.resolutionTime
    ) {
      throw new Error('Escalation time must be less than resolution time');
    }
  }

  /**
   * Get times adjusted for priority
   */
  adjustForPriority(priority: Priority): SLATimes {
    return new SLATimes(
      getAdjustedTimeForPriority(this.responseTime, priority),
      getAdjustedTimeForPriority(this.resolutionTime, priority),
      this.escalationTime
        ? getAdjustedTimeForPriority(this.escalationTime, priority)
        : null,
    );
  }

  /**
   * Convert to hours for display
   */
  toHours(): {
    responseHours: number;
    resolutionHours: number;
    escalationHours: number | null;
  } {
    return {
      responseHours: Math.round((this.responseTime / 60) * 10) / 10,
      resolutionHours: Math.round((this.resolutionTime / 60) * 10) / 10,
      escalationHours: this.escalationTime
        ? Math.round((this.escalationTime / 60) * 10) / 10
        : null,
    };
  }

  /**
   * Convert to days for display
   */
  toDays(): {
    responseDays: number;
    resolutionDays: number;
    escalationDays: number | null;
  } {
    return {
      responseDays: Math.round((this.responseTime / 1440) * 10) / 10,
      resolutionDays: Math.round((this.resolutionTime / 1440) * 10) / 10,
      escalationDays: this.escalationTime
        ? Math.round((this.escalationTime / 1440) * 10) / 10
        : null,
    };
  }

  /**
   * Get human-readable time string
   */
  static formatMinutes(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    if (minutes < 1440) {
      const hours = Math.round((minutes / 60) * 10) / 10;
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.round((minutes / 1440) * 10) / 10;
    return `${days} day${days !== 1 ? 's' : ''}`;
  }

  /**
   * Serialize to plain object
   */
  toJSON(): SLATimesData {
    return {
      responseTime: this.responseTime,
      resolutionTime: this.resolutionTime,
      escalationTime: this.escalationTime ?? undefined,
    };
  }

  /**
   * Check equality
   */
  equals(other: SLATimes): boolean {
    return (
      this.responseTime === other.responseTime &&
      this.resolutionTime === other.resolutionTime &&
      this.escalationTime === other.escalationTime
    );
  }
}
