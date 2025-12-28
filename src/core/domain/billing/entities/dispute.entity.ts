// ============================================
// DISPUTE ENTITY
// src/core/domain/billing/entities/dispute.entity.ts
// ============================================

import {
  DisputeStatus,
  DisputeStatusEnum,
} from '../value-objects/dispute-status.vo';
import { Priority, PriorityEnum } from '../value-objects/priority.vo';

export interface DisputeRelatedEntity {
  consultationId?: string;
  legalOpinionId?: string;
  serviceRequestId?: string;
  litigationCaseId?: string;
}

export interface DisputeProps {
  userId: string;
  reason: string;
  description: string;
  relatedEntity?: DisputeRelatedEntity;
  evidence?: Record<string, unknown>;
  priority?: Priority;
  status?: DisputeStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DisputeRehydrateProps {
  id: string;
  userId: string;
  consultationId?: string;
  legalOpinionId?: string;
  serviceRequestId?: string;
  litigationCaseId?: string;
  reason: string;
  description: string;
  evidence?: Record<string, unknown>;
  status: string;
  priority: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  escalatedAt?: Date;
  escalatedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeResolutionData {
  resolvedBy: string;
  resolution: string;
}

export interface DisputeEscalationData {
  escalatedTo: string;
}

export class Dispute {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly consultationId: string | undefined,
    public readonly legalOpinionId: string | undefined,
    public readonly serviceRequestId: string | undefined,
    public readonly litigationCaseId: string | undefined,
    public readonly reason: string,
    public readonly description: string,
    public readonly evidence: Record<string, unknown> | undefined,
    public readonly status: DisputeStatus,
    public readonly priority: Priority,
    public readonly resolution: string | undefined,
    public readonly resolvedBy: string | undefined,
    public readonly resolvedAt: Date | undefined,
    public readonly escalatedAt: Date | undefined,
    public readonly escalatedTo: string | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // ============================================
  // FACTORY METHODS
  // ============================================

  static create(props: DisputeProps): Dispute {
    const now = new Date();
    return new Dispute(
      crypto.randomUUID(),
      props.userId,
      props.relatedEntity?.consultationId,
      props.relatedEntity?.legalOpinionId,
      props.relatedEntity?.serviceRequestId,
      props.relatedEntity?.litigationCaseId,
      props.reason,
      props.description,
      props.evidence,
      props.status ?? DisputeStatus.open(),
      props.priority ?? Priority.normal(),
      undefined, // resolution
      undefined, // resolvedBy
      undefined, // resolvedAt
      undefined, // escalatedAt
      undefined, // escalatedTo
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }

  static rehydrate(props: DisputeRehydrateProps): Dispute {
    return new Dispute(
      props.id,
      props.userId,
      props.consultationId,
      props.legalOpinionId,
      props.serviceRequestId,
      props.litigationCaseId,
      props.reason,
      props.description,
      props.evidence,
      DisputeStatus.create(props.status),
      Priority.create(props.priority),
      props.resolution,
      props.resolvedBy,
      props.resolvedAt,
      props.escalatedAt,
      props.escalatedTo,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ============================================
  // DOMAIN METHODS - Immutable State Transitions
  // ============================================

  startReview(): Dispute {
    if (!this.status.canBeReviewed()) {
      throw new Error(
        `Cannot start review. Current status: ${this.status.getValue()}`,
      );
    }
    return new Dispute(
      this.id,
      this.userId,
      this.consultationId,
      this.legalOpinionId,
      this.serviceRequestId,
      this.litigationCaseId,
      this.reason,
      this.description,
      this.evidence,
      DisputeStatus.underReview(),
      this.priority,
      this.resolution,
      this.resolvedBy,
      this.resolvedAt,
      this.escalatedAt,
      this.escalatedTo,
      this.createdAt,
      new Date(),
    );
  }

  escalate(escalationData: DisputeEscalationData): Dispute {
    if (!this.status.canBeEscalated()) {
      throw new Error(
        `Cannot escalate dispute. Current status: ${this.status.getValue()}`,
      );
    }
    return new Dispute(
      this.id,
      this.userId,
      this.consultationId,
      this.legalOpinionId,
      this.serviceRequestId,
      this.litigationCaseId,
      this.reason,
      this.description,
      this.evidence,
      DisputeStatus.escalated(),
      this.priority,
      this.resolution,
      this.resolvedBy,
      this.resolvedAt,
      new Date(),
      escalationData.escalatedTo,
      this.createdAt,
      new Date(),
    );
  }

  resolve(resolutionData: DisputeResolutionData): Dispute {
    if (!this.status.canBeResolved()) {
      throw new Error(
        `Cannot resolve dispute. Current status: ${this.status.getValue()}`,
      );
    }
    return new Dispute(
      this.id,
      this.userId,
      this.consultationId,
      this.legalOpinionId,
      this.serviceRequestId,
      this.litigationCaseId,
      this.reason,
      this.description,
      this.evidence,
      DisputeStatus.resolved(),
      this.priority,
      resolutionData.resolution,
      resolutionData.resolvedBy,
      new Date(),
      this.escalatedAt,
      this.escalatedTo,
      this.createdAt,
      new Date(),
    );
  }

  close(): Dispute {
    if (!this.status.canBeClosed()) {
      throw new Error(
        `Cannot close dispute. Current status: ${this.status.getValue()}`,
      );
    }
    return new Dispute(
      this.id,
      this.userId,
      this.consultationId,
      this.legalOpinionId,
      this.serviceRequestId,
      this.litigationCaseId,
      this.reason,
      this.description,
      this.evidence,
      DisputeStatus.closed(),
      this.priority,
      this.resolution,
      this.resolvedBy,
      this.resolvedAt,
      this.escalatedAt,
      this.escalatedTo,
      this.createdAt,
      new Date(),
    );
  }

  updatePriority(newPriority: Priority): Dispute {
    if (this.status.isFinal()) {
      throw new Error(`Cannot update priority of a finalized dispute`);
    }
    return new Dispute(
      this.id,
      this.userId,
      this.consultationId,
      this.legalOpinionId,
      this.serviceRequestId,
      this.litigationCaseId,
      this.reason,
      this.description,
      this.evidence,
      this.status,
      newPriority,
      this.resolution,
      this.resolvedBy,
      this.resolvedAt,
      this.escalatedAt,
      this.escalatedTo,
      this.createdAt,
      new Date(),
    );
  }

  addEvidence(newEvidence: Record<string, unknown>): Dispute {
    if (this.status.isFinal()) {
      throw new Error(`Cannot add evidence to a finalized dispute`);
    }
    return new Dispute(
      this.id,
      this.userId,
      this.consultationId,
      this.legalOpinionId,
      this.serviceRequestId,
      this.litigationCaseId,
      this.reason,
      this.description,
      { ...this.evidence, ...newEvidence },
      this.status,
      this.priority,
      this.resolution,
      this.resolvedBy,
      this.resolvedAt,
      this.escalatedAt,
      this.escalatedTo,
      this.createdAt,
      new Date(),
    );
  }

  // ============================================
  // BUSINESS LOGIC QUERIES
  // ============================================

  isOpen(): boolean {
    return this.status.isOpen();
  }

  isActive(): boolean {
    return this.status.isActive();
  }

  isFinal(): boolean {
    return this.status.isFinal();
  }

  isEscalated(): boolean {
    return this.status.isEscalated();
  }

  requiresImmediateAttention(): boolean {
    return this.priority.requiresImmediateAttention() && this.status.isActive();
  }

  getRelatedEntityType(): string | null {
    if (this.consultationId) return 'consultation';
    if (this.legalOpinionId) return 'legal_opinion';
    if (this.serviceRequestId) return 'service_request';
    if (this.litigationCaseId) return 'litigation_case';
    return null;
  }

  getRelatedEntityId(): string | null {
    return (
      this.consultationId ??
      this.legalOpinionId ??
      this.serviceRequestId ??
      this.litigationCaseId ??
      null
    );
  }

  getResolutionDuration(): number | null {
    if (!this.resolvedAt) {
      return null;
    }
    return this.resolvedAt.getTime() - this.createdAt.getTime();
  }

  getAgeInDays(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      consultationId: this.consultationId,
      legalOpinionId: this.legalOpinionId,
      serviceRequestId: this.serviceRequestId,
      litigationCaseId: this.litigationCaseId,
      reason: this.reason,
      description: this.description,
      evidence: this.evidence,
      status: this.status.getValue(),
      priority: this.priority.getValue(),
      resolution: this.resolution,
      resolvedBy: this.resolvedBy,
      resolvedAt: this.resolvedAt?.toISOString(),
      escalatedAt: this.escalatedAt?.toISOString(),
      escalatedTo: this.escalatedTo,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
