// ============================================
// DISPUTE USE CASES - UNIT TESTS
// src/core/application/billing/use-cases/dispute.use-cases.spec.ts
// ============================================

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateDisputeUseCase,
  GetDisputeByIdUseCase,
  EscalateDisputeUseCase,
  ResolveDisputeUseCase,
  ListDisputesUseCase,
} from './dispute.use-cases';
import { Dispute } from '../../../domain/billing/entities/dispute.entity';
import { DisputeStatusEnum } from '../../../domain/billing/value-objects/dispute-status.vo';
import {
  Priority,
  PriorityEnum,
} from '../../../domain/billing/value-objects/priority.vo';
import { IBillingUnitOfWork } from '../../../domain/billing/ports/billing.uow';
import { IDisputeRepository } from '../../../domain/billing/ports/dispute.repository';

describe('Dispute Use Cases', () => {
  let module: TestingModule;
  let createDisputeUseCase: CreateDisputeUseCase;
  let getDisputeUseCase: GetDisputeByIdUseCase;
  let escalateDisputeUseCase: EscalateDisputeUseCase;
  let resolveDisputeUseCase: ResolveDisputeUseCase;
  let listDisputesUseCase: ListDisputesUseCase;
  let mockDisputeRepository: jest.Mocked<IDisputeRepository>;
  let mockBillingUow: jest.Mocked<IBillingUnitOfWork>;

  beforeEach(async () => {
    mockDisputeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
      list: jest.fn(),
      count: jest.fn(),
      hasActiveDispute: jest.fn(),
      getStatistics: jest.fn(),
    } as any;

    mockBillingUow = {
      disputes: mockDisputeRepository,
      refunds: {} as any,
      transactionLogs: {} as any,
      invoices: {} as any,
      transaction: jest.fn(async (work) => work(mockBillingUow)),
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
    } as any;

    module = await Test.createTestingModule({
      providers: [
        CreateDisputeUseCase,
        GetDisputeByIdUseCase,
        EscalateDisputeUseCase,
        ResolveDisputeUseCase,
        ListDisputesUseCase,
        {
          provide: 'IDisputeRepository',
          useValue: mockDisputeRepository,
        },
        {
          provide: Symbol.for('IBillingUnitOfWork'),
          useValue: mockBillingUow,
        },
      ],
    }).compile();

    createDisputeUseCase = module.get(CreateDisputeUseCase);
    getDisputeUseCase = module.get(GetDisputeByIdUseCase);
    escalateDisputeUseCase = module.get(EscalateDisputeUseCase);
    resolveDisputeUseCase = module.get(ResolveDisputeUseCase);
    listDisputesUseCase = module.get(ListDisputesUseCase);
  });

  describe('CreateDisputeUseCase', () => {
    it('should create a dispute for consultation', async () => {
      const dto = {
        userId: 'user-123',
        consultationId: 'cons-456',
        reason: 'Poor service quality',
        description: 'Service did not meet expectations',
        evidence: ['evidence1', 'evidence2'],
      };

      mockDisputeRepository.hasActiveDispute.mockResolvedValue(false);

      const dispute = Dispute.create({
        userId: dto.userId,
        reason: dto.reason,
        description: dto.description,
        relatedEntity: {
          consultationId: dto.consultationId,
        },
        evidence: dto.evidence,
        priority: Priority.normal(),
      });

      mockDisputeRepository.create.mockResolvedValue(dispute);

      const result = await createDisputeUseCase.execute(dto);

      expect(result).toBeDefined();
      expect(result.userId).toBe(dto.userId);
      expect(mockDisputeRepository.hasActiveDispute).toHaveBeenCalledWith(
        'consultation',
        dto.consultationId,
      );
      expect(mockDisputeRepository.create).toHaveBeenCalled();
    });

    it('should throw error when active dispute already exists', async () => {
      const dto = {
        userId: 'user-123',
        consultationId: 'cons-456',
        reason: 'Poor service quality',
        description: 'Service did not meet expectations',
      };

      mockDisputeRepository.hasActiveDispute.mockResolvedValue(true);

      await expect(createDisputeUseCase.execute(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when no related entity provided', async () => {
      const dto = {
        userId: 'user-123',
        reason: 'Poor service quality',
        description: 'Service did not meet expectations',
      };

      await expect(createDisputeUseCase.execute(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('GetDisputeByIdUseCase', () => {
    it('should return dispute when found', async () => {
      const disputeId = 'dispute-123';
      const dispute = Dispute.create({
        userId: 'user-123',
        reason: 'Quality issue',
        description: 'Poor service',
        relatedEntity: {
          consultationId: 'cons-456',
        },
        priority: Priority.normal(),
      });

      mockDisputeRepository.findById.mockResolvedValue(dispute);

      const result = await getDisputeUseCase.execute(disputeId);

      expect(result).toBeDefined();
      expect(mockDisputeRepository.findById).toHaveBeenCalledWith(disputeId);
    });

    it('should throw NotFoundException when dispute not found', async () => {
      mockDisputeRepository.findById.mockResolvedValue(null);

      await expect(getDisputeUseCase.execute('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('EscalateDisputeUseCase', () => {
    it('should escalate dispute atomically', async () => {
      const disputeId = 'dispute-123';
      const dto = {
        escalatedTo: 'manager-789',
        escalationReason: 'Customer insistent',
        newPriority: PriorityEnum.HIGH,
      };

      const dispute = Dispute.create({
        userId: 'user-123',
        reason: 'Quality issue',
        description: 'Poor service',
        relatedEntity: {
          consultationId: 'cons-456',
        },
        priority: Priority.normal(),
      });

      mockDisputeRepository.findById.mockResolvedValue(dispute);
      const escalatedDispute = dispute.escalate({
        escalatedTo: dto.escalatedTo,
        escalationReason: dto.escalationReason,
        newPriority: dto.newPriority,
      });
      mockDisputeRepository.update.mockResolvedValue(escalatedDispute);

      const result = await escalateDisputeUseCase.execute(disputeId, dto);

      expect(result).toBeDefined();
      // Verify transaction was called for atomicity
      expect(mockBillingUow.transaction).toHaveBeenCalled();
      expect(mockDisputeRepository.findById).toHaveBeenCalledWith(disputeId);
      expect(mockDisputeRepository.update).toHaveBeenCalled();
    });
  });

  describe('ResolveDisputeUseCase', () => {
    it('should resolve dispute atomically with resolution log', async () => {
      const disputeId = 'dispute-123';
      const dto = {
        resolvedBy: 'manager-789',
        resolution: 'Refund issued',
        resolutionData: {
          refundAmount: 100,
          reason: 'Service quality issue',
        },
      };

      const dispute = Dispute.create({
        userId: 'user-123',
        reason: 'Quality issue',
        description: 'Poor service',
        relatedEntity: {
          consultationId: 'cons-456',
        },
        priority: Priority.normal(),
      });

      mockDisputeRepository.findById.mockResolvedValue(dispute);
      const resolvedDispute = dispute.resolve({
        resolvedBy: dto.resolvedBy,
        resolution: dto.resolution,
        resolutionData: dto.resolutionData,
      });
      mockDisputeRepository.update.mockResolvedValue(resolvedDispute);

      const result = await resolveDisputeUseCase.execute(disputeId, dto);

      expect(result).toBeDefined();
      // Verify UoW transaction ensures atomicity
      expect(mockBillingUow.transaction).toHaveBeenCalled();
      expect(mockDisputeRepository.update).toHaveBeenCalled();
    });
  });

  describe('ListDisputesUseCase', () => {
    it('should list disputes with filtering', async () => {
      const query = {
        status: DisputeStatusEnum.OPEN,
        limit: 10,
        offset: 0,
      };

      const disputes = Array(3)
        .fill(null)
        .map((_, i) =>
          Dispute.create({
            userId: `user-${i}`,
            reason: `Issue ${i}`,
            description: `Description ${i}`,
            relatedEntity: {
              consultationId: `cons-${i}`,
            },
            priority: Priority.normal(),
          }),
        );

      mockDisputeRepository.list.mockResolvedValue(disputes);
      mockDisputeRepository.count.mockResolvedValue(3);

      const result = await listDisputesUseCase.execute(query);

      expect(result.disputes).toHaveLength(3);
      expect(result.total).toBe(3);
    });
  });

  describe('Transaction Safety - UoW Pattern', () => {
    it('should guarantee atomic operation for escalation with history', async () => {
      const disputeId = 'dispute-123';
      const dto = {
        escalatedTo: 'manager-789',
        escalationReason: 'Customer insistent',
        newPriority: PriorityEnum.HIGH,
      };

      const dispute = Dispute.create({
        userId: 'user-123',
        reason: 'Quality issue',
        description: 'Poor service',
        relatedEntity: {
          consultationId: 'cons-456',
        },
        priority: Priority.normal(),
      });

      mockDisputeRepository.findById.mockResolvedValue(dispute);
      mockDisputeRepository.update.mockResolvedValue(
        dispute.escalate({
          escalatedTo: dto.escalatedTo,
          escalationReason: dto.escalationReason,
          newPriority: dto.newPriority,
        }),
      );

      await escalateDisputeUseCase.execute(disputeId, dto);

      // Verify transaction was called - ensures atomicity
      expect(mockBillingUow.transaction).toHaveBeenCalled();

      // Verify correct sequence
      expect(mockDisputeRepository.findById).toHaveBeenCalledBefore(
        mockDisputeRepository.update as any,
      );
    });

    it('should rollback all changes if resolution fails', async () => {
      const disputeId = 'dispute-123';
      const dto = {
        resolvedBy: 'manager-789',
        resolution: 'Refund issued',
        resolutionData: {
          refundAmount: 100,
          reason: 'Service quality issue',
        },
      };

      const dispute = Dispute.create({
        userId: 'user-123',
        reason: 'Quality issue',
        description: 'Poor service',
        relatedEntity: {
          consultationId: 'cons-456',
        },
        priority: Priority.normal(),
      });

      mockDisputeRepository.findById.mockResolvedValue(dispute);
      mockDisputeRepository.update.mockRejectedValue(
        new Error('Database error'),
      );

      // Simulate UoW rollback on error
      mockBillingUow.transaction.mockImplementationOnce(async (work) => {
        try {
          return await work(mockBillingUow);
        } catch (e) {
          await mockBillingUow.rollback();
          throw e;
        }
      });

      await expect(resolveDisputeUseCase.execute(disputeId, dto)).rejects.toThrow(
        'Database error',
      );

      expect(mockBillingUow.rollback).toHaveBeenCalled();
    });
  });
});
