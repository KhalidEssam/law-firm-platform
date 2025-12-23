import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
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
import { BillingModule } from './infrastructure/modules/billing.module';
import { AdminRolesModule } from './infrastructure/modules/admin-roles.module';
import { SupportTicketModule } from './infrastructure/modules/support-ticket.module';
import { NotificationModule } from './interface/notification/notification.module';
import { CallRequestModule } from './infrastructure/modules/call-request.module';
import { RoutingModule } from './infrastructure/modules/routing.module';
import { ReportsModule } from './infrastructure/modules/reports.module';
import { SLAModule } from './infrastructure/modules/sla.module';
import { SpecializationModule } from './infrastructure/modules/specialization.module';
import { DocumentModule } from './infrastructure/modules/document.module';

@Module({
  imports: [
    // Scheduling for cron jobs (SLA checks, etc.)
    ScheduleModule.forRoot(),
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
    PaymentMethodModule,
    BillingModule,
    AdminRolesModule,
    SupportTicketModule,
    NotificationModule,
    CallRequestModule,
    RoutingModule,
    ReportsModule,
    SLAModule,
    SpecializationModule,
    DocumentModule,
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