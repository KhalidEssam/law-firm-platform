// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            secretOrKeyProvider: jwksRsa.passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksUri: `${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`, // ✅ fixed slash
            }),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            audience: process.env.AUTH0_AUDIENCE,
            issuer: `${process.env.AUTH0_DOMAIN}/`,
            algorithms: ['RS256'],

        });
        console.log('[JwtStrategy] initialized');
    }

    async validate(payload: any) {
        console.log('[JwtStrategy] Payload:', payload);
        return {
            sub: payload.sub,
            email: payload.email,
            roles: payload['https://exoln.com/roles'] || [],
            permissions: payload.permissions || []
        };
    }

}
