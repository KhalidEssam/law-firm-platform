// src/core/application/sla/services/sla-integration.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { SLACalculatorService } from '../../../domain/sla/services/sla-calculator.service';
import { ISLAPolicyRepository } from '../../../domain/sla/ports/sla-policy.repository';
import { RequestType } from '../../../domain/sla/value-objects/request-type.vo';
import { Priority } from '../../../domain/sla/value-objects/priority.vo';
import { SLAStatus } from '../../../domain/sla/value-objects/sla-status.vo';

// ============================================
// INTERFACES
// ============================================

export interface SLAApplicationResult {
  slaDeadline: Date;
  slaStatus: SLAStatus;
  responseDeadline: Date;
  resolutionDeadline: Date;
  escalationDeadline: Date | null;
  policyId: string | null;
  policyName: string | null;
}

export interface SLAStatusCheckResult {
  currentStatus: SLAStatus;
  previousStatus: SLAStatus | null;
  hasChanged: boolean;
  isBreached: boolean;
  isAtRisk: boolean;
  breachType?: 'response' | 'resolution';
  timeToDeadline?: number; // milliseconds
}

export interface RequestSLAData {
  requestId: string;
  requestType: string;
  priority: string;
  createdAt: Date;
  respondedAt?: Date;
  resolvedAt?: Date;
  slaDeadline?: Date;
  currentSlaStatus?: string;
}

// ============================================
// SLA INTEGRATION SERVICE
// ============================================

@Injectable()
export class SLAIntegrationService {
  private readonly logger = new Logger(SLAIntegrationService.name);
  // calculatorService reserved for future use
  private readonly calculatorService: SLACalculatorService;

  constructor(
    @Inject('ISLAPolicyRepository')
    private readonly policyRepository: ISLAPolicyRepository,
  ) {
    this.calculatorService = new SLACalculatorService();
  }

  // ============================================
  // APPLY SLA TO NEW REQUEST
  // ============================================

  /**
   * Calculate and return SLA data for a new request.
   * Call this when creating a new request to get SLA deadlines.
   */
  async applySLAToRequest(
    requestType: string,
    priority: string = 'normal',
    createdAt: Date = new Date(),
  ): Promise<SLAApplicationResult | null> {
    try {
      // Convert to domain types
      const reqType = this.mapToRequestType(requestType);
      const reqPriority = this.mapToPriority(priority);

      // Find applicable policy using best match (tries exact priority, falls back to normal)
      const policy = await this.policyRepository.findBestMatch(
        reqType,
        reqPriority,
      );

      if (!policy) {
        this.logger.warn(
          `No SLA policy found for type=${requestType}, priority=${priority}`,
        );
        return null;
      }

      return this.calculateSLAFromPolicy(policy, reqPriority, createdAt);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to apply SLA: ${message}`, stack);
      return null;
    }
  }

  private calculateSLAFromPolicy(
    policy: any,
    priority: Priority,
    createdAt: Date,
  ): SLAApplicationResult {
    // Calculate deadlines using policy
    const deadlines = policy.calculateDeadlines(createdAt, priority);

    return {
      slaDeadline: deadlines.resolutionDeadline, // Main deadline is resolution
      slaStatus: SLAStatus.ON_TRACK,
      responseDeadline: deadlines.responseDeadline,
      resolutionDeadline: deadlines.resolutionDeadline,
      escalationDeadline: deadlines.escalationDeadline,
      policyId: policy.id,
      policyName: policy.name,
    };
  }

  // ============================================
  // CHECK AND UPDATE SLA STATUS
  // ============================================

  /**
   * Check and calculate the current SLA status for a request.
   * Returns the new status and whether it has changed.
   */
  checkSLAStatus(data: RequestSLAData): SLAStatusCheckResult {
    const now = new Date();
    const previousStatus = data.currentSlaStatus
      ? this.mapToSLAStatus(data.currentSlaStatus)
      : null;

    // If already resolved, maintain current status
    if (data.resolvedAt) {
      const wasBreached =
        data.slaDeadline && data.resolvedAt > data.slaDeadline;
      return {
        currentStatus: wasBreached ? SLAStatus.BREACHED : SLAStatus.ON_TRACK,
        previousStatus,
        hasChanged: false,
        isBreached: wasBreached || false,
        isAtRisk: false,
      };
    }

    // No deadline set
    if (!data.slaDeadline) {
      return {
        currentStatus: SLAStatus.ON_TRACK,
        previousStatus,
        hasChanged: false,
        isBreached: false,
        isAtRisk: false,
      };
    }

    const deadline = new Date(data.slaDeadline);
    const timeToDeadline = deadline.getTime() - now.getTime();

    // Already breached
    if (now > deadline) {
      const currentStatus = SLAStatus.BREACHED;
      return {
        currentStatus,
        previousStatus,
        hasChanged: previousStatus !== currentStatus,
        isBreached: true,
        isAtRisk: false,
        breachType: 'resolution',
        timeToDeadline,
      };
    }

    // At risk: within 20% of deadline
    const totalTime = deadline.getTime() - new Date(data.createdAt).getTime();
    const remainingPercent = (timeToDeadline / totalTime) * 100;

    if (remainingPercent <= 20) {
      const currentStatus = SLAStatus.AT_RISK;
      return {
        currentStatus,
        previousStatus,
        hasChanged: previousStatus !== currentStatus,
        isBreached: false,
        isAtRisk: true,
        timeToDeadline,
      };
    }

    // On track
    return {
      currentStatus: SLAStatus.ON_TRACK,
      previousStatus,
      hasChanged:
        previousStatus !== SLAStatus.ON_TRACK && previousStatus !== null,
      isBreached: false,
      isAtRisk: false,
      timeToDeadline,
    };
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Check SLA status for multiple requests at once.
   * Returns list of requests that need status updates.
   */
  batchCheckSLAStatus(requests: RequestSLAData[]): Array<{
    requestId: string;
    result: SLAStatusCheckResult;
  }> {
    return requests.map((request) => ({
      requestId: request.requestId,
      result: this.checkSLAStatus(request),
    }));
  }

  /**
   * Get requests sorted by urgency (most urgent first).
   */
  sortByUrgency(requests: RequestSLAData[]): RequestSLAData[] {
    return [...requests].sort((a, b) => {
      const resultA = this.checkSLAStatus(a);
      const resultB = this.checkSLAStatus(b);

      // Breached first
      if (resultA.isBreached && !resultB.isBreached) return -1;
      if (!resultA.isBreached && resultB.isBreached) return 1;

      // At risk second
      if (resultA.isAtRisk && !resultB.isAtRisk) return -1;
      if (!resultA.isAtRisk && resultB.isAtRisk) return 1;

      // Then by time to deadline (ascending)
      const timeA = resultA.timeToDeadline ?? Infinity;
      const timeB = resultB.timeToDeadline ?? Infinity;
      return timeA - timeB;
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  private mapToRequestType(type: string): RequestType {
    const typeMap: Record<string, RequestType> = {
      consultation: RequestType.CONSULTATION,
      legal_opinion: RequestType.LEGAL_OPINION,
      service: RequestType.SERVICE,
      litigation: RequestType.LITIGATION,
      call: RequestType.CALL,
    };
    return typeMap[type.toLowerCase()] || RequestType.CONSULTATION;
  }

  private mapToPriority(priority: string): Priority {
    const priorityMap: Record<string, Priority> = {
      low: Priority.LOW,
      normal: Priority.NORMAL,
      high: Priority.HIGH,
      urgent: Priority.URGENT,
    };
    return priorityMap[priority.toLowerCase()] || Priority.NORMAL;
  }

  private mapToSLAStatus(status: string): SLAStatus {
    const statusMap: Record<string, SLAStatus> = {
      on_track: SLAStatus.ON_TRACK,
      at_risk: SLAStatus.AT_RISK,
      breached: SLAStatus.BREACHED,
    };
    return statusMap[status.toLowerCase()] || SLAStatus.ON_TRACK;
  }

  // ============================================
  // UTILITY METHODS FOR EXTERNAL USE
  // ============================================

  /**
   * Format time remaining as human-readable string.
   */
  formatTimeRemaining(milliseconds: number): string {
    if (milliseconds < 0) {
      return `Overdue by ${this.formatDuration(Math.abs(milliseconds))}`;
    }
    return this.formatDuration(milliseconds);
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  /**
   * Get urgency score (0-100, higher = more urgent).
   */
  getUrgencyScore(data: RequestSLAData): number {
    const result = this.checkSLAStatus(data);

    if (result.isBreached) return 100;
    if (!result.timeToDeadline) return 0;

    const totalTime =
      new Date(data.slaDeadline!).getTime() -
      new Date(data.createdAt).getTime();
    const remainingPercent = (result.timeToDeadline / totalTime) * 100;

    // Invert: less time remaining = higher urgency
    return Math.max(0, Math.min(100, 100 - remainingPercent));
  }
}
