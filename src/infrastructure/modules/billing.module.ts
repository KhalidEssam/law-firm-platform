// ============================================
// BILLING MODULE
// src/infrastructure/modules/billing.module.ts
// ============================================

import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MembershipModule } from './membership.module';

// Controller
import { BillingController } from '../../interface/http/billing.controller';

// Repositories
import {
    PrismaMembershipInvoiceRepository,
    PrismaTransactionLogRepository,
    PrismaRefundRepository,
    PrismaDisputeRepository,
} from '../persistence/billing';

// MembershipInvoice Use Cases
import {
    CreateMembershipInvoiceUseCase,
    GetMembershipInvoiceByIdUseCase,
    GetMembershipInvoiceByNumberUseCase,
    ListMembershipInvoicesUseCase,
    GetInvoicesByMembershipUseCase,
    MarkInvoicePaidUseCase,
    MarkInvoiceOverdueUseCase,
    CancelMembershipInvoiceUseCase,
    GetOverdueInvoicesUseCase,
    GetInvoicesDueSoonUseCase,
    GetUnpaidInvoicesByMembershipUseCase,
    GetTotalUnpaidAmountUseCase,
    DeleteMembershipInvoiceUseCase,
} from '../../core/application/billing/use-cases/membership-invoice.use-cases';

// TransactionLog Use Cases
import {
    CreateTransactionLogUseCase,
    CreateSubscriptionPaymentUseCase,
    CreateWalletTopupUseCase,
    CreateServicePaymentUseCase,
    GetTransactionLogByIdUseCase,
    GetTransactionByReferenceUseCase,
    ListTransactionLogsUseCase,
    GetUserTransactionsUseCase,
    MarkTransactionPaidUseCase,
    MarkTransactionFailedUseCase,
    MarkTransactionRefundedUseCase,
    GetUserTransactionSummaryUseCase,
    GetPendingTransactionsUseCase,
    GetFailedTransactionsUseCase,
    GetTotalSpentUseCase,
} from '../../core/application/billing/use-cases/transaction-log.use-cases';

// Refund Use Cases
import {
    RequestRefundUseCase,
    GetRefundByIdUseCase,
    ListRefundsUseCase,
    GetUserRefundsUseCase,
    ApproveRefundUseCase,
    RejectRefundUseCase,
    ProcessRefundUseCase,
    GetPendingRefundsUseCase,
    GetApprovedRefundsUseCase,
    GetRefundStatisticsUseCase,
    GetTotalRefundedAmountUseCase,
    GetPendingRefundAmountUseCase,
    DeleteRefundUseCase,
} from '../../core/application/billing/use-cases/refund.use-cases';

// Dispute Use Cases
import {
    CreateDisputeUseCase,
    GetDisputeByIdUseCase,
    ListDisputesUseCase,
    GetUserDisputesUseCase,
    StartDisputeReviewUseCase,
    EscalateDisputeUseCase,
    ResolveDisputeUseCase,
    CloseDisputeUseCase,
    UpdateDisputePriorityUseCase,
    AddDisputeEvidenceUseCase,
    GetOpenDisputesUseCase,
    GetActiveDisputesUseCase,
    GetEscalatedDisputesUseCase,
    GetHighPriorityDisputesUseCase,
    GetDisputesRequiringAttentionUseCase,
    GetDisputeStatisticsUseCase,
    DeleteDisputeUseCase,
} from '../../core/application/billing/use-cases/dispute.use-cases';

// Service Usage Billing Use Cases
import {
    GetUnbilledServiceUsageSummaryUseCase,
    GenerateServiceUsageInvoiceUseCase,
    GetBillableUsageByServiceTypeUseCase,
    ProcessBatchServiceUsageBillingUseCase,
    GetCombinedBillingSummaryUseCase,
} from '../../core/application/billing/use-cases/service-usage-billing.use-cases';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => MembershipModule), // Import for service usage billing integration
    ],
    controllers: [BillingController],
    providers: [
        // ============================================
        // REPOSITORIES
        // ============================================
        {
            provide: 'IMembershipInvoiceRepository',
            useClass: PrismaMembershipInvoiceRepository,
        },
        {
            provide: 'ITransactionLogRepository',
            useClass: PrismaTransactionLogRepository,
        },
        {
            provide: 'IRefundRepository',
            useClass: PrismaRefundRepository,
        },
        {
            provide: 'IDisputeRepository',
            useClass: PrismaDisputeRepository,
        },

        // ============================================
        // MEMBERSHIP INVOICE USE CASES
        // ============================================
        CreateMembershipInvoiceUseCase,
        GetMembershipInvoiceByIdUseCase,
        GetMembershipInvoiceByNumberUseCase,
        ListMembershipInvoicesUseCase,
        GetInvoicesByMembershipUseCase,
        MarkInvoicePaidUseCase,
        MarkInvoiceOverdueUseCase,
        CancelMembershipInvoiceUseCase,
        GetOverdueInvoicesUseCase,
        GetInvoicesDueSoonUseCase,
        GetUnpaidInvoicesByMembershipUseCase,
        GetTotalUnpaidAmountUseCase,
        DeleteMembershipInvoiceUseCase,

        // ============================================
        // TRANSACTION LOG USE CASES
        // ============================================
        CreateTransactionLogUseCase,
        CreateSubscriptionPaymentUseCase,
        CreateWalletTopupUseCase,
        CreateServicePaymentUseCase,
        GetTransactionLogByIdUseCase,
        GetTransactionByReferenceUseCase,
        ListTransactionLogsUseCase,
        GetUserTransactionsUseCase,
        MarkTransactionPaidUseCase,
        MarkTransactionFailedUseCase,
        MarkTransactionRefundedUseCase,
        GetUserTransactionSummaryUseCase,
        GetPendingTransactionsUseCase,
        GetFailedTransactionsUseCase,
        GetTotalSpentUseCase,

        // ============================================
        // REFUND USE CASES
        // ============================================
        RequestRefundUseCase,
        GetRefundByIdUseCase,
        ListRefundsUseCase,
        GetUserRefundsUseCase,
        ApproveRefundUseCase,
        RejectRefundUseCase,
        ProcessRefundUseCase,
        GetPendingRefundsUseCase,
        GetApprovedRefundsUseCase,
        GetRefundStatisticsUseCase,
        GetTotalRefundedAmountUseCase,
        GetPendingRefundAmountUseCase,
        DeleteRefundUseCase,

        // ============================================
        // DISPUTE USE CASES
        // ============================================
        CreateDisputeUseCase,
        GetDisputeByIdUseCase,
        ListDisputesUseCase,
        GetUserDisputesUseCase,
        StartDisputeReviewUseCase,
        EscalateDisputeUseCase,
        ResolveDisputeUseCase,
        CloseDisputeUseCase,
        UpdateDisputePriorityUseCase,
        AddDisputeEvidenceUseCase,
        GetOpenDisputesUseCase,
        GetActiveDisputesUseCase,
        GetEscalatedDisputesUseCase,
        GetHighPriorityDisputesUseCase,
        GetDisputesRequiringAttentionUseCase,
        GetDisputeStatisticsUseCase,
        DeleteDisputeUseCase,

        // ============================================
        // SERVICE USAGE BILLING USE CASES
        // ============================================
        GetUnbilledServiceUsageSummaryUseCase,
        GenerateServiceUsageInvoiceUseCase,
        GetBillableUsageByServiceTypeUseCase,
        ProcessBatchServiceUsageBillingUseCase,
        GetCombinedBillingSummaryUseCase,
    ],
    exports: [
        // Repositories
        'IMembershipInvoiceRepository',
        'ITransactionLogRepository',
        'IRefundRepository',
        'IDisputeRepository',

        // Invoice Use Cases
        CreateMembershipInvoiceUseCase,
        GetMembershipInvoiceByIdUseCase,
        ListMembershipInvoicesUseCase,
        MarkInvoicePaidUseCase,
        GetOverdueInvoicesUseCase,

        // Transaction Use Cases
        CreateTransactionLogUseCase,
        CreateSubscriptionPaymentUseCase,
        CreateServicePaymentUseCase,
        GetTransactionLogByIdUseCase,
        MarkTransactionPaidUseCase,
        GetUserTransactionSummaryUseCase,

        // Refund Use Cases
        RequestRefundUseCase,
        GetRefundByIdUseCase,
        ApproveRefundUseCase,
        RejectRefundUseCase,
        ProcessRefundUseCase,
        GetPendingRefundsUseCase,

        // Dispute Use Cases
        CreateDisputeUseCase,
        GetDisputeByIdUseCase,
        ResolveDisputeUseCase,
        GetActiveDisputesUseCase,
        GetDisputeStatisticsUseCase,

        // Service Usage Billing Use Cases
        GetUnbilledServiceUsageSummaryUseCase,
        GenerateServiceUsageInvoiceUseCase,
        GetBillableUsageByServiceTypeUseCase,
        ProcessBatchServiceUsageBillingUseCase,
        GetCombinedBillingSummaryUseCase,
    ],
})
export class BillingModule {}
