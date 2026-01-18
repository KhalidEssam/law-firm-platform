# Unit of Work Pattern for Financial Operations

## Overview

This document describes the implementation of the **Unit of Work (UoW) pattern** for financial operations in the Law Firm platform. The UoW pattern ensures **ACID compliance** for multi-entity transactions that involve money, refunds, disputes, and audit trails.

## Problem Statement

### Without UoW Pattern

```typescript
// ❌ NOT SAFE - Race condition possible
async execute(id: string, dto: ProcessRefundDto): Promise<Refund> {
  const refund = await this.refundRepository.findById(id);           // T1: Read
  // ⚠️ Another request could modify refund between T1 and T2
  
  const updatedRefund = refund.process(dto.refundReference);
  await this.refundRepository.update(updatedRefund);                  // T1: Write
  
  // ⚠️ What if this fails? Refund updated but no transaction log!
  const log = TransactionLog.create({
    type: TransactionType.REFUND,
    userId: refund.userId,
    amount: refund.amount,
  });
  await this.transactionLogRepository.create(log);                    // T2: Partial
}
```

**Risks:**
- **Race Condition**: Two concurrent requests process same refund
- **Partial Failures**: Refund updated but transaction log not created
- **Data Inconsistency**: Audit trail incomplete
- **Financial Loss**: No record of refund processed

### With UoW Pattern

```typescript
// ✅ SAFE - Atomic transaction
async execute(id: string, dto: ProcessRefundDto): Promise<Refund> {
  return await this.billingUow.transaction(async (uow) => {
    // All operations below are in SAME transaction
    const refund = await uow.refunds.findById(id);
    const updatedRefund = refund.process(dto.refundReference);
    await uow.refunds.update(updatedRefund);
    
    const log = TransactionLog.create({...});
    await uow.transactionLogs.create(log);
    
    // If ANY operation fails, ALL are rolled back
    // If ALL succeed, ALL are committed atomically
    return updatedRefund;
  });
}
```

**Benefits:**
- **Atomicity**: All or nothing
- **Consistency**: No partial states
- **Isolation**: Concurrent operations don't interfere
- **Durability**: Once committed, never lost

---

## Architecture

### 1. UoW Interface (Domain Layer)

```typescript
// src/core/domain/billing/ports/billing.uow.ts
export interface IBillingUnitOfWork extends IBaseUnitOfWork<IBillingUnitOfWork> {
  readonly refunds: IRefundRepository;
  readonly disputes: IDisputeRepository;
  readonly transactionLogs: ITransactionLogRepository;
  readonly invoices: IMembershipInvoiceRepository;
  
  transaction<T>(work: (uow: IBillingUnitOfWork) => Promise<T>): Promise<T>;
}
```

### 2. UoW Implementation (Infrastructure Layer)

```typescript
// src/infrastructure/persistence/billing/prisma-billing.uow.ts
@Injectable()
export class PrismaBillingUnitOfWork implements IBillingUnitOfWork {
  async transaction<T>(work: (uow: IBillingUnitOfWork) => Promise<T>): Promise<T> {
    const client = await this.prisma.$transaction(async (tx) => {
      return await work(this.createTransactionalUow(tx));
    });
    return client;
  }
  
  private createTransactionalUow(txClient: PrismaTransactionClient): IBillingUnitOfWork {
    return {
      refunds: new TransactionalRefundRepository(txClient),
      disputes: new TransactionalDisputeRepository(txClient),
      transactionLogs: new TransactionalTransactionLogRepository(txClient),
      invoices: new TransactionalMembershipInvoiceRepository(txClient),
    };
  }
}
```

### 3. Use Case Implementation

```typescript
// src/core/application/billing/use-cases/refund.use-cases.ts
@Injectable()
export class ProcessRefundUseCase {
  constructor(
    @Inject(BILLING_UNIT_OF_WORK)
    private readonly billingUow: IBillingUnitOfWork,
  ) {}

  async execute(id: string, dto: ProcessRefundDto): Promise<Refund> {
    // ✅ Everything inside transaction() is atomic
    return await this.billingUow.transaction(async (uow) => {
      const refund = await uow.refunds.findById(id);
      if (!refund) throw new NotFoundException(...);
      
      const updatedRefund = refund.process(dto.refundReference);
      await uow.refunds.update(updatedRefund);
      
      const log = TransactionLog.create({
        type: TransactionType.REFUND,
        userId: refund.userId,
        amount: refund.amount,
      });
      await uow.transactionLogs.create(log);
      
      return updatedRefund;
    });
  }
}
```

---

## Financial Operations Using UoW

### 1. Refund Processing (Atomic Multi-Entity)

```typescript
// Process refund atomically:
// 1. Update refund status
// 2. Create refund transaction log
// 3. Update original transaction as refunded

return await this.billingUow.transaction(async (uow) => {
  // Find refund
  const refund = await uow.refunds.findById(refundId);
  
  // Update refund
  const processed = refund.process(reference);
  await uow.refunds.update(processed);
  
  // Create audit log (same transaction)
  await uow.transactionLogs.create(
    TransactionLog.create({
      type: TransactionType.REFUND,
      userId: refund.userId,
      amount: refund.amount,
      relatedRefundId: refund.id,
    })
  );
  
  // Update original transaction (same transaction)
  const original = await uow.transactionLogs.findById(refund.transactionLogId);
  if (original) {
    await uow.transactionLogs.update(
      original.markAsRefunded(refund.id)
    );
  }
  
  return processed;
});
```

### 2. Dispute Resolution (Complex Multi-Entity)

```typescript
// Resolve dispute with refund atomically:
// 1. Update dispute to RESOLVED
// 2. Create refund request
// 3. Create transaction log
// 4. Create audit trail

return await this.billingUow.transaction(async (uow) => {
  const dispute = await uow.disputes.findById(disputeId);
  
  // Update dispute
  const resolved = dispute.resolve({
    resolvedBy: dto.resolvedBy,
    resolution: dto.resolution,
  });
  await uow.disputes.update(resolved);
  
  // Create refund (same transaction)
  const refund = Refund.create({
    userId: dispute.userId,
    amount: Money.create({
      amount: dto.refundAmount,
      currency: CurrencyEnum.SAR,
    }),
    reason: `Dispute resolution: ${dto.resolution}`,
  });
  const createdRefund = await uow.refunds.create(refund);
  
  // Create transaction log (same transaction)
  await uow.transactionLogs.create(
    TransactionLog.create({
      type: TransactionType.DISPUTE_RESOLUTION_REFUND,
      userId: dispute.userId,
      amount: dto.refundAmount,
      relatedDisputeId: dispute.id,
      relatedRefundId: createdRefund.id,
    })
  );
  
  return resolved;
});
```

### 3. Invoice Payment (Multi-Entity Update)

```typescript
// Mark invoice as paid with transaction log atomically:
// 1. Update invoice status
// 2. Create payment transaction
// 3. Update user wallet/balance

return await this.billingUow.transaction(async (uow) => {
  const invoice = await uow.invoices.findById(invoiceId);
  
  // Update invoice
  const paid = invoice.markAsPaid(dto.paymentReference);
  await uow.invoices.update(paid);
  
  // Create transaction log (same transaction)
  await uow.transactionLogs.create(
    TransactionLog.create({
      type: TransactionType.INVOICE_PAYMENT,
      userId: invoice.membershipId,
      amount: invoice.amount,
      relatedInvoiceId: invoice.id,
      reference: dto.paymentReference,
    })
  );
  
  return paid;
});
```

---

## Transaction Guarantees

### ACID Properties

| Property | Implementation | Guarantee |
|----------|---|---|
| **Atomicity** | Prisma `$transaction()` | All or nothing |
| **Consistency** | Domain validation | Valid state always |
| **Isolation** | DB-level locking | No dirty reads |
| **Durability** | PostgreSQL WAL | Data persisted |

### Rollback on Error

```typescript
try {
  return await this.billingUow.transaction(async (uow) => {
    // Operation 1
    await uow.refunds.update(...);
    
    // Operation 2 - throws error
    throw new Error('Database connection lost');
    
    // Operation 3 - never executes
    await uow.transactionLogs.create(...);
  });
} catch (e) {
  // ✅ Operations 1 and 2 are automatically rolled back
  // ✅ No partial state persisted
  throw e;
}
```

### Concurrent Request Safety

```typescript
// Request 1 (T1)              Request 2 (T2)
const refund = await...       const refund = await...
const updated = refund...     const updated = refund...
await uow.refunds.update()    await uow.refunds.update()
                              
// ✅ No race condition - DB ensures serialization
// ✅ Second request gets locked until first commits
```

---

## Testing Strategies

### 1. Unit Tests (Mocked UoW)

```typescript
it('should process refund atomically', async () => {
  mockBillingUow.transaction.mockImplementationOnce(async (work) => {
    return await work(mockBillingUow);
  });

  await processRefundUseCase.execute(refundId, dto);

  // Verify transaction was called
  expect(mockBillingUow.transaction).toHaveBeenCalled();
  // Verify operations in order
  expect(mockRefundRepository.update).toHaveBeenCalled();
});
```

### 2. Integration Tests (Real DB)

```typescript
it('should maintain data consistency on concurrent refunds', async () => {
  const refunds = await Promise.all([
    processRefund(refund1),
    processRefund(refund2),
  ]);

  // Both should succeed without corruption
  const persisted = await prisma.refund.findMany({
    where: { id: { in: [refund1.id, refund2.id] } },
  });
  
  expect(persisted).toHaveLength(2);
  expect(persisted).toEqual(expect.arrayContaining(refunds));
});
```

### 3. Failure Scenarios

```typescript
it('should rollback all changes on failure', async () => {
  mockRefundRepository.update.mockRejectedValueOnce(
    new Error('DB error')
  );

  mockBillingUow.transaction.mockImplementationOnce(async (work) => {
    try {
      return await work(mockBillingUow);
    } catch (e) {
      await mockBillingUow.rollback();
      throw e;
    }
  });

  await expect(
    processRefundUseCase.execute(refundId, dto)
  ).rejects.toThrow('DB error');

  expect(mockBillingUow.rollback).toHaveBeenCalled();
});
```

---

## Performance Considerations

### Transaction Duration

```typescript
// ❌ SLOW - Long transaction
return await this.billingUow.transaction(async (uow) => {
  const refund = await uow.refunds.findById(id);
  await externalApiCall(refund);  // Blocks transaction!
  await uow.refunds.update(refund);
});

// ✅ FAST - Short transaction
const externalData = await externalApiCall(id);
return await this.billingUow.transaction(async (uow) => {
  const refund = await uow.refunds.findById(id);
  refund.update(externalData);
  await uow.refunds.update(refund);
});
```

### Best Practices

1. **Keep transactions short**: Only include database operations
2. **Do I/O outside**: External API calls before transaction
3. **Validate early**: Check all inputs before transaction
4. **Handle errors gracefully**: Catch and log, then rollback automatically

---

## Migration Guide

### From Non-Transactional to UoW

**Before:**
```typescript
async execute(id: string, dto: RefundDto): Promise<Refund> {
  const refund = await this.refundRepository.findById(id);
  await this.refundRepository.update(refund);  // T1
  
  // Missing: transactionlog creation
  return refund;
}
```

**After:**
```typescript
async execute(id: string, dto: RefundDto): Promise<Refund> {
  return await this.billingUow.transaction(async (uow) => {
    const refund = await uow.refunds.findById(id);
    await uow.refunds.update(refund);  // T1
    
    await uow.transactionLogs.create(log);  // T2 (same transaction)
    return refund;
  });
}
```

---

## Troubleshooting

### Transaction Timeout

```
Error: Transaction timeout after 5000ms
```

**Solution:** Move non-DB operations outside transaction

```typescript
const externalData = await fetchData();  // Outside

return await this.billingUow.transaction(async (uow) => {
  const refund = await uow.refunds.findById(id);
  refund.update(externalData);
  await uow.refunds.update(refund);
});
```

### Deadlock Detection

```
Error: Deadlock detected
```

**Solution:** Ensure consistent ordering of table access

```typescript
// ✅ Always access in same order
await uow.refunds.update(...);
await uow.transactionLogs.create(...);

// ❌ Avoid reverse order in other requests
// await uow.transactionLogs.create(...);
// await uow.refunds.update(...);
```

### Nested Transaction Error

```
Error: Cannot use nested transactions
```

**Solution:** Prisma transactions cannot be nested

```typescript
// ❌ Don't nest
return await this.billingUow.transaction(async (uow) => {
  return await this.membershipUow.transaction(async (muow) => {
    // Error: nested transaction
  });
});

// ✅ Create combined UoW or sequence them
```

---

## References

- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Unit of Work Pattern](https://martinfowler.com/eaaCatalog/unitOfWork.html)
- [ACID Properties](https://en.wikipedia.org/wiki/ACID)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
