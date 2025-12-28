// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthDomainService } from './auth.service';
import { AuthRoleService } from '../core/application/auth/role.service';
import { Auth0Module } from '../infrastructure/persistence/auth0/auth0.module';
import { AuthRepository } from '../infrastructure/persistence/auth/auth.repository.impl';
import { ROLE_PROVIDER } from './role.provider';
import { Auth0RoleProvider } from '../infrastructure/persistence/auth0/auth0-role.provider';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), Auth0Module],
  providers: [
    JwtStrategy,
    AuthDomainService,
    AuthRoleService,
    { provide: 'IAuthRepository', useClass: AuthRepository },
    { provide: ROLE_PROVIDER, useClass: Auth0RoleProvider },
  ],
  exports: [AuthDomainService, AuthRoleService],
})
export class AuthModule {}
