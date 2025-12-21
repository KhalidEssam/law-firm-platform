// src/core/domain/sla/value-objects/request-type.vo.ts

/**
 * Request Type Value Object
 * Represents the type of service request for SLA purposes
 */
export enum RequestType {
    CONSULTATION = 'consultation',
    LEGAL_OPINION = 'legal_opinion',
    SERVICE = 'service',
    LITIGATION = 'litigation',
    CALL = 'call',
}

/**
 * Check if a string is a valid request type
 */
export function isValidRequestType(value: string): value is RequestType {
    return Object.values(RequestType).includes(value as RequestType);
}

/**
 * Map request type to Prisma enum value
 */
export function mapRequestTypeToPrisma(type: RequestType): string {
    return type;
}

/**
 * Map Prisma enum value to domain request type
 */
export function mapRequestTypeFromPrisma(prismaType: string): RequestType {
    if (isValidRequestType(prismaType)) {
        return prismaType;
    }
    return RequestType.CONSULTATION;
}

/**
 * Default SLA times per request type (in minutes)
 * These are fallback values if no policy is defined
 */
export const DEFAULT_SLA_TIMES: Record<RequestType, { response: number; resolution: number; escalation: number }> = {
    [RequestType.CONSULTATION]: {
        response: 60,       // 1 hour to respond
        resolution: 1440,   // 24 hours to resolve
        escalation: 720,    // 12 hours before escalation
    },
    [RequestType.LEGAL_OPINION]: {
        response: 120,      // 2 hours to respond
        resolution: 4320,   // 72 hours (3 days) to resolve
        escalation: 2880,   // 48 hours before escalation
    },
    [RequestType.SERVICE]: {
        response: 60,       // 1 hour to respond
        resolution: 2880,   // 48 hours to resolve
        escalation: 1440,   // 24 hours before escalation
    },
    [RequestType.LITIGATION]: {
        response: 240,      // 4 hours to respond
        resolution: 10080,  // 7 days to resolve
        escalation: 4320,   // 72 hours before escalation
    },
    [RequestType.CALL]: {
        response: 30,       // 30 minutes to respond
        resolution: 480,    // 8 hours to complete call
        escalation: 240,    // 4 hours before escalation
    },
};

/**
 * Request type display names
 */
export const REQUEST_TYPE_DISPLAY_NAMES: Record<RequestType, string> = {
    [RequestType.CONSULTATION]: 'Consultation',
    [RequestType.LEGAL_OPINION]: 'Legal Opinion',
    [RequestType.SERVICE]: 'Service Request',
    [RequestType.LITIGATION]: 'Litigation Case',
    [RequestType.CALL]: 'Call Request',
};
