// src/infrastructure/auth0/auth0.module.ts
import { Module } from '@nestjs/common';
import { Auth0Service } from './auth0.service';

@Module({
  providers: [Auth0Service],
  exports: [Auth0Service], // <-- export it so other modules can inject
})
export class Auth0Module {}
