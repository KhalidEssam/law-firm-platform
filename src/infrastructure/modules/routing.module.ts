// src/infrastructure/modules/routing.module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaRoutingRuleRepository } from '../persistence/routing/prisma-routing-rule.repository';
import { PrismaRoutingDataProvider } from '../persistence/routing/prisma-routing-data-provider';
import { ROUTING_RULE_REPOSITORY } from '../../core/application/routing/ports/routing-rule.repository';
import { ROUTING_DATA_PROVIDER } from '../../core/application/routing/ports/routing-data-provider';
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
  imports: [PrismaModule],
  controllers: [RoutingController],
  providers: [
    // Repository
    {
      provide: ROUTING_RULE_REPOSITORY,
      useClass: PrismaRoutingRuleRepository,
    },
    // Data Provider
    {
      provide: ROUTING_DATA_PROVIDER,
      useClass: PrismaRoutingDataProvider,
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
    ROUTING_DATA_PROVIDER,
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
