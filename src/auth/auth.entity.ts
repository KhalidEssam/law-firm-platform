// src/core/domain/auth/auth.entity.ts
export class Auth {
  constructor(
    public readonly userId: string,     // internal User ID (Postgres)
    public readonly externalId: string, // Auth0 user ID (sub)
    public readonly email: string,
    public readonly roles: string[],    // mapped from Auth0 RBAC
  ) {}
}
