// ============================================
// AUDIT MODULE
// src/infrastructure/modules/audit.module.ts
// ============================================

import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaAuditLogRepository } from '../persistence/audit/prisma-audit-log.repository';
import {
  AuditLoggingService,
  AUDIT_LOGGING_SERVICE,
} from '../../core/application/audit/audit-logging.service';
import { AUDIT_LOG_REPOSITORY } from '../../core/domain/audit';

/**
 * AuditModule
 *
 * Global module providing audit logging capabilities across the application.
 * Being global means it only needs to be imported once in AppModule.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    // Repository
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository,
    },
    // Service
    {
      provide: AUDIT_LOGGING_SERVICE,
      useClass: AuditLoggingService,
    },
    // Also provide AuditLoggingService directly for convenience
    AuditLoggingService,
  ],
  exports: [AUDIT_LOG_REPOSITORY, AUDIT_LOGGING_SERVICE, AuditLoggingService],
})
export class AuditModule {}
