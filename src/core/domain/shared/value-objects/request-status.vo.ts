// ============================================
// REQUEST STATUS VALUE OBJECT
// src/core/domain/shared/value-objects/request-status.vo.ts
// ============================================
// This is the unified RequestStatus that matches the Prisma schema.
// It provides mappers to/from domain-specific status enums.
// ============================================

/**
 * RequestStatus enum matching Prisma schema exactly
 * This is the unified status used across all request types in the database
 */
export enum RequestStatusEnum {
    PENDING = 'pending',
    ASSIGNED = 'assigned',
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    QUOTE_SENT = 'quote_sent',
    QUOTE_ACCEPTED = 'quote_accepted',
    COMPLETED = 'completed',
    DISPUTED = 'disputed',
    CANCELLED = 'cancelled',
    CLOSED = 'closed',
    NO_SHOW = 'no_show',
    RESCHEDULED = 'rescheduled',
}

/**
 * RequestStatus Value Object
 * Unified status type matching the Prisma schema
 */
export class RequestStatus {
    private static readonly validStatuses = Object.values(RequestStatusEnum);

    private constructor(private readonly value: RequestStatusEnum) {}

    static create(value: string): RequestStatus {
        const normalizedValue = value.toLowerCase() as RequestStatusEnum;
        if (!RequestStatus.validStatuses.includes(normalizedValue)) {
            throw new Error(
                `Invalid request status: ${value}. Must be one of: ${RequestStatus.validStatuses.join(', ')}`
            );
        }
        return new RequestStatus(normalizedValue);
    }

    // Factory methods for each status
    static pending(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.PENDING);
    }

    static assigned(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.ASSIGNED);
    }

    static scheduled(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.SCHEDULED);
    }

    static inProgress(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.IN_PROGRESS);
    }

    static quoteSent(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.QUOTE_SENT);
    }

    static quoteAccepted(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.QUOTE_ACCEPTED);
    }

    static completed(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.COMPLETED);
    }

    static disputed(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.DISPUTED);
    }

    static cancelled(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.CANCELLED);
    }

    static closed(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.CLOSED);
    }

    static noShow(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.NO_SHOW);
    }

    static rescheduled(): RequestStatus {
        return new RequestStatus(RequestStatusEnum.RESCHEDULED);
    }

    getValue(): RequestStatusEnum {
        return this.value;
    }

    // State query methods
    isPending(): boolean {
        return this.value === RequestStatusEnum.PENDING;
    }

    isAssigned(): boolean {
        return this.value === RequestStatusEnum.ASSIGNED;
    }

    isScheduled(): boolean {
        return this.value === RequestStatusEnum.SCHEDULED;
    }

    isInProgress(): boolean {
        return this.value === RequestStatusEnum.IN_PROGRESS;
    }

    isQuoteSent(): boolean {
        return this.value === RequestStatusEnum.QUOTE_SENT;
    }

    isQuoteAccepted(): boolean {
        return this.value === RequestStatusEnum.QUOTE_ACCEPTED;
    }

    isCompleted(): boolean {
        return this.value === RequestStatusEnum.COMPLETED;
    }

    isDisputed(): boolean {
        return this.value === RequestStatusEnum.DISPUTED;
    }

    isCancelled(): boolean {
        return this.value === RequestStatusEnum.CANCELLED;
    }

    isClosed(): boolean {
        return this.value === RequestStatusEnum.CLOSED;
    }

    isNoShow(): boolean {
        return this.value === RequestStatusEnum.NO_SHOW;
    }

    isRescheduled(): boolean {
        return this.value === RequestStatusEnum.RESCHEDULED;
    }

    // Business rule methods
    isActive(): boolean {
        return [
            RequestStatusEnum.PENDING,
            RequestStatusEnum.ASSIGNED,
            RequestStatusEnum.SCHEDULED,
            RequestStatusEnum.IN_PROGRESS,
            RequestStatusEnum.QUOTE_SENT,
            RequestStatusEnum.QUOTE_ACCEPTED,
            RequestStatusEnum.RESCHEDULED,
        ].includes(this.value);
    }

    isTerminal(): boolean {
        return [
            RequestStatusEnum.COMPLETED,
            RequestStatusEnum.CANCELLED,
            RequestStatusEnum.CLOSED,
        ].includes(this.value);
    }

    requiresAction(): boolean {
        return [
            RequestStatusEnum.PENDING,
            RequestStatusEnum.QUOTE_SENT,
            RequestStatusEnum.NO_SHOW,
        ].includes(this.value);
    }

    canBeCancelled(): boolean {
        return ![
            RequestStatusEnum.COMPLETED,
            RequestStatusEnum.CANCELLED,
            RequestStatusEnum.CLOSED,
        ].includes(this.value);
    }

    canBeDisputed(): boolean {
        return this.value === RequestStatusEnum.COMPLETED;
    }

    /**
     * Check if this status requires SLA tracking
     */
    requiresSLATracking(): boolean {
        return [
            RequestStatusEnum.PENDING,
            RequestStatusEnum.ASSIGNED,
            RequestStatusEnum.IN_PROGRESS,
        ].includes(this.value);
    }

    equals(other: RequestStatus): boolean {
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
 * Check if a string is a valid request status
 */
export function isValidRequestStatus(value: string): value is RequestStatusEnum {
    return Object.values(RequestStatusEnum).includes(value as RequestStatusEnum);
}

// ============================================
// DOMAIN STATUS MAPPERS
// ============================================

/**
 * ConsultationStatus values (domain-specific)
 */
export enum ConsultationStatusValue {
    PENDING = 'pending',
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    AWAITING_INFO = 'awaiting_info',
    RESPONDED = 'responded',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    DISPUTED = 'disputed',
}

/**
 * CallStatus values (domain-specific)
 */
export enum CallStatusValue {
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
 * CaseStatus values (domain-specific for litigation)
 */
export enum CaseStatusValue {
    PENDING = 'pending',
    SCHEDULED = 'scheduled',
    QUOTE_SENT = 'quote_sent',
    QUOTE_ACCEPTED = 'quote_accepted',
    ACTIVE = 'active',
    CLOSED = 'closed',
    CANCELLED = 'cancelled',
}

/**
 * LegalOpinionStatus values (domain-specific)
 */
export enum LegalOpinionStatusValue {
    PENDING = 'pending',
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    QUOTE_SENT = 'quote_sent',
    QUOTE_ACCEPTED = 'quote_accepted',
    COMPLETED = 'completed',
    DISPUTED = 'disputed',
    CANCELLED = 'cancelled',
    CLOSED = 'closed',
}

// ============================================
// CONSULTATION STATUS MAPPERS
// ============================================

/**
 * Map ConsultationStatus to unified RequestStatus
 */
export function mapConsultationStatusToRequestStatus(consultationStatus: string): RequestStatusEnum {
    const mapping: Record<string, RequestStatusEnum> = {
        [ConsultationStatusValue.PENDING]: RequestStatusEnum.PENDING,
        [ConsultationStatusValue.ASSIGNED]: RequestStatusEnum.ASSIGNED,
        [ConsultationStatusValue.IN_PROGRESS]: RequestStatusEnum.IN_PROGRESS,
        [ConsultationStatusValue.AWAITING_INFO]: RequestStatusEnum.IN_PROGRESS, // Map to in_progress
        [ConsultationStatusValue.RESPONDED]: RequestStatusEnum.IN_PROGRESS,     // Map to in_progress
        [ConsultationStatusValue.COMPLETED]: RequestStatusEnum.COMPLETED,
        [ConsultationStatusValue.CANCELLED]: RequestStatusEnum.CANCELLED,
        [ConsultationStatusValue.DISPUTED]: RequestStatusEnum.DISPUTED,
    };
    return mapping[consultationStatus] || RequestStatusEnum.PENDING;
}

/**
 * Map unified RequestStatus to ConsultationStatus
 */
export function mapRequestStatusToConsultationStatus(requestStatus: RequestStatusEnum): ConsultationStatusValue {
    const mapping: Record<RequestStatusEnum, ConsultationStatusValue> = {
        [RequestStatusEnum.PENDING]: ConsultationStatusValue.PENDING,
        [RequestStatusEnum.ASSIGNED]: ConsultationStatusValue.ASSIGNED,
        [RequestStatusEnum.SCHEDULED]: ConsultationStatusValue.ASSIGNED,        // Map to assigned
        [RequestStatusEnum.IN_PROGRESS]: ConsultationStatusValue.IN_PROGRESS,
        [RequestStatusEnum.QUOTE_SENT]: ConsultationStatusValue.IN_PROGRESS,    // Consultation doesn't have quote
        [RequestStatusEnum.QUOTE_ACCEPTED]: ConsultationStatusValue.IN_PROGRESS,
        [RequestStatusEnum.COMPLETED]: ConsultationStatusValue.COMPLETED,
        [RequestStatusEnum.DISPUTED]: ConsultationStatusValue.DISPUTED,
        [RequestStatusEnum.CANCELLED]: ConsultationStatusValue.CANCELLED,
        [RequestStatusEnum.CLOSED]: ConsultationStatusValue.COMPLETED,          // Map closed to completed
        [RequestStatusEnum.NO_SHOW]: ConsultationStatusValue.CANCELLED,         // Map to cancelled
        [RequestStatusEnum.RESCHEDULED]: ConsultationStatusValue.PENDING,       // Map to pending
    };
    return mapping[requestStatus];
}

// ============================================
// CALL STATUS MAPPERS
// ============================================

/**
 * Map CallStatus to unified RequestStatus
 */
export function mapCallStatusToRequestStatus(callStatus: string): RequestStatusEnum {
    const mapping: Record<string, RequestStatusEnum> = {
        [CallStatusValue.PENDING]: RequestStatusEnum.PENDING,
        [CallStatusValue.ASSIGNED]: RequestStatusEnum.ASSIGNED,
        [CallStatusValue.SCHEDULED]: RequestStatusEnum.SCHEDULED,
        [CallStatusValue.IN_PROGRESS]: RequestStatusEnum.IN_PROGRESS,
        [CallStatusValue.COMPLETED]: RequestStatusEnum.COMPLETED,
        [CallStatusValue.CANCELLED]: RequestStatusEnum.CANCELLED,
        [CallStatusValue.NO_SHOW]: RequestStatusEnum.NO_SHOW,
        [CallStatusValue.RESCHEDULED]: RequestStatusEnum.RESCHEDULED,
    };
    return mapping[callStatus] || RequestStatusEnum.PENDING;
}

/**
 * Map unified RequestStatus to CallStatus
 */
export function mapRequestStatusToCallStatus(requestStatus: RequestStatusEnum): CallStatusValue {
    const mapping: Record<RequestStatusEnum, CallStatusValue> = {
        [RequestStatusEnum.PENDING]: CallStatusValue.PENDING,
        [RequestStatusEnum.ASSIGNED]: CallStatusValue.ASSIGNED,
        [RequestStatusEnum.SCHEDULED]: CallStatusValue.SCHEDULED,
        [RequestStatusEnum.IN_PROGRESS]: CallStatusValue.IN_PROGRESS,
        [RequestStatusEnum.QUOTE_SENT]: CallStatusValue.ASSIGNED,           // Calls don't have quotes
        [RequestStatusEnum.QUOTE_ACCEPTED]: CallStatusValue.SCHEDULED,
        [RequestStatusEnum.COMPLETED]: CallStatusValue.COMPLETED,
        [RequestStatusEnum.DISPUTED]: CallStatusValue.COMPLETED,            // Map to completed
        [RequestStatusEnum.CANCELLED]: CallStatusValue.CANCELLED,
        [RequestStatusEnum.CLOSED]: CallStatusValue.COMPLETED,              // Map to completed
        [RequestStatusEnum.NO_SHOW]: CallStatusValue.NO_SHOW,
        [RequestStatusEnum.RESCHEDULED]: CallStatusValue.RESCHEDULED,
    };
    return mapping[requestStatus];
}

// ============================================
// CASE STATUS MAPPERS
// ============================================

/**
 * Map CaseStatus to unified RequestStatus
 */
export function mapCaseStatusToRequestStatus(caseStatus: string): RequestStatusEnum {
    const mapping: Record<string, RequestStatusEnum> = {
        [CaseStatusValue.PENDING]: RequestStatusEnum.PENDING,
        [CaseStatusValue.SCHEDULED]: RequestStatusEnum.SCHEDULED,
        [CaseStatusValue.QUOTE_SENT]: RequestStatusEnum.QUOTE_SENT,
        [CaseStatusValue.QUOTE_ACCEPTED]: RequestStatusEnum.QUOTE_ACCEPTED,
        [CaseStatusValue.ACTIVE]: RequestStatusEnum.IN_PROGRESS,
        [CaseStatusValue.CLOSED]: RequestStatusEnum.CLOSED,
        [CaseStatusValue.CANCELLED]: RequestStatusEnum.CANCELLED,
    };
    return mapping[caseStatus] || RequestStatusEnum.PENDING;
}

/**
 * Map unified RequestStatus to CaseStatus
 */
export function mapRequestStatusToCaseStatus(requestStatus: RequestStatusEnum): CaseStatusValue {
    const mapping: Record<RequestStatusEnum, CaseStatusValue> = {
        [RequestStatusEnum.PENDING]: CaseStatusValue.PENDING,
        [RequestStatusEnum.ASSIGNED]: CaseStatusValue.PENDING,
        [RequestStatusEnum.SCHEDULED]: CaseStatusValue.SCHEDULED,
        [RequestStatusEnum.IN_PROGRESS]: CaseStatusValue.ACTIVE,
        [RequestStatusEnum.QUOTE_SENT]: CaseStatusValue.QUOTE_SENT,
        [RequestStatusEnum.QUOTE_ACCEPTED]: CaseStatusValue.QUOTE_ACCEPTED,
        [RequestStatusEnum.COMPLETED]: CaseStatusValue.CLOSED,
        [RequestStatusEnum.DISPUTED]: CaseStatusValue.ACTIVE,               // Map to active
        [RequestStatusEnum.CANCELLED]: CaseStatusValue.CANCELLED,
        [RequestStatusEnum.CLOSED]: CaseStatusValue.CLOSED,
        [RequestStatusEnum.NO_SHOW]: CaseStatusValue.PENDING,               // Map to pending
        [RequestStatusEnum.RESCHEDULED]: CaseStatusValue.PENDING,           // Map to pending
    };
    return mapping[requestStatus];
}

// ============================================
// LEGAL OPINION STATUS MAPPERS
// ============================================

/**
 * Map LegalOpinionStatus to unified RequestStatus
 */
export function mapLegalOpinionStatusToRequestStatus(opinionStatus: string): RequestStatusEnum {
    const mapping: Record<string, RequestStatusEnum> = {
        [LegalOpinionStatusValue.PENDING]: RequestStatusEnum.PENDING,
        [LegalOpinionStatusValue.ASSIGNED]: RequestStatusEnum.ASSIGNED,
        [LegalOpinionStatusValue.IN_PROGRESS]: RequestStatusEnum.IN_PROGRESS,
        [LegalOpinionStatusValue.QUOTE_SENT]: RequestStatusEnum.QUOTE_SENT,
        [LegalOpinionStatusValue.QUOTE_ACCEPTED]: RequestStatusEnum.QUOTE_ACCEPTED,
        [LegalOpinionStatusValue.COMPLETED]: RequestStatusEnum.COMPLETED,
        [LegalOpinionStatusValue.DISPUTED]: RequestStatusEnum.DISPUTED,
        [LegalOpinionStatusValue.CANCELLED]: RequestStatusEnum.CANCELLED,
        [LegalOpinionStatusValue.CLOSED]: RequestStatusEnum.CLOSED,
    };
    return mapping[opinionStatus] || RequestStatusEnum.PENDING;
}

/**
 * Map unified RequestStatus to LegalOpinionStatus
 */
export function mapRequestStatusToLegalOpinionStatus(requestStatus: RequestStatusEnum): LegalOpinionStatusValue {
    const mapping: Record<RequestStatusEnum, LegalOpinionStatusValue> = {
        [RequestStatusEnum.PENDING]: LegalOpinionStatusValue.PENDING,
        [RequestStatusEnum.ASSIGNED]: LegalOpinionStatusValue.ASSIGNED,
        [RequestStatusEnum.SCHEDULED]: LegalOpinionStatusValue.ASSIGNED,
        [RequestStatusEnum.IN_PROGRESS]: LegalOpinionStatusValue.IN_PROGRESS,
        [RequestStatusEnum.QUOTE_SENT]: LegalOpinionStatusValue.QUOTE_SENT,
        [RequestStatusEnum.QUOTE_ACCEPTED]: LegalOpinionStatusValue.QUOTE_ACCEPTED,
        [RequestStatusEnum.COMPLETED]: LegalOpinionStatusValue.COMPLETED,
        [RequestStatusEnum.DISPUTED]: LegalOpinionStatusValue.DISPUTED,
        [RequestStatusEnum.CANCELLED]: LegalOpinionStatusValue.CANCELLED,
        [RequestStatusEnum.CLOSED]: LegalOpinionStatusValue.CLOSED,
        [RequestStatusEnum.NO_SHOW]: LegalOpinionStatusValue.CANCELLED,
        [RequestStatusEnum.RESCHEDULED]: LegalOpinionStatusValue.PENDING,
    };
    return mapping[requestStatus];
}
