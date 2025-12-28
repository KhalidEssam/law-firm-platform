// ============================================
// TRANSACTION LOG USE CASES
// src/core/application/billing/use-cases/transaction-log.use-cases.ts
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TransactionLog } from '../../../domain/billing/entities/transaction-log.entity';
import {
  Money,
  CurrencyEnum,
} from '../../../domain/billing/value-objects/money.vo';
import {
  TransactionType,
  TransactionTypeEnum,
} from '../../../domain/billing/value-objects/transaction-type.vo';
import {
  PaymentStatus,
  PaymentStatusEnum,
} from '../../../domain/billing/value-objects/payment-status.vo';
import {
  type ITransactionLogRepository,
  TransactionLogListOptions,
  TransactionSummary,
} from '../../../domain/billing/ports/transaction-log.repository';
import {
  CreateTransactionLogDto,
  CreateSubscriptionPaymentDto,
  CreateWalletTopupDto,
  CreateServicePaymentDto,
  ListTransactionLogsQueryDto,
} from '../dto/transaction-log.dto';

// ============================================
// CREATE TRANSACTION
// ============================================
@Injectable()
export class CreateTransactionLogUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(dto: CreateTransactionLogDto): Promise<TransactionLog> {
    const transaction = TransactionLog.create({
      userId: dto.userId,
      type: TransactionType.create(dto.type),
      amount: Money.create({
        amount: dto.amount,
        currency: dto.currency ?? CurrencyEnum.SAR,
      }),
      status: PaymentStatus.pending(),
      reference: dto.reference,
      metadata: dto.metadata,
    });

    return await this.transactionRepository.create(transaction);
  }
}

// ============================================
// CREATE SUBSCRIPTION PAYMENT
// ============================================
@Injectable()
export class CreateSubscriptionPaymentUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(dto: CreateSubscriptionPaymentDto): Promise<TransactionLog> {
    const transaction = TransactionLog.createSubscriptionPayment({
      userId: dto.userId,
      amount: Money.create({
        amount: dto.amount,
        currency: dto.currency ?? CurrencyEnum.SAR,
      }),
      reference: dto.membershipId,
      metadata: {
        ...dto.metadata,
        membershipId: dto.membershipId,
      },
    });

    return await this.transactionRepository.create(transaction);
  }
}

// ============================================
// CREATE WALLET TOPUP
// ============================================
@Injectable()
export class CreateWalletTopupUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(dto: CreateWalletTopupDto): Promise<TransactionLog> {
    const transaction = TransactionLog.createWalletTopup({
      userId: dto.userId,
      amount: Money.create({
        amount: dto.amount,
        currency: dto.currency ?? CurrencyEnum.SAR,
      }),
      reference: dto.paymentMethodId,
      metadata: {
        ...dto.metadata,
        paymentMethodId: dto.paymentMethodId,
      },
    });

    return await this.transactionRepository.create(transaction);
  }
}

// ============================================
// CREATE SERVICE PAYMENT
// ============================================
@Injectable()
export class CreateServicePaymentUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(dto: CreateServicePaymentDto): Promise<TransactionLog> {
    const transaction = TransactionLog.createServicePayment({
      userId: dto.userId,
      amount: Money.create({
        amount: dto.amount,
        currency: dto.currency ?? CurrencyEnum.SAR,
      }),
      reference: dto.serviceRequestId,
      metadata: {
        ...dto.metadata,
        serviceRequestId: dto.serviceRequestId,
      },
    });

    return await this.transactionRepository.create(transaction);
  }
}

// ============================================
// GET TRANSACTION BY ID
// ============================================
@Injectable()
export class GetTransactionLogByIdUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(id: string): Promise<TransactionLog> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }
}

// ============================================
// GET TRANSACTION BY REFERENCE
// ============================================
@Injectable()
export class GetTransactionByReferenceUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(reference: string): Promise<TransactionLog> {
    const transaction =
      await this.transactionRepository.findByReference(reference);
    if (!transaction) {
      throw new NotFoundException(
        `Transaction with reference ${reference} not found`,
      );
    }
    return transaction;
  }
}

// ============================================
// LIST TRANSACTIONS
// ============================================
@Injectable()
export class ListTransactionLogsUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(query: ListTransactionLogsQueryDto): Promise<{
    transactions: TransactionLog[];
    total: number;
  }> {
    const options: TransactionLogListOptions = {
      userId: query.userId,
      type: query.type as TransactionTypeEnum,
      status: query.status as PaymentStatusEnum,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      orderBy: query.orderBy as 'createdAt' | 'amount',
      orderDir: query.orderDir as 'asc' | 'desc',
    };

    const [transactions, total] = await Promise.all([
      this.transactionRepository.list(options),
      this.transactionRepository.count({
        userId: query.userId,
        type: query.type as TransactionTypeEnum,
        status: query.status as PaymentStatusEnum,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      }),
    ]);

    return { transactions, total };
  }
}

// ============================================
// GET USER TRANSACTIONS
// ============================================
@Injectable()
export class GetUserTransactionsUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(userId: string): Promise<TransactionLog[]> {
    return await this.transactionRepository.findByUserId(userId);
  }
}

// ============================================
// MARK TRANSACTION AS PAID
// ============================================
@Injectable()
export class MarkTransactionPaidUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(id: string, reference?: string): Promise<TransactionLog> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (!transaction.status.canBeRetried()) {
      throw new BadRequestException(
        `Cannot mark transaction as paid. Current status: ${transaction.status.getValue()}`,
      );
    }

    let updatedTransaction = transaction.markAsPaid();
    if (reference) {
      updatedTransaction = updatedTransaction.withReference(reference);
    }

    return await this.transactionRepository.update(updatedTransaction);
  }
}

// ============================================
// MARK TRANSACTION AS FAILED
// ============================================
@Injectable()
export class MarkTransactionFailedUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(
    id: string,
    errorDetails?: Record<string, unknown>,
  ): Promise<TransactionLog> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (transaction.status.isFinal()) {
      throw new BadRequestException(
        `Cannot mark transaction as failed. Current status: ${transaction.status.getValue()}`,
      );
    }

    let updatedTransaction = transaction.markAsFailed();
    if (errorDetails) {
      updatedTransaction = updatedTransaction.withMetadata({
        error: errorDetails,
      });
    }

    return await this.transactionRepository.update(updatedTransaction);
  }
}

// ============================================
// MARK TRANSACTION AS REFUNDED
// ============================================
@Injectable()
export class MarkTransactionRefundedUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(id: string, refundReference?: string): Promise<TransactionLog> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (!transaction.status.canBeRefunded()) {
      throw new BadRequestException(
        `Cannot mark transaction as refunded. Current status: ${transaction.status.getValue()}`,
      );
    }

    let updatedTransaction = transaction.markAsRefunded();
    if (refundReference) {
      updatedTransaction = updatedTransaction.withMetadata({ refundReference });
    }

    return await this.transactionRepository.update(updatedTransaction);
  }
}

// ============================================
// GET USER TRANSACTION SUMMARY
// ============================================
@Injectable()
export class GetUserTransactionSummaryUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TransactionSummary> {
    return await this.transactionRepository.getUserTransactionSummary(
      userId,
      fromDate,
      toDate,
    );
  }
}

// ============================================
// GET PENDING TRANSACTIONS
// ============================================
@Injectable()
export class GetPendingTransactionsUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(userId?: string): Promise<TransactionLog[]> {
    return await this.transactionRepository.findPendingTransactions(userId);
  }
}

// ============================================
// GET FAILED TRANSACTIONS
// ============================================
@Injectable()
export class GetFailedTransactionsUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(userId?: string): Promise<TransactionLog[]> {
    return await this.transactionRepository.findFailedTransactions(userId);
  }
}

// ============================================
// GET TOTAL SPENT
// ============================================
@Injectable()
export class GetTotalSpentUseCase {
  constructor(
    @Inject('ITransactionLogRepository')
    private readonly transactionRepository: ITransactionLogRepository,
  ) {}

  async execute(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<number> {
    return await this.transactionRepository.getTotalSpent(
      userId,
      fromDate,
      toDate,
    );
  }
}
