// src/core/domain/sla/entities/sla-policy.entity.ts

import crypto from 'crypto';
import { RequestType, isValidRequestType, DEFAULT_SLA_TIMES } from '../value-objects/request-type.vo';
import { Priority, isValidPriority } from '../value-objects/priority.vo';
import { SLATimes, SLATimesData } from '../value-objects/sla-times.vo';
import { SLADeadlines } from '../value-objects/sla-deadlines.vo';

/**
 * SLA Policy Props for creation
 */
export interface SLAPolicyProps {
    id?: string;
    name: string;
    requestType: RequestType | string;
    priority?: Priority | string;
    responseTime: number;      // Minutes
    resolutionTime: number;    // Minutes
    escalationTime?: number;   // Minutes (optional)
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * SLA Policy Entity - Aggregate Root
 * Represents a Service Level Agreement policy for a specific request type and priority
 */
export class SLAPolicy {
    private constructor(
        public readonly id: string,
        private _name: string,
        private _requestType: RequestType,
        private _priority: Priority,
        private _times: SLATimes,
        private _isActive: boolean,
        public readonly createdAt: Date,
        private _updatedAt: Date,
    ) {}

    // ============================================
    // FACTORY METHODS
    // ============================================

    /**
     * Create a new SLA Policy
     */
    static create(props: SLAPolicyProps): SLAPolicy {
        const now = new Date();

        // Validate and convert request type
        const requestType = typeof props.requestType === 'string'
            ? (isValidRequestType(props.requestType) ? props.requestType as RequestType : RequestType.CONSULTATION)
            : props.requestType;

        // Validate and convert priority
        const priority = typeof props.priority === 'string'
            ? (isValidPriority(props.priority) ? props.priority as Priority : Priority.NORMAL)
            : (props.priority ?? Priority.NORMAL);

        // Create SLA times
        const times = SLATimes.create({
            responseTime: props.responseTime,
            resolutionTime: props.resolutionTime,
            escalationTime: props.escalationTime,
        });

        return new SLAPolicy(
            props.id || crypto.randomUUID(),
            props.name,
            requestType,
            priority,
            times,
            props.isActive ?? true,
            props.createdAt || now,
            props.updatedAt || now,
        );
    }

    /**
     * Create a default SLA Policy for a request type
     */
    static createDefault(requestType: RequestType, priority: Priority = Priority.NORMAL): SLAPolicy {
        const defaults = DEFAULT_SLA_TIMES[requestType];

        return SLAPolicy.create({
            name: `Default ${requestType} - ${priority}`,
            requestType,
            priority,
            responseTime: defaults.response,
            resolutionTime: defaults.resolution,
            escalationTime: defaults.escalation,
        });
    }

    /**
     * Rehydrate from persistence
     */
    static rehydrate(props: {
        id: string;
        name: string;
        requestType: string;
        priority: string;
        responseTime: number;
        resolutionTime: number;
        escalationTime: number | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): SLAPolicy {
        const times = SLATimes.create({
            responseTime: props.responseTime,
            resolutionTime: props.resolutionTime,
            escalationTime: props.escalationTime ?? undefined,
        });

        return new SLAPolicy(
            props.id,
            props.name,
            props.requestType as RequestType,
            props.priority as Priority,
            times,
            props.isActive,
            props.createdAt,
            props.updatedAt,
        );
    }

    // ============================================
    // GETTERS
    // ============================================

    get name(): string {
        return this._name;
    }

    get requestType(): RequestType {
        return this._requestType;
    }

    get priority(): Priority {
        return this._priority;
    }

    get times(): SLATimes {
        return this._times;
    }

    get responseTime(): number {
        return this._times.responseTime;
    }

    get resolutionTime(): number {
        return this._times.resolutionTime;
    }

    get escalationTime(): number | null {
        return this._times.escalationTime;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    // ============================================
    // DOMAIN METHODS - SLA Calculation
    // ============================================

    /**
     * Calculate SLA deadlines for a request starting at the given date
     * @param startDate When the request was created
     * @param requestPriority Optional override priority for the request
     */
    calculateDeadlines(startDate: Date = new Date(), requestPriority?: Priority): SLADeadlines {
        // If request has different priority than policy default, adjust times
        const times = requestPriority && requestPriority !== this._priority
            ? this._times.adjustForPriority(requestPriority)
            : this._times;

        return SLADeadlines.calculate(times, startDate);
    }

    /**
     * Check if this policy matches the given request type and priority
     */
    matches(requestType: RequestType, priority?: Priority): boolean {
        if (this._requestType !== requestType) return false;
        if (priority && this._priority !== priority) return false;
        return this._isActive;
    }

    /**
     * Get human-readable time descriptions
     */
    getTimeDescriptions(): {
        response: string;
        resolution: string;
        escalation: string | null;
    } {
        return {
            response: SLATimes.formatMinutes(this._times.responseTime),
            resolution: SLATimes.formatMinutes(this._times.resolutionTime),
            escalation: this._times.escalationTime
                ? SLATimes.formatMinutes(this._times.escalationTime)
                : null,
        };
    }

    // ============================================
    // DOMAIN METHODS - Policy Management
    // ============================================

    /**
     * Update the policy name
     */
    updateName(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new Error('Policy name cannot be empty');
        }
        this._name = name.trim();
        this.touch();
    }

    /**
     * Update the SLA times
     */
    updateTimes(times: SLATimesData): void {
        this._times = SLATimes.create(times);
        this.touch();
    }

    /**
     * Update the response time
     */
    updateResponseTime(minutes: number): void {
        this._times = SLATimes.create({
            responseTime: minutes,
            resolutionTime: this._times.resolutionTime,
            escalationTime: this._times.escalationTime ?? undefined,
        });
        this.touch();
    }

    /**
     * Update the resolution time
     */
    updateResolutionTime(minutes: number): void {
        this._times = SLATimes.create({
            responseTime: this._times.responseTime,
            resolutionTime: minutes,
            escalationTime: this._times.escalationTime ?? undefined,
        });
        this.touch();
    }

    /**
     * Update the escalation time
     */
    updateEscalationTime(minutes: number | null): void {
        this._times = SLATimes.create({
            responseTime: this._times.responseTime,
            resolutionTime: this._times.resolutionTime,
            escalationTime: minutes ?? undefined,
        });
        this.touch();
    }

    /**
     * Update the priority level
     */
    updatePriority(priority: Priority): void {
        this._priority = priority;
        this.touch();
    }

    /**
     * Activate the policy
     */
    activate(): void {
        this._isActive = true;
        this.touch();
    }

    /**
     * Deactivate the policy
     */
    deactivate(): void {
        this._isActive = false;
        this.touch();
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private touch(): void {
        this._updatedAt = new Date();
    }

    // ============================================
    // SERIALIZATION
    // ============================================

    toObject(): {
        id: string;
        name: string;
        requestType: RequestType;
        priority: Priority;
        responseTime: number;
        resolutionTime: number;
        escalationTime: number | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } {
        return {
            id: this.id,
            name: this._name,
            requestType: this._requestType,
            priority: this._priority,
            responseTime: this._times.responseTime,
            resolutionTime: this._times.resolutionTime,
            escalationTime: this._times.escalationTime,
            isActive: this._isActive,
            createdAt: this.createdAt,
            updatedAt: this._updatedAt,
        };
    }

    /**
     * Generate a unique key for this policy (requestType + priority)
     */
    getKey(): string {
        return `${this._requestType}:${this._priority}`;
    }
}
