// ============================================
// LITIGATION STATUS HISTORY ENTITY
// src/core/domain/litigation-case/entities/litigation-status-history.entity.ts
// ============================================

import {
  CaseId,
  UserId,
  CaseStatus,
} from '../value-objects/litigation-case.vo';

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

export interface LitigationStatusHistoryProps {
  id: StatusHistoryId;
  litigationCaseId: CaseId;
  fromStatus?: CaseStatus;
  toStatus: CaseStatus;
  reason?: string;
  changedBy?: UserId;
  changedAt: Date;
}

export interface LitigationStatusHistoryCreateProps {
  litigationCaseId: CaseId;
  fromStatus?: CaseStatus;
  toStatus: CaseStatus;
  reason?: string;
  changedBy?: UserId;
}

export interface LitigationStatusHistoryRehydrateProps {
  id: string;
  litigationCaseId: string;
  fromStatus?: string;
  toStatus: string;
  reason?: string;
  changedBy?: string;
  changedAt: Date;
}

/**
 * Litigation Status History Entity.
 *
 * Records status transitions for litigation cases to maintain
 * an audit trail of all state changes.
 */
export class LitigationStatusHistory {
  private props: LitigationStatusHistoryProps;

  private constructor(props: LitigationStatusHistoryProps) {
    this.props = props;
  }

  /**
   * Creates a new status history entry.
   */
  static create(
    params: LitigationStatusHistoryCreateProps,
  ): LitigationStatusHistory {
    const props: LitigationStatusHistoryProps = {
      id: StatusHistoryId.generate(),
      litigationCaseId: params.litigationCaseId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      reason: params.reason,
      changedBy: params.changedBy,
      changedAt: new Date(),
    };

    return new LitigationStatusHistory(props);
  }

  /**
   * Reconstitutes a status history from persisted data.
   */
  static rehydrate(
    props: LitigationStatusHistoryRehydrateProps,
  ): LitigationStatusHistory {
    return new LitigationStatusHistory({
      id: StatusHistoryId.create(props.id),
      litigationCaseId: CaseId.create(props.litigationCaseId),
      fromStatus: props.fromStatus
        ? CaseStatus.create(props.fromStatus)
        : undefined,
      toStatus: CaseStatus.create(props.toStatus),
      reason: props.reason,
      changedBy: props.changedBy ? UserId.create(props.changedBy) : undefined,
      changedAt: props.changedAt,
    });
  }

  get id(): StatusHistoryId {
    return this.props.id;
  }

  get litigationCaseId(): CaseId {
    return this.props.litigationCaseId;
  }

  get fromStatus(): CaseStatus | undefined {
    return this.props.fromStatus;
  }

  get toStatus(): CaseStatus {
    return this.props.toStatus;
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get changedBy(): UserId | undefined {
    return this.props.changedBy;
  }

  get changedAt(): Date {
    return this.props.changedAt;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      litigationCaseId: this.litigationCaseId.getValue(),
      fromStatus: this.fromStatus?.getValue(),
      toStatus: this.toStatus.getValue(),
      reason: this.reason,
      changedBy: this.changedBy?.getValue(),
      changedAt: this.changedAt.toISOString(),
    };
  }
}
