// src/interface/http/sla.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';

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

import {
    CheckSLAStatusUseCase,
    CheckSLABreachesUseCase,
    GetUrgencyScoreUseCase,
    BatchCheckSLAStatusUseCase,
} from '../../core/application/sla/use-cases/sla-tracking.use-cases';

import {
    CreateSLAPolicyDto,
    UpdateSLAPolicyDto,
    SLAPolicyResponseDto,
    CheckSLAStatusDto,
    SLAStatusResponseDto,
} from '../../core/application/sla/dto/sla-policy.dto';

// ============================================
// REQUEST DTOs (for validation)
// ============================================

class CreatePolicyRequestDto {
    name: string;
    requestType: string;
    priority?: string;
    responseTime: number;
    resolutionTime: number;
    escalationTime?: number;
    isActive?: boolean;
}

class UpdatePolicyRequestDto {
    name?: string;
    responseTime?: number;
    resolutionTime?: number;
    escalationTime?: number;
    isActive?: boolean;
}

class ListPoliciesQueryDto {
    requestType?: string;
    isActive?: string;
    limit?: string;
    offset?: string;
}

class CalculateDeadlinesQueryDto {
    requestType: string;
    priority?: string;
    startDate?: string;
}

class CheckStatusRequestDto {
    requestId: string;
    requestType: string;
    priority: string;
    responseDeadline: string;
    resolutionDeadline: string;
    escalationDeadline?: string;
    createdAt: string;
    respondedAt?: string;
    resolvedAt?: string;
}

// ============================================
// CONTROLLER
// ============================================

@Controller('sla')
@UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
export class SLAController {
    constructor(
        private readonly createPolicy: CreateSLAPolicyUseCase,
        private readonly updatePolicy: UpdateSLAPolicyUseCase,
        private readonly getPolicy: GetSLAPolicyUseCase,
        private readonly getPolicyByType: GetSLAPolicyByTypeUseCase,
        private readonly listPolicies: ListSLAPoliciesUseCase,
        private readonly deletePolicy: DeleteSLAPolicyUseCase,
        private readonly activatePolicy: ActivateSLAPolicyUseCase,
        private readonly deactivatePolicy: DeactivateSLAPolicyUseCase,
        private readonly calculateDeadlines: CalculateSLADeadlinesUseCase,
        private readonly seedDefaults: SeedDefaultSLAPoliciesUseCase,
        private readonly checkStatus: CheckSLAStatusUseCase,
        private readonly checkBreaches: CheckSLABreachesUseCase,
        private readonly getUrgencyScore: GetUrgencyScoreUseCase,
        private readonly batchCheckStatus: BatchCheckSLAStatusUseCase,
    ) {}

    // ============================================
    // POLICY MANAGEMENT ENDPOINTS
    // ============================================

    /**
     * Create a new SLA policy
     */
    @Post('policies')
    @Roles('system admin')
    @Permissions('manage:sla')
    async create(@Body() dto: CreatePolicyRequestDto): Promise<{ policy: SLAPolicyResponseDto }> {
        const policy = await this.createPolicy.execute(dto);
        return { policy };
    }

    /**
     * List all SLA policies
     */
    @Get('policies')
    @Roles('system admin', 'platform')
    async list(@Query() query: ListPoliciesQueryDto): Promise<{ policies: SLAPolicyResponseDto[]; total: number }> {
        return this.listPolicies.execute({
            requestType: query.requestType,
            isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
            offset: query.offset ? parseInt(query.offset, 10) : undefined,
        });
    }

    /**
     * Get SLA policy by ID
     */
    @Get('policies/:id')
    @Roles('system admin', 'platform')
    async getById(@Param('id') id: string): Promise<{ policy: SLAPolicyResponseDto }> {
        const policy = await this.getPolicy.execute(id);
        return { policy };
    }

    /**
     * Get SLA policy by request type and priority
     */
    @Get('policies/by-type/:requestType')
    @Roles('system admin', 'platform', 'provider')
    async getByType(
        @Param('requestType') requestType: string,
        @Query('priority') priority?: string,
    ): Promise<{ policy: SLAPolicyResponseDto | null }> {
        const policy = await this.getPolicyByType.execute(requestType, priority);
        return { policy };
    }

    /**
     * Update SLA policy
     */
    @Patch('policies/:id')
    @Roles('system admin')
    @Permissions('manage:sla')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdatePolicyRequestDto,
    ): Promise<{ policy: SLAPolicyResponseDto }> {
        const policy = await this.updatePolicy.execute(id, dto);
        return { policy };
    }

    /**
     * Delete SLA policy
     */
    @Delete('policies/:id')
    @Roles('system admin')
    @Permissions('manage:sla')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string): Promise<void> {
        await this.deletePolicy.execute(id);
    }

    /**
     * Activate SLA policy
     */
    @Post('policies/:id/activate')
    @Roles('system admin')
    @Permissions('manage:sla')
    async activate(@Param('id') id: string): Promise<{ policy: SLAPolicyResponseDto }> {
        const policy = await this.activatePolicy.execute(id);
        return { policy };
    }

    /**
     * Deactivate SLA policy
     */
    @Post('policies/:id/deactivate')
    @Roles('system admin')
    @Permissions('manage:sla')
    async deactivate(@Param('id') id: string): Promise<{ policy: SLAPolicyResponseDto }> {
        const policy = await this.deactivatePolicy.execute(id);
        return { policy };
    }

    /**
     * Seed default SLA policies
     */
    @Post('policies/seed-defaults')
    @Roles('system admin')
    @Permissions('manage:sla')
    async seedDefaultPolicies(): Promise<{ created: number; skipped: number }> {
        return this.seedDefaults.execute();
    }

    // ============================================
    // SLA CALCULATION ENDPOINTS
    // ============================================

    /**
     * Calculate SLA deadlines for a new request
     */
    @Get('calculate')
    @Roles('system admin', 'platform', 'provider')
    async calculateSLADeadlines(@Query() query: CalculateDeadlinesQueryDto): Promise<{
        deadlines: { response: Date; resolution: Date; escalation: Date | null };
        policyId: string | null;
    }> {
        const startDate = query.startDate ? new Date(query.startDate) : undefined;
        return this.calculateDeadlines.execute(query.requestType, query.priority, startDate);
    }

    // ============================================
    // SLA STATUS CHECK ENDPOINTS
    // ============================================

    /**
     * Check SLA status for a request
     */
    @Post('check-status')
    @Roles('system admin', 'platform', 'provider')
    async checkSLAStatus(@Body() dto: CheckStatusRequestDto): Promise<SLAStatusResponseDto> {
        return this.checkStatus.execute({
            requestId: dto.requestId,
            requestType: dto.requestType,
            priority: dto.priority,
            responseDeadline: new Date(dto.responseDeadline),
            resolutionDeadline: new Date(dto.resolutionDeadline),
            escalationDeadline: dto.escalationDeadline ? new Date(dto.escalationDeadline) : undefined,
            createdAt: new Date(dto.createdAt),
            respondedAt: dto.respondedAt ? new Date(dto.respondedAt) : undefined,
            resolvedAt: dto.resolvedAt ? new Date(dto.resolvedAt) : undefined,
        });
    }

    /**
     * Check for SLA breaches
     */
    @Post('check-breaches')
    @Roles('system admin', 'platform', 'provider')
    async checkSLABreaches(@Body() dto: CheckStatusRequestDto): Promise<{
        breaches: Array<{
            requestId: string;
            requestType: string;
            breachType: 'response' | 'resolution';
            deadline: Date;
            breachedAt: Date;
            overdueDuration: string;
        }>;
    }> {
        const breaches = await this.checkBreaches.execute({
            requestId: dto.requestId,
            requestType: dto.requestType,
            priority: dto.priority,
            responseDeadline: new Date(dto.responseDeadline),
            resolutionDeadline: new Date(dto.resolutionDeadline),
            escalationDeadline: dto.escalationDeadline ? new Date(dto.escalationDeadline) : undefined,
            createdAt: new Date(dto.createdAt),
            respondedAt: dto.respondedAt ? new Date(dto.respondedAt) : undefined,
            resolvedAt: dto.resolvedAt ? new Date(dto.resolvedAt) : undefined,
        });
        return { breaches };
    }

    /**
     * Batch check SLA status for multiple requests
     */
    @Post('batch-check')
    @Roles('system admin', 'platform')
    async batchCheck(@Body() items: CheckStatusRequestDto[]): Promise<{
        results: Array<{
            requestId: string;
            status: string;
            isBreached: boolean;
            isAtRisk: boolean;
            urgencyScore: number;
        }>;
    }> {
        const results = this.batchCheckStatus.execute(
            items.map(item => ({
                requestId: item.requestId,
                requestType: item.requestType,
                priority: item.priority,
                responseDeadline: new Date(item.responseDeadline),
                resolutionDeadline: new Date(item.resolutionDeadline),
                escalationDeadline: item.escalationDeadline ? new Date(item.escalationDeadline) : undefined,
                createdAt: new Date(item.createdAt),
                respondedAt: item.respondedAt ? new Date(item.respondedAt) : undefined,
                resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
            })),
        );
        return { results };
    }
}
