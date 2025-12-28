// src/interface/http/routing.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
import {
  type CreateRoutingRuleDto,
  type UpdateRoutingRuleDto,
  FilterRoutingRulesDto,
  type TestRoutingRuleDto,
  type AutoAssignRequestDto,
  type ReassignRequestDto,
} from '../../core/application/routing/dto/routing-rule.dto';
import {
  RequestType,
  getRequestTypeName,
} from '../../core/domain/routing/value-objects/request-type.vo';
import {
  RoutingStrategy,
  getStrategyDescription,
} from '../../core/domain/routing/value-objects/routing-strategy.vo';

@Controller('admin/routing')
export class RoutingController {
  constructor(
    private readonly createRoutingRule: CreateRoutingRuleUseCase,
    private readonly updateRoutingRule: UpdateRoutingRuleUseCase,
    private readonly deleteRoutingRule: DeleteRoutingRuleUseCase,
    private readonly getRoutingRuleById: GetRoutingRuleByIdUseCase,
    private readonly getRoutingRules: GetRoutingRulesUseCase,
    private readonly findApplicableRule: FindApplicableRuleUseCase,
    private readonly testRoutingRule: TestRoutingRuleUseCase,
    private readonly toggleRoutingRuleActive: ToggleRoutingRuleActiveUseCase,
    private readonly autoAssignRequest: AutoAssignRequestUseCase,
    private readonly reassignRequest: ReassignRequestUseCase,
    private readonly getProviderWorkload: GetProviderWorkloadUseCase,
    private readonly getRoutingStats: GetRoutingStatsUseCase,
  ) {}

  // ============================================
  // ROUTING RULES CRUD
  // ============================================

  /**
   * Create a new routing rule
   */
  @Post('rules')
  async createRule(@Body() dto: CreateRoutingRuleDto) {
    const rule = await this.createRoutingRule.execute(dto);
    return {
      message: 'Routing rule created successfully',
      rule: rule.toObject(),
    };
  }

  /**
   * Get all routing rules with optional filters
   */
  @Get('rules')
  async getRules(
    @Query('requestType') requestType?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: FilterRoutingRulesDto = {
      requestType,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    const result = await this.getRoutingRules.execute(filters);
    return {
      rules: result.data.map((r) => r.toObject()),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  /**
   * Get a routing rule by ID
   */
  @Get('rules/:id')
  async getRuleById(@Param('id') id: string) {
    const rule = await this.getRoutingRuleById.execute(id);
    return {
      rule: rule.toObject(),
    };
  }

  /**
   * Update a routing rule
   */
  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() dto: UpdateRoutingRuleDto) {
    const rule = await this.updateRoutingRule.execute(id, dto);
    return {
      message: 'Routing rule updated successfully',
      rule: rule.toObject(),
    };
  }

  /**
   * Delete a routing rule
   */
  @Delete('rules/:id')
  @HttpCode(HttpStatus.OK)
  async deleteRule(@Param('id') id: string) {
    await this.deleteRoutingRule.execute(id);
    return {
      message: 'Routing rule deleted successfully',
    };
  }

  /**
   * Activate a routing rule
   */
  @Patch('rules/:id/activate')
  async activateRule(@Param('id') id: string) {
    const rule = await this.toggleRoutingRuleActive.execute(id, true);
    return {
      message: 'Routing rule activated successfully',
      rule: rule.toObject(),
    };
  }

  /**
   * Deactivate a routing rule
   */
  @Patch('rules/:id/deactivate')
  async deactivateRule(@Param('id') id: string) {
    const rule = await this.toggleRoutingRuleActive.execute(id, false);
    return {
      message: 'Routing rule deactivated successfully',
      rule: rule.toObject(),
    };
  }

  // ============================================
  // ROUTING OPERATIONS
  // ============================================

  /**
   * Test a routing rule against a sample request
   */
  @Post('rules/test')
  async testRule(@Body() dto: TestRoutingRuleDto) {
    const result = await this.testRoutingRule.execute(dto);
    return {
      matchingRule: result.matchingRule?.toObject() || null,
      evaluatedRules: result.allEvaluatedRules.map((r) => ({
        id: r.rule.id,
        name: r.rule.name,
        priority: r.rule.priority,
        strategy: r.rule.routingStrategy,
        matched: r.matched,
        reason: r.reason,
      })),
    };
  }

  /**
   * Auto-assign a request to a provider
   */
  @Post('auto-assign')
  async autoAssign(@Body() dto: AutoAssignRequestDto) {
    const result = await this.autoAssignRequest.execute(dto);
    return result;
  }

  /**
   * Reassign a request to a different provider
   */
  @Post('reassign')
  async reassign(@Body() dto: ReassignRequestDto) {
    const result = await this.reassignRequest.execute(dto);
    return result;
  }

  // ============================================
  // PROVIDER & STATS
  // ============================================

  /**
   * Get workload information for all providers
   */
  @Get('providers/workload')
  async getWorkload() {
    const workload = await this.getProviderWorkload.execute();
    return {
      providers: workload,
      total: workload.length,
    };
  }

  /**
   * Get routing statistics
   */
  @Get('stats')
  async getStats() {
    const stats = await this.getRoutingStats.execute();
    return {
      stats,
    };
  }

  // ============================================
  // REFERENCE DATA
  // ============================================

  /**
   * Get available request types
   */
  @Get('reference/request-types')
  getRequestTypes() {
    return {
      requestTypes: Object.values(RequestType).map((type) => ({
        value: type,
        label: getRequestTypeName(type),
      })),
    };
  }

  /**
   * Get available routing strategies
   */
  @Get('reference/strategies')
  getStrategies() {
    return {
      strategies: Object.values(RoutingStrategy).map((strategy) => ({
        value: strategy,
        label: strategy
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        description: getStrategyDescription(strategy),
      })),
    };
  }
}
