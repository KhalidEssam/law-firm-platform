// src/core/domain/sla/value-objects/priority.vo.ts

/**
 * Priority Value Object
 * Represents the urgency level of a request
 */
export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Check if a string is a valid priority
 */
export function isValidPriority(value: string): value is Priority {
  return Object.values(Priority).includes(value as Priority);
}

/**
 * Map priority to Prisma enum value
 */
export function mapPriorityToPrisma(priority: Priority): string {
  return priority;
}

/**
 * Map Prisma enum value to domain priority
 */
export function mapPriorityFromPrisma(prismaPriority: string): Priority {
  if (isValidPriority(prismaPriority)) {
    return prismaPriority;
  }
  return Priority.NORMAL;
}

/**
 * Priority multipliers for SLA time calculations
 * Lower priority = longer response times allowed
 * Higher priority = shorter response times required
 */
export const PRIORITY_MULTIPLIERS: Record<Priority, number> = {
  [Priority.LOW]: 1.5, // 50% more time allowed
  [Priority.NORMAL]: 1.0, // Base time
  [Priority.HIGH]: 0.75, // 25% less time
  [Priority.URGENT]: 0.5, // 50% less time (fastest)
};

/**
 * Get adjusted time based on priority
 * @param baseMinutes Base time in minutes
 * @param priority Priority level
 * @returns Adjusted time in minutes
 */
export function getAdjustedTimeForPriority(
  baseMinutes: number,
  priority: Priority,
): number {
  return Math.round(baseMinutes * PRIORITY_MULTIPLIERS[priority]);
}

/**
 * Priority severity for sorting
 */
export const PRIORITY_SEVERITY: Record<Priority, number> = {
  [Priority.LOW]: 0,
  [Priority.NORMAL]: 1,
  [Priority.HIGH]: 2,
  [Priority.URGENT]: 3,
};

/**
 * Sort priorities by severity (highest first)
 */
export function sortByPrioritySeverity(a: Priority, b: Priority): number {
  return PRIORITY_SEVERITY[b] - PRIORITY_SEVERITY[a];
}
