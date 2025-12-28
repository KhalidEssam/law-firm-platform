// src/core/domain/call-request/entities/call-request.entity.ts

import crypto from 'crypto';
import {
  CallStatus,
  isValidStatusTransition,
  canModifyCall,
  isTerminalStatus,
} from '../value-objects/call-status.vo';
import {
  CallPlatform,
  CallPlatformType,
} from '../value-objects/call-platform.vo';
import { Duration, MAX_CALL_DURATION } from '../value-objects/duration.vo';

export interface CallRequestProps {
  id?: string;
  requestNumber?: string;
  subscriberId: string;
  assignedProviderId?: string | null;
  consultationType?: string | null;
  purpose: string;
  preferredDate?: Date | null;
  preferredTime?: string | null;
  status?: CallStatus;
  scheduledAt?: Date | null;
  scheduledDuration?: number | null;
  actualDuration?: number | null;
  callStartedAt?: Date | null;
  callEndedAt?: Date | null;
  recordingUrl?: string | null;
  callPlatform?: string | null;
  callLink?: string | null;
  submittedAt?: Date;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * CallRequest Entity - Aggregate Root
 * Represents a video/audio call consultation request
 */
export class CallRequest {
  private constructor(
    public readonly id: string,
    public readonly requestNumber: string,
    public readonly subscriberId: string,
    private _assignedProviderId: string | null,
    private _consultationType: string | null,
    private _purpose: string,
    private _preferredDate: Date | null,
    private _preferredTime: string | null,
    private _status: CallStatus,
    private _scheduledAt: Date | null,
    private _scheduledDuration: number | null,
    private _actualDuration: number | null,
    private _callStartedAt: Date | null,
    private _callEndedAt: Date | null,
    private _recordingUrl: string | null,
    private _callPlatform: string | null,
    private _callLink: string | null,
    public readonly submittedAt: Date,
    private _completedAt: Date | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ============================================
  // FACTORY METHODS
  // ============================================

  /**
   * Create a new CallRequest
   */
  static create(props: CallRequestProps): CallRequest {
    const now = new Date();
    return new CallRequest(
      props.id || crypto.randomUUID(),
      props.requestNumber || CallRequest.generateRequestNumber(),
      props.subscriberId,
      props.assignedProviderId || null,
      props.consultationType || null,
      props.purpose,
      props.preferredDate || null,
      props.preferredTime || null,
      props.status || CallStatus.PENDING,
      props.scheduledAt || null,
      props.scheduledDuration || null,
      props.actualDuration || null,
      props.callStartedAt || null,
      props.callEndedAt || null,
      props.recordingUrl || null,
      props.callPlatform || null,
      props.callLink || null,
      props.submittedAt || now,
      props.completedAt || null,
      props.createdAt || now,
      props.updatedAt || now,
    );
  }

  /**
   * Rehydrate from persistence
   */
  static rehydrate(
    props: Required<Omit<CallRequestProps, 'status'>> & { status: CallStatus },
  ): CallRequest {
    return new CallRequest(
      props.id,
      props.requestNumber,
      props.subscriberId,
      props.assignedProviderId,
      props.consultationType,
      props.purpose,
      props.preferredDate,
      props.preferredTime,
      props.status,
      props.scheduledAt,
      props.scheduledDuration,
      props.actualDuration,
      props.callStartedAt,
      props.callEndedAt,
      props.recordingUrl,
      props.callPlatform,
      props.callLink,
      props.submittedAt,
      props.completedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  /**
   * Generate a unique request number
   */
  private static generateRequestNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CALL-${timestamp}-${random}`;
  }

  // ============================================
  // GETTERS
  // ============================================

  get assignedProviderId(): string | null {
    return this._assignedProviderId;
  }

  get consultationType(): string | null {
    return this._consultationType;
  }

  get purpose(): string {
    return this._purpose;
  }

  get preferredDate(): Date | null {
    return this._preferredDate;
  }

  get preferredTime(): string | null {
    return this._preferredTime;
  }

  get status(): CallStatus {
    return this._status;
  }

  get scheduledAt(): Date | null {
    return this._scheduledAt;
  }

  get scheduledDuration(): number | null {
    return this._scheduledDuration;
  }

  get actualDuration(): number | null {
    return this._actualDuration;
  }

  get callStartedAt(): Date | null {
    return this._callStartedAt;
  }

  get callEndedAt(): Date | null {
    return this._callEndedAt;
  }

  get recordingUrl(): string | null {
    return this._recordingUrl;
  }

  get callPlatform(): string | null {
    return this._callPlatform;
  }

  get callLink(): string | null {
    return this._callLink;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============================================
  // DOMAIN METHODS
  // ============================================

  /**
   * Assign a provider to this call request
   */
  assignProvider(providerId: string): void {
    if (!canModifyCall(this._status)) {
      throw new Error(
        `Cannot assign provider when call is in ${this._status} status`,
      );
    }

    this._assignedProviderId = providerId;
    this.transitionTo(CallStatus.ASSIGNED);
  }

  /**
   * Schedule the call
   */
  schedule(props: {
    scheduledAt: Date;
    durationMinutes: number;
    platform?: CallPlatformType;
    callLink?: string;
  }): void {
    if (!this._assignedProviderId) {
      throw new Error('Cannot schedule call without an assigned provider');
    }

    if (props.scheduledAt < new Date()) {
      throw new Error('Cannot schedule call in the past');
    }

    const duration = Duration.fromMinutes(props.durationMinutes);
    if (duration.isGreaterThan(MAX_CALL_DURATION)) {
      throw new Error(
        `Call duration cannot exceed ${MAX_CALL_DURATION.format()}`,
      );
    }

    this._scheduledAt = props.scheduledAt;
    this._scheduledDuration = props.durationMinutes;
    this._callPlatform = props.platform || CallPlatformType.INTERNAL;
    this._callLink = props.callLink || null;
    this.transitionTo(CallStatus.SCHEDULED);
  }

  /**
   * Reschedule the call
   */
  reschedule(props: {
    scheduledAt: Date;
    durationMinutes?: number;
    reason?: string;
  }): void {
    if (
      ![
        CallStatus.SCHEDULED,
        CallStatus.NO_SHOW,
        CallStatus.RESCHEDULED,
      ].includes(this._status)
    ) {
      throw new Error(`Cannot reschedule call in ${this._status} status`);
    }

    if (props.scheduledAt < new Date()) {
      throw new Error('Cannot reschedule call to a past time');
    }

    this._scheduledAt = props.scheduledAt;
    if (props.durationMinutes) {
      this._scheduledDuration = props.durationMinutes;
    }
    this.transitionTo(CallStatus.RESCHEDULED);
  }

  /**
   * Start the call
   */
  startCall(): void {
    if (this._status !== CallStatus.SCHEDULED) {
      throw new Error(
        `Cannot start call in ${this._status} status. Call must be scheduled first.`,
      );
    }

    this._callStartedAt = new Date();
    this.transitionTo(CallStatus.IN_PROGRESS);
  }

  /**
   * End the call
   */
  endCall(recordingUrl?: string): void {
    if (this._status !== CallStatus.IN_PROGRESS) {
      throw new Error(
        `Cannot end call in ${this._status} status. Call must be in progress.`,
      );
    }

    const endTime = new Date();
    this._callEndedAt = endTime;
    this._completedAt = endTime;

    // Calculate actual duration
    if (this._callStartedAt) {
      const duration = Duration.fromTimeRange(this._callStartedAt, endTime);
      this._actualDuration = duration.minutes;
    }

    if (recordingUrl) {
      this._recordingUrl = recordingUrl;
    }

    this.transitionTo(CallStatus.COMPLETED);
  }

  /**
   * Cancel the call
   */
  cancel(reason?: string): void {
    if (isTerminalStatus(this._status)) {
      throw new Error(`Cannot cancel call in ${this._status} status`);
    }

    if (this._status === CallStatus.IN_PROGRESS) {
      throw new Error(
        'Cannot cancel a call that is in progress. End the call instead.',
      );
    }

    this.transitionTo(CallStatus.CANCELLED);
  }

  /**
   * Mark as no-show
   */
  markNoShow(): void {
    if (this._status !== CallStatus.SCHEDULED) {
      throw new Error(`Cannot mark as no-show in ${this._status} status`);
    }

    this.transitionTo(CallStatus.NO_SHOW);
  }

  /**
   * Update call link
   */
  updateCallLink(callLink: string, platform?: CallPlatformType): void {
    if (!canModifyCall(this._status)) {
      throw new Error(`Cannot update call link in ${this._status} status`);
    }

    this._callLink = callLink;
    if (platform) {
      this._callPlatform = platform;
    }
    this.touch();
  }

  /**
   * Set recording URL
   */
  setRecordingUrl(url: string): void {
    if (this._status !== CallStatus.COMPLETED) {
      throw new Error('Can only set recording URL for completed calls');
    }

    this._recordingUrl = url;
    this.touch();
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * Check if call is active (not in terminal state)
   */
  isActive(): boolean {
    return !isTerminalStatus(this._status);
  }

  /**
   * Check if call is scheduled
   */
  isScheduled(): boolean {
    return this._status === CallStatus.SCHEDULED && this._scheduledAt !== null;
  }

  /**
   * Check if call is in progress
   */
  isInProgress(): boolean {
    return this._status === CallStatus.IN_PROGRESS;
  }

  /**
   * Check if call is completed
   */
  isCompleted(): boolean {
    return this._status === CallStatus.COMPLETED;
  }

  /**
   * Check if call has provider
   */
  hasProvider(): boolean {
    return this._assignedProviderId !== null;
  }

  /**
   * Get scheduled duration as Duration value object
   */
  getScheduledDuration(): Duration | null {
    return this._scheduledDuration
      ? Duration.fromMinutes(this._scheduledDuration)
      : null;
  }

  /**
   * Get actual duration as Duration value object
   */
  getActualDuration(): Duration | null {
    return this._actualDuration
      ? Duration.fromMinutes(this._actualDuration)
      : null;
  }

  /**
   * Get billable minutes (rounded up to billing unit)
   */
  getBillableMinutes(billingUnitMinutes: number = 15): number {
    const duration = this.getActualDuration();
    if (!duration) return 0;
    return duration.getBillableUnits(billingUnitMinutes) * billingUnitMinutes;
  }

  /**
   * Check if call is overdue (scheduled time has passed without starting)
   */
  isOverdue(): boolean {
    if (this._status !== CallStatus.SCHEDULED || !this._scheduledAt) {
      return false;
    }
    return new Date() > this._scheduledAt;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private transitionTo(newStatus: CallStatus): void {
    if (!isValidStatusTransition(this._status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${this._status} to ${newStatus}`,
      );
    }
    this._status = newStatus;
    this.touch();
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  toObject(): {
    id: string;
    requestNumber: string;
    subscriberId: string;
    assignedProviderId: string | null;
    consultationType: string | null;
    purpose: string;
    preferredDate: Date | null;
    preferredTime: string | null;
    status: CallStatus;
    scheduledAt: Date | null;
    scheduledDuration: number | null;
    actualDuration: number | null;
    callStartedAt: Date | null;
    callEndedAt: Date | null;
    recordingUrl: string | null;
    callPlatform: string | null;
    callLink: string | null;
    submittedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      requestNumber: this.requestNumber,
      subscriberId: this.subscriberId,
      assignedProviderId: this._assignedProviderId,
      consultationType: this._consultationType,
      purpose: this._purpose,
      preferredDate: this._preferredDate,
      preferredTime: this._preferredTime,
      status: this._status,
      scheduledAt: this._scheduledAt,
      scheduledDuration: this._scheduledDuration,
      actualDuration: this._actualDuration,
      callStartedAt: this._callStartedAt,
      callEndedAt: this._callEndedAt,
      recordingUrl: this._recordingUrl,
      callPlatform: this._callPlatform,
      callLink: this._callLink,
      submittedAt: this.submittedAt,
      completedAt: this._completedAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
