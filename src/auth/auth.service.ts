// src/core/domain/auth/auth.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Auth } from './auth.entity';
import { Tokens } from './tokens.vo';
import { type IAuthRepository } from './auth.repository';
import * as crypto from 'crypto';

@Injectable()
export class AuthDomainService {
  constructor(
    @Inject('IAuthRepository') private readonly authRepo: IAuthRepository,
  ) {}

  async loginWithAuth0(
    externalId: string,
    email: string,
    roles: string[],
  ): Promise<Auth> {
    let user = await this.authRepo.findByExternalId(externalId);

    if (!user) {
      user = new Auth(crypto.randomUUID(), externalId, email, roles);
      await this.authRepo.save(user);
    }

    return user;
  }

  async attachTokens(
    auth: Auth,
    tokens: Tokens,
  ): Promise<{ auth: Auth; tokens: Tokens }> {
    // optional: persist refresh tokens
    return { auth, tokens };
  }
}
