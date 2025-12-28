// ============================================
// AUDIT LOG ENTITY
// src/core/domain/audit/entities/audit-log.entity.ts
// ============================================

import { AuditAction, AuditActionType } from '../value-objects/audit-action.vo';

/**
 * Entity types that can be audited
 */
export type AuditEntityType =
  | 'consultation'
  | 'legal_opinion'
  | 'litigation'
  | 'call'
  | 'service'
  | 'user'
  | 'provider'
  | 'membership'
  | 'payment'
  | 'refund'
  | 'dispute'
  | 'support_ticket'
  | 'document'
  | 'system';

/**
 * Input for creating a new AuditLog
 */
export interface CreateAuditLogInput {
  userId?: string;
  action: AuditActionType | string;
  entityType?: AuditEntityType;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AuditLog Domain Entity
 *
 * Represents an immutable record of a system action for compliance and debugging.
 */
export class AuditLog {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string | null,
    private readonly _action: AuditAction,
    private readonly _entityType: AuditEntityType | null,
    private readonly _entityId: string | null,
    private readonly _details: Record<string, unknown> | null,
    private readonly _ipAddress: string | null,
    private readonly _userAgent: string | null,
    private readonly _createdAt: Date,
  ) {}

  /**
   * Create a new AuditLog entry
   */
  static create(input: CreateAuditLogInput): AuditLog {
    const id = crypto.randomUUID();
    const action =
      typeof input.action === 'string'
        ? AuditAction.create(input.action)
        : AuditAction.fromType(input.action);

    return new AuditLog(
      id,
      input.userId || null,
      action,
      input.entityType || null,
      input.entityId || null,
      input.details || null,
      input.ipAddress || null,
      input.userAgent || null,
      new Date(),
    );
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(data: {
    id: string;
    userId: string | null;
    action: string;
    entityType: AuditEntityType | null;
    entityId: string | null;
    details: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }): AuditLog {
    return new AuditLog(
      data.id,
      data.userId,
      AuditAction.create(data.action),
      data.entityType,
      data.entityId,
      data.details,
      data.ipAddress,
      data.userAgent,
      data.createdAt,
    );
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string | null {
    return this._userId;
  }

  get action(): AuditAction {
    return this._action;
  }

  get entityType(): AuditEntityType | null {
    return this._entityType;
  }

  get entityId(): string | null {
    return this._entityId;
  }

  get details(): Record<string, unknown> | null {
    return this._details;
  }

  get ipAddress(): string | null {
    return this._ipAddress;
  }

  get userAgent(): string | null {
    return this._userAgent;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Convert to plain object for serialization
   */
  toObject(): {
    id: string;
    userId: string | null;
    action: string;
    entityType: AuditEntityType | null;
    entityId: string | null;
    details: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  } {
    return {
      id: this._id,
      userId: this._userId,
      action: this._action.getValue(),
      entityType: this._entityType,
      entityId: this._entityId,
      details: this._details,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      createdAt: this._createdAt,
    };
  }
}
