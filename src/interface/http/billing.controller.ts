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
import {
  StrictRateLimit,
  StandardRateLimit,
  RelaxedRateLimit,
} from '../../common/decorators/throttle.decorator';

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
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('billing')
export class BillingController {
  constructor(
    // Invoice use cases
    private readonly createInvoiceUseCase: CreateMembershipInvoiceUseCase,
    private readonly getInvoiceByIdUseCase: GetMembershipInvoiceByIdUseCase,
    private readonly getInvoiceByNumberUseCase: GetMembershipInvoiceByNumberUseCase,
    private readonly listInvoicesUseCase: ListMembershipInvoicesUseCase,
    private readonly getInvoicesByMembershipUseCase: GetInvoicesByMembershipUseCase,
    private readonly markInvoicePaidUseCase: MarkInvoicePaidUseCase,
    private readonly markInvoiceOverdueUseCase: MarkInvoiceOverdueUseCase,
    private readonly cancelInvoiceUseCase: CancelMembershipInvoiceUseCase,
    private readonly getOverdueInvoicesUseCase: GetOverdueInvoicesUseCase,
    private readonly getInvoicesDueSoonUseCase: GetInvoicesDueSoonUseCase,
    private readonly getUnpaidInvoicesByMembershipUseCase: GetUnpaidInvoicesByMembershipUseCase,
    private readonly getTotalUnpaidAmountUseCase: GetTotalUnpaidAmountUseCase,
    // Transaction use cases
    private readonly createSubscriptionPaymentUseCase: CreateSubscriptionPaymentUseCase,
    private readonly createWalletTopupUseCase: CreateWalletTopupUseCase,
    private readonly createServicePaymentUseCase: CreateServicePaymentUseCase,
    private readonly getTransactionByIdUseCase: GetTransactionLogByIdUseCase,
    private readonly getTransactionByReferenceUseCase: GetTransactionByReferenceUseCase,
    private readonly listTransactionsUseCase: ListTransactionLogsUseCase,
    private readonly getUserTransactionsUseCase: GetUserTransactionsUseCase,
    private readonly markTransactionPaidUseCase: MarkTransactionPaidUseCase,
    private readonly markTransactionFailedUseCase: MarkTransactionFailedUseCase,
    private readonly markTransactionRefundedUseCase: MarkTransactionRefundedUseCase,
    private readonly getUserTransactionSummaryUseCase: GetUserTransactionSummaryUseCase,
    private readonly getPendingTransactionsUseCase: GetPendingTransactionsUseCase,
    private readonly getFailedTransactionsUseCase: GetFailedTransactionsUseCase,
    private readonly getTotalSpentUseCase: GetTotalSpentUseCase,
    // Refund use cases
    private readonly requestRefundUseCase: RequestRefundUseCase,
    private readonly getRefundByIdUseCase: GetRefundByIdUseCase,
    private readonly listRefundsUseCase: ListRefundsUseCase,
    private readonly getUserRefundsUseCase: GetUserRefundsUseCase,
    private readonly approveRefundUseCase: ApproveRefundUseCase,
    private readonly rejectRefundUseCase: RejectRefundUseCase,
    private readonly processRefundUseCase: ProcessRefundUseCase,
    private readonly getPendingRefundsUseCase: GetPendingRefundsUseCase,
    private readonly getApprovedRefundsUseCase: GetApprovedRefundsUseCase,
    private readonly getRefundStatisticsUseCase: GetRefundStatisticsUseCase,
    private readonly getTotalRefundedAmountUseCase: GetTotalRefundedAmountUseCase,
    private readonly getPendingRefundAmountUseCase: GetPendingRefundAmountUseCase,
    // Dispute use cases
    private readonly createDisputeUseCase: CreateDisputeUseCase,
    private readonly getDisputeByIdUseCase: GetDisputeByIdUseCase,
    private readonly listDisputesUseCase: ListDisputesUseCase,
    private readonly getUserDisputesUseCase: GetUserDisputesUseCase,
    private readonly startDisputeReviewUseCase: StartDisputeReviewUseCase,
    private readonly escalateDisputeUseCase: EscalateDisputeUseCase,
    private readonly resolveDisputeUseCase: ResolveDisputeUseCase,
    private readonly closeDisputeUseCase: CloseDisputeUseCase,
    private readonly updateDisputePriorityUseCase: UpdateDisputePriorityUseCase,
    private readonly addDisputeEvidenceUseCase: AddDisputeEvidenceUseCase,
    private readonly getOpenDisputesUseCase: GetOpenDisputesUseCase,
    private readonly getActiveDisputesUseCase: GetActiveDisputesUseCase,
    private readonly getEscalatedDisputesUseCase: GetEscalatedDisputesUseCase,
    private readonly getHighPriorityDisputesUseCase: GetHighPriorityDisputesUseCase,
    private readonly getDisputesRequiringAttentionUseCase: GetDisputesRequiringAttentionUseCase,
    private readonly getDisputeStatisticsUseCase: GetDisputeStatisticsUseCase,
  ) {}

  // ============================================
  // INVOICE ENDPOINTS
  // ============================================

  @Post('invoices')
  @Public()
  // @Roles('system admin', 'platform')
  // @Permissions('create:invoices')
  @HttpCode(HttpStatus.CREATED)
  async createMembershipInvoice(
    @Body() dto: CreateMembershipInvoiceDto,
  ): Promise<{ invoice: MembershipInvoiceResponseDto }> {
    const invoice = await this.createInvoiceUseCase.execute(dto);
    return { invoice: this.mapInvoiceToResponse(invoice) };
  }

  @Get('invoices')
  @Roles('system admin', 'platform')
  @Permissions('read:invoices')
  async listMembershipInvoices(
    @Query() query: ListMembershipInvoicesQueryDto,
  ): Promise<MembershipInvoiceListResponseDto> {
    const result = await this.listInvoicesUseCase.execute(query);
    return {
      invoices: result.invoices.map((inv) => this.mapInvoiceToResponse(inv)),
      total: result.total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };
  }

  @Get('invoices/overdue')
  @Roles('system admin', 'platform')
  @Permissions('read:invoices')
  async getOverdueInvoicesList(): Promise<{
    invoices: MembershipInvoiceResponseDto[];
  }> {
    const invoices = await this.getOverdueInvoicesUseCase.execute();
    return { invoices: invoices.map((inv) => this.mapInvoiceToResponse(inv)) };
  }

  @Get('invoices/due-soon')
  @Roles('system admin', 'platform')
  @Permissions('read:invoices')
  async getInvoicesDueSoonList(
    @Query('days') days?: number,
  ): Promise<{ invoices: MembershipInvoiceResponseDto[] }> {
    const invoices = await this.getInvoicesDueSoonUseCase.execute(days ?? 7);
    return { invoices: invoices.map((inv) => this.mapInvoiceToResponse(inv)) };
  }

  @Get('invoices/number/:invoiceNumber')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getInvoiceByInvoiceNumber(
    @Param('invoiceNumber') invoiceNumber: string,
  ): Promise<{ invoice: MembershipInvoiceResponseDto }> {
    const invoice = await this.getInvoiceByNumberUseCase.execute(invoiceNumber);
    return { invoice: this.mapInvoiceToResponse(invoice) };
  }

  @Get('invoices/membership/:membershipId')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getInvoicesForMembership(
    @Param('membershipId') membershipId: string,
  ): Promise<{ invoices: MembershipInvoiceResponseDto[] }> {
    const invoices =
      await this.getInvoicesByMembershipUseCase.execute(membershipId);
    return { invoices: invoices.map((inv) => this.mapInvoiceToResponse(inv)) };
  }

  @Get('invoices/membership/:membershipId/unpaid')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getUnpaidInvoicesForMembership(
    @Param('membershipId') membershipId: string,
  ): Promise<{
    invoices: MembershipInvoiceResponseDto[];
    totalUnpaid: number;
  }> {
    const [invoices, total] = await Promise.all([
      this.getUnpaidInvoicesByMembershipUseCase.execute(membershipId),
      this.getTotalUnpaidAmountUseCase.execute(membershipId),
    ]);
    return {
      invoices: invoices.map((inv) => this.mapInvoiceToResponse(inv)),
      totalUnpaid: total,
    };
  }

  @Get('invoices/:id')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getInvoiceById(
    @Param('id') id: string,
  ): Promise<{ invoice: MembershipInvoiceResponseDto }> {
    const invoice = await this.getInvoiceByIdUseCase.execute(id);
    return { invoice: this.mapInvoiceToResponse(invoice) };
  }

  @Patch('invoices/:id/paid')
  @Roles('system admin', 'platform')
  @Permissions('update:invoices')
  async markInvoiceAsPaid(
    @Param('id') id: string,
  ): Promise<{ invoice: MembershipInvoiceResponseDto }> {
    const invoice = await this.markInvoicePaidUseCase.execute(id);
    return { invoice: this.mapInvoiceToResponse(invoice) };
  }

  @Patch('invoices/:id/overdue')
  @Roles('system admin', 'platform')
  @Permissions('update:invoices')
  async markInvoiceAsOverdue(
    @Param('id') id: string,
  ): Promise<{ invoice: MembershipInvoiceResponseDto }> {
    const invoice = await this.markInvoiceOverdueUseCase.execute(id);
    return { invoice: this.mapInvoiceToResponse(invoice) };
  }

  @Delete('invoices/:id')
  @Roles('system admin')
  @Permissions('delete:invoices')
  async cancelMembershipInvoice(
    @Param('id') id: string,
  ): Promise<{ invoice: MembershipInvoiceResponseDto }> {
    const invoice = await this.cancelInvoiceUseCase.execute(id);
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
    const transaction =
      await this.createSubscriptionPaymentUseCase.execute(dto);
    return { transaction: this.mapTransactionToResponse(transaction) };
  }

  @Post('transactions/wallet-topup')
  @Roles('user', 'partner', 'platform', 'system admin')
  @HttpCode(HttpStatus.CREATED)
  async createTopup(
    @Body() dto: CreateWalletTopupDto,
  ): Promise<{ transaction: TransactionLogResponseDto }> {
    const transaction = await this.createWalletTopupUseCase.execute(dto);
    return { transaction: this.mapTransactionToResponse(transaction) };
  }

  @Post('transactions/service-payment')
  @Roles('user', 'partner', 'platform', 'system admin')
  @HttpCode(HttpStatus.CREATED)
  async createServicePmt(
    @Body() dto: CreateServicePaymentDto,
  ): Promise<{ transaction: TransactionLogResponseDto }> {
    const transaction = await this.createServicePaymentUseCase.execute(dto);
    return { transaction: this.mapTransactionToResponse(transaction) };
  }

  @Get('transactions')
  @Roles('system admin', 'platform')
  @Permissions('read:transactions')
  async listAllTransactions(
    @Query() query: ListTransactionLogsQueryDto,
  ): Promise<TransactionLogListResponseDto> {
    const result = await this.listTransactionsUseCase.execute(query);
    return {
      transactions: result.transactions.map((txn) =>
        this.mapTransactionToResponse(txn),
      ),
      total: result.total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };
  }

  @Get('transactions/pending')
  @Roles('system admin', 'platform')
  @Permissions('read:transactions')
  async getPendingTransactionsList(): Promise<{
    transactions: TransactionLogResponseDto[];
  }> {
    const transactions = await this.getPendingTransactionsUseCase.execute();
    return {
      transactions: transactions.map((txn) =>
        this.mapTransactionToResponse(txn),
      ),
    };
  }

  @Get('transactions/failed')
  @Roles('system admin', 'platform')
  @Permissions('read:transactions')
  async getFailedTransactionsList(): Promise<{
    transactions: TransactionLogResponseDto[];
  }> {
    const transactions = await this.getFailedTransactionsUseCase.execute();
    return {
      transactions: transactions.map((txn) =>
        this.mapTransactionToResponse(txn),
      ),
    };
  }

  @Get('transactions/reference/:reference')
  @Roles('system admin', 'platform')
  @Permissions('read:transactions')
  async getTransactionByRef(
    @Param('reference') reference: string,
  ): Promise<{ transaction: TransactionLogResponseDto }> {
    const transaction =
      await this.getTransactionByReferenceUseCase.execute(reference);
    return { transaction: this.mapTransactionToResponse(transaction) };
  }

  @Get('transactions/user/:userId')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getUserTransactionsList(
    @Param('userId') userId: string,
  ): Promise<{ transactions: TransactionLogResponseDto[] }> {
    const transactions = await this.getUserTransactionsUseCase.execute(userId);
    return {
      transactions: transactions.map((txn) =>
        this.mapTransactionToResponse(txn),
      ),
    };
  }

  @Get('transactions/user/:userId/summary')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getUserSummary(
    @Param('userId') userId: string,
  ): Promise<{ summary: TransactionSummaryResponseDto }> {
    const summary = await this.getUserTransactionSummaryUseCase.execute(userId);
    return { summary };
  }

  @Get('transactions/user/:userId/total-spent')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getUserTotalSpent(
    @Param('userId') userId: string,
  ): Promise<{ totalSpent: number }> {
    const totalSpent = await this.getTotalSpentUseCase.execute(userId);
    return { totalSpent };
  }

  @Get('transactions/:id')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getTransaction(
    @Param('id') id: string,
  ): Promise<{ transaction: TransactionLogResponseDto }> {
    const transaction = await this.getTransactionByIdUseCase.execute(id);
    return { transaction: this.mapTransactionToResponse(transaction) };
  }

  @Patch('transactions/:id/paid')
  @Roles('system admin', 'platform')
  @Permissions('update:transactions')
  async markTransactionAsPaid(
    @Param('id') id: string,
  ): Promise<{ transaction: TransactionLogResponseDto }> {
    const transaction = await this.markTransactionPaidUseCase.execute(id);
    return { transaction: this.mapTransactionToResponse(transaction) };
  }

  @Patch('transactions/:id/failed')
  @Roles('system admin', 'platform')
  @Permissions('update:transactions')
  async markTransactionAsFailed(
    @Param('id') id: string,
  ): Promise<{ transaction: TransactionLogResponseDto }> {
    const transaction = await this.markTransactionFailedUseCase.execute(id);
    return { transaction: this.mapTransactionToResponse(transaction) };
  }

  @Patch('transactions/:id/refunded')
  @Roles('system admin', 'platform')
  @Permissions('update:transactions')
  async markTransactionAsRefunded(
    @Param('id') id: string,
  ): Promise<{ transaction: TransactionLogResponseDto }> {
    const transaction = await this.markTransactionRefundedUseCase.execute(id);
    return { transaction: this.mapTransactionToResponse(transaction) };
  }

  // ============================================
  // REFUND ENDPOINTS
  // ============================================

  @Post('refunds')
  @Roles('user', 'partner', 'platform', 'system admin')
  @HttpCode(HttpStatus.CREATED)
  async requestNewRefund(
    @Body() dto: RequestRefundDto,
  ): Promise<{ refund: RefundResponseDto }> {
    const refund = await this.requestRefundUseCase.execute(dto);
    return { refund: this.mapRefundToResponse(refund) };
  }

  @Get('refunds')
  @Roles('system admin', 'platform')
  @Permissions('read:refunds')
  async listAllRefunds(
    @Query() query: ListRefundsQueryDto,
  ): Promise<RefundListResponseDto> {
    const result = await this.listRefundsUseCase.execute(query);
    return {
      refunds: result.refunds.map((r) => this.mapRefundToResponse(r)),
      total: result.total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };
  }

  @Get('refunds/pending')
  @Roles('system admin', 'platform')
  @Permissions('read:refunds')
  async getPendingRefundsList(): Promise<{ refunds: RefundResponseDto[] }> {
    const refunds = await this.getPendingRefundsUseCase.execute();
    return { refunds: refunds.map((r) => this.mapRefundToResponse(r)) };
  }

  @Get('refunds/approved')
  @Roles('system admin', 'platform')
  @Permissions('read:refunds')
  async getApprovedRefundsList(): Promise<{ refunds: RefundResponseDto[] }> {
    const refunds = await this.getApprovedRefundsUseCase.execute();
    return { refunds: refunds.map((r) => this.mapRefundToResponse(r)) };
  }

  @Get('refunds/statistics')
  @Roles('system admin', 'platform')
  @Permissions('read:refunds')
  async getRefundStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<{ statistics: RefundStatisticsResponseDto }> {
    const statistics = await this.getRefundStatisticsUseCase.execute(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
    return { statistics };
  }

  @Get('refunds/total-refunded')
  @Roles('system admin', 'platform')
  @Permissions('read:refunds')
  async getTotalRefunded(): Promise<{ totalRefunded: number }> {
    const totalRefunded = await this.getTotalRefundedAmountUseCase.execute();
    return { totalRefunded };
  }

  @Get('refunds/pending-amount')
  @Roles('system admin', 'platform')
  @Permissions('read:refunds')
  async getPendingAmount(): Promise<{ pendingAmount: number }> {
    const pendingAmount = await this.getPendingRefundAmountUseCase.execute();
    return { pendingAmount };
  }

  @Get('refunds/user/:userId')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getUserRefundsList(
    @Param('userId') userId: string,
  ): Promise<{ refunds: RefundResponseDto[] }> {
    const refunds = await this.getUserRefundsUseCase.execute(userId);
    return { refunds: refunds.map((r) => this.mapRefundToResponse(r)) };
  }

  @Get('refunds/:id')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getRefund(
    @Param('id') id: string,
  ): Promise<{ refund: RefundResponseDto }> {
    const refund = await this.getRefundByIdUseCase.execute(id);
    return { refund: this.mapRefundToResponse(refund) };
  }

  @Patch('refunds/:id/approve')
  @Roles('system admin', 'platform')
  @Permissions('update:refunds')
  async approveRefundRequest(
    @Param('id') id: string,
    @Body() dto: ReviewRefundDto,
  ): Promise<{ refund: RefundResponseDto }> {
    const refund = await this.approveRefundUseCase.execute(id, dto);
    return { refund: this.mapRefundToResponse(refund) };
  }

  @Patch('refunds/:id/reject')
  @Roles('system admin', 'platform')
  @Permissions('update:refunds')
  async rejectRefundRequest(
    @Param('id') id: string,
    @Body() dto: ReviewRefundDto,
  ): Promise<{ refund: RefundResponseDto }> {
    const refund = await this.rejectRefundUseCase.execute(id, dto);
    return { refund: this.mapRefundToResponse(refund) };
  }

  @Patch('refunds/:id/process')
  @Roles('system admin', 'platform')
  @Permissions('update:refunds')
  async processRefundRequest(
    @Param('id') id: string,
    @Body() dto: ProcessRefundDto,
  ): Promise<{ refund: RefundResponseDto }> {
    const refund = await this.processRefundUseCase.execute(id, dto);
    return { refund: this.mapRefundToResponse(refund) };
  }

  // ============================================
  // DISPUTE ENDPOINTS
  // ============================================

  @Post('disputes')
  @Roles('user', 'partner', 'platform', 'system admin')
  @HttpCode(HttpStatus.CREATED)
  async createNewDispute(
    @Body() dto: CreateDisputeDto,
  ): Promise<{ dispute: DisputeResponseDto }> {
    const dispute = await this.createDisputeUseCase.execute(dto);
    return { dispute: this.mapDisputeToResponse(dispute) };
  }

  @Get('disputes')
  @Roles('system admin', 'platform')
  @Permissions('read:disputes')
  async listAllDisputes(
    @Query() query: ListDisputesQueryDto,
  ): Promise<DisputeListResponseDto> {
    const result = await this.listDisputesUseCase.execute(query);
    return {
      disputes: result.disputes.map((d) => this.mapDisputeToResponse(d)),
      total: result.total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };
  }

  @Get('disputes/open')
  @Roles('system admin', 'platform')
  @Permissions('read:disputes')
  async getOpenDisputesList(): Promise<{ disputes: DisputeResponseDto[] }> {
    const disputes = await this.getOpenDisputesUseCase.execute();
    return { disputes: disputes.map((d) => this.mapDisputeToResponse(d)) };
  }

  @Get('disputes/active')
  @Roles('system admin', 'platform')
  @Permissions('read:disputes')
  async getActiveDisputesList(): Promise<{ disputes: DisputeResponseDto[] }> {
    const disputes = await this.getActiveDisputesUseCase.execute();
    return { disputes: disputes.map((d) => this.mapDisputeToResponse(d)) };
  }

  @Get('disputes/escalated')
  @Roles('system admin', 'platform')
  @Permissions('read:disputes')
  async getEscalatedDisputesList(): Promise<{
    disputes: DisputeResponseDto[];
  }> {
    const disputes = await this.getEscalatedDisputesUseCase.execute();
    return { disputes: disputes.map((d) => this.mapDisputeToResponse(d)) };
  }

  @Get('disputes/high-priority')
  @Roles('system admin', 'platform')
  @Permissions('read:disputes')
  async getHighPriorityDisputesList(): Promise<{
    disputes: DisputeResponseDto[];
  }> {
    const disputes = await this.getHighPriorityDisputesUseCase.execute();
    return { disputes: disputes.map((d) => this.mapDisputeToResponse(d)) };
  }

  @Get('disputes/requiring-attention')
  @Roles('system admin', 'platform')
  @Permissions('read:disputes')
  async getDisputesRequiringAttentionList(): Promise<{
    disputes: DisputeResponseDto[];
  }> {
    const disputes = await this.getDisputesRequiringAttentionUseCase.execute();
    return { disputes: disputes.map((d) => this.mapDisputeToResponse(d)) };
  }

  @Get('disputes/statistics')
  @Roles('system admin', 'platform')
  @Permissions('read:disputes')
  async getDisputeStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<{ statistics: DisputeStatisticsResponseDto }> {
    const statistics = await this.getDisputeStatisticsUseCase.execute(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
    return { statistics };
  }

  @Get('disputes/user/:userId')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getUserDisputesList(
    @Param('userId') userId: string,
  ): Promise<{ disputes: DisputeResponseDto[] }> {
    const disputes = await this.getUserDisputesUseCase.execute(userId);
    return { disputes: disputes.map((d) => this.mapDisputeToResponse(d)) };
  }

  @Get('disputes/:id')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getDispute(
    @Param('id') id: string,
  ): Promise<{ dispute: DisputeResponseDto }> {
    const dispute = await this.getDisputeByIdUseCase.execute(id);
    return { dispute: this.mapDisputeToResponse(dispute) };
  }

  @Patch('disputes/:id/review')
  @Roles('system admin', 'platform')
  @Permissions('update:disputes')
  async startReview(
    @Param('id') id: string,
  ): Promise<{ dispute: DisputeResponseDto }> {
    const dispute = await this.startDisputeReviewUseCase.execute(id);
    return { dispute: this.mapDisputeToResponse(dispute) };
  }

  @Patch('disputes/:id/escalate')
  @Roles('system admin', 'platform')
  @Permissions('update:disputes')
  async escalate(
    @Param('id') id: string,
    @Body() dto: EscalateDisputeDto,
  ): Promise<{ dispute: DisputeResponseDto }> {
    const dispute = await this.escalateDisputeUseCase.execute(id, dto);
    return { dispute: this.mapDisputeToResponse(dispute) };
  }

  @Patch('disputes/:id/resolve')
  @Roles('system admin', 'platform')
  @Permissions('update:disputes')
  async resolve(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ): Promise<{ dispute: DisputeResponseDto }> {
    const dispute = await this.resolveDisputeUseCase.execute(id, dto);
    return { dispute: this.mapDisputeToResponse(dispute) };
  }

  @Patch('disputes/:id/close')
  @Roles('system admin', 'platform')
  @Permissions('update:disputes')
  async close(
    @Param('id') id: string,
  ): Promise<{ dispute: DisputeResponseDto }> {
    const dispute = await this.closeDisputeUseCase.execute(id);
    return { dispute: this.mapDisputeToResponse(dispute) };
  }

  @Patch('disputes/:id/priority')
  @Roles('system admin', 'platform')
  @Permissions('update:disputes')
  async updatePriority(
    @Param('id') id: string,
    @Body() dto: UpdateDisputePriorityDto,
  ): Promise<{ dispute: DisputeResponseDto }> {
    const dispute = await this.updateDisputePriorityUseCase.execute(id, dto);
    return { dispute: this.mapDisputeToResponse(dispute) };
  }

  @Patch('disputes/:id/evidence')
  @Roles('user', 'partner', 'platform', 'system admin')
  async addEvidence(
    @Param('id') id: string,
    @Body() dto: AddDisputeEvidenceDto,
  ): Promise<{ dispute: DisputeResponseDto }> {
    const dispute = await this.addDisputeEvidenceUseCase.execute(id, dto);
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

  private mapTransactionToResponse(
    transaction: any,
  ): TransactionLogResponseDto {
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
