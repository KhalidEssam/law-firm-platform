import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module'; // ✅ FIXED: import from src
import { UserModule } from './infrastructure/modules/user.module';

import { AuthModule } from './auth/auth.module';
import { Auth0Module } from './infrastructure/persistence/auth0/auth0.module';
import { RolesModule } from './interface/auth/roles.module';
import { MembershipModule } from './infrastructure/modules/membership.module';
import { ProviderModule } from './infrastructure/modules/provider.module';
import { ConsultationRequestModule } from './infrastructure/modules/consultation.module';
import { LegalOpinionRequestModule } from './infrastructure/modules/legal-opinion-request.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { PermissionsGuard } from './auth/permissions.guard';
import { LitigationCaseModule } from './infrastructure/modules/litigation-case.module';
import { PaymentMethodModule } from './infrastructure/modules/payment-method.module';
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
      blockDuration: 120000,
    }]),
    PrismaModule,
    AuthModule,
    Auth0Module,
    RolesModule,
    UserModule,
    MembershipModule,
    ProviderModule,
    ConsultationRequestModule,
    LegalOpinionRequestModule,
    LitigationCaseModule,
    PaymentMethodModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],

})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // applies to all routes
  }
}