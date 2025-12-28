// src/core/domain/membership/value-objects/quota-resource.vo.ts

/**
 * Represents all quota-measured resources for a membership tier.
 * Each key corresponds to a quota field defined in MembershipTier and MembershipQuotaUsage.
 */
export enum QuotaResource {
  CONSULTATIONS = 'consultationsPerMonth',
  OPINIONS = 'opinionsPerMonth',
  SERVICES = 'servicesPerMonth',
  CASES = 'casesPerMonth',
  CALL_MINUTES = 'callMinutesPerMonth',
}

/**
 * Utility type for storing numeric limits/usage per resource.
 */
export type QuotaRecord = Record<QuotaResource, number>;

/**
 * Returns true if a given string or enum value is a valid QuotaResource.
 */
export function isQuotaResource(value: string): value is QuotaResource {
  return Object.values(QuotaResource).includes(value as QuotaResource);
}

/**
 * Returns all quota resource keys.
 */
export function getAllQuotaResources(): QuotaResource[] {
  return Object.values(QuotaResource);
}
