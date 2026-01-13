// auth/jwt.strategy.ts
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import {
  JwtPayload,
  AuthenticatedUser,
} from './types/authenticated-user.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    super({
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: `${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    });
    this.logger.log('JwtStrategy initialized');
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);
    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload['https://exoln.com/roles'] ?? [],
      permissions: payload.permissions ?? [],
    };
  }
}
