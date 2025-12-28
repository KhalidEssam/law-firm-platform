// ============================================
// PRISMA SUPPORT TICKET REPOSITORY
// src/infrastructure/persistence/support-ticket/prisma-support-ticket.repository.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  SupportTicket,
  AssignTicketData,
} from '../../../core/domain/support-ticket/entities/support-ticket.entity';
import { TicketStatusEnum } from '../../../core/domain/support-ticket/value-objects/ticket-status.vo';
import { TicketCategoryEnum } from '../../../core/domain/support-ticket/value-objects/ticket-category.vo';
import { PriorityEnum } from '../../../core/domain/billing/value-objects/priority.vo';
import {
  ISupportTicketRepository,
  SupportTicketListOptions,
  SupportTicketCountOptions,
  SupportTicketStatistics,
} from '../../../core/domain/support-ticket/ports/support-ticket.repository';
import {
  TicketStatusMapper,
  TicketCategoryMapper,
  SupportTicketPriorityMapper,
} from './support-ticket-enum.mapper';

@Injectable()
export class PrismaSupportTicketRepository implements ISupportTicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CREATE
  // ============================================
  async create(ticket: SupportTicket): Promise<SupportTicket> {
    const created = await this.prisma.supportTicket.create({
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subscriberId: ticket.subscriberId,
        subject: ticket.subject,
        description: ticket.description,
        category: TicketCategoryMapper.toPrisma(ticket.category.getValue()),
        priority: SupportTicketPriorityMapper.toPrisma(
          ticket.priority.getValue(),
        ),
        status: TicketStatusMapper.toPrisma(ticket.status.getValue()),
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
    });
    return this.toDomain(created);
  }

  // ============================================
  // READ
  // ============================================
  async findById(id: string): Promise<SupportTicket | null> {
    const found = await this.prisma.supportTicket.findUnique({
      where: { id, deletedAt: null },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByTicketNumber(
    ticketNumber: string,
  ): Promise<SupportTicket | null> {
    const found = await this.prisma.supportTicket.findUnique({
      where: { ticketNumber, deletedAt: null },
    });
    return found ? this.toDomain(found) : null;
  }

  async findBySubscriberId(subscriberId: string): Promise<SupportTicket[]> {
    const found = await this.prisma.supportTicket.findMany({
      where: { subscriberId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByAssignedTo(assignedTo: string): Promise<SupportTicket[]> {
    const found = await this.prisma.supportTicket.findMany({
      where: { assignedTo, deletedAt: null },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async list(options?: SupportTicketListOptions): Promise<SupportTicket[]> {
    const found = await this.prisma.supportTicket.findMany({
      where: this.buildWhereClause(options),
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      orderBy: {
        [options?.orderBy ?? 'createdAt']: options?.orderDir ?? 'desc',
      },
    });
    return found.map((record) => this.toDomain(record));
  }

  async count(options?: SupportTicketCountOptions): Promise<number> {
    return await this.prisma.supportTicket.count({
      where: this.buildWhereClause(options),
    });
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(ticket: SupportTicket): Promise<SupportTicket> {
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        subject: ticket.subject,
        description: ticket.description,
        status: TicketStatusMapper.toPrisma(ticket.status.getValue()),
        priority: SupportTicketPriorityMapper.toPrisma(
          ticket.priority.getValue(),
        ),
        assignedTo: ticket.assignedTo,
        resolvedAt: ticket.resolvedAt,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async assign(
    id: string,
    assignData: AssignTicketData,
  ): Promise<SupportTicket> {
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        assignedTo: assignData.assignedTo,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async startProgress(id: string): Promise<SupportTicket> {
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: TicketStatusMapper.toPrisma(TicketStatusEnum.IN_PROGRESS),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async resolve(id: string): Promise<SupportTicket> {
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: TicketStatusMapper.toPrisma(TicketStatusEnum.RESOLVED),
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async close(id: string): Promise<SupportTicket> {
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: TicketStatusMapper.toPrisma(TicketStatusEnum.CLOSED),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async reopen(id: string): Promise<SupportTicket> {
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
        resolvedAt: null,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  async updatePriority(
    id: string,
    priority: PriorityEnum,
  ): Promise<SupportTicket> {
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        priority: SupportTicketPriorityMapper.toPrisma(priority),
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  // ============================================
  // DELETE
  // ============================================
  async softDelete(id: string): Promise<void> {
    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.supportTicket.delete({
      where: { id },
    });
  }

  // ============================================
  // BUSINESS QUERIES
  // ============================================
  async findOpenTickets(): Promise<SupportTicket[]> {
    const found = await this.prisma.supportTicket.findMany({
      where: {
        status: TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
        deletedAt: null,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findActiveTickets(): Promise<SupportTicket[]> {
    const found = await this.prisma.supportTicket.findMany({
      where: {
        status: {
          in: [
            TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
            TicketStatusMapper.toPrisma(TicketStatusEnum.IN_PROGRESS),
          ],
        },
        deletedAt: null,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findUnassignedTickets(): Promise<SupportTicket[]> {
    const found = await this.prisma.supportTicket.findMany({
      where: {
        assignedTo: null,
        status: {
          in: [
            TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
            TicketStatusMapper.toPrisma(TicketStatusEnum.IN_PROGRESS),
          ],
        },
        deletedAt: null,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findHighPriorityTickets(): Promise<SupportTicket[]> {
    const found = await this.prisma.supportTicket.findMany({
      where: {
        priority: {
          in: [
            SupportTicketPriorityMapper.toPrisma(PriorityEnum.HIGH),
            SupportTicketPriorityMapper.toPrisma(PriorityEnum.URGENT),
          ],
        },
        status: {
          notIn: [
            TicketStatusMapper.toPrisma(TicketStatusEnum.RESOLVED),
            TicketStatusMapper.toPrisma(TicketStatusEnum.CLOSED),
          ],
        },
        deletedAt: null,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findOverdueTickets(maxAgeDays: number = 3): Promise<SupportTicket[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const found = await this.prisma.supportTicket.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: {
          in: [
            TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
            TicketStatusMapper.toPrisma(TicketStatusEnum.IN_PROGRESS),
          ],
        },
        deletedAt: null,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findTicketsRequiringAttention(): Promise<SupportTicket[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 3);

    const found = await this.prisma.supportTicket.findMany({
      where: {
        OR: [
          // High priority and active
          {
            priority: {
              in: [
                SupportTicketPriorityMapper.toPrisma(PriorityEnum.HIGH),
                SupportTicketPriorityMapper.toPrisma(PriorityEnum.URGENT),
              ],
            },
            status: {
              in: [
                TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
                TicketStatusMapper.toPrisma(TicketStatusEnum.IN_PROGRESS),
              ],
            },
          },
          // Overdue tickets
          {
            createdAt: { lt: cutoffDate },
            status: {
              in: [
                TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
                TicketStatusMapper.toPrisma(TicketStatusEnum.IN_PROGRESS),
              ],
            },
          },
          // Unassigned tickets
          {
            assignedTo: null,
            status: TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
          },
        ],
        deletedAt: null,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return found.map((record) => this.toDomain(record));
  }

  async findByCategory(category: TicketCategoryEnum): Promise<SupportTicket[]> {
    const found = await this.prisma.supportTicket.findMany({
      where: {
        category: TicketCategoryMapper.toPrisma(category),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return found.map((record) => this.toDomain(record));
  }

  async getStatistics(
    fromDate?: Date,
    toDate?: Date,
  ): Promise<SupportTicketStatistics> {
    const dateFilter =
      fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {};

    const baseFilter = { deletedAt: null, ...dateFilter };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 3);

    const [
      open,
      inProgress,
      resolved,
      closed,
      byCategory,
      byPriority,
      unassigned,
      overdue,
      avgResolutionTime,
    ] = await Promise.all([
      this.prisma.supportTicket.count({
        where: {
          status: TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
          ...baseFilter,
        },
      }),
      this.prisma.supportTicket.count({
        where: {
          status: TicketStatusMapper.toPrisma(TicketStatusEnum.IN_PROGRESS),
          ...baseFilter,
        },
      }),
      this.prisma.supportTicket.count({
        where: {
          status: TicketStatusMapper.toPrisma(TicketStatusEnum.RESOLVED),
          ...baseFilter,
        },
      }),
      this.prisma.supportTicket.count({
        where: {
          status: TicketStatusMapper.toPrisma(TicketStatusEnum.CLOSED),
          ...baseFilter,
        },
      }),
      Promise.all([
        this.prisma.supportTicket.count({
          where: {
            category: TicketCategoryMapper.toPrisma(
              TicketCategoryEnum.TECHNICAL,
            ),
            ...baseFilter,
          },
        }),
        this.prisma.supportTicket.count({
          where: {
            category: TicketCategoryMapper.toPrisma(TicketCategoryEnum.BILLING),
            ...baseFilter,
          },
        }),
        this.prisma.supportTicket.count({
          where: {
            category: TicketCategoryMapper.toPrisma(TicketCategoryEnum.GENERAL),
            ...baseFilter,
          },
        }),
        this.prisma.supportTicket.count({
          where: {
            category: TicketCategoryMapper.toPrisma(
              TicketCategoryEnum.COMPLAINT,
            ),
            ...baseFilter,
          },
        }),
      ]),
      Promise.all([
        this.prisma.supportTicket.count({
          where: {
            priority: SupportTicketPriorityMapper.toPrisma(PriorityEnum.LOW),
            ...baseFilter,
          },
        }),
        this.prisma.supportTicket.count({
          where: {
            priority: SupportTicketPriorityMapper.toPrisma(PriorityEnum.NORMAL),
            ...baseFilter,
          },
        }),
        this.prisma.supportTicket.count({
          where: {
            priority: SupportTicketPriorityMapper.toPrisma(PriorityEnum.HIGH),
            ...baseFilter,
          },
        }),
        this.prisma.supportTicket.count({
          where: {
            priority: SupportTicketPriorityMapper.toPrisma(PriorityEnum.URGENT),
            ...baseFilter,
          },
        }),
      ]),
      this.prisma.supportTicket.count({
        where: {
          assignedTo: null,
          status: {
            in: [
              TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
              TicketStatusMapper.toPrisma(TicketStatusEnum.IN_PROGRESS),
            ],
          },
          ...baseFilter,
        },
      }),
      this.prisma.supportTicket.count({
        where: {
          createdAt: { lt: cutoffDate },
          status: {
            in: [
              TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
              TicketStatusMapper.toPrisma(TicketStatusEnum.IN_PROGRESS),
            ],
          },
          ...baseFilter,
        },
      }),
      this.prisma.$queryRaw<{ avg: number }[]>`
                SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600) as avg
                FROM "SupportTicket"
                WHERE "resolvedAt" IS NOT NULL
                AND "deletedAt" IS NULL
            `.catch(() => [{ avg: null }]),
    ]);

    return {
      totalOpen: open,
      totalInProgress: inProgress,
      totalResolved: resolved,
      totalClosed: closed,
      averageResolutionTimeHours: avgResolutionTime[0]?.avg ?? null,
      byCategory: {
        technical: byCategory[0],
        billing: byCategory[1],
        general: byCategory[2],
        complaint: byCategory[3],
      },
      byPriority: {
        low: byPriority[0],
        normal: byPriority[1],
        high: byPriority[2],
        urgent: byPriority[3],
      },
      unassignedCount: unassigned,
      overdueCount: overdue,
    };
  }

  async getAgentWorkload(assignedTo: string): Promise<{
    open: number;
    inProgress: number;
    total: number;
  }> {
    const [open, inProgress] = await Promise.all([
      this.prisma.supportTicket.count({
        where: {
          assignedTo,
          status: TicketStatusMapper.toPrisma(TicketStatusEnum.OPEN),
          deletedAt: null,
        },
      }),
      this.prisma.supportTicket.count({
        where: {
          assignedTo,
          status: TicketStatusMapper.toPrisma(TicketStatusEnum.IN_PROGRESS),
          deletedAt: null,
        },
      }),
    ]);

    return {
      open,
      inProgress,
      total: open + inProgress,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================
  private buildWhereClause(
    options?: SupportTicketListOptions | SupportTicketCountOptions,
  ) {
    const where: any = { deletedAt: null };

    if (options?.subscriberId) where.subscriberId = options.subscriberId;
    if (options?.status)
      where.status = TicketStatusMapper.toPrisma(options.status);
    if (options?.category)
      where.category = TicketCategoryMapper.toPrisma(options.category);
    if (options?.priority)
      where.priority = SupportTicketPriorityMapper.toPrisma(options.priority);
    if (options?.assignedTo) where.assignedTo = options.assignedTo;
    if (options?.isUnassigned === true) where.assignedTo = null;

    if (options?.fromDate || options?.toDate) {
      where.createdAt = {};
      if (options?.fromDate) where.createdAt.gte = options.fromDate;
      if (options?.toDate) where.createdAt.lte = options.toDate;
    }

    return where;
  }

  private toDomain(record: any): SupportTicket {
    return SupportTicket.rehydrate({
      id: record.id,
      ticketNumber: record.ticketNumber,
      subscriberId: record.subscriberId,
      subject: record.subject,
      description: record.description,
      category: TicketCategoryMapper.toDomain(record.category),
      priority: SupportTicketPriorityMapper.toDomain(record.priority),
      status: TicketStatusMapper.toDomain(record.status),
      assignedTo: record.assignedTo ?? undefined,
      resolvedAt: record.resolvedAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt ?? undefined,
    });
  }
}
