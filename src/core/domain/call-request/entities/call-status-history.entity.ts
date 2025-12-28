// ============================================
// CALL STATUS HISTORY ENTITY
// src/core/domain/call-request/entities/call-status-history.entity.ts
// ============================================

import crypto from 'crypto';
import { CallStatus } from '../value-objects/call-status.vo';

export class StatusHistoryId {
  private constructor(private readonly value: string) {}

  static create(value: string): StatusHistoryId {
    if (!value || value.trim().length === 0) {
      throw new Error('Status History ID cannot be empty');
    }
    return new StatusHistoryId(value);
  }

  static generate(): StatusHistoryId {
    return new StatusHistoryId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: StatusHistoryId): boolean {
    return this.value === other.value;
  }
}

export interface CallStatusHistoryProps {
  id: StatusHistoryId;
  callRequestId: string;
  fromStatus?: CallStatus;
  toStatus: CallStatus;
  reason?: string;
  changedBy?: string;
  changedAt: Date;
}

export interface CallStatusHistoryCreateProps {
  callRequestId: string;
  fromStatus?: CallStatus;
  toStatus: CallStatus;
  reason?: string;
  changedBy?: string;
}

export interface CallStatusHistoryRehydrateProps {
  id: string;
  callRequestId: string;
  fromStatus?: string;
  toStatus: string;
  reason?: string;
  changedBy?: string;
  changedAt: Date;
}

/**
 * Call Status History Entity.
 *
 * Records status transitions for call requests to maintain
 * an audit trail of all state changes.
 */
export class CallStatusHistory {
  private props: CallStatusHistoryProps;

  private constructor(props: CallStatusHistoryProps) {
    this.props = props;
  }

  /**
   * Creates a new status history entry.
   */
  static create(params: CallStatusHistoryCreateProps): CallStatusHistory {
    const props: CallStatusHistoryProps = {
      id: StatusHistoryId.generate(),
      callRequestId: params.callRequestId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      reason: params.reason,
      changedBy: params.changedBy,
      changedAt: new Date(),
    };

    return new CallStatusHistory(props);
  }

  /**
   * Reconstitutes a status history from persisted data.
   */
  static rehydrate(props: CallStatusHistoryRehydrateProps): CallStatusHistory {
    return new CallStatusHistory({
      id: StatusHistoryId.create(props.id),
      callRequestId: props.callRequestId,
      fromStatus: props.fromStatus
        ? (props.fromStatus as CallStatus)
        : undefined,
      toStatus: props.toStatus as CallStatus,
      reason: props.reason,
      changedBy: props.changedBy,
      changedAt: props.changedAt,
    });
  }

  get id(): StatusHistoryId {
    return this.props.id;
  }

  get callRequestId(): string {
    return this.props.callRequestId;
  }

  get fromStatus(): CallStatus | undefined {
    return this.props.fromStatus;
  }

  get toStatus(): CallStatus {
    return this.props.toStatus;
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get changedBy(): string | undefined {
    return this.props.changedBy;
  }

  get changedAt(): Date {
    return this.props.changedAt;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      callRequestId: this.callRequestId,
      fromStatus: this.fromStatus,
      toStatus: this.toStatus,
      reason: this.reason,
      changedBy: this.changedBy,
      changedAt: this.changedAt.toISOString(),
    };
  }
}
