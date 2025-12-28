import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

/**
 * Rate limiting presets for different endpoint types
 */
export const RateLimitPresets = {
  /**
   * Strict rate limit for sensitive operations
   * 5 requests per minute
   * Use for: login, password reset, payment processing
   */
  STRICT: { ttl: 60000, limit: 5 },

  /**
   * Standard rate limit for normal operations
   * 30 requests per minute
   * Use for: CRUD operations, general API calls
   */
  STANDARD: { ttl: 60000, limit: 30 },

  /**
   * Relaxed rate limit for read-heavy operations
   * 100 requests per minute
   * Use for: listing, searching, public endpoints
   */
  RELAXED: { ttl: 60000, limit: 100 },

  /**
   * Bulk operations rate limit
   * 10 requests per minute
   * Use for: exports, imports, batch operations
   */
  BULK: { ttl: 60000, limit: 10 },
};

/**
 * Apply strict rate limiting (5 req/min)
 * For sensitive operations like auth, payments
 */
export function StrictRateLimit() {
  return applyDecorators(
    Throttle({ default: RateLimitPresets.STRICT }),
    SetMetadata('rateLimit', 'strict'),
  );
}

/**
 * Apply standard rate limiting (30 req/min)
 * For normal CRUD operations
 */
export function StandardRateLimit() {
  return applyDecorators(
    Throttle({ default: RateLimitPresets.STANDARD }),
    SetMetadata('rateLimit', 'standard'),
  );
}

/**
 * Apply relaxed rate limiting (100 req/min)
 * For read-heavy or public endpoints
 */
export function RelaxedRateLimit() {
  return applyDecorators(
    Throttle({ default: RateLimitPresets.RELAXED }),
    SetMetadata('rateLimit', 'relaxed'),
  );
}

/**
 * Apply bulk operations rate limiting (10 req/min)
 * For exports, imports, batch operations
 */
export function BulkRateLimit() {
  return applyDecorators(
    Throttle({ default: RateLimitPresets.BULK }),
    SetMetadata('rateLimit', 'bulk'),
  );
}

/**
 * Skip rate limiting for this endpoint
 * Use sparingly - only for health checks or internal endpoints
 */
export function NoRateLimit() {
  return applyDecorators(
    SkipThrottle(),
    SetMetadata('rateLimit', 'none'),
  );
}

/**
 * Custom rate limit with specific values
 */
export function CustomRateLimit(limit: number, ttlSeconds: number = 60) {
  return applyDecorators(
    Throttle({ default: { ttl: ttlSeconds * 1000, limit } }),
    SetMetadata('rateLimit', 'custom'),
  );
}
