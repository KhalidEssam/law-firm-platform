// ============================================
// BILLING ENUM MAPPERS
// src/infrastructure/persistence/billing/billing-enum.mapper.ts
// ============================================

import {
  InvoiceStatus as PrismaInvoiceStatus,
  TransactionType as PrismaTransactionType,
  PaymentStatus as PrismaPaymentStatus,
  RefundStatus as PrismaRefundStatus,
  DisputeStatus as PrismaDisputeStatus,
  Priority as PrismaPriority,
  Currency as PrismaCurrency,
} from '@prisma/client';

import { InvoiceStatusEnum } from '../../../core/domain/billing/value-objects/invoice-status.vo';
import { TransactionTypeEnum } from '../../../core/domain/billing/value-objects/transaction-type.vo';
import { PaymentStatusEnum } from '../../../core/domain/billing/value-objects/payment-status.vo';
import { RefundStatusEnum } from '../../../core/domain/billing/value-objects/refund-status.vo';
import { DisputeStatusEnum } from '../../../core/domain/billing/value-objects/dispute-status.vo';
import { PriorityEnum } from '../../../core/domain/billing/value-objects/priority.vo';
import { CurrencyEnum } from '../../../core/domain/billing/value-objects/money.vo';

// ============================================
// INVOICE STATUS MAPPER
// ============================================
export class InvoiceStatusMapper {
  static toPrisma(status: InvoiceStatusEnum): PrismaInvoiceStatus {
    const mapping: Record<InvoiceStatusEnum, PrismaInvoiceStatus> = {
      [InvoiceStatusEnum.UNPAID]: PrismaInvoiceStatus.unpaid,
      [InvoiceStatusEnum.PAID]: PrismaInvoiceStatus.paid,
      [InvoiceStatusEnum.OVERDUE]: PrismaInvoiceStatus.overdue,
      [InvoiceStatusEnum.CANCELLED]: PrismaInvoiceStatus.cancelled,
    };
    return mapping[status];
  }

  static toDomain(status: PrismaInvoiceStatus): InvoiceStatusEnum {
    const mapping: Record<PrismaInvoiceStatus, InvoiceStatusEnum> = {
      [PrismaInvoiceStatus.unpaid]: InvoiceStatusEnum.UNPAID,
      [PrismaInvoiceStatus.paid]: InvoiceStatusEnum.PAID,
      [PrismaInvoiceStatus.overdue]: InvoiceStatusEnum.OVERDUE,
      [PrismaInvoiceStatus.cancelled]: InvoiceStatusEnum.CANCELLED,
    };
    return mapping[status];
  }
}

// ============================================
// TRANSACTION TYPE MAPPER
// ============================================
export class TransactionTypeMapper {
  static toPrisma(type: TransactionTypeEnum): PrismaTransactionType {
    const mapping: Record<TransactionTypeEnum, PrismaTransactionType> = {
      [TransactionTypeEnum.SUBSCRIPTION]: PrismaTransactionType.subscription,
      [TransactionTypeEnum.WALLET_TOPUP]: PrismaTransactionType.wallet_topup,
      [TransactionTypeEnum.SERVICE_PAYMENT]:
        PrismaTransactionType.service_payment,
      [TransactionTypeEnum.REFUND]: PrismaTransactionType.refund,
    };
    return mapping[type];
  }

  static toDomain(type: PrismaTransactionType): TransactionTypeEnum {
    const mapping: Record<PrismaTransactionType, TransactionTypeEnum> = {
      [PrismaTransactionType.subscription]: TransactionTypeEnum.SUBSCRIPTION,
      [PrismaTransactionType.wallet_topup]: TransactionTypeEnum.WALLET_TOPUP,
      [PrismaTransactionType.service_payment]:
        TransactionTypeEnum.SERVICE_PAYMENT,
      [PrismaTransactionType.refund]: TransactionTypeEnum.REFUND,
    };
    return mapping[type];
  }
}

// ============================================
// PAYMENT STATUS MAPPER
// ============================================
export class PaymentStatusMapper {
  static toPrisma(status: PaymentStatusEnum): PrismaPaymentStatus {
    const mapping: Record<PaymentStatusEnum, PrismaPaymentStatus> = {
      [PaymentStatusEnum.PENDING]: PrismaPaymentStatus.pending,
      [PaymentStatusEnum.PAID]: PrismaPaymentStatus.paid,
      [PaymentStatusEnum.FAILED]: PrismaPaymentStatus.failed,
      [PaymentStatusEnum.REFUNDED]: PrismaPaymentStatus.refunded,
      [PaymentStatusEnum.PARTIALLY_REFUNDED]:
        PrismaPaymentStatus.partially_refunded,
    };
    return mapping[status];
  }

  static toDomain(status: PrismaPaymentStatus): PaymentStatusEnum {
    const mapping: Record<PrismaPaymentStatus, PaymentStatusEnum> = {
      [PrismaPaymentStatus.pending]: PaymentStatusEnum.PENDING,
      [PrismaPaymentStatus.paid]: PaymentStatusEnum.PAID,
      [PrismaPaymentStatus.failed]: PaymentStatusEnum.FAILED,
      [PrismaPaymentStatus.refunded]: PaymentStatusEnum.REFUNDED,
      [PrismaPaymentStatus.partially_refunded]:
        PaymentStatusEnum.PARTIALLY_REFUNDED,
    };
    return mapping[status];
  }
}

// ============================================
// REFUND STATUS MAPPER
// ============================================
export class RefundStatusMapper {
  static toPrisma(status: RefundStatusEnum): PrismaRefundStatus {
    const mapping: Record<RefundStatusEnum, PrismaRefundStatus> = {
      [RefundStatusEnum.PENDING]: PrismaRefundStatus.pending,
      [RefundStatusEnum.APPROVED]: PrismaRefundStatus.approved,
      [RefundStatusEnum.REJECTED]: PrismaRefundStatus.rejected,
      [RefundStatusEnum.PROCESSED]: PrismaRefundStatus.processed,
    };
    return mapping[status];
  }

  static toDomain(status: PrismaRefundStatus): RefundStatusEnum {
    const mapping: Record<PrismaRefundStatus, RefundStatusEnum> = {
      [PrismaRefundStatus.pending]: RefundStatusEnum.PENDING,
      [PrismaRefundStatus.approved]: RefundStatusEnum.APPROVED,
      [PrismaRefundStatus.rejected]: RefundStatusEnum.REJECTED,
      [PrismaRefundStatus.processed]: RefundStatusEnum.PROCESSED,
    };
    return mapping[status];
  }
}

// ============================================
// DISPUTE STATUS MAPPER
// ============================================
export class DisputeStatusMapper {
  static toPrisma(status: DisputeStatusEnum): PrismaDisputeStatus {
    const mapping: Record<DisputeStatusEnum, PrismaDisputeStatus> = {
      [DisputeStatusEnum.OPEN]: PrismaDisputeStatus.open,
      [DisputeStatusEnum.UNDER_REVIEW]: PrismaDisputeStatus.under_review,
      [DisputeStatusEnum.RESOLVED]: PrismaDisputeStatus.resolved,
      [DisputeStatusEnum.ESCALATED]: PrismaDisputeStatus.escalated,
      [DisputeStatusEnum.CLOSED]: PrismaDisputeStatus.closed,
    };
    return mapping[status];
  }

  static toDomain(status: PrismaDisputeStatus): DisputeStatusEnum {
    const mapping: Record<PrismaDisputeStatus, DisputeStatusEnum> = {
      [PrismaDisputeStatus.open]: DisputeStatusEnum.OPEN,
      [PrismaDisputeStatus.under_review]: DisputeStatusEnum.UNDER_REVIEW,
      [PrismaDisputeStatus.resolved]: DisputeStatusEnum.RESOLVED,
      [PrismaDisputeStatus.escalated]: DisputeStatusEnum.ESCALATED,
      [PrismaDisputeStatus.closed]: DisputeStatusEnum.CLOSED,
    };
    return mapping[status];
  }
}

// ============================================
// PRIORITY MAPPER
// ============================================
export class PriorityMapper {
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

// ============================================
// CURRENCY MAPPER
// ============================================
export class CurrencyMapper {
  static toPrisma(currency: CurrencyEnum): PrismaCurrency {
    const mapping: Record<CurrencyEnum, PrismaCurrency> = {
      [CurrencyEnum.SAR]: PrismaCurrency.SAR,
      [CurrencyEnum.USD]: PrismaCurrency.USD,
      [CurrencyEnum.EUR]: PrismaCurrency.EUR,
    };
    return mapping[currency];
  }

  static toDomain(currency: PrismaCurrency): CurrencyEnum {
    const mapping: Record<PrismaCurrency, CurrencyEnum> = {
      [PrismaCurrency.SAR]: CurrencyEnum.SAR,
      [PrismaCurrency.USD]: CurrencyEnum.USD,
      [PrismaCurrency.EUR]: CurrencyEnum.EUR,
    };
    return mapping[currency];
  }
}
