// ============================================
// MEMBERSHIP INVOICE ENTITY
// src/core/domain/billing/entities/membership-invoice.entity.ts
// ============================================

import { randomBytes } from 'crypto';
import { Money } from '../value-objects/money.vo';
import { InvoiceStatus } from '../value-objects/invoice-status.vo';

export interface MembershipInvoiceProps {
  membershipId: string;
  invoiceNumber: string;
  amount: Money;
  dueDate: Date;
  status?: InvoiceStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MembershipInvoiceRehydrateProps {
  id: string;
  membershipId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MembershipInvoice {
  private constructor(
    public readonly id: string,
    public readonly membershipId: string,
    public readonly invoiceNumber: string,
    public readonly amount: Money,
    public readonly dueDate: Date,
    public readonly status: InvoiceStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // ============================================
  // FACTORY METHODS
  // ============================================

  static create(props: MembershipInvoiceProps): MembershipInvoice {
    const now = new Date();
    return new MembershipInvoice(
      crypto.randomUUID(),
      props.membershipId,
      props.invoiceNumber,
      props.amount,
      props.dueDate,
      props.status ?? InvoiceStatus.unpaid(),
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }

  static rehydrate(props: MembershipInvoiceRehydrateProps): MembershipInvoice {
    return new MembershipInvoice(
      props.id,
      props.membershipId,
      props.invoiceNumber,
      Money.create({ amount: props.amount, currency: props.currency }),
      props.dueDate,
      InvoiceStatus.create(props.status),
      props.createdAt,
      props.updatedAt,
    );
  }

  static generateInvoiceNumber(prefix: string = 'INV'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    // Use cryptographically secure random bytes instead of Math.random()
    const random = randomBytes(2).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // ============================================
  // DOMAIN METHODS - Immutable State Transitions
  // ============================================

  markAsPaid(): MembershipInvoice {
    if (!this.status.canBePaid()) {
      throw new Error(
        `Cannot mark invoice as paid. Current status: ${this.status.getValue()}`,
      );
    }
    return new MembershipInvoice(
      this.id,
      this.membershipId,
      this.invoiceNumber,
      this.amount,
      this.dueDate,
      InvoiceStatus.paid(),
      this.createdAt,
      new Date(),
    );
  }

  markAsOverdue(): MembershipInvoice {
    if (!this.status.canBeMarkedOverdue()) {
      throw new Error(
        `Cannot mark invoice as overdue. Current status: ${this.status.getValue()}`,
      );
    }
    return new MembershipInvoice(
      this.id,
      this.membershipId,
      this.invoiceNumber,
      this.amount,
      this.dueDate,
      InvoiceStatus.overdue(),
      this.createdAt,
      new Date(),
    );
  }

  cancel(): MembershipInvoice {
    if (!this.status.canBeCancelled()) {
      throw new Error(
        `Cannot cancel invoice. Current status: ${this.status.getValue()}`,
      );
    }
    return new MembershipInvoice(
      this.id,
      this.membershipId,
      this.invoiceNumber,
      this.amount,
      this.dueDate,
      InvoiceStatus.cancelled(),
      this.createdAt,
      new Date(),
    );
  }

  // ============================================
  // BUSINESS LOGIC QUERIES
  // ============================================

  isOverdue(): boolean {
    if (this.status.isPaid() || this.status.isCancelled()) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  getDaysUntilDue(): number {
    const now = new Date();
    const diffTime = this.dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysOverdue(): number {
    if (!this.isOverdue()) {
      return 0;
    }
    const now = new Date();
    const diffTime = now.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      membershipId: this.membershipId,
      invoiceNumber: this.invoiceNumber,
      amount: this.amount.amount,
      currency: this.amount.currency,
      dueDate: this.dueDate.toISOString(),
      status: this.status.getValue(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
