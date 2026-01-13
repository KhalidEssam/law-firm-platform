// ============================================
// AUTHENTICATED USER TYPES
// Type definitions for JWT payload and request
// ============================================

import { Request } from 'express';

/**
 * JWT payload structure returned by Auth0
 */
export interface JwtPayload {
  /** Auth0 user ID (e.g., 'auth0|123456') */
  sub: string;
  /** User's email address */
  email?: string;
  /** Custom roles claim from Auth0 */
  'https://exoln.com/roles'?: string[];
  /** Permissions from Auth0 */
  permissions?: string[];
  /** Token issued at timestamp */
  iat?: number;
  /** Token expiration timestamp */
  exp?: number;
  /** Token audience */
  aud?: string | string[];
  /** Token issuer */
  iss?: string;
}

/**
 * Authenticated user attached to request after JWT validation
 */
export interface AuthenticatedUser {
  /** Auth0 user ID */
  sub: string;
  /** User's email address */
  email?: string;
  /** User roles from Auth0 */
  roles: string[];
  /** User permissions from Auth0 */
  permissions: string[];
  /** Database user ID (populated after lookup) */
  id?: string;
  /** User's role for RBAC checks */
  role?: string;
}

/**
 * Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Type guard to check if request has authenticated user
 */
export function isAuthenticated(
  req: Request,
): req is AuthenticatedRequest {
  const reqWithUser = req as AuthenticatedRequest;
  return (
    reqWithUser.user !== undefined &&
    typeof reqWithUser.user.sub === 'string'
  );
}
