// src/core/domain/sla/value-objects/sla-status.vo.ts

/**
 * SLA Status Value Object
 * Represents the current health status of an SLA
 */
export enum SLAStatus {
    ON_TRACK = 'on_track',
    AT_RISK = 'at_risk',
    BREACHED = 'breached',
}

/**
 * Check if a string is a valid SLA status
 */
export function isValidSLAStatus(value: string): value is SLAStatus {
    return Object.values(SLAStatus).includes(value as SLAStatus);
}

/**
 * Map SLA status to Prisma enum value
 */
export function mapSLAStatusToPrisma(status: SLAStatus): string {
    return status;
}

/**
 * Map Prisma enum value to domain SLA status
 */
export function mapSLAStatusFromPrisma(prismaStatus: string): SLAStatus {
    if (isValidSLAStatus(prismaStatus)) {
        return prismaStatus;
    }
    return SLAStatus.ON_TRACK;
}

/**
 * SLA Status severity levels for sorting/prioritization
 */
export const SLA_STATUS_SEVERITY: Record<SLAStatus, number> = {
    [SLAStatus.ON_TRACK]: 0,
    [SLAStatus.AT_RISK]: 1,
    [SLAStatus.BREACHED]: 2,
};

/**
 * Get the most severe status from multiple statuses
 */
export function getMostSevereStatus(statuses: SLAStatus[]): SLAStatus {
    if (statuses.length === 0) return SLAStatus.ON_TRACK;

    return statuses.reduce((worst, current) =>
        SLA_STATUS_SEVERITY[current] > SLA_STATUS_SEVERITY[worst] ? current : worst
    );
}
