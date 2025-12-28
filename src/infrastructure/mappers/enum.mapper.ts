// src/core/infrastructure/mappers/enum.mapper.ts

import {
  PaymentStatus as PrismaPaymentStatus,
  RequestStatus as PrismaRequestStatus,
  QuoteStatus as PrismaQuoteStatus,
  // ... other Prisma enums
} from '@prisma/client';

import {
  CaseStatusEnum,
  PaymentStatusEnum,
} from 'src/core/domain/litigation-case/value-objects/litigation-case.vo';

// ============================================
// CASE STATUS MAPPER
// ============================================
export class CaseStatusMapper {
  // Domain → Prisma
  static toPrisma(domainStatus: CaseStatusEnum): PrismaRequestStatus {
    const mapping: Record<CaseStatusEnum, PrismaRequestStatus> = {
      [CaseStatusEnum.PENDING]: PrismaRequestStatus.pending,
      [CaseStatusEnum.QUOTE_SENT]: PrismaRequestStatus.quote_sent,
      [CaseStatusEnum.SCHEDULED]: PrismaRequestStatus.scheduled,
      [CaseStatusEnum.QUOTE_ACCEPTED]: PrismaRequestStatus.quote_accepted,
      [CaseStatusEnum.ACTIVE]: PrismaRequestStatus.in_progress,
      [CaseStatusEnum.CLOSED]: PrismaRequestStatus.closed,
      [CaseStatusEnum.CANCELLED]: PrismaRequestStatus.cancelled,
    };
    return mapping[domainStatus];
  }

  // Prisma → Domain
  static toDomain(prismaStatus: PrismaRequestStatus): CaseStatusEnum {
    const mapping: Record<PrismaRequestStatus, CaseStatusEnum> = {
      [PrismaRequestStatus.pending]: CaseStatusEnum.PENDING,
      [PrismaRequestStatus.scheduled]: CaseStatusEnum.SCHEDULED,
      [PrismaRequestStatus.assigned]: CaseStatusEnum.PENDING,
      [PrismaRequestStatus.in_progress]: CaseStatusEnum.ACTIVE,
      [PrismaRequestStatus.quote_sent]: CaseStatusEnum.QUOTE_SENT,
      [PrismaRequestStatus.quote_accepted]: CaseStatusEnum.QUOTE_ACCEPTED,
      [PrismaRequestStatus.completed]: CaseStatusEnum.CLOSED,
      [PrismaRequestStatus.disputed]: CaseStatusEnum.ACTIVE,
      [PrismaRequestStatus.cancelled]: CaseStatusEnum.CANCELLED,
      [PrismaRequestStatus.closed]: CaseStatusEnum.CLOSED,
      [PrismaRequestStatus.no_show]: CaseStatusEnum.CANCELLED,
      [PrismaRequestStatus.rescheduled]: CaseStatusEnum.PENDING,
    };
    return mapping[prismaStatus];
  }
}

// ============================================
// PAYMENT STATUS MAPPER
// ============================================
export class PaymentStatusMapper {
  static toPrisma(domainStatus: PaymentStatusEnum): PrismaPaymentStatus {
    const mapping: Record<PaymentStatusEnum, PrismaPaymentStatus> = {
      [PaymentStatusEnum.PENDING]: PrismaPaymentStatus.pending,
      [PaymentStatusEnum.PAID]: PrismaPaymentStatus.paid,
      [PaymentStatusEnum.REFUNDED]: PrismaPaymentStatus.refunded,
      [PaymentStatusEnum.PARTIALLY_PAID]:
        PrismaPaymentStatus.partially_refunded, // or adjust
    };
    return mapping[domainStatus];
  }

  static toDomain(prismaStatus: PrismaPaymentStatus): PaymentStatusEnum {
    const mapping: Record<PrismaPaymentStatus, PaymentStatusEnum> = {
      [PrismaPaymentStatus.pending]: PaymentStatusEnum.PENDING,
      [PrismaPaymentStatus.paid]: PaymentStatusEnum.PAID,
      [PrismaPaymentStatus.failed]: PaymentStatusEnum.PENDING,
      [PrismaPaymentStatus.refunded]: PaymentStatusEnum.REFUNDED,
      [PrismaPaymentStatus.partially_refunded]:
        PaymentStatusEnum.PARTIALLY_PAID,
    };
    return mapping[prismaStatus];
  }
}
