# Unit of Work (UoW) Pattern Analysis & Implementation Plan

> **Document Version:** 1.0
> **Date:** 2025-12-25
> **Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Risk Assessment](#3-risk-assessment)
4. [Implementation Phases](#4-implementation-phases)
5. [Technical Specifications](#5-technical-specifications)
6. [Success Criteria](#6-success-criteria)

---

## 1. Executive Summary

### Problem Statement

The codebase follows Clean Architecture with DDD patterns but has **inconsistent transaction management**. Only the **Consultation module** properly implements Unit of Work (UoW) pattern with Prisma transactions. All other modules (17+) use simple repository services without ACID guarantees.

### Impact

| Risk Category | Current Exposure | Potential Impact |
|---------------|------------------|------------------|
| Financial Data Integrity | HIGH | Refunds/payments may be inconsistent |
| Quota/Coupon Abuse | HIGH | Race conditions allow over-consumption |
| Audit Trail Gaps | MEDIUM | Status changes without history records |
| Data Consistency | MEDIUM | Orphaned or partially created records |

### Reference Implementation

The Consultation module (`src/core/application/consultation/`) demonstrates the correct pattern and serves as our template.

---

## 2. Current State Analysis

### 2.1 Module UoW Coverage

| Module | Has UoW | Transaction Safety | Priority |
|--------|---------|-------------------|----------|
| Consultation | ✅ Yes | ✅ Full | - |
| Billing | ❌ No | ❌ None | P0 |
| Membership | ❌ No | ❌ None (code commented) | P0 |
| Litigation Case | ❌ No | ❌ None | P1 |
| Call Request | ❌ No | ❌ None | P1 |
| Legal Opinion | ❌ No | ❌ None | P2 |
| Service Request | ❌ No | ❌ None | P2 |
| Support Ticket | ❌ No | ❌ None | P3 |
| Provider | ❌ No | ❌ None | P3 |
| Payment Method | ❌ No | ❌ None | P3 |

### 2.2 Consultation UoW Pattern (Reference)

**Interface Location:** `src/core/domain/consultation/ports/consultation-request.repository.ts:314-326`

```typescript
export interface IConsultationRequestUnitOfWork {
    consultationRequests: IConsultationRequestRepository;
    documents: IDocumentRepository;
    messages: IRequestMessageRepository;
    statusHistories: IRequestStatusHistoryRepository;
    ratings: IRequestRatingRepository;
    collaborators: IRequestCollaboratorRepository;

    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    transaction<T>(work: (uow: IConsultationRequestUnitOfWork) => Promise<T>): Promise<T>;
}
```

**Usage Pattern:** `src/core/application/consultation/use-cases/status/complete-consultation.use-case.ts`

```typescript
async execute(consultationId: string): Promise<ConsultationRequestResponseDTO> {
    return await this.unitOfWork.transaction(async (uow) => {
        const consultation = await uow.consultationRequests.findById(id);
        const oldStatus = consultation.status;
        consultation.complete();

        const updated = await uow.consultationRequests.update(consultation);

        // Atomic: status history created in same transaction
        const statusHistory = RequestStatusHistory.create({
            consultationId: updated.id,
            fromStatus: oldStatus,
            toStatus: updated.status,
            reason: 'Consultation completed',
        });
        await uow.statusHistories.create(statusHistory);

        return this.toDTO(updated);
    });
}
```

---

## 3. Risk Assessment

### 3.1 P0 - Critical (Financial/Quota Operations)

#### Billing Module

| Use Case | File | Risk | Issue |
|----------|------|------|-------|
| `ProcessRefundUseCase` | `refund.use-cases.ts:186-209` | 🔴 HIGH | No TransactionLog, no wallet update atomicity |
| `ApproveRefundUseCase` | `refund.use-cases.ts:126-152` | 🔴 HIGH | Status change without audit |
| `ResolveDisputeUseCase` | `dispute.use-cases.ts:216-242` | 🔴 HIGH | Resolution without transaction log |
| `EscalateDisputeUseCase` | `dispute.use-cases.ts:186-211` | 🟡 MEDIUM | Escalation without history |

**Race Condition Example:**
```typescript
// Current code - NOT SAFE
async execute(id: string, dto: ProcessRefundDto): Promise<Refund> {
    const refund = await this.refundRepository.findById(id);  // T1: Read
    // ⚠️ Another request could modify refund here
    const updatedRefund = refund.process(dto.refundReference);
    return await this.refundRepository.update(updatedRefund);  // T1: Write
    // ⚠️ Missing: TransactionLog, User balance update
}
```

#### Membership Module

| Use Case | File | Risk | Issue |
|----------|------|------|-------|
| `ConsumeQuotaUseCase` | `consume-quota.use-case.ts` | 🔴 HIGH | Commented out, race condition |
| `ApplyCouponUseCase` | `apply-coupon.use-case.ts` | 🔴 HIGH | Commented out, double redemption possible |
| `CreateMembershipUseCase` | `create-membership.use-case.ts` | 🟡 MEDIUM | No invoice atomicity |

**Race Condition Example (commented code):**
```typescript
// ❌ RACE CONDITION - Two users can exhaust single-use coupon
await this.redemptionRepo.create(redemption);           // Step 1
const updatedCoupon = coupon.incrementRedemptions();
await this.couponRepo.update(updatedCoupon);            // Step 2 - NOT atomic!
```

### 3.2 P1 - High (State Transitions)

#### Litigation Case Module

| Use Case | File | Risk | Issue |
|----------|------|------|-------|
| `MarkAsPaidUseCase` | `litigation-case.use-cases.ts:299-331` | 🔴 HIGH | Payment without TransactionLog |
| `AcceptQuoteUseCase` | `litigation-case.use-cases.ts:253-285` | 🟡 MEDIUM | No status history |
| `AssignProviderUseCase` | `litigation-case.use-cases.ts:159-187` | 🟡 MEDIUM | No assignment history |
| `CloseCaseUseCase` | `litigation-case.use-cases.ts:380-408` | 🟡 MEDIUM | No closure audit |

#### Call Request Module

| Use Case | File | Risk | Issue |
|----------|------|------|-------|
| `EndCallUseCase` | `session/end-call.use-case.ts` | 🔴 HIGH | No minutes consumption tracking |
| `StartCallUseCase` | `session/start-call.use-case.ts` | 🟡 MEDIUM | No status history |
| `ScheduleCallUseCase` | `scheduling/schedule-call.use-case.ts` | 🟡 MEDIUM | Slot booking without lock |
| `CancelCallUseCase` | `session/cancel-call.use-case.ts` | 🟡 MEDIUM | No refund coordination |

### 3.3 P2 - Medium (Workflow Operations)

#### Legal Opinion Module

| Use Case | File | Risk | Issue |
|----------|------|------|-------|
| `MarkAsPaidUseCase` | `mark-as-paid.use-case.ts` | 🟡 MEDIUM | Payment without full audit |

#### Service Request Module (if exists)

| Use Case | Risk | Issue |
|----------|------|-------|
| Quote acceptance | 🟡 MEDIUM | Quote + Payment not atomic |
| Service completion | 🟡 MEDIUM | Status + billing not atomic |

### 3.4 P3 - Low (Supporting Operations)

| Module | Use Case | Risk | Issue |
|--------|----------|------|-------|
| Support Ticket | Assignment | 🟢 LOW | Notification may fail after assignment |
| Provider | Onboarding | 🟢 LOW | Multi-entity creation |
| Payment Method | Set Default | 🟢 LOW | Multiple updates needed |

---

## 4. Implementation Phases

### Phase 0: Foundation (Pre-requisite)

**Objective:** Create shared UoW infrastructure

**Deliverables:**
1. Base UoW interface in shared domain
2. Prisma transaction helper utilities
3. Testing infrastructure for transactions

**Files to Create:**
```
src/core/domain/shared/ports/base-unit-of-work.interface.ts
src/infrastructure/persistence/shared/prisma-transaction.helper.ts
```

---

### Phase 1: Billing Module UoW

**Priority:** P0 - Critical
**Risk Level:** 🔴 HIGH
**Estimated Effort:** 2-3 days

#### 1.1 Scope

| Component | Action |
|-----------|--------|
| Domain Interface | Create `IBillingUnitOfWork` |
| Infrastructure | Implement `PrismaBillingUnitOfWork` |
| Use Cases | Refactor 12 use cases |
| Tests | Add transaction tests |

#### 1.2 Files to Modify/Create

**Create:**
```
src/core/domain/billing/ports/billing.uow.ts
src/infrastructure/persistence/billing/prisma-billing.uow.ts
```

**Modify:**
```
src/core/application/billing/use-cases/refund.use-cases.ts
src/core/application/billing/use-cases/dispute.use-cases.ts
src/core/application/billing/use-cases/transaction-log.use-cases.ts
src/core/application/billing/use-cases/membership-invoice.use-cases.ts
src/core/application/billing/billing.module.ts
```

#### 1.3 UoW Interface Design

```typescript
export interface IBillingUnitOfWork {
    refunds: IRefundRepository;
    disputes: IDisputeRepository;
    transactionLogs: ITransactionLogRepository;
    invoices: IMembershipInvoiceRepository;

    transaction<T>(work: (uow: IBillingUnitOfWork) => Promise<T>): Promise<T>;
}
```

#### 1.4 Use Case Transformation

**Before:**
```typescript
@Injectable()
export class ProcessRefundUseCase {
    constructor(
        @Inject('IRefundRepository')
        private readonly refundRepository: IRefundRepository,
    ) {}

    async execute(id: string, dto: ProcessRefundDto): Promise<Refund> {
        const refund = await this.refundRepository.findById(id);
        const updatedRefund = refund.process(dto.refundReference);
        return await this.refundRepository.update(updatedRefund);
    }
}
```

**After:**
```typescript
@Injectable()
export class ProcessRefundUseCase {
    constructor(
        @Inject('IBillingUnitOfWork')
        private readonly billingUow: IBillingUnitOfWork,
    ) {}

    async execute(id: string, dto: ProcessRefundDto): Promise<Refund> {
        return await this.billingUow.transaction(async (uow) => {
            const refund = await uow.refunds.findById(id);
            if (!refund) throw new NotFoundException();

            const updatedRefund = refund.process(dto.refundReference);
            await uow.refunds.update(updatedRefund);

            // Create transaction log atomically
            const log = TransactionLog.create({
                userId: refund.userId,
                type: TransactionType.REFUND,
                amount: refund.amount,
                referenceId: refund.id,
                description: `Refund processed: ${dto.refundReference}`,
            });
            await uow.transactionLogs.create(log);

            return updatedRefund;
        });
    }
}
```

---

### Phase 2: Membership Module UoW

**Priority:** P0 - Critical
**Risk Level:** 🔴 HIGH
**Estimated Effort:** 2-3 days

#### 2.1 Scope

| Component | Action |
|-----------|--------|
| Domain Interface | Create `IMembershipUnitOfWork` |
| Infrastructure | Implement `PrismaMembershipUnitOfWork` |
| Use Cases | Uncomment + refactor 10 use cases |
| Quota Logic | Implement with transaction locking |

#### 2.2 Files to Modify/Create

**Create:**
```
src/core/domain/membership/ports/membership.uow.ts
src/infrastructure/persistence/membership/prisma-membership.uow.ts
```

**Modify:**
```
src/core/application/membership/use-cases/consume-quota.use-case.ts (uncomment + refactor)
src/core/application/membership/use-cases/apply-coupon.use-case.ts (uncomment + refactor)
src/core/application/membership/use-cases/create-membership.use-case.ts
src/core/application/membership/use-cases/tier-change.use-cases.ts
src/core/application/membership/membership.module.ts
```

#### 2.3 UoW Interface Design

```typescript
export interface IMembershipUnitOfWork {
    memberships: IMembershipRepository;
    tiers: IMembershipTierRepository;
    quotaUsage: IMembershipQuotaUsageRepository;
    coupons: IMembershipCouponRepository;
    redemptions: IMembershipCouponRedemptionRepository;
    invoices: IMembershipInvoiceRepository;
    payments: IMembershipPaymentRepository;

    transaction<T>(work: (uow: IMembershipUnitOfWork) => Promise<T>): Promise<T>;
}
```

#### 2.4 Critical Fix: Quota Consumption

```typescript
async execute(userId: string, resource: QuotaResource, amount: number = 1): Promise<void> {
    return await this.membershipUow.transaction(async (uow) => {
        // 1. Find active membership (with FOR UPDATE lock in Prisma)
        const membership = await uow.memberships.findActiveByUserIdForUpdate(userId);
        if (!membership) throw new Error('No active membership');

        // 2. Get tier limits
        const tier = await uow.tiers.findById(membership.tierId);

        // 3. Get or create quota period
        let quotaUsage = await uow.quotaUsage.findCurrentByMembership(membership.id);
        if (!quotaUsage) {
            quotaUsage = MembershipQuotaUsage.create({...});
            quotaUsage = await uow.quotaUsage.create(quotaUsage);
        }

        // 4. Check limit (inside transaction - safe from race)
        const limit = tier.getQuotaLimit(resource);
        const currentUsage = quotaUsage.getUsage(resource);
        if (!tier.hasUnlimitedQuota(resource) && currentUsage + amount > limit) {
            throw new Error(`Quota exceeded`);
        }

        // 5. Increment atomically
        const updated = quotaUsage.incrementUsage(resource, amount);
        await uow.quotaUsage.update(updated);
    });
}
```

---

### Phase 3: Litigation Case Module UoW

**Priority:** P1 - High
**Risk Level:** 🟡 MEDIUM-HIGH
**Estimated Effort:** 2 days

#### 3.1 Scope

| Component | Action |
|-----------|--------|
| Domain Interface | Create `ILitigationUnitOfWork` |
| Infrastructure | Implement `PrismaLitigationUnitOfWork` |
| Status History | Add `CaseStatusHistory` entity |
| Use Cases | Refactor 12 use cases |

#### 3.2 Files to Modify/Create

**Create:**
```
src/core/domain/litigation-case/ports/litigation.uow.ts
src/core/domain/litigation-case/entities/case-status-history.entity.ts
src/infrastructure/persistence/litigation-case/prisma-litigation.uow.ts
```

**Modify:**
```
src/core/application/litigation-case/use-cases/litigation-case.use-cases.ts
src/core/application/litigation-case/litigation-case.module.ts
prisma/schema.prisma (add CaseStatusHistory model)
```

#### 3.3 UoW Interface Design

```typescript
export interface ILitigationUnitOfWork {
    cases: ILitigationCaseRepository;
    statusHistories: ICaseStatusHistoryRepository;
    documents: ICaseDocumentRepository;
    hearings: ICaseHearingRepository;

    transaction<T>(work: (uow: ILitigationUnitOfWork) => Promise<T>): Promise<T>;
}
```

---

### Phase 4: Call Request Module UoW

**Priority:** P1 - High
**Risk Level:** 🟡 MEDIUM-HIGH
**Estimated Effort:** 2 days

#### 4.1 Scope

| Component | Action |
|-----------|--------|
| Domain Interface | Create `ICallRequestUnitOfWork` |
| Infrastructure | Implement `PrismaCallRequestUnitOfWork` |
| Minutes Tracking | Add atomic consumption |
| Use Cases | Refactor 15+ use cases |

#### 4.2 Files to Modify/Create

**Create:**
```
src/core/domain/call-request/ports/call-request.uow.ts
src/infrastructure/persistence/call-request/prisma-call-request.uow.ts
```

**Modify:**
```
src/core/application/call-request/use-cases/session/*.ts
src/core/application/call-request/use-cases/scheduling/*.ts
src/core/application/call-request/call-request.module.ts
```

#### 4.3 UoW Interface Design

```typescript
export interface ICallRequestUnitOfWork {
    callRequests: ICallRequestRepository;
    statusHistories: ICallStatusHistoryRepository;
    minutesUsage: ICallMinutesUsageRepository;
    schedules: IProviderScheduleRepository;

    transaction<T>(work: (uow: ICallRequestUnitOfWork) => Promise<T>): Promise<T>;
}
```

---

### Phase 5: Legal Opinion Module UoW

**Priority:** P2 - Medium
**Risk Level:** 🟡 MEDIUM
**Estimated Effort:** 1.5 days

#### 5.1 Scope

| Component | Action |
|-----------|--------|
| Domain Interface | Create `ILegalOpinionUnitOfWork` |
| Infrastructure | Implement Prisma UoW |
| Use Cases | Refactor payment-related use cases |

---

### Phase 6: Supporting Modules UoW

**Priority:** P3 - Low
**Risk Level:** 🟢 LOW
**Estimated Effort:** 2-3 days (combined)

#### 6.1 Modules

1. **Support Ticket** - Assignment + Notification atomicity
2. **Provider** - Onboarding workflow
3. **Payment Method** - Default flag management

---

## 5. Technical Specifications

### 5.1 Prisma Transaction Configuration

```typescript
// src/infrastructure/persistence/shared/prisma-transaction.helper.ts

export const TRANSACTION_OPTIONS: Prisma.TransactionOptions = {
    maxWait: 5000,      // 5s max wait to acquire lock
    timeout: 10000,     // 10s transaction timeout
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // For financial ops
};

export const STANDARD_TRANSACTION_OPTIONS: Prisma.TransactionOptions = {
    maxWait: 2000,
    timeout: 5000,
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};
```

### 5.2 Base UoW Implementation Pattern

```typescript
// src/infrastructure/persistence/shared/base-prisma.uow.ts

export abstract class BasePrismaUnitOfWork<T> {
    constructor(protected readonly prisma: PrismaService) {}

    async transaction<R>(
        work: (uow: T) => Promise<R>,
        options?: Prisma.TransactionOptions
    ): Promise<R> {
        return await this.prisma.$transaction(async (tx) => {
            const transactionalUow = this.createTransactionalInstance(tx);
            return await work(transactionalUow);
        }, options ?? STANDARD_TRANSACTION_OPTIONS);
    }

    protected abstract createTransactionalInstance(tx: Prisma.TransactionClient): T;
}
```

### 5.3 DI Token Convention

```typescript
// Tokens for UoW injection
export const BILLING_UNIT_OF_WORK = Symbol('IBillingUnitOfWork');
export const MEMBERSHIP_UNIT_OF_WORK = Symbol('IMembershipUnitOfWork');
export const LITIGATION_UNIT_OF_WORK = Symbol('ILitigationUnitOfWork');
export const CALL_REQUEST_UNIT_OF_WORK = Symbol('ICallRequestUnitOfWork');
export const LEGAL_OPINION_UNIT_OF_WORK = Symbol('ILegalOpinionUnitOfWork');
```

---

## 6. Success Criteria

### 6.1 Per-Phase Acceptance Criteria

| Phase | Criteria |
|-------|----------|
| Phase 1 (Billing) | All refund/dispute operations atomic; TransactionLog created with every financial op |
| Phase 2 (Membership) | Quota cannot exceed limits under concurrent load; Coupon single-use enforced |
| Phase 3 (Litigation) | Status history created with every transition; Payment + status atomic |
| Phase 4 (Call Request) | Minutes consumed atomically with call end; No double-booking |
| Phase 5 (Legal Opinion) | Payment flows fully audited |
| Phase 6 (Supporting) | No orphaned records in workflows |

### 6.2 Testing Requirements

1. **Unit Tests** - Mock UoW transactions
2. **Integration Tests** - Real Prisma transactions with rollback
3. **Concurrency Tests** - Simulate race conditions
4. **Load Tests** - Verify no deadlocks under load

### 6.3 Metrics

| Metric | Target |
|--------|--------|
| UoW Coverage | 100% of financial operations |
| Transaction Success Rate | > 99.9% |
| Orphaned Record Rate | 0% |
| Average Transaction Time | < 100ms |

---

## Appendix A: File Inventory

### Files Requiring Major Changes

| File | Phase | Change Type |
|------|-------|-------------|
| `billing/use-cases/refund.use-cases.ts` | 1 | Inject UoW, refactor 12 use cases |
| `billing/use-cases/dispute.use-cases.ts` | 1 | Inject UoW, refactor 17 use cases |
| `membership/use-cases/consume-quota.use-case.ts` | 2 | Uncomment, add UoW |
| `membership/use-cases/apply-coupon.use-case.ts` | 2 | Uncomment, add UoW |
| `litigation-case/use-cases/litigation-case.use-cases.ts` | 3 | Add UoW, status history |
| `call-request/use-cases/session/*.ts` | 4 | Add UoW, minutes tracking |

### New Files to Create

| File | Phase | Purpose |
|------|-------|---------|
| `domain/billing/ports/billing.uow.ts` | 1 | UoW interface |
| `persistence/billing/prisma-billing.uow.ts` | 1 | UoW implementation |
| `domain/membership/ports/membership.uow.ts` | 2 | UoW interface |
| `persistence/membership/prisma-membership.uow.ts` | 2 | UoW implementation |
| `domain/litigation-case/ports/litigation.uow.ts` | 3 | UoW interface |
| `domain/litigation-case/entities/case-status-history.entity.ts` | 3 | New entity |

---

## Appendix B: Quick Reference

### When to Use UoW

✅ **USE UoW when:**
- Multiple entities updated together
- Status change requires history record
- Financial operation needs audit log
- Operation must be all-or-nothing

❌ **DON'T USE UoW when:**
- Single entity read operation
- Single entity simple update (no side effects)
- Report/statistics queries

### Transaction Isolation Levels

| Level | Use Case |
|-------|----------|
| `Serializable` | Financial: refunds, payments, quota |
| `ReadCommitted` | Status transitions, assignments |
| `RepeatableRead` | Rarely needed |

---

*Document maintained by: Engineering Team*
*Last updated: 2025-12-25*
