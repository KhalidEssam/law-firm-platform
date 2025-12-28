// ============================================
// LEGAL OPINION STATUS HISTORY ENTITY
// src/core/domain/legal-opinion/entities/legal-opinion-status-history.entity.ts
// ============================================

import crypto from 'crypto';
import { OpinionStatus } from '../value-objects/opinion-status.vo';

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

export interface LegalOpinionStatusHistoryProps {
  id: StatusHistoryId;
  legalOpinionId: string;
  fromStatus?: OpinionStatus;
  toStatus: OpinionStatus;
  reason?: string;
  changedBy?: string;
  changedAt: Date;
}

export interface LegalOpinionStatusHistoryCreateProps {
  legalOpinionId: string;
  fromStatus?: OpinionStatus;
  toStatus: OpinionStatus;
  reason?: string;
  changedBy?: string;
}

export interface LegalOpinionStatusHistoryRehydrateProps {
  id: string;
  legalOpinionId: string;
  fromStatus?: string;
  toStatus: string;
  reason?: string;
  changedBy?: string;
  changedAt: Date;
}

/**
 * Legal Opinion Status History Entity.
 *
 * Records status transitions for legal opinion requests to maintain
 * an audit trail of all state changes through the workflow.
 */
export class LegalOpinionStatusHistory {
  private props: LegalOpinionStatusHistoryProps;

  private constructor(props: LegalOpinionStatusHistoryProps) {
    this.props = props;
  }

  /**
   * Creates a new status history entry.
   */
  static create(
    params: LegalOpinionStatusHistoryCreateProps,
  ): LegalOpinionStatusHistory {
    const props: LegalOpinionStatusHistoryProps = {
      id: StatusHistoryId.generate(),
      legalOpinionId: params.legalOpinionId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      reason: params.reason,
      changedBy: params.changedBy,
      changedAt: new Date(),
    };

    return new LegalOpinionStatusHistory(props);
  }

  /**
   * Reconstitutes a status history from persisted data.
   */
  static rehydrate(
    props: LegalOpinionStatusHistoryRehydrateProps,
  ): LegalOpinionStatusHistory {
    return new LegalOpinionStatusHistory({
      id: StatusHistoryId.create(props.id),
      legalOpinionId: props.legalOpinionId,
      fromStatus: props.fromStatus
        ? (props.fromStatus as OpinionStatus)
        : undefined,
      toStatus: props.toStatus as OpinionStatus,
      reason: props.reason,
      changedBy: props.changedBy,
      changedAt: props.changedAt,
    });
  }

  get id(): StatusHistoryId {
    return this.props.id;
  }

  get legalOpinionId(): string {
    return this.props.legalOpinionId;
  }

  get fromStatus(): OpinionStatus | undefined {
    return this.props.fromStatus;
  }

  get toStatus(): OpinionStatus {
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
      legalOpinionId: this.legalOpinionId,
      fromStatus: this.fromStatus,
      toStatus: this.toStatus,
      reason: this.reason,
      changedBy: this.changedBy,
      changedAt: this.changedAt.toISOString(),
    };
  }
}
