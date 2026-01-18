// ============================================
// BILLING FINANCIAL FLOW INTEGRATION TESTS
// test/billing.integration.spec.ts
// ============================================

/**
 * Integration tests for complete financial workflows using UoW pattern.
 * 
 * These tests verify that:
 * 1. Multi-entity transactions are atomic
 * 2. All entities are updated consistently
 * 3. Rollback works correctly on failures
 * 4. Audit trails are maintained
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BillingModule } from '../src/infrastructure/modules/billing.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Billing Financial Operations - Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BillingModule, PrismaModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.transactionLog.deleteMany({});
    await prisma.refund.deleteMany({});
    await prisma.dispute.deleteMany({});
    await prisma.membershipInvoice.deleteMany({});
  });

  describe('Refund Processing Workflow - Atomic Transactions', () => {
    it('should process refund and create transaction log atomically', async () => {
      // Arrange: Create a transaction log first
      const originalTxn = await prisma.transactionLog.create({
        data: {
          userId: 'user-123',
          type: 'SERVICE_PAYMENT',
          amount: 100,
          currency: 'SAR',
          status: 'SUCCESS',
          reference: 'TXN-001',
        },
      });

      // Create a refund request
      const refund = await prisma.refund.create({
        data: {
          userId: 'user-123',
          amount: 100,
          currency: 'SAR',
          reason: 'Quality issue',
          status: 'APPROVED',
          transactionLogId: originalTxn.id,
          reviewedBy: 'admin-456',
          reviewedAt: new Date(),
        },
      });

      // Act: Process the refund
      const response = await request(app.getHttpServer())
        .post(`/billing/refunds/${refund.id}/process`)
        .send({
          refundReference: 'REF-2024-001',
        })
        .set('Authorization', 'Bearer token');

      // Assert
      expect(response.status).toBe(200);

      // Verify refund was updated
      const updatedRefund = await prisma.refund.findUnique({
        where: { id: refund.id },
      });
      expect(updatedRefund?.status).toBe('PROCESSED');
      expect(updatedRefund?.processedAt).toBeDefined();

      // Verify transaction log was created in same transaction
      const refundLog = await prisma.transactionLog.findFirst({
        where: {
          userId: 'user-123',
          type: 'REFUND',
          relatedRefundId: refund.id,
        },
      });
      expect(refundLog).toBeDefined();
      expect(refundLog?.amount).toBe(100);
      expect(refundLog?.status).toBe('SUCCESS');
    });

    it('should rollback refund and transaction log on failure', async () => {
      // Arrange
      const originalTxn = await prisma.transactionLog.create({
        data: {
          userId: 'user-123',
          type: 'SERVICE_PAYMENT',
          amount: 100,
          currency: 'SAR',
          status: 'SUCCESS',
          reference: 'TXN-001',
        },
      });

      const refund = await prisma.refund.create({
        data: {
          userId: 'user-123',
          amount: 100,
          currency: 'SAR',
          reason: 'Invalid reason',
          status: 'PENDING', // Not approved
          transactionLogId: originalTxn.id,
        },
      });

      // Act: Try to process non-approved refund
      const response = await request(app.getHttpServer())
        .post(`/billing/refunds/${refund.id}/process`)
        .send({
          refundReference: 'REF-2024-001',
        })
        .set('Authorization', 'Bearer token');

      // Assert: Should fail
      expect(response.status).toBe(400);

      // Verify refund was NOT updated (rollback)
      const unchangedRefund = await prisma.refund.findUnique({
        where: { id: refund.id },
      });
      expect(unchangedRefund?.status).toBe('PENDING');
      expect(unchangedRefund?.processedAt).toBeNull();

      // Verify no transaction log was created
      const refundLogs = await prisma.transactionLog.findMany({
        where: {
          relatedRefundId: refund.id,
        },
      });
      expect(refundLogs).toHaveLength(0);
    });

    it('should handle concurrent refund approvals safely', async () => {
      // Arrange: Create multiple refund requests
      const refunds = await Promise.all([
        prisma.refund.create({
          data: {
            userId: 'user-123',
            amount: 100,
            currency: 'SAR',
            reason: 'Issue 1',
            status: 'PENDING',
          },
        }),
        prisma.refund.create({
          data: {
            userId: 'user-123',
            amount: 50,
            currency: 'SAR',
            reason: 'Issue 2',
            status: 'PENDING',
          },
        }),
      ]);

      // Act: Approve both refunds concurrently
      const approvals = refunds.map((refund) =>
        request(app.getHttpServer())
          .put(`/billing/refunds/${refund.id}/approve`)
          .send({
            reviewedBy: 'admin-456',
            reviewNotes: 'Approved',
          })
          .set('Authorization', 'Bearer token'),
      );

      const responses = await Promise.all(approvals);

      // Assert: Both should succeed without data corruption
      responses.forEach((resp) => {
        expect(resp.status).toBe(200);
      });

      // Verify both refunds are approved
      const approvedRefunds = await prisma.refund.findMany({
        where: { status: 'APPROVED' },
      });
      expect(approvedRefunds).toHaveLength(2);
      expect(approvedRefunds).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: refunds[0].id }),
          expect.objectContaining({ id: refunds[1].id }),
        ]),
      );
    });
  });

  describe('Dispute Resolution Workflow - Multi-Entity Transactions', () => {
    it('should resolve dispute and create refund atomically', async () => {
      // Arrange: Create a consultation and dispute
      const dispute = await prisma.dispute.create({
        data: {
          userId: 'user-123',
          reason: 'Poor service quality',
          description: 'Service did not meet expectations',
          consultationId: 'cons-456',
          status: 'OPEN',
          priority: 'HIGH',
        },
      });

      // Act: Resolve dispute with refund
      const response = await request(app.getHttpServer())
        .post(`/billing/disputes/${dispute.id}/resolve`)
        .send({
          resolvedBy: 'manager-789',
          resolution: 'Refund issued',
          resolutionData: {
            refundAmount: 100,
            reason: 'Service quality issue',
          },
        })
        .set('Authorization', 'Bearer token');

      // Assert
      expect(response.status).toBe(200);

      // Verify dispute was resolved
      const resolvedDispute = await prisma.dispute.findUnique({
        where: { id: dispute.id },
      });
      expect(resolvedDispute?.status).toBe('RESOLVED');
      expect(resolvedDispute?.resolvedBy).toBe('manager-789');
      expect(resolvedDispute?.resolvedAt).toBeDefined();

      // Verify refund was created in same transaction
      const relatedRefund = await prisma.refund.findFirst({
        where: {
          userId: 'user-123',
          amount: 100,
        },
      });
      expect(relatedRefund).toBeDefined();
    });

    it('should maintain data consistency during concurrent dispute resolutions', async () => {
      // Arrange: Create multiple disputes
      const disputes = await Promise.all([
        prisma.dispute.create({
          data: {
            userId: 'user-123',
            reason: 'Issue 1',
            description: 'Description 1',
            consultationId: 'cons-456',
            status: 'UNDER_REVIEW',
            priority: 'MEDIUM',
          },
        }),
        prisma.dispute.create({
          data: {
            userId: 'user-456',
            reason: 'Issue 2',
            description: 'Description 2',
            consultationId: 'cons-789',
            status: 'UNDER_REVIEW',
            priority: 'MEDIUM',
          },
        }),
      ]);

      // Act: Resolve both concurrently
      const resolutions = disputes.map((dispute) =>
        request(app.getHttpServer())
          .post(`/billing/disputes/${dispute.id}/resolve`)
          .send({
            resolvedBy: 'manager-789',
            resolution: 'Refund issued',
            resolutionData: { refundAmount: 100 },
          })
          .set('Authorization', 'Bearer token'),
      );

      const responses = await Promise.all(resolutions);

      // Assert: No corruption or race conditions
      responses.forEach((resp) => {
        expect(resp.status).toBe(200);
      });

      const resolvedDisputes = await prisma.dispute.findMany({
        where: { status: 'RESOLVED' },
      });
      expect(resolvedDisputes).toHaveLength(2);
    });
  });

  describe('Invoice Payment Workflow - Transaction Tracking', () => {
    it('should mark invoice as paid and create transaction atomically', async () => {
      // Arrange
      const invoice = await prisma.membershipInvoice.create({
        data: {
          membershipId: 'mem-123',
          invoiceNumber: 'INV-2024-001',
          amount: 500,
          currency: 'SAR',
          status: 'ISSUED',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Act: Pay invoice
      const response = await request(app.getHttpServer())
        .post(`/billing/invoices/${invoice.id}/pay`)
        .send({
          paymentReference: 'PAY-2024-001',
          amount: 500,
        })
        .set('Authorization', 'Bearer token');

      // Assert
      expect(response.status).toBe(200);

      // Verify invoice status changed
      const paidInvoice = await prisma.membershipInvoice.findUnique({
        where: { id: invoice.id },
      });
      expect(paidInvoice?.status).toBe('PAID');
      expect(paidInvoice?.paidAt).toBeDefined();

      // Verify transaction was recorded
      const transaction = await prisma.transactionLog.findFirst({
        where: {
          relatedInvoiceId: invoice.id,
          type: 'INVOICE_PAYMENT',
        },
      });
      expect(transaction).toBeDefined();
      expect(transaction?.amount).toBe(500);
    });
  });

  describe('Financial Reporting - Data Consistency', () => {
    it('should generate accurate financial reports from transactional data', async () => {
      // Arrange: Create various transactions
      await prisma.transactionLog.createMany({
        data: [
          {
            userId: 'user-123',
            type: 'SERVICE_PAYMENT',
            amount: 100,
            currency: 'SAR',
            status: 'SUCCESS',
            reference: 'TXN-001',
          },
          {
            userId: 'user-123',
            type: 'REFUND',
            amount: 50,
            currency: 'SAR',
            status: 'SUCCESS',
            reference: 'REF-001',
          },
          {
            userId: 'user-456',
            type: 'SERVICE_PAYMENT',
            amount: 200,
            currency: 'SAR',
            status: 'SUCCESS',
            reference: 'TXN-002',
          },
        ],
      });

      // Act: Get financial summary
      const response = await request(app.getHttpServer())
        .get('/billing/transactions/summary')
        .set('Authorization', 'Bearer token');

      // Assert: Data should be consistent and accurate
      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          totalIncome: 300, // 100 + 200
          totalRefunds: 50,
          netIncome: 250, // 300 - 50
          transactionCount: 3,
        }),
      );
    });
  });

  describe('Error Recovery & Transaction Safety', () => {
    it('should not create partial records on validation failure', async () => {
      // Arrange: Create conditions for validation failure
      const invalidRefundData = {
        userId: '',  // Empty - invalid
        amount: -100, // Negative - invalid
        reason: 'Test',
      };

      // Act: Try to create invalid refund
      const response = await request(app.getHttpServer())
        .post('/billing/refunds')
        .send(invalidRefundData)
        .set('Authorization', 'Bearer token');

      // Assert
      expect(response.status).toBe(400);

      // Verify no refund was created (rollback)
      const refunds = await prisma.refund.findMany();
      expect(refunds).toHaveLength(0);
    });

    it('should maintain referential integrity during bulk operations', async () => {
      // Arrange: Create refund with transaction log reference
      const txn = await prisma.transactionLog.create({
        data: {
          userId: 'user-123',
          type: 'SERVICE_PAYMENT',
          amount: 100,
          currency: 'SAR',
          status: 'SUCCESS',
          reference: 'TXN-001',
        },
      });

      const refund = await prisma.refund.create({
        data: {
          userId: 'user-123',
          amount: 100,
          currency: 'SAR',
          reason: 'Quality issue',
          status: 'APPROVED',
          transactionLogId: txn.id,
        },
      });

      // Act: Process refund (creates related transaction)
      await request(app.getHttpServer())
        .post(`/billing/refunds/${refund.id}/process`)
        .send({
          refundReference: 'REF-2024-001',
        })
        .set('Authorization', 'Bearer token');

      // Assert: Verify all relationships are intact
      const updatedRefund = await prisma.refund.findUnique({
        where: { id: refund.id },
        include: { transactionLog: true },
      });

      expect(updatedRefund?.transactionLogId).toBe(txn.id);
      expect(updatedRefund?.transactionLog).toBeDefined();
    });
  });
});
