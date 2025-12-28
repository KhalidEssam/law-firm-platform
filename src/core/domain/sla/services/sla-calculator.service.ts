// src/core/domain/sla/services/sla-calculator.service.ts

import { SLAPolicy } from '../entities/sla-policy.entity';
import { SLADeadlines } from '../value-objects/sla-deadlines.vo';
import { SLAStatus, getMostSevereStatus } from '../value-objects/sla-status.vo';
import { Priority } from '../value-objects/priority.vo';
import {
  RequestType,
  DEFAULT_SLA_TIMES,
} from '../value-objects/request-type.vo';
import { SLATimes } from '../value-objects/sla-times.vo';

/**
 * Request SLA Info - current status of a request's SLA
 */
export interface RequestSLAInfo {
  requestId: string;
  requestType: RequestType;
  priority: Priority;
  status: SLAStatus;
  responseStatus: SLAStatus;
  resolutionStatus: SLAStatus;
  deadlines: {
    response: Date;
    resolution: Date;
    escalation: Date | null;
  };
  timeRemaining: {
    response: number; // milliseconds
    resolution: number;
  };
  percentElapsed: {
    response: number;
    resolution: number;
  };
  isEscalationRequired: boolean;
  policyId: string | null;
}

/**
 * Breach Info - details about an SLA breach
 */
export interface SLABreachInfo {
  requestId: string;
  requestType: RequestType;
  breachType: 'response' | 'resolution';
  breachedAt: Date;
  deadline: Date;
  overdueDuration: number; // milliseconds
}

/**
 * SLA Calculator Domain Service
 * Handles all SLA calculations and status checks
 */
export class SLACalculatorService {
  /**
   * Calculate SLA deadlines for a new request
   */
  calculateDeadlines(
    policy: SLAPolicy | null,
    requestType: RequestType,
    priority: Priority,
    startDate: Date = new Date(),
  ): SLADeadlines {
    if (policy) {
      return policy.calculateDeadlines(startDate, priority);
    }

    // Fall back to default times if no policy exists
    const defaults = DEFAULT_SLA_TIMES[requestType];
    const times = SLATimes.create({
      responseTime: defaults.response,
      resolutionTime: defaults.resolution,
      escalationTime: defaults.escalation,
    });

    // Adjust for priority
    const adjustedTimes = times.adjustForPriority(priority);
    return SLADeadlines.calculate(adjustedTimes, startDate);
  }

  /**
   * Calculate current SLA status for a request
   */
  calculateStatus(
    deadlines: SLADeadlines,
    responded: boolean,
    resolved: boolean,
    now: Date = new Date(),
  ): SLAStatus {
    return deadlines.getOverallStatus(responded, resolved, now);
  }

  /**
   * Get detailed SLA info for a request
   */
  getRequestSLAInfo(
    requestId: string,
    requestType: RequestType,
    priority: Priority,
    deadlines: SLADeadlines,
    responded: boolean,
    resolved: boolean,
    policyId: string | null,
    now: Date = new Date(),
  ): RequestSLAInfo {
    const responseStatus = deadlines.getResponseStatus(responded, now);
    const resolutionStatus = deadlines.getResolutionStatus(resolved, now);
    const overallStatus = getMostSevereStatus([
      responseStatus,
      resolutionStatus,
    ]);

    return {
      requestId,
      requestType,
      priority,
      status: overallStatus,
      responseStatus,
      resolutionStatus,
      deadlines: {
        response: deadlines.responseDeadline,
        resolution: deadlines.resolutionDeadline,
        escalation: deadlines.escalationDeadline,
      },
      timeRemaining: {
        response: deadlines.getResponseTimeRemaining(now),
        resolution: deadlines.getResolutionTimeRemaining(now),
      },
      percentElapsed: {
        response: deadlines.getResponseTimeElapsedPercent(now),
        resolution: deadlines.getResolutionTimeElapsedPercent(now),
      },
      isEscalationRequired: deadlines.isEscalationRequired(now),
      policyId,
    };
  }

  /**
   * Check if a request has any SLA breaches
   */
  checkBreaches(
    requestId: string,
    requestType: RequestType,
    deadlines: SLADeadlines,
    responded: boolean,
    resolved: boolean,
    now: Date = new Date(),
  ): SLABreachInfo[] {
    const breaches: SLABreachInfo[] = [];

    // Check response breach
    if (!responded && deadlines.isResponseBreached(now)) {
      breaches.push({
        requestId,
        requestType,
        breachType: 'response',
        breachedAt: deadlines.responseDeadline,
        deadline: deadlines.responseDeadline,
        overdueDuration: now.getTime() - deadlines.responseDeadline.getTime(),
      });
    }

    // Check resolution breach
    if (!resolved && deadlines.isResolutionBreached(now)) {
      breaches.push({
        requestId,
        requestType,
        breachType: 'resolution',
        breachedAt: deadlines.resolutionDeadline,
        deadline: deadlines.resolutionDeadline,
        overdueDuration: now.getTime() - deadlines.resolutionDeadline.getTime(),
      });
    }

    return breaches;
  }

  /**
   * Get requests that are at risk of breaching SLA
   * @param threshold Percentage of time elapsed to consider "at risk" (default 75%)
   */
  isAtRisk(
    deadlines: SLADeadlines,
    responded: boolean,
    resolved: boolean,
    now: Date = new Date(),
    threshold: number = 75,
  ): { response: boolean; resolution: boolean } {
    return {
      response:
        !responded && deadlines.getResponseTimeElapsedPercent(now) >= threshold,
      resolution:
        !resolved &&
        deadlines.getResolutionTimeElapsedPercent(now) >= threshold,
    };
  }

  /**
   * Calculate when a request will become at risk
   */
  calculateAtRiskTime(
    deadlines: SLADeadlines,
    threshold: number = 75,
  ): { response: Date; resolution: Date } {
    const responseTotal =
      deadlines.responseDeadline.getTime() - deadlines.createdAt.getTime();
    const resolutionTotal =
      deadlines.resolutionDeadline.getTime() - deadlines.createdAt.getTime();

    return {
      response: new Date(
        deadlines.createdAt.getTime() + (responseTotal * threshold) / 100,
      ),
      resolution: new Date(
        deadlines.createdAt.getTime() + (resolutionTotal * threshold) / 100,
      ),
    };
  }

  /**
   * Format duration for display
   */
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  }

  /**
   * Get urgency score for prioritization (higher = more urgent)
   */
  getUrgencyScore(
    deadlines: SLADeadlines,
    priority: Priority,
    responded: boolean,
    resolved: boolean,
    now: Date = new Date(),
  ): number {
    if (resolved) return 0;

    const priorityWeight = {
      [Priority.LOW]: 1,
      [Priority.NORMAL]: 2,
      [Priority.HIGH]: 3,
      [Priority.URGENT]: 4,
    };

    const statusWeight = {
      [SLAStatus.ON_TRACK]: 1,
      [SLAStatus.AT_RISK]: 3,
      [SLAStatus.BREACHED]: 5,
    };

    const status = deadlines.getOverallStatus(responded, resolved, now);
    deadlines.getResolutionTimeRemaining(now);
    const percentElapsed = deadlines.getResolutionTimeElapsedPercent(now);

    // Higher score = more urgent
    return (
      priorityWeight[priority] * 10 + statusWeight[status] * 20 + percentElapsed
    );
  }
}
