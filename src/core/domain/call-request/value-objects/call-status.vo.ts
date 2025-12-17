// src/core/domain/call-request/value-objects/call-status.vo.ts

/**
 * CallStatus Value Object
 * Represents the lifecycle states of a call request
 */
export enum CallStatus {
    PENDING = 'pending',
    ASSIGNED = 'assigned',
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
    RESCHEDULED = 'rescheduled',
}

/**
 * Status transition rules for call requests
 */
export const CALL_STATUS_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
    [CallStatus.PENDING]: [CallStatus.ASSIGNED, CallStatus.CANCELLED],
    [CallStatus.ASSIGNED]: [CallStatus.SCHEDULED, CallStatus.CANCELLED],
    [CallStatus.SCHEDULED]: [CallStatus.IN_PROGRESS, CallStatus.CANCELLED, CallStatus.RESCHEDULED, CallStatus.NO_SHOW],
    [CallStatus.IN_PROGRESS]: [CallStatus.COMPLETED],
    [CallStatus.COMPLETED]: [],
    [CallStatus.CANCELLED]: [],
    [CallStatus.NO_SHOW]: [CallStatus.RESCHEDULED],
    [CallStatus.RESCHEDULED]: [CallStatus.SCHEDULED, CallStatus.CANCELLED],
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(from: CallStatus, to: CallStatus): boolean {
    return CALL_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all possible next statuses from current status
 */
export function getNextPossibleStatuses(current: CallStatus): CallStatus[] {
    return CALL_STATUS_TRANSITIONS[current] || [];
}

/**
 * Check if the call is in a terminal state
 */
export function isTerminalStatus(status: CallStatus): boolean {
    return [CallStatus.COMPLETED, CallStatus.CANCELLED].includes(status);
}

/**
 * Check if the call can be modified
 */
export function canModifyCall(status: CallStatus): boolean {
    return [CallStatus.PENDING, CallStatus.ASSIGNED, CallStatus.SCHEDULED, CallStatus.RESCHEDULED].includes(status);
}

/**
 * Maps Prisma RequestStatus to domain CallStatus
 */
export function mapPrismaStatusToCallStatus(prismaStatus: string): CallStatus {
    const statusMap: Record<string, CallStatus> = {
        'pending': CallStatus.PENDING,
        'assigned': CallStatus.ASSIGNED,
        'in_progress': CallStatus.IN_PROGRESS,
        'completed': CallStatus.COMPLETED,
        'cancelled': CallStatus.CANCELLED,
    };
    return statusMap[prismaStatus] || CallStatus.PENDING;
}

/**
 * Maps domain CallStatus to Prisma RequestStatus
 */
export function mapCallStatusToPrisma(status: CallStatus): string {
    const statusMap: Record<CallStatus, string> = {
        [CallStatus.PENDING]: 'pending',
        [CallStatus.ASSIGNED]: 'assigned',
        [CallStatus.SCHEDULED]: 'assigned', // Prisma doesn't have 'scheduled', map to assigned
        [CallStatus.IN_PROGRESS]: 'in_progress',
        [CallStatus.COMPLETED]: 'completed',
        [CallStatus.CANCELLED]: 'cancelled',
        [CallStatus.NO_SHOW]: 'cancelled',
        [CallStatus.RESCHEDULED]: 'assigned',
    };
    return statusMap[status];
}
