// src/core/domain/auth/tokens.vo.ts
export class Tokens {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken?: string,
    public readonly expiresIn?: number,
  ) {}
}
