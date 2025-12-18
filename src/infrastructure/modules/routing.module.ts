// src/infrastructure/modules/routing.module.ts

import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaRoutingRuleRepository } from '../persistence/routing/prisma-routing-rule.repository';
import { ROUTING_RULE_REPOSITORY } from '../../core/application/routing/ports/routing-rule.repository';
import {
    CreateRoutingRuleUseCase,
    UpdateRoutingRuleUseCase,
    DeleteRoutingRuleUseCase,
    GetRoutingRuleByIdUseCase,
    GetRoutingRulesUseCase,
    FindApplicableRuleUseCase,
    TestRoutingRuleUseCase,
    ToggleRoutingRuleActiveUseCase,
    AutoAssignRequestUseCase,
    ReassignRequestUseCase,
    GetProviderWorkloadUseCase,
    GetRoutingStatsUseCase,
} from '../../core/application/routing/use-cases';
import { RoutingIntegrationService } from '../../core/application/routing/services/routing-integration.service';
import { RoutingController } from '../../interface/http/routing.controller';

@Module({
    controllers: [RoutingController],
    providers: [
        PrismaService,
        // Repository
        {
            provide: ROUTING_RULE_REPOSITORY,
            useClass: PrismaRoutingRuleRepository,
        },
        // Use Cases - CRUD
        CreateRoutingRuleUseCase,
        UpdateRoutingRuleUseCase,
        DeleteRoutingRuleUseCase,
        GetRoutingRuleByIdUseCase,
        GetRoutingRulesUseCase,
        FindApplicableRuleUseCase,
        TestRoutingRuleUseCase,
        ToggleRoutingRuleActiveUseCase,
        // Use Cases - Auto Assignment
        AutoAssignRequestUseCase,
        ReassignRequestUseCase,
        GetProviderWorkloadUseCase,
        GetRoutingStatsUseCase,
        // Integration Service
        RoutingIntegrationService,
    ],
    exports: [
        ROUTING_RULE_REPOSITORY,
        CreateRoutingRuleUseCase,
        UpdateRoutingRuleUseCase,
        DeleteRoutingRuleUseCase,
        GetRoutingRuleByIdUseCase,
        GetRoutingRulesUseCase,
        FindApplicableRuleUseCase,
        TestRoutingRuleUseCase,
        ToggleRoutingRuleActiveUseCase,
        AutoAssignRequestUseCase,
        ReassignRequestUseCase,
        GetProviderWorkloadUseCase,
        GetRoutingStatsUseCase,
        RoutingIntegrationService,
    ],
})
export class RoutingModule {}
