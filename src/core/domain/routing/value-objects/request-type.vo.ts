// src/core/domain/routing/value-objects/request-type.vo.ts

/**
 * RequestType Value Object
 * Represents the different types of requests that can be routed
 */
export enum RequestType {
  CONSULTATION = 'consultation',
  LEGAL_OPINION = 'legal_opinion',
  SERVICE = 'service',
  LITIGATION = 'litigation',
  CALL = 'call',
}

/**
 * Validate if a string is a valid RequestType
 */
export function isValidRequestType(value: string): value is RequestType {
  return Object.values(RequestType).includes(value as RequestType);
}

/**
 * Get human-readable name for a request type
 */
export function getRequestTypeName(type: RequestType): string {
  const names: Record<RequestType, string> = {
    [RequestType.CONSULTATION]: 'Consultation',
    [RequestType.LEGAL_OPINION]: 'Legal Opinion',
    [RequestType.SERVICE]: 'Service Request',
    [RequestType.LITIGATION]: 'Litigation Case',
    [RequestType.CALL]: 'Call Request',
  };
  return names[type];
}

/**
 * Get Arabic name for a request type
 */
export function getRequestTypeNameAr(type: RequestType): string {
  const names: Record<RequestType, string> = {
    [RequestType.CONSULTATION]: 'استشارة',
    [RequestType.LEGAL_OPINION]: 'رأي قانوني',
    [RequestType.SERVICE]: 'طلب خدمة',
    [RequestType.LITIGATION]: 'قضية',
    [RequestType.CALL]: 'مكالمة',
  };
  return names[type];
}

/**
 * Get default SLA times for each request type (in minutes)
 */
export function getDefaultSLATimes(type: RequestType): {
  response: number;
  resolution: number;
} {
  const slaTimes: Record<
    RequestType,
    { response: number; resolution: number }
  > = {
    [RequestType.CONSULTATION]: { response: 60, resolution: 2880 }, // 1 hour / 48 hours
    [RequestType.LEGAL_OPINION]: { response: 120, resolution: 10080 }, // 2 hours / 7 days
    [RequestType.SERVICE]: { response: 120, resolution: 7200 }, // 2 hours / 5 days
    [RequestType.LITIGATION]: { response: 240, resolution: 43200 }, // 4 hours / 30 days
    [RequestType.CALL]: { response: 30, resolution: 120 }, // 30 mins / 2 hours
  };
  return slaTimes[type];
}

/**
 * Maps Prisma RequestType to domain enum
 */
export function mapPrismaToRequestType(prismaType: string): RequestType {
  const typeMap: Record<string, RequestType> = {
    consultation: RequestType.CONSULTATION,
    legal_opinion: RequestType.LEGAL_OPINION,
    service: RequestType.SERVICE,
    litigation: RequestType.LITIGATION,
    call: RequestType.CALL,
  };
  return typeMap[prismaType] || RequestType.CONSULTATION;
}

/**
 * Maps domain RequestType to Prisma enum string
 */
export function mapRequestTypeToPrisma(type: RequestType): string {
  return type; // They're the same
}
