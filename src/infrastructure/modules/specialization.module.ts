// ============================================
// SPECIALIZATION MODULE
// src/infrastructure/modules/specialization.module.ts
// ============================================

import { Module, forwardRef } from '@nestjs/common';

// Prisma
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';

// Controllers
import {
  SpecializationController,
  ProviderSpecializationController,
} from '../../interface/http/specialization.controller';

// Repositories
import {
  PrismaSpecializationRepository,
  PrismaProviderSpecializationRepository,
} from '../../infrastructure/persistence/specialization/prisma.repository';

// DI Tokens
import {
  SPECIALIZATION_REPOSITORY,
  PROVIDER_SPECIALIZATION_REPOSITORY,
} from '../../core/domain/specialization/ports/specialization.repository';

// Specialization Use Cases
import {
  CreateSpecializationUseCase,
  GetSpecializationUseCase,
  UpdateSpecializationUseCase,
  DeleteSpecializationUseCase,
  ListSpecializationsUseCase,
} from '../../core/application/specialization/use-cases/specialization';

// Provider Specialization Use Cases
import {
  CreateProviderSpecializationUseCase,
  GetProviderSpecializationUseCase,
  UpdateProviderSpecializationUseCase,
  DeleteProviderSpecializationUseCase,
  ListProviderSpecializationsUseCase,
  RecordCaseResultUseCase,
} from '../../core/application/specialization/use-cases/provider-specialization';

// Integration Service
import { SpecializationIntegrationService } from '../../core/application/specialization/services/specialization-integration.service';

// Provider Module (for provider profile validation)
import { ProviderModule } from './provider.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ProviderModule)],
  controllers: [SpecializationController, ProviderSpecializationController],
  providers: [
    // ============================================
    // REPOSITORIES
    // ============================================
    {
      provide: SPECIALIZATION_REPOSITORY,
      useFactory: (prisma: PrismaService) => {
        return new PrismaSpecializationRepository(prisma);
      },
      inject: [PrismaService],
    },
    {
      provide: PROVIDER_SPECIALIZATION_REPOSITORY,
      useFactory: (prisma: PrismaService) => {
        return new PrismaProviderSpecializationRepository(prisma);
      },
      inject: [PrismaService],
    },

    // ============================================
    // SPECIALIZATION USE CASES
    // ============================================
    CreateSpecializationUseCase,
    GetSpecializationUseCase,
    UpdateSpecializationUseCase,
    DeleteSpecializationUseCase,
    ListSpecializationsUseCase,

    // ============================================
    // PROVIDER SPECIALIZATION USE CASES
    // ============================================
    CreateProviderSpecializationUseCase,
    GetProviderSpecializationUseCase,
    UpdateProviderSpecializationUseCase,
    DeleteProviderSpecializationUseCase,
    ListProviderSpecializationsUseCase,
    RecordCaseResultUseCase,

    // ============================================
    // INTEGRATION SERVICE
    // ============================================
    SpecializationIntegrationService,
  ],
  exports: [
    SPECIALIZATION_REPOSITORY,
    PROVIDER_SPECIALIZATION_REPOSITORY,
    // Export use cases for cross-module integration
    ListSpecializationsUseCase,
    ListProviderSpecializationsUseCase,
    RecordCaseResultUseCase,
    // Export integration service for routing module
    SpecializationIntegrationService,
  ],
})
export class SpecializationModule {}
