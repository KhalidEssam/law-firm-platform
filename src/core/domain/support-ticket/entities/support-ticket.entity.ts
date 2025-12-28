// ============================================
// SUPPORT TICKET ENTITY
// src/core/domain/support-ticket/entities/support-ticket.entity.ts
// ============================================

import { TicketStatus } from '../value-objects/ticket-status.vo';
import { TicketCategory } from '../value-objects/ticket-category.vo';
import { Priority } from '../../billing/value-objects/priority.vo';

export interface SupportTicketProps {
  subscriberId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: Priority;
  status?: TicketStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SupportTicketRehydrateProps {
  id: string;
  ticketNumber: string;
  subscriberId: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AssignTicketData {
  assignedTo: string;
}

export interface ResolveTicketData {
  resolution?: string;
}

export class SupportTicket {
  private constructor(
    public readonly id: string,
    public readonly ticketNumber: string,
    public readonly subscriberId: string,
    public readonly subject: string,
    public readonly description: string,
    public readonly category: TicketCategory,
    public readonly priority: Priority,
    public readonly status: TicketStatus,
    public readonly assignedTo: string | undefined,
    public readonly resolvedAt: Date | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | undefined,
  ) {}

  // ============================================
  // FACTORY METHODS
  // ============================================

  static create(props: SupportTicketProps): SupportTicket {
    const now = new Date();
    const ticketNumber = SupportTicket.generateTicketNumber();

    // If category is complaint, default to high priority
    let defaultPriority = Priority.normal();
    if (props.category.isHighPriorityByDefault()) {
      defaultPriority = Priority.high();
    }

    return new SupportTicket(
      crypto.randomUUID(),
      ticketNumber,
      props.subscriberId,
      props.subject,
      props.description,
      props.category,
      props.priority ?? defaultPriority,
      props.status ?? TicketStatus.open(),
      undefined, // assignedTo
      undefined, // resolvedAt
      props.createdAt ?? now,
      props.updatedAt ?? now,
      undefined, // deletedAt
    );
  }

  static rehydrate(props: SupportTicketRehydrateProps): SupportTicket {
    return new SupportTicket(
      props.id,
      props.ticketNumber,
      props.subscriberId,
      props.subject,
      props.description,
      TicketCategory.create(props.category),
      Priority.create(props.priority),
      TicketStatus.create(props.status),
      props.assignedTo,
      props.resolvedAt,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );
  }

  private static generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    // Use cryptographically secure random bytes instead of Math.random()
    const randomBytes = crypto.getRandomValues(new Uint8Array(2));
    const random = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }

  // ============================================
  // DOMAIN METHODS - Immutable State Transitions
  // ============================================

  assign(assignData: AssignTicketData): SupportTicket {
    if (!this.status.canBeAssigned()) {
      throw new Error(
        `Cannot assign ticket. Current status: ${this.status.getValue()}`,
      );
    }
    return new SupportTicket(
      this.id,
      this.ticketNumber,
      this.subscriberId,
      this.subject,
      this.description,
      this.category,
      this.priority,
      this.status,
      assignData.assignedTo,
      this.resolvedAt,
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  startProgress(): SupportTicket {
    if (!this.status.canStartProgress()) {
      throw new Error(
        `Cannot start progress. Current status: ${this.status.getValue()}`,
      );
    }
    return new SupportTicket(
      this.id,
      this.ticketNumber,
      this.subscriberId,
      this.subject,
      this.description,
      this.category,
      this.priority,
      TicketStatus.inProgress(),
      this.assignedTo,
      this.resolvedAt,
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  resolve(): SupportTicket {
    if (!this.status.canBeResolved()) {
      throw new Error(
        `Cannot resolve ticket. Current status: ${this.status.getValue()}`,
      );
    }
    return new SupportTicket(
      this.id,
      this.ticketNumber,
      this.subscriberId,
      this.subject,
      this.description,
      this.category,
      this.priority,
      TicketStatus.resolved(),
      this.assignedTo,
      new Date(),
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  close(): SupportTicket {
    if (!this.status.canBeClosed()) {
      throw new Error(
        `Cannot close ticket. Current status: ${this.status.getValue()}`,
      );
    }
    return new SupportTicket(
      this.id,
      this.ticketNumber,
      this.subscriberId,
      this.subject,
      this.description,
      this.category,
      this.priority,
      TicketStatus.closed(),
      this.assignedTo,
      this.resolvedAt,
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  reopen(): SupportTicket {
    if (!this.status.canBeReopened()) {
      throw new Error(
        `Cannot reopen ticket. Current status: ${this.status.getValue()}`,
      );
    }
    return new SupportTicket(
      this.id,
      this.ticketNumber,
      this.subscriberId,
      this.subject,
      this.description,
      this.category,
      this.priority,
      TicketStatus.open(),
      this.assignedTo,
      undefined, // Clear resolved date
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  updatePriority(newPriority: Priority): SupportTicket {
    if (this.status.isFinal()) {
      throw new Error('Cannot update priority of a closed ticket');
    }
    return new SupportTicket(
      this.id,
      this.ticketNumber,
      this.subscriberId,
      this.subject,
      this.description,
      this.category,
      newPriority,
      this.status,
      this.assignedTo,
      this.resolvedAt,
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  updateDetails(subject: string, description: string): SupportTicket {
    if (this.status.isFinal()) {
      throw new Error('Cannot update details of a closed ticket');
    }
    return new SupportTicket(
      this.id,
      this.ticketNumber,
      this.subscriberId,
      subject,
      description,
      this.category,
      this.priority,
      this.status,
      this.assignedTo,
      this.resolvedAt,
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  softDelete(): SupportTicket {
    return new SupportTicket(
      this.id,
      this.ticketNumber,
      this.subscriberId,
      this.subject,
      this.description,
      this.category,
      this.priority,
      this.status,
      this.assignedTo,
      this.resolvedAt,
      this.createdAt,
      new Date(),
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

  isAssigned(): boolean {
    return this.assignedTo !== undefined;
  }

  isUnassigned(): boolean {
    return this.assignedTo === undefined;
  }

  requiresImmediateAttention(): boolean {
    return this.priority.requiresImmediateAttention() && this.status.isActive();
  }

  isOverdue(maxAgeDays: number = 3): boolean {
    if (this.status.isFinal()) return false;
    return this.getAgeInDays() > maxAgeDays;
  }

  getAgeInDays(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getResolutionDuration(): number | null {
    if (!this.resolvedAt) {
      return null;
    }
    return this.resolvedAt.getTime() - this.createdAt.getTime();
  }

  getResolutionDurationInHours(): number | null {
    const duration = this.getResolutionDuration();
    if (duration === null) return null;
    return Math.ceil(duration / (1000 * 60 * 60));
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      ticketNumber: this.ticketNumber,
      subscriberId: this.subscriberId,
      subject: this.subject,
      description: this.description,
      category: this.category.getValue(),
      priority: this.priority.getValue(),
      status: this.status.getValue(),
      assignedTo: this.assignedTo,
      resolvedAt: this.resolvedAt?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt?.toISOString(),
      isAssigned: this.isAssigned(),
      isOverdue: this.isOverdue(),
      ageInDays: this.getAgeInDays(),
    };
  }
}
