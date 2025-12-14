// ============================================
// BILLING CONTROLLER
// src/interface/http/billing.controller.ts
// ============================================

import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';

// ============================================
// MEMBERSHIP INVOICE USE CASES
// ============================================
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
} from '../../core/application/billing/use-cases/membership-invoice.use-cases';

// ============================================
// TRANSACTION LOG USE CASES
// ============================================
import {
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

// ============================================
// REFUND USE CASES
// ============================================
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
} from '../../core/application/billing/use-cases/refund.use-cases';

// ============================================
// DISPUTE USE CASES
// ============================================
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
} from '../../core/application/billing/use-cases/dispute.use-cases';

// ============================================
// DTOs
// ============================================
import {
    CreateMembershipInvoiceDto,
    ListMembershipInvoicesQueryDto,
    MembershipInvoiceResponseDto,
    MembershipInvoiceListResponseDto,
} from '../../core/application/billing/dto/membership-invoice.dto';

import {
    CreateSubscriptionPaymentDto,
    CreateWalletTopupDto,
    CreateServicePaymentDto,
    ListTransactionLogsQueryDto,
    TransactionLogResponseDto,
    TransactionLogListResponseDto,
    TransactionSummaryResponseDto,
} from '../../core/application/billing/dto/transaction-log.dto';

import {
    RequestRefundDto,
    ReviewRefundDto,
    ProcessRefundDto,
    ListRefundsQueryDto,
    RefundResponseDto,
    RefundListResponseDto,
    RefundStatisticsResponseDto,
} from '../../core/application/billing/dto/refund.dto';

import {
    CreateDisputeDto,
    EscalateDisputeDto,
    ResolveDisputeDto,
    UpdateDisputePriorityDto,
    AddDisputeEvidenceDto,
    ListDisputesQueryDto,
    DisputeResponseDto,
    DisputeListResponseDto,
    DisputeStatisticsResponseDto,
} from '../../core/application/billing/dto/dispute.dto';

@Controller('billing')
export class BillingController {
    constructor(
        // Invoice use cases
        private readonly createInvoice: CreateMembershipInvoiceUseCase,
        private readonly getInvoiceById: GetMembershipInvoiceByIdUseCase,
        private readonly getInvoiceByNumber: GetMembershipInvoiceByNumberUseCase,
        private readonly listInvoices: ListMembershipInvoicesUseCase,
        private readonly getInvoicesByMembership: GetInvoicesByMembershipUseCase,
        private readonly markInvoicePaid: MarkInvoicePaidUseCase,
        private readonly markInvoiceOverdue: MarkInvoiceOverdueUseCase,
        private readonly cancelInvoice: CancelMembershipInvoiceUseCase,
        private readonly getOverdueInvoices: GetOverdueInvoicesUseCase,
        private readonly getInvoicesDueSoon: GetInvoicesDueSoonUseCase,
        private readonly getUnpaidInvoicesByMembership: GetUnpaidInvoicesByMembershipUseCase,
        private readonly getTotalUnpaidAmount: GetTotalUnpaidAmountUseCase,
        // Transaction use cases
        private readonly createSubscriptionPayment: CreateSubscriptionPaymentUseCase,
        private readonly createWalletTopup: CreateWalletTopupUseCase,
        private readonly createServicePayment: CreateServicePaymentUseCase,
        private readonly getTransactionById: GetTransactionLogByIdUseCase,
        private readonly getTransactionByReference: GetTransactionByReferenceUseCase,
        private readonly listTransactions: ListTransactionLogsUseCase,
        private readonly getUserTransactions: GetUserTransactionsUseCase,
        private readonly markTransactionPaid: MarkTransactionPaidUseCase,
        private readonly markTransactionFailed: MarkTransactionFailedUseCase,
        private readonly markTransactionRefunded: MarkTransactionRefundedUseCase,
        private readonly getUserTransactionSummary: GetUserTransactionSummaryUseCase,
        private readonly getPendingTransactions: GetPendingTransactionsUseCase,
        private readonly getFailedTransactions: GetFailedTransactionsUseCase,
        private readonly getTotalSpent: GetTotalSpentUseCase,
        // Refund use cases
        private readonly requestRefund: RequestRefundUseCase,
        private readonly getRefundById: GetRefundByIdUseCase,
        private readonly listRefunds: ListRefundsUseCase,
        private readonly getUserRefunds: GetUserRefundsUseCase,
        private readonly approveRefund: ApproveRefundUseCase,
        private readonly rejectRefund: RejectRefundUseCase,
        private readonly processRefund: ProcessRefundUseCase,
        private readonly getPendingRefunds: GetPendingRefundsUseCase,
        private readonly getApprovedRefunds: GetApprovedRefundsUseCase,
        private readonly getRefundStatistics: GetRefundStatisticsUseCase,
        private readonly getTotalRefundedAmount: GetTotalRefundedAmountUseCase,
        private readonly getPendingRefundAmount: GetPendingRefundAmountUseCase,
        // Dispute use cases
        private readonly createDispute: CreateDisputeUseCase,
        private readonly getDisputeById: GetDisputeByIdUseCase,
        private readonly listDisputes: ListDisputesUseCase,
        private readonly getUserDisputes: GetUserDisputesUseCase,
        private readonly startDisputeReview: StartDisputeReviewUseCase,
        private readonly escalateDispute: EscalateDisputeUseCase,
        private readonly resolveDispute: ResolveDisputeUseCase,
        private readonly closeDispute: CloseDisputeUseCase,
        private readonly updateDisputePriority: UpdateDisputePriorityUseCase,
        private readonly addDisputeEvidence: AddDisputeEvidenceUseCase,
        private readonly getOpenDisputes: GetOpenDisputesUseCase,
        private readonly getActiveDisputes: GetActiveDisputesUseCase,
        private readonly getEscalatedDisputes: GetEscalatedDisputesUseCase,
        private readonly getHighPriorityDisputes: GetHighPriorityDisputesUseCase,
        private readonly getDisputesRequiringAttention: GetDisputesRequiringAttentionUseCase,
        private readonly getDisputeStatistics: GetDisputeStatisticsUseCase,
    ) {}

    // ============================================
    // INVOICE ENDPOINTS
    // ============================================

    @Post('invoices')
    @Roles('system admin', 'platform')
    @Permissions('create:invoices')
    @HttpCode(HttpStatus.CREATED)
    async createMembershipInvoice(
        @Body() dto: CreateMembershipInvoiceDto,
    ): Promise<{ invoice: MembershipInvoiceResponseDto }> {
        const invoice = await this.createInvoice.execute(dto);
        return { invoice: this.mapInvoiceToResponse(invoice) };
    }

    @Get('invoices')
    @Roles('system admin', 'platform')
    @Permissions('read:invoices')
    async listMembershipInvoices(
        @Query() query: ListMembershipInvoicesQueryDto,
    ): Promise<MembershipInvoiceListResponseDto> {
        const invoices = await this.listInvoices.execute(query);
        const total = invoices.length; // For proper pagination, count should come from use case
        return {
            invoices: invoices.map(inv => this.mapInvoiceToResponse(inv)),
            total,
            limit: query.limit ?? 20,
            offset: query.offset ?? 0,
        };
    }

    @Get('invoices/overdue')
    @Roles('system admin', 'platform')
    @Permissions('read:invoices')
    async getOverdueInvoicesList(): Promise<{ invoices: MembershipInvoiceResponseDto[] }> {
        const invoices = await this.getOverdueInvoices.execute();
        return { invoices: invoices.map(inv => this.mapInvoiceToResponse(inv)) };
    }

    @Get('invoices/due-soon')
    @Roles('system admin', 'platform')
    @Permissions('read:invoices')
    async getInvoicesDueSoonList(
        @Query('days') days?: number,
    ): Promise<{ invoices: MembershipInvoiceResponseDto[] }> {
        const invoices = await this.getInvoicesDueSoon.execute(days ?? 7);
        return { invoices: invoices.map(inv => this.mapInvoiceToResponse(inv)) };
    }

    @Get('invoices/number/:invoiceNumber')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getInvoiceByInvoiceNumber(
        @Param('invoiceNumber') invoiceNumber: string,
    ): Promise<{ invoice: MembershipInvoiceResponseDto }> {
        const invoice = await this.getInvoiceByNumber.execute(invoiceNumber);
        return { invoice: this.mapInvoiceToResponse(invoice) };
    }

    @Get('invoices/membership/:membershipId')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getInvoicesForMembership(
        @Param('membershipId') membershipId: string,
    ): Promise<{ invoices: MembershipInvoiceResponseDto[] }> {
        const invoices = await this.getInvoicesByMembership.execute(membershipId);
        return { invoices: invoices.map(inv => this.mapInvoiceToResponse(inv)) };
    }

    @Get('invoices/membership/:membershipId/unpaid')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getUnpaidInvoicesForMembership(
        @Param('membershipId') membershipId: string,
    ): Promise<{ invoices: MembershipInvoiceResponseDto[]; totalUnpaid: number }> {
        const [invoices, total] = await Promise.all([
            this.getUnpaidInvoicesByMembership.execute(membershipId),
            this.getTotalUnpaidAmount.execute(membershipId),
        ]);
        return {
            invoices: invoices.map(inv => this.mapInvoiceToResponse(inv)),
            totalUnpaid: total,
        };
    }

    @Get('invoices/:id')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getInvoiceById(@Param('id') id: string): Promise<{ invoice: MembershipInvoiceResponseDto }> {
        const invoice = await this.getInvoiceById.execute(id);
        return { invoice: this.mapInvoiceToResponse(invoice) };
    }

    @Patch('invoices/:id/paid')
    @Roles('system admin', 'platform')
    @Permissions('update:invoices')
    async markInvoiceAsPaid(@Param('id') id: string): Promise<{ invoice: MembershipInvoiceResponseDto }> {
        const invoice = await this.markInvoicePaid.execute(id);
        return { invoice: this.mapInvoiceToResponse(invoice) };
    }

    @Patch('invoices/:id/overdue')
    @Roles('system admin', 'platform')
    @Permissions('update:invoices')
    async markInvoiceAsOverdue(@Param('id') id: string): Promise<{ invoice: MembershipInvoiceResponseDto }> {
        const invoice = await this.markInvoiceOverdue.execute(id);
        return { invoice: this.mapInvoiceToResponse(invoice) };
    }

    @Delete('invoices/:id')
    @Roles('system admin')
    @Permissions('delete:invoices')
    async cancelMembershipInvoice(@Param('id') id: string): Promise<{ invoice: MembershipInvoiceResponseDto }> {
        const invoice = await this.cancelInvoice.execute(id);
        return { invoice: this.mapInvoiceToResponse(invoice) };
    }

    // ============================================
    // TRANSACTION ENDPOINTS
    // ============================================

    @Post('transactions/subscription')
    @Roles('system admin', 'platform')
    @Permissions('create:transactions')
    @HttpCode(HttpStatus.CREATED)
    async createSubscription(
        @Body() dto: CreateSubscriptionPaymentDto,
    ): Promise<{ transaction: TransactionLogResponseDto }> {
        const transaction = await this.createSubscriptionPayment.execute(dto);
        return { transaction: this.mapTransactionToResponse(transaction) };
    }

    @Post('transactions/wallet-topup')
    @Roles('user', 'partner', 'platform', 'system admin')
    @HttpCode(HttpStatus.CREATED)
    async createTopup(
        @Body() dto: CreateWalletTopupDto,
    ): Promise<{ transaction: TransactionLogResponseDto }> {
        const transaction = await this.createWalletTopup.execute(dto);
        return { transaction: this.mapTransactionToResponse(transaction) };
    }

    @Post('transactions/service-payment')
    @Roles('user', 'partner', 'platform', 'system admin')
    @HttpCode(HttpStatus.CREATED)
    async createServicePmt(
        @Body() dto: CreateServicePaymentDto,
    ): Promise<{ transaction: TransactionLogResponseDto }> {
        const transaction = await this.createServicePayment.execute(dto);
        return { transaction: this.mapTransactionToResponse(transaction) };
    }

    @Get('transactions')
    @Roles('system admin', 'platform')
    @Permissions('read:transactions')
    async listAllTransactions(
        @Query() query: ListTransactionLogsQueryDto,
    ): Promise<TransactionLogListResponseDto> {
        const transactions = await this.listTransactions.execute(query);
        return {
            transactions: transactions.map(txn => this.mapTransactionToResponse(txn)),
            total: transactions.length,
            limit: query.limit ?? 20,
            offset: query.offset ?? 0,
        };
    }

    @Get('transactions/pending')
    @Roles('system admin', 'platform')
    @Permissions('read:transactions')
    async getPendingTransactionsList(): Promise<{ transactions: TransactionLogResponseDto[] }> {
        const transactions = await this.getPendingTransactions.execute();
        return { transactions: transactions.map(txn => this.mapTransactionToResponse(txn)) };
    }

    @Get('transactions/failed')
    @Roles('system admin', 'platform')
    @Permissions('read:transactions')
    async getFailedTransactionsList(): Promise<{ transactions: TransactionLogResponseDto[] }> {
        const transactions = await this.getFailedTransactions.execute();
        return { transactions: transactions.map(txn => this.mapTransactionToResponse(txn)) };
    }

    @Get('transactions/reference/:reference')
    @Roles('system admin', 'platform')
    @Permissions('read:transactions')
    async getTransactionByRef(
        @Param('reference') reference: string,
    ): Promise<{ transaction: TransactionLogResponseDto }> {
        const transaction = await this.getTransactionByReference.execute(reference);
        return { transaction: this.mapTransactionToResponse(transaction) };
    }

    @Get('transactions/user/:userId')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getUserTransactionsList(
        @Param('userId') userId: string,
    ): Promise<{ transactions: TransactionLogResponseDto[] }> {
        const transactions = await this.getUserTransactions.execute(userId);
        return { transactions: transactions.map(txn => this.mapTransactionToResponse(txn)) };
    }

    @Get('transactions/user/:userId/summary')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getUserSummary(
        @Param('userId') userId: string,
    ): Promise<{ summary: TransactionSummaryResponseDto }> {
        const summary = await this.getUserTransactionSummary.execute(userId);
        return { summary };
    }

    @Get('transactions/user/:userId/total-spent')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getUserTotalSpent(@Param('userId') userId: string): Promise<{ totalSpent: number }> {
        const totalSpent = await this.getTotalSpent.execute(userId);
        return { totalSpent };
    }

    @Get('transactions/:id')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getTransaction(@Param('id') id: string): Promise<{ transaction: TransactionLogResponseDto }> {
        const transaction = await this.getTransactionById.execute(id);
        return { transaction: this.mapTransactionToResponse(transaction) };
    }

    @Patch('transactions/:id/paid')
    @Roles('system admin', 'platform')
    @Permissions('update:transactions')
    async markTransactionAsPaid(@Param('id') id: string): Promise<{ transaction: TransactionLogResponseDto }> {
        const transaction = await this.markTransactionPaid.execute(id);
        return { transaction: this.mapTransactionToResponse(transaction) };
    }

    @Patch('transactions/:id/failed')
    @Roles('system admin', 'platform')
    @Permissions('update:transactions')
    async markTransactionAsFailed(@Param('id') id: string): Promise<{ transaction: TransactionLogResponseDto }> {
        const transaction = await this.markTransactionFailed.execute(id);
        return { transaction: this.mapTransactionToResponse(transaction) };
    }

    @Patch('transactions/:id/refunded')
    @Roles('system admin', 'platform')
    @Permissions('update:transactions')
    async markTransactionAsRefunded(@Param('id') id: string): Promise<{ transaction: TransactionLogResponseDto }> {
        const transaction = await this.markTransactionRefunded.execute(id);
        return { transaction: this.mapTransactionToResponse(transaction) };
    }

    // ============================================
    // REFUND ENDPOINTS
    // ============================================

    @Post('refunds')
    @Roles('user', 'partner', 'platform', 'system admin')
    @HttpCode(HttpStatus.CREATED)
    async requestNewRefund(@Body() dto: RequestRefundDto): Promise<{ refund: RefundResponseDto }> {
        const refund = await this.requestRefund.execute(dto);
        return { refund: this.mapRefundToResponse(refund) };
    }

    @Get('refunds')
    @Roles('system admin', 'platform')
    @Permissions('read:refunds')
    async listAllRefunds(@Query() query: ListRefundsQueryDto): Promise<RefundListResponseDto> {
        const refunds = await this.listRefunds.execute(query);
        return {
            refunds: refunds.map(r => this.mapRefundToResponse(r)),
            total: refunds.length,
            limit: query.limit ?? 20,
            offset: query.offset ?? 0,
        };
    }

    @Get('refunds/pending')
    @Roles('system admin', 'platform')
    @Permissions('read:refunds')
    async getPendingRefundsList(): Promise<{ refunds: RefundResponseDto[] }> {
        const refunds = await this.getPendingRefunds.execute();
        return { refunds: refunds.map(r => this.mapRefundToResponse(r)) };
    }

    @Get('refunds/approved')
    @Roles('system admin', 'platform')
    @Permissions('read:refunds')
    async getApprovedRefundsList(): Promise<{ refunds: RefundResponseDto[] }> {
        const refunds = await this.getApprovedRefunds.execute();
        return { refunds: refunds.map(r => this.mapRefundToResponse(r)) };
    }

    @Get('refunds/statistics')
    @Roles('system admin', 'platform')
    @Permissions('read:refunds')
    async getRefundStats(
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ): Promise<{ statistics: RefundStatisticsResponseDto }> {
        const statistics = await this.getRefundStatistics.execute(
            fromDate ? new Date(fromDate) : undefined,
            toDate ? new Date(toDate) : undefined,
        );
        return { statistics };
    }

    @Get('refunds/total-refunded')
    @Roles('system admin', 'platform')
    @Permissions('read:refunds')
    async getTotalRefunded(): Promise<{ totalRefunded: number }> {
        const totalRefunded = await this.getTotalRefundedAmount.execute();
        return { totalRefunded };
    }

    @Get('refunds/pending-amount')
    @Roles('system admin', 'platform')
    @Permissions('read:refunds')
    async getPendingAmount(): Promise<{ pendingAmount: number }> {
        const pendingAmount = await this.getPendingRefundAmount.execute();
        return { pendingAmount };
    }

    @Get('refunds/user/:userId')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getUserRefundsList(@Param('userId') userId: string): Promise<{ refunds: RefundResponseDto[] }> {
        const refunds = await this.getUserRefunds.execute(userId);
        return { refunds: refunds.map(r => this.mapRefundToResponse(r)) };
    }

    @Get('refunds/:id')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getRefund(@Param('id') id: string): Promise<{ refund: RefundResponseDto }> {
        const refund = await this.getRefundById.execute(id);
        return { refund: this.mapRefundToResponse(refund) };
    }

    @Patch('refunds/:id/approve')
    @Roles('system admin', 'platform')
    @Permissions('update:refunds')
    async approveRefundRequest(
        @Param('id') id: string,
        @Body() dto: ReviewRefundDto,
    ): Promise<{ refund: RefundResponseDto }> {
        const refund = await this.approveRefund.execute(id, dto.reviewedBy, dto.reviewNotes);
        return { refund: this.mapRefundToResponse(refund) };
    }

    @Patch('refunds/:id/reject')
    @Roles('system admin', 'platform')
    @Permissions('update:refunds')
    async rejectRefundRequest(
        @Param('id') id: string,
        @Body() dto: ReviewRefundDto,
    ): Promise<{ refund: RefundResponseDto }> {
        const refund = await this.rejectRefund.execute(id, dto.reviewedBy, dto.reviewNotes);
        return { refund: this.mapRefundToResponse(refund) };
    }

    @Patch('refunds/:id/process')
    @Roles('system admin', 'platform')
    @Permissions('update:refunds')
    async processRefundRequest(
        @Param('id') id: string,
        @Body() dto: ProcessRefundDto,
    ): Promise<{ refund: RefundResponseDto }> {
        const refund = await this.processRefund.execute(id, dto.refundReference);
        return { refund: this.mapRefundToResponse(refund) };
    }

    // ============================================
    // DISPUTE ENDPOINTS
    // ============================================

    @Post('disputes')
    @Roles('user', 'partner', 'platform', 'system admin')
    @HttpCode(HttpStatus.CREATED)
    async createNewDispute(@Body() dto: CreateDisputeDto): Promise<{ dispute: DisputeResponseDto }> {
        const dispute = await this.createDispute.execute(dto);
        return { dispute: this.mapDisputeToResponse(dispute) };
    }

    @Get('disputes')
    @Roles('system admin', 'platform')
    @Permissions('read:disputes')
    async listAllDisputes(@Query() query: ListDisputesQueryDto): Promise<DisputeListResponseDto> {
        const disputes = await this.listDisputes.execute(query);
        return {
            disputes: disputes.map(d => this.mapDisputeToResponse(d)),
            total: disputes.length,
            limit: query.limit ?? 20,
            offset: query.offset ?? 0,
        };
    }

    @Get('disputes/open')
    @Roles('system admin', 'platform')
    @Permissions('read:disputes')
    async getOpenDisputesList(): Promise<{ disputes: DisputeResponseDto[] }> {
        const disputes = await this.getOpenDisputes.execute();
        return { disputes: disputes.map(d => this.mapDisputeToResponse(d)) };
    }

    @Get('disputes/active')
    @Roles('system admin', 'platform')
    @Permissions('read:disputes')
    async getActiveDisputesList(): Promise<{ disputes: DisputeResponseDto[] }> {
        const disputes = await this.getActiveDisputes.execute();
        return { disputes: disputes.map(d => this.mapDisputeToResponse(d)) };
    }

    @Get('disputes/escalated')
    @Roles('system admin', 'platform')
    @Permissions('read:disputes')
    async getEscalatedDisputesList(): Promise<{ disputes: DisputeResponseDto[] }> {
        const disputes = await this.getEscalatedDisputes.execute();
        return { disputes: disputes.map(d => this.mapDisputeToResponse(d)) };
    }

    @Get('disputes/high-priority')
    @Roles('system admin', 'platform')
    @Permissions('read:disputes')
    async getHighPriorityDisputesList(): Promise<{ disputes: DisputeResponseDto[] }> {
        const disputes = await this.getHighPriorityDisputes.execute();
        return { disputes: disputes.map(d => this.mapDisputeToResponse(d)) };
    }

    @Get('disputes/requiring-attention')
    @Roles('system admin', 'platform')
    @Permissions('read:disputes')
    async getDisputesRequiringAttentionList(): Promise<{ disputes: DisputeResponseDto[] }> {
        const disputes = await this.getDisputesRequiringAttention.execute();
        return { disputes: disputes.map(d => this.mapDisputeToResponse(d)) };
    }

    @Get('disputes/statistics')
    @Roles('system admin', 'platform')
    @Permissions('read:disputes')
    async getDisputeStats(
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ): Promise<{ statistics: DisputeStatisticsResponseDto }> {
        const statistics = await this.getDisputeStatistics.execute(
            fromDate ? new Date(fromDate) : undefined,
            toDate ? new Date(toDate) : undefined,
        );
        return { statistics };
    }

    @Get('disputes/user/:userId')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getUserDisputesList(@Param('userId') userId: string): Promise<{ disputes: DisputeResponseDto[] }> {
        const disputes = await this.getUserDisputes.execute(userId);
        return { disputes: disputes.map(d => this.mapDisputeToResponse(d)) };
    }

    @Get('disputes/:id')
    @Roles('user', 'partner', 'platform', 'system admin')
    async getDispute(@Param('id') id: string): Promise<{ dispute: DisputeResponseDto }> {
        const dispute = await this.getDisputeById.execute(id);
        return { dispute: this.mapDisputeToResponse(dispute) };
    }

    @Patch('disputes/:id/review')
    @Roles('system admin', 'platform')
    @Permissions('update:disputes')
    async startReview(@Param('id') id: string): Promise<{ dispute: DisputeResponseDto }> {
        const dispute = await this.startDisputeReview.execute(id);
        return { dispute: this.mapDisputeToResponse(dispute) };
    }

    @Patch('disputes/:id/escalate')
    @Roles('system admin', 'platform')
    @Permissions('update:disputes')
    async escalate(
        @Param('id') id: string,
        @Body() dto: EscalateDisputeDto,
    ): Promise<{ dispute: DisputeResponseDto }> {
        const dispute = await this.escalateDispute.execute(id, dto.escalatedTo);
        return { dispute: this.mapDisputeToResponse(dispute) };
    }

    @Patch('disputes/:id/resolve')
    @Roles('system admin', 'platform')
    @Permissions('update:disputes')
    async resolve(
        @Param('id') id: string,
        @Body() dto: ResolveDisputeDto,
    ): Promise<{ dispute: DisputeResponseDto }> {
        const dispute = await this.resolveDispute.execute(id, dto.resolvedBy, dto.resolution);
        return { dispute: this.mapDisputeToResponse(dispute) };
    }

    @Patch('disputes/:id/close')
    @Roles('system admin', 'platform')
    @Permissions('update:disputes')
    async close(@Param('id') id: string): Promise<{ dispute: DisputeResponseDto }> {
        const dispute = await this.closeDispute.execute(id);
        return { dispute: this.mapDisputeToResponse(dispute) };
    }

    @Patch('disputes/:id/priority')
    @Roles('system admin', 'platform')
    @Permissions('update:disputes')
    async updatePriority(
        @Param('id') id: string,
        @Body() dto: UpdateDisputePriorityDto,
    ): Promise<{ dispute: DisputeResponseDto }> {
        const dispute = await this.updateDisputePriority.execute(id, dto.priority);
        return { dispute: this.mapDisputeToResponse(dispute) };
    }

    @Patch('disputes/:id/evidence')
    @Roles('user', 'partner', 'platform', 'system admin')
    async addEvidence(
        @Param('id') id: string,
        @Body() dto: AddDisputeEvidenceDto,
    ): Promise<{ dispute: DisputeResponseDto }> {
        const dispute = await this.addDisputeEvidence.execute(id, dto.evidence);
        return { dispute: this.mapDisputeToResponse(dispute) };
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private mapInvoiceToResponse(invoice: any): MembershipInvoiceResponseDto {
        return {
            id: invoice.id,
            membershipId: invoice.membershipId,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount.amount,
            currency: invoice.amount.currency,
            dueDate: invoice.dueDate.toISOString(),
            status: invoice.status.getValue(),
            isOverdue: invoice.isOverdue,
            daysUntilDue: invoice.daysUntilDue,
            createdAt: invoice.createdAt.toISOString(),
            updatedAt: invoice.updatedAt.toISOString(),
        };
    }

    private mapTransactionToResponse(transaction: any): TransactionLogResponseDto {
        return {
            id: transaction.id,
            userId: transaction.userId,
            type: transaction.type.getValue(),
            amount: transaction.amount.amount,
            currency: transaction.amount.currency,
            status: transaction.status.getValue(),
            reference: transaction.reference,
            metadata: transaction.metadata,
            isCredit: transaction.isCredit,
            isDebit: transaction.isDebit,
            createdAt: transaction.createdAt.toISOString(),
        };
    }

    private mapRefundToResponse(refund: any): RefundResponseDto {
        return {
            id: refund.id,
            userId: refund.userId,
            transactionLogId: refund.transactionLogId,
            paymentId: refund.paymentId,
            amount: refund.amount.amount,
            currency: refund.amount.currency,
            reason: refund.reason,
            status: refund.status.getValue(),
            reviewedBy: refund.reviewedBy,
            reviewedAt: refund.reviewedAt?.toISOString(),
            reviewNotes: refund.reviewNotes,
            processedAt: refund.processedAt?.toISOString(),
            refundReference: refund.refundReference,
            createdAt: refund.createdAt.toISOString(),
            updatedAt: refund.updatedAt.toISOString(),
        };
    }

    private mapDisputeToResponse(dispute: any): DisputeResponseDto {
        return {
            id: dispute.id,
            userId: dispute.userId,
            consultationId: dispute.consultationId,
            legalOpinionId: dispute.legalOpinionId,
            serviceRequestId: dispute.serviceRequestId,
            litigationCaseId: dispute.litigationCaseId,
            reason: dispute.reason,
            description: dispute.description,
            evidence: dispute.evidence,
            status: dispute.status.getValue(),
            priority: dispute.priority.getValue(),
            resolution: dispute.resolution,
            resolvedBy: dispute.resolvedBy,
            resolvedAt: dispute.resolvedAt?.toISOString(),
            escalatedAt: dispute.escalatedAt?.toISOString(),
            escalatedTo: dispute.escalatedTo,
            relatedEntityType: dispute.relatedEntityType,
            relatedEntityId: dispute.relatedEntityId,
            ageInDays: dispute.ageInDays,
            createdAt: dispute.createdAt.toISOString(),
            updatedAt: dispute.updatedAt.toISOString(),
        };
    }
}
