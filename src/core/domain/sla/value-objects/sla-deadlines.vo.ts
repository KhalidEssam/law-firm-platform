// src/core/domain/sla/value-objects/sla-deadlines.vo.ts

import { SLATimes } from './sla-times.vo';
import { SLAStatus } from './sla-status.vo';

/**
 * SLA Deadlines Value Object
 * Represents calculated deadline timestamps for a specific request
 */
export interface SLADeadlinesData {
    responseDeadline: Date;
    resolutionDeadline: Date;
    escalationDeadline?: Date;
    createdAt: Date;
}

/**
 * Threshold percentage for "at risk" status
 * When this percentage of time has passed, status becomes AT_RISK
 */
const AT_RISK_THRESHOLD = 0.75; // 75% of time elapsed

export class SLADeadlines {
    private constructor(
        public readonly responseDeadline: Date,
        public readonly resolutionDeadline: Date,
        public readonly escalationDeadline: Date | null,
        public readonly createdAt: Date,
    ) {}

    /**
     * Calculate deadlines from SLA times and start date
     */
    static calculate(times: SLATimes, startDate: Date = new Date()): SLADeadlines {
        const responseDeadline = new Date(startDate.getTime() + times.responseTime * 60 * 1000);
        const resolutionDeadline = new Date(startDate.getTime() + times.resolutionTime * 60 * 1000);
        const escalationDeadline = times.escalationTime
            ? new Date(startDate.getTime() + times.escalationTime * 60 * 1000)
            : null;

        return new SLADeadlines(
            responseDeadline,
            resolutionDeadline,
            escalationDeadline,
            startDate,
        );
    }

    /**
     * Reconstruct from data
     */
    static fromData(data: SLADeadlinesData): SLADeadlines {
        return new SLADeadlines(
            new Date(data.responseDeadline),
            new Date(data.resolutionDeadline),
            data.escalationDeadline ? new Date(data.escalationDeadline) : null,
            new Date(data.createdAt),
        );
    }

    /**
     * Check if response deadline is breached
     */
    isResponseBreached(now: Date = new Date()): boolean {
        return now > this.responseDeadline;
    }

    /**
     * Check if resolution deadline is breached
     */
    isResolutionBreached(now: Date = new Date()): boolean {
        return now > this.resolutionDeadline;
    }

    /**
     * Check if escalation deadline is passed
     */
    isEscalationRequired(now: Date = new Date()): boolean {
        if (!this.escalationDeadline) return false;
        return now > this.escalationDeadline;
    }

    /**
     * Get current SLA status for response
     */
    getResponseStatus(responded: boolean, now: Date = new Date()): SLAStatus {
        if (responded) return SLAStatus.ON_TRACK;
        if (this.isResponseBreached(now)) return SLAStatus.BREACHED;
        if (this.isResponseAtRisk(now)) return SLAStatus.AT_RISK;
        return SLAStatus.ON_TRACK;
    }

    /**
     * Get current SLA status for resolution
     */
    getResolutionStatus(resolved: boolean, now: Date = new Date()): SLAStatus {
        if (resolved) return SLAStatus.ON_TRACK;
        if (this.isResolutionBreached(now)) return SLAStatus.BREACHED;
        if (this.isResolutionAtRisk(now)) return SLAStatus.AT_RISK;
        return SLAStatus.ON_TRACK;
    }

    /**
     * Get overall SLA status (worst of response and resolution)
     */
    getOverallStatus(responded: boolean, resolved: boolean, now: Date = new Date()): SLAStatus {
        const responseStatus = this.getResponseStatus(responded, now);
        const resolutionStatus = this.getResolutionStatus(resolved, now);

        // Return the worst status
        if (responseStatus === SLAStatus.BREACHED || resolutionStatus === SLAStatus.BREACHED) {
            return SLAStatus.BREACHED;
        }
        if (responseStatus === SLAStatus.AT_RISK || resolutionStatus === SLAStatus.AT_RISK) {
            return SLAStatus.AT_RISK;
        }
        return SLAStatus.ON_TRACK;
    }

    /**
     * Check if response is at risk (>75% time elapsed)
     */
    private isResponseAtRisk(now: Date): boolean {
        const totalTime = this.responseDeadline.getTime() - this.createdAt.getTime();
        const elapsedTime = now.getTime() - this.createdAt.getTime();
        return elapsedTime / totalTime >= AT_RISK_THRESHOLD;
    }

    /**
     * Check if resolution is at risk (>75% time elapsed)
     */
    private isResolutionAtRisk(now: Date): boolean {
        const totalTime = this.resolutionDeadline.getTime() - this.createdAt.getTime();
        const elapsedTime = now.getTime() - this.createdAt.getTime();
        return elapsedTime / totalTime >= AT_RISK_THRESHOLD;
    }

    /**
     * Get time remaining until response deadline
     */
    getResponseTimeRemaining(now: Date = new Date()): number {
        return Math.max(0, this.responseDeadline.getTime() - now.getTime());
    }

    /**
     * Get time remaining until resolution deadline
     */
    getResolutionTimeRemaining(now: Date = new Date()): number {
        return Math.max(0, this.resolutionDeadline.getTime() - now.getTime());
    }

    /**
     * Get percentage of response time elapsed
     */
    getResponseTimeElapsedPercent(now: Date = new Date()): number {
        const totalTime = this.responseDeadline.getTime() - this.createdAt.getTime();
        const elapsedTime = Math.min(now.getTime() - this.createdAt.getTime(), totalTime);
        return Math.round((elapsedTime / totalTime) * 100);
    }

    /**
     * Get percentage of resolution time elapsed
     */
    getResolutionTimeElapsedPercent(now: Date = new Date()): number {
        const totalTime = this.resolutionDeadline.getTime() - this.createdAt.getTime();
        const elapsedTime = Math.min(now.getTime() - this.createdAt.getTime(), totalTime);
        return Math.round((elapsedTime / totalTime) * 100);
    }

    /**
     * Serialize to plain object
     */
    toJSON(): SLADeadlinesData {
        return {
            responseDeadline: this.responseDeadline,
            resolutionDeadline: this.resolutionDeadline,
            escalationDeadline: this.escalationDeadline ?? undefined,
            createdAt: this.createdAt,
        };
    }
}
