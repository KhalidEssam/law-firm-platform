// src/core/domain/auth/auth.repository.ts
import { Auth } from './auth.entity';

export interface IAuthRepository {
  save(auth: Auth): Promise<void>;
  findByExternalId(externalId: string): Promise<Auth | null>;
}
