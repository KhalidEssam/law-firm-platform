// src/core/application/routing/use-cases/routing-rule.use-cases.ts

import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import {
    IRoutingRuleRepository,
    ROUTING_RULE_REPOSITORY,
    PaginatedResult,
} from '../ports/routing-rule.repository';
import { RoutingRule } from '../../../domain/routing/entities/routing-rule.entity';
import { RequestType, isValidRequestType } from '../../../domain/routing/value-objects/request-type.vo';
import { RoutingStrategy, isValidRoutingStrategy } from '../../../domain/routing/value-objects/routing-strategy.vo';
import {
    CreateRoutingRuleDto,
    UpdateRoutingRuleDto,
    FilterRoutingRulesDto,
    TestRoutingRuleDto,
} from '../dto/routing-rule.dto';
import { RequestContext } from '../../../domain/routing/value-objects/routing-conditions.vo';

// ============================================
// CREATE ROUTING RULE
// ============================================

@Injectable()
export class CreateRoutingRuleUseCase {
    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
    ) {}

    async execute(dto: CreateRoutingRuleDto): Promise<RoutingRule> {
        // Validate request type
        if (!isValidRequestType(dto.requestType)) {
            throw new BadRequestException(
                `Invalid request type: ${dto.requestType}. Valid values: ${Object.values(RequestType).join(', ')}`
            );
        }

        // Validate routing strategy
        if (!isValidRoutingStrategy(dto.routingStrategy)) {
            throw new BadRequestException(
                `Invalid routing strategy: ${dto.routingStrategy}. Valid values: ${Object.values(RoutingStrategy).join(', ')}`
            );
        }

        // Check for duplicate name
        if (await this.ruleRepo.existsByName(dto.name)) {
            throw new ConflictException(`A routing rule with name "${dto.name}" already exists`);
        }

        const rule = RoutingRule.create({
            name: dto.name,
            requestType: dto.requestType as RequestType,
            routingStrategy: dto.routingStrategy as RoutingStrategy,
            conditions: dto.conditions,
            priority: dto.priority ?? 0,
            targetProviders: dto.targetProviders,
            isActive: dto.isActive ?? true,
        });

        return this.ruleRepo.create(rule);
    }
}

// ============================================
// UPDATE ROUTING RULE
// ============================================

@Injectable()
export class UpdateRoutingRuleUseCase {
    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
    ) {}

    async execute(id: string, dto: UpdateRoutingRuleDto): Promise<RoutingRule> {
        const rule = await this.ruleRepo.findById(id);
        if (!rule) {
            throw new NotFoundException(`Routing rule with ID ${id} not found`);
        }

        // Validate request type if provided
        if (dto.requestType && !isValidRequestType(dto.requestType)) {
            throw new BadRequestException(
                `Invalid request type: ${dto.requestType}. Valid values: ${Object.values(RequestType).join(', ')}`
            );
        }

        // Validate routing strategy if provided
        if (dto.routingStrategy && !isValidRoutingStrategy(dto.routingStrategy)) {
            throw new BadRequestException(
                `Invalid routing strategy: ${dto.routingStrategy}. Valid values: ${Object.values(RoutingStrategy).join(', ')}`
            );
        }

        // Check for duplicate name if changing
        if (dto.name && dto.name !== rule.name) {
            if (await this.ruleRepo.existsByName(dto.name)) {
                throw new ConflictException(`A routing rule with name "${dto.name}" already exists`);
            }
            rule.updateName(dto.name);
        }

        // Apply updates
        if (dto.requestType) {
            rule.updateRequestType(dto.requestType as RequestType);
        }

        if (dto.routingStrategy) {
            rule.updateRoutingStrategy(dto.routingStrategy as RoutingStrategy);
        }

        if (dto.conditions !== undefined) {
            rule.updateConditions(dto.conditions);
        }

        if (dto.priority !== undefined) {
            rule.updatePriority(dto.priority);
        }

        if (dto.targetProviders !== undefined) {
            rule.updateTargetProviders(dto.targetProviders);
        }

        if (dto.isActive !== undefined) {
            if (dto.isActive) {
                rule.activate();
            } else {
                rule.deactivate();
            }
        }

        return this.ruleRepo.update(rule);
    }
}

// ============================================
// DELETE ROUTING RULE
// ============================================

@Injectable()
export class DeleteRoutingRuleUseCase {
    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
    ) {}

    async execute(id: string): Promise<void> {
        const rule = await this.ruleRepo.findById(id);
        if (!rule) {
            throw new NotFoundException(`Routing rule with ID ${id} not found`);
        }

        await this.ruleRepo.delete(id);
    }
}

// ============================================
// GET ROUTING RULE BY ID
// ============================================

@Injectable()
export class GetRoutingRuleByIdUseCase {
    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
    ) {}

    async execute(id: string): Promise<RoutingRule> {
        const rule = await this.ruleRepo.findById(id);
        if (!rule) {
            throw new NotFoundException(`Routing rule with ID ${id} not found`);
        }
        return rule;
    }
}

// ============================================
// GET ROUTING RULES (LIST)
// ============================================

@Injectable()
export class GetRoutingRulesUseCase {
    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
    ) {}

    async execute(dto?: FilterRoutingRulesDto): Promise<PaginatedResult<RoutingRule>> {
        return this.ruleRepo.findAll(
            {
                requestType: dto?.requestType as RequestType,
                isActive: dto?.isActive,
                search: dto?.search,
            },
            {
                limit: dto?.limit,
                offset: dto?.offset,
            },
        );
    }
}

// ============================================
// FIND APPLICABLE RULE
// ============================================

@Injectable()
export class FindApplicableRuleUseCase {
    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
    ) {}

    /**
     * Find the first matching routing rule for a request context
     */
    async execute(context: RequestContext): Promise<RoutingRule | null> {
        // Get all active rules for this request type, ordered by priority
        const rules = await this.ruleRepo.findActiveByRequestType(context.requestType);

        // Find the first rule that matches all conditions
        for (const rule of rules) {
            if (rule.matchesRequest(context)) {
                return rule;
            }
        }

        return null;
    }
}

// ============================================
// TEST ROUTING RULE
// ============================================

@Injectable()
export class TestRoutingRuleUseCase {
    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
    ) {}

    /**
     * Test which routing rule would match for a given request context
     */
    async execute(dto: TestRoutingRuleDto): Promise<{
        matchingRule: RoutingRule | null;
        allEvaluatedRules: {
            rule: RoutingRule;
            matched: boolean;
            reason?: string;
        }[];
    }> {
        const context: RequestContext = {
            requestType: dto.requestType,
            category: dto.category,
            urgency: dto.urgency,
            subscriberTier: dto.subscriberTier,
            subscriberId: dto.subscriberId,
            amount: dto.amount,
            region: dto.region,
            specializations: dto.specializations,
            metadata: dto.metadata,
        };

        const rules = await this.ruleRepo.findActiveByRequestType(dto.requestType);
        const evaluatedRules: {
            rule: RoutingRule;
            matched: boolean;
            reason?: string;
        }[] = [];

        let matchingRule: RoutingRule | null = null;

        for (const rule of rules) {
            const matched = rule.matchesRequest(context);
            evaluatedRules.push({
                rule,
                matched,
                reason: matched ? 'All conditions matched' : 'Conditions did not match',
            });

            if (matched && !matchingRule) {
                matchingRule = rule;
            }
        }

        return {
            matchingRule,
            allEvaluatedRules: evaluatedRules,
        };
    }
}

// ============================================
// ACTIVATE/DEACTIVATE ROUTING RULE
// ============================================

@Injectable()
export class ToggleRoutingRuleActiveUseCase {
    constructor(
        @Inject(ROUTING_RULE_REPOSITORY)
        private readonly ruleRepo: IRoutingRuleRepository,
    ) {}

    async execute(id: string, isActive: boolean): Promise<RoutingRule> {
        const rule = await this.ruleRepo.findById(id);
        if (!rule) {
            throw new NotFoundException(`Routing rule with ID ${id} not found`);
        }

        if (isActive) {
            rule.activate();
        } else {
            rule.deactivate();
        }

        return this.ruleRepo.update(rule);
    }
}
