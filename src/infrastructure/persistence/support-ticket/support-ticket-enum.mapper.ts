// ============================================
// SUPPORT TICKET ENUM MAPPERS
// src/infrastructure/persistence/support-ticket/support-ticket-enum.mapper.ts
// ============================================

import {
  TicketStatus as PrismaTicketStatus,
  TicketCategory as PrismaTicketCategory,
  Priority as PrismaPriority,
} from '@prisma/client';

import { TicketStatusEnum } from '../../../core/domain/support-ticket/value-objects/ticket-status.vo';
import { TicketCategoryEnum } from '../../../core/domain/support-ticket/value-objects/ticket-category.vo';
import { PriorityEnum } from '../../../core/domain/billing/value-objects/priority.vo';

// ============================================
// TICKET STATUS MAPPER
// ============================================
export class TicketStatusMapper {
  static toPrisma(status: TicketStatusEnum): PrismaTicketStatus {
    const mapping: Record<TicketStatusEnum, PrismaTicketStatus> = {
      [TicketStatusEnum.OPEN]: PrismaTicketStatus.open,
      [TicketStatusEnum.IN_PROGRESS]: PrismaTicketStatus.in_progress,
      [TicketStatusEnum.RESOLVED]: PrismaTicketStatus.resolved,
      [TicketStatusEnum.CLOSED]: PrismaTicketStatus.closed,
    };
    return mapping[status];
  }

  static toDomain(status: PrismaTicketStatus): TicketStatusEnum {
    const mapping: Record<PrismaTicketStatus, TicketStatusEnum> = {
      [PrismaTicketStatus.open]: TicketStatusEnum.OPEN,
      [PrismaTicketStatus.in_progress]: TicketStatusEnum.IN_PROGRESS,
      [PrismaTicketStatus.resolved]: TicketStatusEnum.RESOLVED,
      [PrismaTicketStatus.closed]: TicketStatusEnum.CLOSED,
    };
    return mapping[status];
  }
}

// ============================================
// TICKET CATEGORY MAPPER
// ============================================
export class TicketCategoryMapper {
  static toPrisma(category: TicketCategoryEnum): PrismaTicketCategory {
    const mapping: Record<TicketCategoryEnum, PrismaTicketCategory> = {
      [TicketCategoryEnum.TECHNICAL]: PrismaTicketCategory.technical,
      [TicketCategoryEnum.BILLING]: PrismaTicketCategory.billing,
      [TicketCategoryEnum.GENERAL]: PrismaTicketCategory.general,
      [TicketCategoryEnum.COMPLAINT]: PrismaTicketCategory.complaint,
    };
    return mapping[category];
  }

  static toDomain(category: PrismaTicketCategory): TicketCategoryEnum {
    const mapping: Record<PrismaTicketCategory, TicketCategoryEnum> = {
      [PrismaTicketCategory.technical]: TicketCategoryEnum.TECHNICAL,
      [PrismaTicketCategory.billing]: TicketCategoryEnum.BILLING,
      [PrismaTicketCategory.general]: TicketCategoryEnum.GENERAL,
      [PrismaTicketCategory.complaint]: TicketCategoryEnum.COMPLAINT,
    };
    return mapping[category];
  }
}

// ============================================
// PRIORITY MAPPER (reuse from billing)
// ============================================
export class SupportTicketPriorityMapper {
  static toPrisma(priority: PriorityEnum): PrismaPriority {
    const mapping: Record<PriorityEnum, PrismaPriority> = {
      [PriorityEnum.LOW]: PrismaPriority.low,
      [PriorityEnum.NORMAL]: PrismaPriority.normal,
      [PriorityEnum.HIGH]: PrismaPriority.high,
      [PriorityEnum.URGENT]: PrismaPriority.urgent,
    };
    return mapping[priority];
  }

  static toDomain(priority: PrismaPriority): PriorityEnum {
    const mapping: Record<PrismaPriority, PriorityEnum> = {
      [PrismaPriority.low]: PriorityEnum.LOW,
      [PrismaPriority.normal]: PriorityEnum.NORMAL,
      [PrismaPriority.high]: PriorityEnum.HIGH,
      [PrismaPriority.urgent]: PriorityEnum.URGENT,
    };
    return mapping[priority];
  }
}
