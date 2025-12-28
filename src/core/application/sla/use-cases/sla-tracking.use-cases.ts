// src/core/application/sla/use-cases/sla-tracking.use-cases.ts

import { Injectable, Inject } from '@nestjs/common';
import type { ISLAPolicyRepository } from '../../../domain/sla/ports/sla-policy.repository';
import {
  SLACalculatorService,
  RequestSLAInfo,
  SLABreachInfo,
} from '../../../domain/sla/services/sla-calculator.service';
import {
  RequestType,
  isValidRequestType,
} from '../../../domain/sla/value-objects/request-type.vo';
import {
  Priority,
  isValidPriority,
} from '../../../domain/sla/value-objects/priority.vo';
import { SLADeadlines } from '../../../domain/sla/value-objects/sla-deadlines.vo';
import { SLAStatus } from '../../../domain/sla/value-objects/sla-status.vo';
import {
  CheckSLAStatusDto,
  SLAStatusResponseDto,
  SLABreachResponseDto,
} from '../dto/sla-policy.dto';

// ============================================
// USE CASE: Check SLA Status for a Request
// ============================================

@Injectable()
export class CheckSLAStatusUseCase {
  private readonly calculator = new SLACalculatorService();

  constructor(
    @Inject('ISLAPolicyRepository')
    private readonly policyRepository: ISLAPolicyRepository,
  ) {}

  async execute(dto: CheckSLAStatusDto): Promise<SLAStatusResponseDto> {
    const requestType =
      typeof dto.requestType === 'string'
        ? isValidRequestType(dto.requestType)
          ? dto.requestType
          : RequestType.CONSULTATION
        : dto.requestType;

    const priority =
      typeof dto.priority === 'string'
        ? isValidPriority(dto.priority)
          ? dto.priority
          : Priority.NORMAL
        : dto.priority;

    // Reconstruct deadlines
    const deadlines = SLADeadlines.fromData({
      responseDeadline: dto.responseDeadline,
      resolutionDeadline: dto.resolutionDeadline,
      escalationDeadline: dto.escalationDeadline,
      createdAt: dto.createdAt,
    });

    const responded = !!dto.respondedAt;
    const resolved = !!dto.resolvedAt;
    const now = new Date();

    // Get matching policy
    const policy = await this.policyRepository.findBestMatch(
      requestType,
      priority,
    );

    // Calculate SLA info
    const slaInfo = this.calculator.getRequestSLAInfo(
      dto.requestId,
      requestType,
      priority,
      deadlines,
      responded,
      resolved,
      policy?.id ?? null,
      now,
    );

    return {
      requestId: slaInfo.requestId,
      requestType: slaInfo.requestType,
      priority: slaInfo.priority,
      status: slaInfo.status,
      responseStatus: slaInfo.responseStatus,
      resolutionStatus: slaInfo.resolutionStatus,
      deadlines: slaInfo.deadlines,
      timeRemaining: {
        response: this.calculator.formatDuration(
          slaInfo.timeRemaining.response,
        ),
        resolution: this.calculator.formatDuration(
          slaInfo.timeRemaining.resolution,
        ),
      },
      percentElapsed: slaInfo.percentElapsed,
      isEscalationRequired: slaInfo.isEscalationRequired,
      policyId: slaInfo.policyId,
    };
  }
}

// ============================================
// USE CASE: Check for SLA Breaches
// ============================================

@Injectable()
export class CheckSLABreachesUseCase {
  private readonly calculator = new SLACalculatorService();

  async execute(dto: CheckSLAStatusDto): Promise<SLABreachResponseDto[]> {
    const requestType =
      typeof dto.requestType === 'string'
        ? isValidRequestType(dto.requestType)
          ? dto.requestType
          : RequestType.CONSULTATION
        : dto.requestType;

    // Reconstruct deadlines
    const deadlines = SLADeadlines.fromData({
      responseDeadline: dto.responseDeadline,
      resolutionDeadline: dto.resolutionDeadline,
      escalationDeadline: dto.escalationDeadline,
      createdAt: dto.createdAt,
    });

    const responded = !!dto.respondedAt;
    const resolved = !!dto.resolvedAt;

    const breaches = this.calculator.checkBreaches(
      dto.requestId,
      requestType,
      deadlines,
      responded,
      resolved,
    );

    return breaches.map((breach) => ({
      requestId: breach.requestId,
      requestType: breach.requestType,
      breachType: breach.breachType,
      deadline: breach.deadline,
      breachedAt: breach.breachedAt,
      overdueDuration: this.calculator.formatDuration(breach.overdueDuration),
    }));
  }
}

// ============================================
// USE CASE: Get Urgency Score
// ============================================

@Injectable()
export class GetUrgencyScoreUseCase {
  private readonly calculator = new SLACalculatorService();

  execute(dto: CheckSLAStatusDto): number {
    const priority =
      typeof dto.priority === 'string'
        ? isValidPriority(dto.priority)
          ? dto.priority
          : Priority.NORMAL
        : dto.priority;

    const deadlines = SLADeadlines.fromData({
      responseDeadline: dto.responseDeadline,
      resolutionDeadline: dto.resolutionDeadline,
      escalationDeadline: dto.escalationDeadline,
      createdAt: dto.createdAt,
    });

    const responded = !!dto.respondedAt;
    const resolved = !!dto.resolvedAt;

    return this.calculator.getUrgencyScore(
      deadlines,
      priority,
      responded,
      resolved,
    );
  }
}

// ============================================
// USE CASE: Batch Check SLA Status
// ============================================

export interface BatchSLACheckItem extends CheckSLAStatusDto {}

export interface BatchSLAResult {
  requestId: string;
  status: SLAStatus;
  isBreached: boolean;
  isAtRisk: boolean;
  urgencyScore: number;
}

@Injectable()
export class BatchCheckSLAStatusUseCase {
  private readonly calculator = new SLACalculatorService();

  execute(items: BatchSLACheckItem[]): BatchSLAResult[] {
    return items.map((item) => {
      const priority =
        typeof item.priority === 'string'
          ? isValidPriority(item.priority)
            ? item.priority
            : Priority.NORMAL
          : item.priority;

      const deadlines = SLADeadlines.fromData({
        responseDeadline: item.responseDeadline,
        resolutionDeadline: item.resolutionDeadline,
        escalationDeadline: item.escalationDeadline,
        createdAt: item.createdAt,
      });

      const responded = !!item.respondedAt;
      const resolved = !!item.resolvedAt;
      const now = new Date();

      const status = deadlines.getOverallStatus(responded, resolved, now);
      const atRisk = this.calculator.isAtRisk(
        deadlines,
        responded,
        resolved,
        now,
      );

      return {
        requestId: item.requestId,
        status,
        isBreached: status === SLAStatus.BREACHED,
        isAtRisk: atRisk.response || atRisk.resolution,
        urgencyScore: this.calculator.getUrgencyScore(
          deadlines,
          priority,
          responded,
          resolved,
          now,
        ),
      };
    });
  }
}

// ============================================
// USE CASE: Sort Requests by Urgency
// ============================================

@Injectable()
export class SortByUrgencyUseCase {
  private readonly batchCheck = new BatchCheckSLAStatusUseCase();

  execute(items: BatchSLACheckItem[]): string[] {
    const results = this.batchCheck.execute(items);

    // Sort by urgency score descending (most urgent first)
    results.sort((a, b) => b.urgencyScore - a.urgencyScore);

    return results.map((r) => r.requestId);
  }
}
