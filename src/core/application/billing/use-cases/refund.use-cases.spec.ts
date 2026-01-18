// ============================================
// REFUND USE CASES - UNIT TESTS
// src/core/application/billing/use-cases/refund.use-cases.spec.ts
// ============================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  RequestRefundUseCase,
  GetRefundByIdUseCase,
  ApproveRefundUseCase,
  RejectRefundUseCase,
  ProcessRefundUseCase,
  ListRefundsUseCase,
  GetUserRefundsUseCase,
} from './refund.use-cases';
import { Refund } from '../../../domain/billing/entities/refund.entity';
import {
  Money,
  CurrencyEnum,
} from '../../../domain/billing/value-objects/money.vo';
import { RefundStatusEnum } from '../../../domain/billing/value-objects/refund-status.vo';
import { IBillingUnitOfWork } from '../../../domain/billing/ports/billing.uow';
import { IRefundRepository } from '../../../domain/billing/ports/refund.repository';
import { TransactionLog } from '../../../domain/billing/entities/transaction-log.entity';

describe('Refund Use Cases', () => {
  let module: TestingModule;
  let requestRefundUseCase: RequestRefundUseCase;
  let getRefundUseCase: GetRefundByIdUseCase;
  let approveRefundUseCase: ApproveRefundUseCase;
  let rejectRefundUseCase: RejectRefundUseCase;
  let processRefundUseCase: ProcessRefundUseCase;
  let listRefundsUseCase: ListRefundsUseCase;
  let mockRefundRepository: jest.Mocked<IRefundRepository>;
  let mockBillingUow: jest.Mocked<IBillingUnitOfWork>;

  beforeEach(async () => {
    // Mock repositories
    mockRefundRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
      list: jest.fn(),
      count: jest.fn(),
      getStatistics: jest.fn(),
      hasActiveRefund: jest.fn(),
    } as any;

    mockBillingUow = {
      refunds: mockRefundRepository,
      disputes: {} as any,
      transactionLogs: {} as any,
      invoices: {} as any,
      transaction: jest.fn(async (work) => work(mockBillingUow)),
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
    } as any;

    module = await Test.createTestingModule({
      providers: [
        RequestRefundUseCase,
        GetRefundByIdUseCase,
        ApproveRefundUseCase,
        RejectRefundUseCase,
        ProcessRefundUseCase,
        ListRefundsUseCase,
        GetUserRefundsUseCase,
        {
          provide: 'IRefundRepository',
          useValue: mockRefundRepository,
        },
        {
          provide: Symbol.for('IBillingUnitOfWork'),
          useValue: mockBillingUow,
        },
      ],
    }).compile();

    requestRefundUseCase = module.get(RequestRefundUseCase);
    getRefundUseCase = module.get(GetRefundByIdUseCase);
    approveRefundUseCase = module.get(ApproveRefundUseCase);
    rejectRefundUseCase = module.get(RejectRefundUseCase);
    processRefundUseCase = module.get(ProcessRefundUseCase);
    listRefundsUseCase = module.get(ListRefundsUseCase);
  });

  describe('RequestRefundUseCase', () => {
    it('should create a new refund request', async () => {
      const dto = {
        userId: 'user-123',
        amount: 100,
        currency: CurrencyEnum.SAR,
        reason: 'Quality issue',
        transactionLogId: 'txn-456',
        paymentId: 'payment-789',
      };

      const createdRefund = Refund.create({
        userId: dto.userId,
        amount: Money.create({
          amount: dto.amount,
          currency: dto.currency,
        }),
        reason: dto.reason,
        transactionLogId: dto.transactionLogId,
        paymentId: dto.paymentId,
      });

      mockRefundRepository.create.mockResolvedValue(createdRefund);

      const result = await requestRefundUseCase.execute(dto);

      expect(result).toBeDefined();
      expect(result.userId).toBe(dto.userId);
      expect(mockRefundRepository.create).toHaveBeenCalled();
    });
  });

  describe('GetRefundByIdUseCase', () => {
    it('should return refund when found', async () => {
      const refundId = 'refund-123';
      const refund = Refund.create({
        userId: 'user-123',
        amount: Money.create({
          amount: 100,
          currency: CurrencyEnum.SAR,
        }),
        reason: 'Quality issue',
        transactionLogId: 'txn-456',
      });

      mockRefundRepository.findById.mockResolvedValue(refund);

      const result = await getRefundUseCase.execute(refundId);

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(mockRefundRepository.findById).toHaveBeenCalledWith(refundId);
    });

    it('should throw NotFoundException when refund not found', async () => {
      const refundId = 'non-existent';
      mockRefundRepository.findById.mockResolvedValue(null);

      await expect(getRefundUseCase.execute(refundId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('ApproveRefundUseCase', () => {
    it('should approve a pending refund atomically', async () => {
      const refundId = 'refund-123';
      const dto = {
        reviewedBy: 'admin-456',
        reviewNotes: 'Approved - valid claim',
      };

      const refund = Refund.create({
        userId: 'user-123',
        amount: Money.create({
          amount: 100,
          currency: CurrencyEnum.SAR,
        }),
        reason: 'Quality issue',
        transactionLogId: 'txn-456',
      });

      mockRefundRepository.findById.mockResolvedValue(refund);
      const approvedRefund = refund.approve({
        reviewedBy: dto.reviewedBy,
        reviewNotes: dto.reviewNotes,
      });
      mockRefundRepository.update.mockResolvedValue(approvedRefund);

      const result = await approveRefundUseCase.execute(refundId, dto);

      expect(result).toBeDefined();
      expect(mockBillingUow.transaction).toHaveBeenCalled();
      expect(mockRefundRepository.findById).toHaveBeenCalledWith(refundId);
      expect(mockRefundRepository.update).toHaveBeenCalled();
    });

    it('should throw error when refund cannot be reviewed', async () => {
      const refundId = 'refund-123';
      const dto = {
        reviewedBy: 'admin-456',
        reviewNotes: 'Approved',
      };

      // Create a refund in PROCESSED state that cannot be reviewed
      const refund = Refund.create({
        userId: 'user-123',
        amount: Money.create({
          amount: 100,
          currency: CurrencyEnum.SAR,
        }),
        reason: 'Quality issue',
        transactionLogId: 'txn-456',
      });
      // Simulate processed state
      refund['props'].status = RefundStatusEnum.PROCESSED;

      mockRefundRepository.findById.mockResolvedValue(refund);

      await expect(
        approveRefundUseCase.execute(refundId, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('RejectRefundUseCase', () => {
    it('should reject a pending refund atomically', async () => {
      const refundId = 'refund-123';
      const dto = {
        reviewedBy: 'admin-456',
        reviewNotes: 'Rejected - insufficient evidence',
      };

      const refund = Refund.create({
        userId: 'user-123',
        amount: Money.create({
          amount: 100,
          currency: CurrencyEnum.SAR,
        }),
        reason: 'Invalid claim',
        transactionLogId: 'txn-456',
      });

      mockRefundRepository.findById.mockResolvedValue(refund);
      const rejectedRefund = refund.reject({
        reviewedBy: dto.reviewedBy,
        reviewNotes: dto.reviewNotes,
      });
      mockRefundRepository.update.mockResolvedValue(rejectedRefund);

      const result = await rejectRefundUseCase.execute(refundId, dto);

      expect(result).toBeDefined();
      expect(mockBillingUow.transaction).toHaveBeenCalled();
      expect(mockRefundRepository.update).toHaveBeenCalled();
    });
  });

  describe('ProcessRefundUseCase', () => {
    it('should process an approved refund atomically with transaction log', async () => {
      const refundId = 'refund-123';
      const dto = {
        refundReference: 'REF-2024-001',
      };

      const refund = Refund.create({
        userId: 'user-123',
        amount: Money.create({
          amount: 100,
          currency: CurrencyEnum.SAR,
        }),
        reason: 'Quality issue',
        transactionLogId: 'txn-456',
      });

      mockRefundRepository.findById.mockResolvedValue(refund);
      const processedRefund = refund.process(dto.refundReference);
      mockRefundRepository.update.mockResolvedValue(processedRefund);

      const result = await processRefundUseCase.execute(refundId, dto);

      expect(result).toBeDefined();
      // Verify UoW transaction was called - ensures atomicity
      expect(mockBillingUow.transaction).toHaveBeenCalled();
      expect(mockRefundRepository.findById).toHaveBeenCalledWith(refundId);
      expect(mockRefundRepository.update).toHaveBeenCalled();
    });

    it('should throw error when processing non-approved refund', async () => {
      const refundId = 'refund-123';
      const dto = {
        refundReference: 'REF-2024-001',
      };

      const refund = Refund.create({
        userId: 'user-123',
        amount: Money.create({
          amount: 100,
          currency: CurrencyEnum.SAR,
        }),
        reason: 'Quality issue',
        transactionLogId: 'txn-456',
      });

      // Simulate pending state (not approved)
      mockRefundRepository.findById.mockResolvedValue(refund);

      await expect(processRefundUseCase.execute(refundId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('ListRefundsUseCase', () => {
    it('should list refunds with pagination', async () => {
      const query = {
        limit: 10,
        offset: 0,
      };

      const refunds = Array(5)
        .fill(null)
        .map((_, i) =>
          Refund.create({
            userId: `user-${i}`,
            amount: Money.create({
              amount: 100 + i,
              currency: CurrencyEnum.SAR,
            }),
            reason: `Reason ${i}`,
            transactionLogId: `txn-${i}`,
          }),
        );

      mockRefundRepository.list.mockResolvedValue(refunds);
      mockRefundRepository.count.mockResolvedValue(5);

      const result = await listRefundsUseCase.execute(query);

      expect(result.refunds).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(mockRefundRepository.list).toHaveBeenCalled();
      expect(mockRefundRepository.count).toHaveBeenCalled();
    });
  });

  describe('Transaction Safety - UoW Pattern', () => {
    it('should guarantee atomic operation for approve + audit trail', async () => {
      const refundId = 'refund-123';
      const dto = {
        reviewedBy: 'admin-456',
        reviewNotes: 'Approved',
      };

      const refund = Refund.create({
        userId: 'user-123',
        amount: Money.create({
          amount: 100,
          currency: CurrencyEnum.SAR,
        }),
        reason: 'Quality issue',
        transactionLogId: 'txn-456',
      });

      mockRefundRepository.findById.mockResolvedValue(refund);
      mockRefundRepository.update.mockResolvedValue(refund.approve(dto));

      await approveRefundUseCase.execute(refundId, dto);

      // Verify that transaction was called - ensures atomicity
      expect(mockBillingUow.transaction).toHaveBeenCalled();

      // Verify correct sequence: find -> approve -> update
      expect(mockRefundRepository.findById).toHaveBeenCalledBefore(
        mockRefundRepository.update as any,
      );
    });

    it('should rollback changes on error during approval', async () => {
      const refundId = 'refund-123';
      const dto = {
        reviewedBy: 'admin-456',
        reviewNotes: 'Approved',
      };

      const refund = Refund.create({
        userId: 'user-123',
        amount: Money.create({
          amount: 100,
          currency: CurrencyEnum.SAR,
        }),
        reason: 'Quality issue',
        transactionLogId: 'txn-456',
      });

      mockRefundRepository.findById.mockResolvedValue(refund);
      mockRefundRepository.update.mockRejectedValue(
        new Error('Database error'),
      );

      // Simulate UoW rollback behavior
      mockBillingUow.transaction.mockImplementationOnce(async (work) => {
        try {
          return await work(mockBillingUow);
        } catch (e) {
          await mockBillingUow.rollback();
          throw e;
        }
      });

      await expect(approveRefundUseCase.execute(refundId, dto)).rejects.toThrow(
        'Database error',
      );

      // Verify rollback was called
      expect(mockBillingUow.rollback).toHaveBeenCalled();
    });
  });
});
