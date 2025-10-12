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
    UserModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],

})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // applies to all routes
  }
}