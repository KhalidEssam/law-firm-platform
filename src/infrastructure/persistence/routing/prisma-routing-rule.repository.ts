// src/infrastructure/persistence/routing/prisma-routing-rule.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    IRoutingRuleRepository,
    RoutingRuleFilters,
    PaginationOptions,
    PaginatedResult,
    RoundRobinState,
} from '../../../core/application/routing/ports/routing-rule.repository';
import { RoutingRule } from '../../../core/domain/routing/entities/routing-rule.entity';
import { RequestType } from '../../../core/domain/routing/value-objects/request-type.vo';
import { RoutingStrategy } from '../../../core/domain/routing/value-objects/routing-strategy.vo';
import { RoutingConditionsData } from '../../../core/domain/routing/value-objects/routing-conditions.vo';
import { ProviderTargetData } from '../../../core/domain/routing/value-objects/provider-target.vo';

@Injectable()
export class PrismaRoutingRuleRepository implements IRoutingRuleRepository {
    // In-memory round-robin state (in production, this could be Redis)
    private roundRobinStates: Map<string, RoundRobinState> = new Map();

    constructor(private readonly prisma: PrismaService) {}

    // ============================================
    // CRUD Operations
    // ============================================

    async create(rule: RoutingRule): Promise<RoutingRule> {
        const data = rule.toObject();

        const created = await this.prisma.routingRule.create({
            data: {
                id: data.id,
                name: data.name,
                requestType: data.requestType ,
                conditions: data.conditions as any,
                priority: data.priority,
                routingStrategy: data.routingStrategy ,
                targetProviders: data.targetProviders as any,
                isActive: data.isActive,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            },
        });

        return this.mapToDomain(created);
    }

    async update(rule: RoutingRule): Promise<RoutingRule> {
        const data = rule.toObject();

        const updated = await this.prisma.routingRule.update({
            where: { id: data.id },
            data: {
                name: data.name,
                requestType: data.requestType ,
                conditions: data.conditions as any,
                priority: data.priority,
                routingStrategy: data.routingStrategy ,
                targetProviders: data.targetProviders as any,
                isActive: data.isActive,
                updatedAt: data.updatedAt,
            },
        });

        return this.mapToDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.routingRule.delete({
            where: { id },
        });

        // Clean up round-robin state
        this.roundRobinStates.delete(id);
    }

    async findById(id: string): Promise<RoutingRule | null> {
        const rule = await this.prisma.routingRule.findUnique({
            where: { id },
        });

        return rule ? this.mapToDomain(rule) : null;
    }

    async findByName(name: string): Promise<RoutingRule | null> {
        const rule = await this.prisma.routingRule.findFirst({
            where: { name },
        });

        return rule ? this.mapToDomain(rule) : null;
    }

    // ============================================
    // Query Operations
    // ============================================

    async findAll(
        filters?: RoutingRuleFilters,
        pagination?: PaginationOptions,
    ): Promise<PaginatedResult<RoutingRule>> {
        const where = this.buildWhereClause(filters);
        const limit = pagination?.limit ?? 20;
        const offset = pagination?.offset ?? 0;

        const [rules, total] = await Promise.all([
            this.prisma.routingRule.findMany({
                where,
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' },
                ],
                take: limit,
                skip: offset,
            }),
            this.prisma.routingRule.count({ where }),
        ]);

        return {
            data: rules.map(r => this.mapToDomain(r)),
            total,
            limit,
            offset,
        };
    }

    async findActiveByRequestType(requestType: RequestType ): Promise<RoutingRule[]> {
        const rules = await this.prisma.routingRule.findMany({
            where: {
                requestType: requestType ,
                isActive: true,
            },
            orderBy: {
                priority: 'desc',
            },
        });

        return rules.map(r => this.mapToDomain(r));
    }

    async findAllActive(): Promise<RoutingRule[]> {
        const rules = await this.prisma.routingRule.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                priority: 'desc',
            },
        });

        return rules.map(r => this.mapToDomain(r));
    }

    async countByRequestType(requestType: RequestType ): Promise<number> {
        return this.prisma.routingRule.count({
            where: {
                requestType: requestType ,
            },
        });
    }

    async existsByName(name: string): Promise<boolean> {
        const count = await this.prisma.routingRule.count({
            where: { name },
        });
        return count > 0;
    }

    // ============================================
    // Round Robin State Management
    // ============================================

    async getRoundRobinState(ruleId: string): Promise<RoundRobinState | null> {
        return this.roundRobinStates.get(ruleId) || null;
    }

    async updateRoundRobinState(
        ruleId: string,
        providerId: string,
        providerIndex: number,
    ): Promise<void> {
        this.roundRobinStates.set(ruleId, {
            ruleId,
            lastAssignedProviderId: providerId,
            lastAssignedIndex: providerIndex,
            updatedAt: new Date(),
        });
    }

    // ============================================
    // Private Helpers
    // ============================================

    private buildWhereClause(filters?: RoutingRuleFilters): any {
        if (!filters) return {};

        const where: any = {};

        if (filters.requestType) {
            where.requestType = filters.requestType;
        }

        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters.search) {
            where.name = {
                contains: filters.search,
                mode: 'insensitive',
            };
        }

        return where;
    }

    private mapToDomain(prismaRule: any): RoutingRule {
        return RoutingRule.rehydrate({
            id: prismaRule.id,
            name: prismaRule.name,
            requestType: prismaRule.requestType,
            conditions: prismaRule.conditions as RoutingConditionsData | null,
            priority: prismaRule.priority,
            routingStrategy: prismaRule.routingStrategy,
            targetProviders: prismaRule.targetProviders as ProviderTargetData | null,
            isActive: prismaRule.isActive,
            createdAt: prismaRule.createdAt,
            updatedAt: prismaRule.updatedAt,
        });
    }
}
