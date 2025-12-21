// src/infrastructure/modules/sla.module.ts

import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaSLAPolicyRepository } from '../persistence/sla/prisma-sla-policy.repository';
import { SLAController } from '../../interface/http/sla.controller';

// Use Cases - Policy Management
import {
    CreateSLAPolicyUseCase,
    UpdateSLAPolicyUseCase,
    GetSLAPolicyUseCase,
    GetSLAPolicyByTypeUseCase,
    ListSLAPoliciesUseCase,
    DeleteSLAPolicyUseCase,
    ActivateSLAPolicyUseCase,
    DeactivateSLAPolicyUseCase,
    CalculateSLADeadlinesUseCase,
    SeedDefaultSLAPoliciesUseCase,
} from '../../core/application/sla/use-cases/sla-policy.use-cases';

// Use Cases - SLA Tracking
import {
    CheckSLAStatusUseCase,
    CheckSLABreachesUseCase,
    GetUrgencyScoreUseCase,
    BatchCheckSLAStatusUseCase,
    SortByUrgencyUseCase,
} from '../../core/application/sla/use-cases/sla-tracking.use-cases';

@Module({
    controllers: [SLAController],
    providers: [
        // Infrastructure
        PrismaService,
        { provide: 'ISLAPolicyRepository', useClass: PrismaSLAPolicyRepository },

        // Policy Management Use Cases
        CreateSLAPolicyUseCase,
        UpdateSLAPolicyUseCase,
        GetSLAPolicyUseCase,
        GetSLAPolicyByTypeUseCase,
        ListSLAPoliciesUseCase,
        DeleteSLAPolicyUseCase,
        ActivateSLAPolicyUseCase,
        DeactivateSLAPolicyUseCase,
        CalculateSLADeadlinesUseCase,
        SeedDefaultSLAPoliciesUseCase,

        // SLA Tracking Use Cases
        CheckSLAStatusUseCase,
        CheckSLABreachesUseCase,
        GetUrgencyScoreUseCase,
        BatchCheckSLAStatusUseCase,
        SortByUrgencyUseCase,
    ],
    exports: [
        'ISLAPolicyRepository',
        GetSLAPolicyByTypeUseCase,
        CalculateSLADeadlinesUseCase,
        CheckSLAStatusUseCase,
        CheckSLABreachesUseCase,
        BatchCheckSLAStatusUseCase,
        SortByUrgencyUseCase,
    ],
})
export class SLAModule {}
