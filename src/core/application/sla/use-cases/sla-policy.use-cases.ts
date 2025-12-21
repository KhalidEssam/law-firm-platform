// src/core/application/sla/use-cases/sla-policy.use-cases.ts

import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SLAPolicy } from '../../../domain/sla/entities/sla-policy.entity';
import type { ISLAPolicyRepository } from '../../../domain/sla/ports/sla-policy.repository';
import { SLACalculatorService } from '../../../domain/sla/services/sla-calculator.service';
import { RequestType, isValidRequestType } from '../../../domain/sla/value-objects/request-type.vo';
import { Priority, isValidPriority } from '../../../domain/sla/value-objects/priority.vo';
import { SLATimes } from '../../../domain/sla/value-objects/sla-times.vo';
import { SLADeadlines } from '../../../domain/sla/value-objects/sla-deadlines.vo';
import {
    CreateSLAPolicyDto,
    UpdateSLAPolicyDto,
    SLAPolicyResponseDto,
    ListSLAPoliciesDto,
} from '../dto/sla-policy.dto';

// ============================================
// HELPER: Map Policy to Response DTO
// ============================================

function mapToResponse(policy: SLAPolicy): SLAPolicyResponseDto {
    const descriptions = policy.getTimeDescriptions();

    return {
        id: policy.id,
        name: policy.name,
        requestType: policy.requestType,
        priority: policy.priority,
        responseTime: policy.responseTime,
        resolutionTime: policy.resolutionTime,
        escalationTime: policy.escalationTime,
        responseTimeFormatted: descriptions.response,
        resolutionTimeFormatted: descriptions.resolution,
        escalationTimeFormatted: descriptions.escalation,
        isActive: policy.isActive,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
    };
}

// ============================================
// USE CASE: Create SLA Policy
// ============================================

@Injectable()
export class CreateSLAPolicyUseCase {
    constructor(
        @Inject('ISLAPolicyRepository')
        private readonly policyRepository: ISLAPolicyRepository,
    ) {}

    async execute(dto: CreateSLAPolicyDto): Promise<SLAPolicyResponseDto> {
        // Validate request type
        const requestType = typeof dto.requestType === 'string'
            ? (isValidRequestType(dto.requestType) ? dto.requestType as RequestType : null)
            : dto.requestType;

        if (!requestType) {
            throw new BadRequestException(`Invalid request type: ${dto.requestType}`);
        }

        // Validate priority
        const priority = dto.priority
            ? (typeof dto.priority === 'string'
                ? (isValidPriority(dto.priority) ? dto.priority as Priority : Priority.NORMAL)
                : dto.priority)
            : Priority.NORMAL;

        // Check for duplicate name
        if (await this.policyRepository.existsByName(dto.name)) {
            throw new ConflictException(`SLA Policy with name "${dto.name}" already exists`);
        }

        // Check for duplicate type+priority combo
        if (await this.policyRepository.existsByTypeAndPriority(requestType, priority)) {
            throw new ConflictException(
                `SLA Policy for ${requestType} with priority ${priority} already exists`
            );
        }

        // Create the policy
        const policy = SLAPolicy.create({
            name: dto.name,
            requestType,
            priority,
            responseTime: dto.responseTime,
            resolutionTime: dto.resolutionTime,
            escalationTime: dto.escalationTime,
            isActive: dto.isActive ?? true,
        });

        const savedPolicy = await this.policyRepository.save(policy);
        return mapToResponse(savedPolicy);
    }
}

// ============================================
// USE CASE: Update SLA Policy
// ============================================

@Injectable()
export class UpdateSLAPolicyUseCase {
    constructor(
        @Inject('ISLAPolicyRepository')
        private readonly policyRepository: ISLAPolicyRepository,
    ) {}

    async execute(id: string, dto: UpdateSLAPolicyDto): Promise<SLAPolicyResponseDto> {
        const policy = await this.policyRepository.findById(id);
        if (!policy) {
            throw new NotFoundException(`SLA Policy not found: ${id}`);
        }

        // Check for duplicate name if changing
        if (dto.name && dto.name !== policy.name) {
            if (await this.policyRepository.existsByName(dto.name)) {
                throw new ConflictException(`SLA Policy with name "${dto.name}" already exists`);
            }
            policy.updateName(dto.name);
        }

        // Update times if provided
        if (dto.responseTime !== undefined) {
            policy.updateResponseTime(dto.responseTime);
        }
        if (dto.resolutionTime !== undefined) {
            policy.updateResolutionTime(dto.resolutionTime);
        }
        if (dto.escalationTime !== undefined) {
            policy.updateEscalationTime(dto.escalationTime);
        }

        // Update active status
        if (dto.isActive !== undefined) {
            dto.isActive ? policy.activate() : policy.deactivate();
        }

        const savedPolicy = await this.policyRepository.save(policy);
        return mapToResponse(savedPolicy);
    }
}

// ============================================
// USE CASE: Get SLA Policy by ID
// ============================================

@Injectable()
export class GetSLAPolicyUseCase {
    constructor(
        @Inject('ISLAPolicyRepository')
        private readonly policyRepository: ISLAPolicyRepository,
    ) {}

    async execute(id: string): Promise<SLAPolicyResponseDto> {
        const policy = await this.policyRepository.findById(id);
        if (!policy) {
            throw new NotFoundException(`SLA Policy not found: ${id}`);
        }
        return mapToResponse(policy);
    }
}

// ============================================
// USE CASE: Get SLA Policy by Type and Priority
// ============================================

@Injectable()
export class GetSLAPolicyByTypeUseCase {
    constructor(
        @Inject('ISLAPolicyRepository')
        private readonly policyRepository: ISLAPolicyRepository,
    ) {}

    async execute(requestType: RequestType | string, priority?: Priority | string): Promise<SLAPolicyResponseDto | null> {
        const type = typeof requestType === 'string'
            ? (isValidRequestType(requestType) ? requestType as RequestType : null)
            : requestType;

        if (!type) {
            throw new BadRequestException(`Invalid request type: ${requestType}`);
        }

        const prio = priority
            ? (typeof priority === 'string'
                ? (isValidPriority(priority) ? priority as Priority : Priority.NORMAL)
                : priority)
            : undefined;

        const policy = await this.policyRepository.findBestMatch(type, prio);
        return policy ? mapToResponse(policy) : null;
    }
}

// ============================================
// USE CASE: List SLA Policies
// ============================================

@Injectable()
export class ListSLAPoliciesUseCase {
    constructor(
        @Inject('ISLAPolicyRepository')
        private readonly policyRepository: ISLAPolicyRepository,
    ) {}

    async execute(dto?: ListSLAPoliciesDto): Promise<{ policies: SLAPolicyResponseDto[]; total: number }> {
        let policies: SLAPolicy[];

        if (dto?.requestType) {
            const type = typeof dto.requestType === 'string'
                ? (isValidRequestType(dto.requestType) ? dto.requestType as RequestType : null)
                : dto.requestType;

            if (!type) {
                throw new BadRequestException(`Invalid request type: ${dto.requestType}`);
            }

            policies = await this.policyRepository.findByRequestType(type);
        } else if (dto?.isActive === true) {
            policies = await this.policyRepository.findAllActive();
        } else {
            policies = await this.policyRepository.findAll();
        }

        // Filter by active status if specified
        if (dto?.isActive !== undefined) {
            policies = policies.filter(p => p.isActive === dto.isActive);
        }

        // Apply pagination
        const total = policies.length;
        const offset = dto?.offset ?? 0;
        const limit = dto?.limit ?? 50;
        const paginatedPolicies = policies.slice(offset, offset + limit);

        return {
            policies: paginatedPolicies.map(mapToResponse),
            total,
        };
    }
}

// ============================================
// USE CASE: Delete SLA Policy
// ============================================

@Injectable()
export class DeleteSLAPolicyUseCase {
    constructor(
        @Inject('ISLAPolicyRepository')
        private readonly policyRepository: ISLAPolicyRepository,
    ) {}

    async execute(id: string): Promise<void> {
        const policy = await this.policyRepository.findById(id);
        if (!policy) {
            throw new NotFoundException(`SLA Policy not found: ${id}`);
        }

        await this.policyRepository.delete(id);
    }
}

// ============================================
// USE CASE: Deactivate SLA Policy
// ============================================

@Injectable()
export class DeactivateSLAPolicyUseCase {
    constructor(
        @Inject('ISLAPolicyRepository')
        private readonly policyRepository: ISLAPolicyRepository,
    ) {}

    async execute(id: string): Promise<SLAPolicyResponseDto> {
        const policy = await this.policyRepository.findById(id);
        if (!policy) {
            throw new NotFoundException(`SLA Policy not found: ${id}`);
        }

        policy.deactivate();
        const savedPolicy = await this.policyRepository.save(policy);
        return mapToResponse(savedPolicy);
    }
}

// ============================================
// USE CASE: Activate SLA Policy
// ============================================

@Injectable()
export class ActivateSLAPolicyUseCase {
    constructor(
        @Inject('ISLAPolicyRepository')
        private readonly policyRepository: ISLAPolicyRepository,
    ) {}

    async execute(id: string): Promise<SLAPolicyResponseDto> {
        const policy = await this.policyRepository.findById(id);
        if (!policy) {
            throw new NotFoundException(`SLA Policy not found: ${id}`);
        }

        policy.activate();
        const savedPolicy = await this.policyRepository.save(policy);
        return mapToResponse(savedPolicy);
    }
}

// ============================================
// USE CASE: Calculate SLA Deadlines
// ============================================

@Injectable()
export class CalculateSLADeadlinesUseCase {
    private readonly calculator = new SLACalculatorService();

    constructor(
        @Inject('ISLAPolicyRepository')
        private readonly policyRepository: ISLAPolicyRepository,
    ) {}

    async execute(
        requestType: RequestType | string,
        priority?: Priority | string,
        startDate?: Date,
    ): Promise<{
        deadlines: { response: Date; resolution: Date; escalation: Date | null };
        policyId: string | null;
    }> {
        const type = typeof requestType === 'string'
            ? (isValidRequestType(requestType) ? requestType as RequestType : RequestType.CONSULTATION)
            : requestType;

        const prio = priority
            ? (typeof priority === 'string'
                ? (isValidPriority(priority) ? priority as Priority : Priority.NORMAL)
                : priority)
            : Priority.NORMAL;

        const policy = await this.policyRepository.findBestMatch(type, prio);
        const deadlines = this.calculator.calculateDeadlines(policy, type, prio, startDate);

        return {
            deadlines: {
                response: deadlines.responseDeadline,
                resolution: deadlines.resolutionDeadline,
                escalation: deadlines.escalationDeadline,
            },
            policyId: policy?.id ?? null,
        };
    }
}

// ============================================
// USE CASE: Seed Default SLA Policies
// ============================================

@Injectable()
export class SeedDefaultSLAPoliciesUseCase {
    constructor(
        @Inject('ISLAPolicyRepository')
        private readonly policyRepository: ISLAPolicyRepository,
    ) {}

    async execute(): Promise<{ created: number; skipped: number }> {
        const requestTypes = Object.values(RequestType);
        const priorities = Object.values(Priority);
        let created = 0;
        let skipped = 0;

        for (const requestType of requestTypes) {
            for (const priority of priorities) {
                const exists = await this.policyRepository.existsByTypeAndPriority(requestType, priority);
                if (exists) {
                    skipped++;
                    continue;
                }

                const policy = SLAPolicy.createDefault(requestType, priority);
                await this.policyRepository.save(policy);
                created++;
            }
        }

        return { created, skipped };
    }
}
