// src/core/domain/membership/entities/membership-change-log.entity.ts

import crypto from 'crypto';

export enum MembershipChangeReason {
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  RENEWAL = 'renewal',
  CANCELLATION = 'cancellation',
  REACTIVATION = 'reactivation',
  PAUSE = 'pause',
  RESUME = 'resume',
  EXPIRATION = 'expiration',
  ADMIN_CHANGE = 'admin_change',
  SYSTEM_MIGRATION = 'system_migration',
}

export class MembershipChangeLog {
  private constructor(
    public readonly id: string,
    public readonly membershipId: string,
    public readonly oldTierId: number | null,
    public readonly newTierId: number | null,
    public readonly reason: MembershipChangeReason | string | null,
    public readonly changedBy: string | null, // userId of who made the change
    public readonly metadata: Record<string, any> | null, // Additional context
    public readonly changedAt: Date,
  ) {}

  /** Factory method for creating new change log */
  static create(props: {
    membershipId: string;
    oldTierId?: number | null;
    newTierId?: number | null;
    reason?: MembershipChangeReason | string | null;
    changedBy?: string | null;
    metadata?: Record<string, any> | null;
  }): MembershipChangeLog {
    return new MembershipChangeLog(
      crypto.randomUUID(),
      props.membershipId,
      props.oldTierId ?? null,
      props.newTierId ?? null,
      props.reason ?? null,
      props.changedBy ?? null,
      props.metadata ?? null,
      new Date(),
    );
  }

  /** Factory method for DB rehydration */
  static rehydrate(record: {
    id: string;
    membershipId: string;
    oldTierId: number | null;
    newTierId: number | null;
    reason: string | null;
    changedAt: Date;
  }): MembershipChangeLog {
    return new MembershipChangeLog(
      record.id,
      record.membershipId,
      record.oldTierId,
      record.newTierId,
      record.reason,
      null, // changedBy not in schema, stored in metadata
      null,
      record.changedAt,
    );
  }

  /** Check if this is a tier upgrade */
  isUpgrade(): boolean {
    return (
      this.reason === MembershipChangeReason.UPGRADE ||
      (this.oldTierId !== null &&
        this.newTierId !== null &&
        this.newTierId > this.oldTierId)
    );
  }

  /** Check if this is a tier downgrade */
  isDowngrade(): boolean {
    return (
      this.reason === MembershipChangeReason.DOWNGRADE ||
      (this.oldTierId !== null &&
        this.newTierId !== null &&
        this.newTierId < this.oldTierId)
    );
  }

  /** Check if this is a cancellation */
  isCancellation(): boolean {
    return (
      this.reason === MembershipChangeReason.CANCELLATION ||
      (this.oldTierId !== null && this.newTierId === null)
    );
  }

  /** Check if this is a reactivation */
  isReactivation(): boolean {
    return (
      this.reason === MembershipChangeReason.REACTIVATION ||
      (this.oldTierId === null && this.newTierId !== null)
    );
  }

  /** Get human-readable description */
  getDescription(): string {
    if (this.isCancellation()) {
      return 'Membership cancelled';
    }
    if (this.isReactivation()) {
      return `Membership reactivated with tier ${this.newTierId}`;
    }
    if (this.isUpgrade()) {
      return `Upgraded from tier ${this.oldTierId} to tier ${this.newTierId}`;
    }
    if (this.isDowngrade()) {
      return `Downgraded from tier ${this.oldTierId} to tier ${this.newTierId}`;
    }
    if (this.reason) {
      return `Change: ${this.reason}`;
    }
    return 'Membership changed';
  }
}
