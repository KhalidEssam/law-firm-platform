// src/infrastructure/modules/sla.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaSLAPolicyRepository } from '../persistence/sla/prisma-sla-policy.repository';
import { SLAController } from '../../interface/http/sla.controller';
import { NotificationModule } from '../../interface/notification/notification.module';

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

// Integration Services
import { SLAIntegrationService } from '../../core/application/sla/services/sla-integration.service';
import { SLASchedulerService } from '../../core/application/sla/services/sla-scheduler.service';

@Module({
    imports: [
        forwardRef(() => NotificationModule), // For SLA breach notifications
    ],
    controllers: [SLAController],
    providers: [
        // Infrastructure
        PrismaService,
        { provide: 'ISLAPolicyRepository', useClass: PrismaSLAPolicyRepository },

        // Integration Services
        SLAIntegrationService,
        SLASchedulerService,

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
        // Repository
        'ISLAPolicyRepository',

        // Integration Services (for other modules to use)
        SLAIntegrationService,
        SLASchedulerService,

        // Use Cases
        GetSLAPolicyByTypeUseCase,
        CalculateSLADeadlinesUseCase,
        CheckSLAStatusUseCase,
        CheckSLABreachesUseCase,
        BatchCheckSLAStatusUseCase,
        SortByUrgencyUseCase,
    ],
})
export class SLAModule {}
