// ============================================
// SUPPORT TICKET REPOSITORY PORT
// src/core/domain/support-ticket/ports/support-ticket.repository.ts
// ============================================

import {
  SupportTicket,
  AssignTicketData,
} from '../entities/support-ticket.entity';
import { TicketStatusEnum } from '../value-objects/ticket-status.vo';
import { TicketCategoryEnum } from '../value-objects/ticket-category.vo';
import { PriorityEnum } from '../../billing/value-objects/priority.vo';

export interface SupportTicketListOptions {
  subscriberId?: string;
  status?: TicketStatusEnum;
  category?: TicketCategoryEnum;
  priority?: PriorityEnum;
  assignedTo?: string;
  isUnassigned?: boolean;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'priority' | 'resolvedAt' | 'updatedAt';
  orderDir?: 'asc' | 'desc';
}

export interface SupportTicketCountOptions {
  subscriberId?: string;
  status?: TicketStatusEnum;
  category?: TicketCategoryEnum;
  priority?: PriorityEnum;
  assignedTo?: string;
  isUnassigned?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

export interface SupportTicketStatistics {
  totalOpen: number;
  totalInProgress: number;
  totalResolved: number;
  totalClosed: number;
  averageResolutionTimeHours: number | null;
  byCategory: {
    technical: number;
    billing: number;
    general: number;
    complaint: number;
  };
  byPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
  unassignedCount: number;
  overdueCount: number;
}

export interface ISupportTicketRepository {
  // ============================================
  // CREATE
  // ============================================
  create(ticket: SupportTicket): Promise<SupportTicket>;

  // ============================================
  // READ
  // ============================================
  findById(id: string): Promise<SupportTicket | null>;
  findByTicketNumber(ticketNumber: string): Promise<SupportTicket | null>;
  findBySubscriberId(subscriberId: string): Promise<SupportTicket[]>;
  findByAssignedTo(assignedTo: string): Promise<SupportTicket[]>;
  list(options?: SupportTicketListOptions): Promise<SupportTicket[]>;
  count(options?: SupportTicketCountOptions): Promise<number>;

  // ============================================
  // UPDATE
  // ============================================
  update(ticket: SupportTicket): Promise<SupportTicket>;
  assign(id: string, assignData: AssignTicketData): Promise<SupportTicket>;
  startProgress(id: string): Promise<SupportTicket>;
  resolve(id: string): Promise<SupportTicket>;
  close(id: string): Promise<SupportTicket>;
  reopen(id: string): Promise<SupportTicket>;
  updatePriority(id: string, priority: PriorityEnum): Promise<SupportTicket>;

  // ============================================
  // DELETE
  // ============================================
  softDelete(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;

  // ============================================
  // BUSINESS QUERIES
  // ============================================
  findOpenTickets(): Promise<SupportTicket[]>;
  findActiveTickets(): Promise<SupportTicket[]>;
  findUnassignedTickets(): Promise<SupportTicket[]>;
  findHighPriorityTickets(): Promise<SupportTicket[]>;
  findOverdueTickets(maxAgeDays?: number): Promise<SupportTicket[]>;
  findTicketsRequiringAttention(): Promise<SupportTicket[]>;
  findByCategory(category: TicketCategoryEnum): Promise<SupportTicket[]>;
  getStatistics(
    fromDate?: Date,
    toDate?: Date,
  ): Promise<SupportTicketStatistics>;
  getAgentWorkload(assignedTo: string): Promise<{
    open: number;
    inProgress: number;
    total: number;
  }>;
}
