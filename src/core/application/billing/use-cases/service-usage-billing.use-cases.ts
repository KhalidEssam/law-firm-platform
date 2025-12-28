// ============================================
// SERVICE USAGE BILLING USE CASES
// Integrates membership service usage with billing
// src/core/application/billing/use-cases/service-usage-billing.use-cases.ts
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  MembershipIntegrationService,
  ServiceType,
} from '../../membership/services/membership-integration.service';
import { CreateMembershipInvoiceUseCase } from './membership-invoice.use-cases';
import { type IMembershipInvoiceRepository } from '../../../domain/billing/ports/membership-invoice.repository';
import { MembershipInvoice } from '../../../domain/billing/entities/membership-invoice.entity';
import {
  Money,
  CurrencyEnum,
} from '../../../domain/billing/value-objects/money.vo';

// ============================================
// DTOs
// ============================================

export interface ServiceUsageBillingSummary {
  membershipId: string;
  userId: string;
  tierName: string;
  unbilledItems: {
    usageId: string;
    serviceType: string;
    requestId: string | null;
    usedAt: Date;
    chargedAmount: number;
    currency: string;
  }[];
  totalUnbilledAmount: number;
  currency: string;
}

export interface GenerateUsageInvoiceDto {
  membershipId: string;
  userId: string;
  dueDate: Date;
  includeUsageIds?: string[]; // If not specified, includes all unbilled usage
}

// ============================================
// GET UNBILLED SERVICE USAGE SUMMARY
// ============================================

@Injectable()
export class GetUnbilledServiceUsageSummaryUseCase {
  constructor(
    private readonly membershipService: MembershipIntegrationService,
  ) {}

  async execute(userId: string): Promise<ServiceUsageBillingSummary | null> {
    // 1. Get membership status
    const status = await this.membershipService.getMembershipStatus(userId);
    if (!status.hasMembership || !status.membershipId) {
      return null;
    }

    // 2. Get unbilled usage
    const unbilledUsage = await this.membershipService.getUnbilledUsage(
      status.membershipId,
    );

    // 3. Transform to billing summary
    const unbilledItems = unbilledUsage.map((usage) => ({
      usageId: usage.id,
      serviceType: usage.serviceId,
      requestId: usage.getRelatedRequestId(),
      usedAt: usage.usedAt,
      chargedAmount: usage.chargedAmount || 0,
      currency: usage.currency || 'SAR',
    }));

    const totalUnbilledAmount = unbilledItems.reduce(
      (sum, item) => sum + item.chargedAmount,
      0,
    );

    return {
      membershipId: status.membershipId,
      userId,
      tierName: status.tierName || 'Unknown',
      unbilledItems,
      totalUnbilledAmount,
      currency: 'SAR',
    };
  }
}

// ============================================
// GENERATE SERVICE USAGE INVOICE
// ============================================

@Injectable()
export class GenerateServiceUsageInvoiceUseCase {
  constructor(
    private readonly membershipService: MembershipIntegrationService,
    @Inject('IMembershipInvoiceRepository')
    private readonly invoiceRepo: IMembershipInvoiceRepository,
  ) {}

  async execute(
    dto: GenerateUsageInvoiceDto,
  ): Promise<MembershipInvoice | null> {
    // 1. Get unbilled usage
    const unbilledUsage = await this.membershipService.getUnbilledUsage(
      dto.membershipId,
    );

    if (unbilledUsage.length === 0) {
      return null; // No unbilled usage to invoice
    }

    // 2. Filter by specified usage IDs if provided
    let usageToInvoice = unbilledUsage;
    if (dto.includeUsageIds && dto.includeUsageIds.length > 0) {
      usageToInvoice = unbilledUsage.filter((u) =>
        dto.includeUsageIds!.includes(u.id),
      );
    }

    // 3. Calculate total amount
    const totalAmount = usageToInvoice.reduce(
      (sum, usage) => sum + (usage.chargedAmount || 0),
      0,
    );

    if (totalAmount <= 0) {
      return null; // No chargeable amount
    }

    // 4. Create invoice
    const invoiceNumber = MembershipInvoice.generateInvoiceNumber('USG');
    const invoice = MembershipInvoice.create({
      membershipId: dto.membershipId,
      invoiceNumber,
      amount: Money.create({
        amount: totalAmount,
        currency: CurrencyEnum.SAR,
      }),
      dueDate: dto.dueDate,
    });

    const savedInvoice = await this.invoiceRepo.create(invoice);

    // 5. Mark usage as billed
    for (const usage of usageToInvoice) {
      if (usage.chargedAmount && usage.chargedAmount > 0) {
        await this.membershipService.markUsageAsBilled(
          usage.id,
          usage.chargedAmount,
          usage.currency || 'SAR',
        );
      }
    }

    return savedInvoice;
  }
}

// ============================================
// GET BILLABLE USAGE BY SERVICE TYPE
// ============================================

@Injectable()
export class GetBillableUsageByServiceTypeUseCase {
  constructor(
    private readonly membershipService: MembershipIntegrationService,
  ) {}

  async execute(
    userId: string,
    serviceType?: ServiceType,
  ): Promise<{
    consultation: number;
    legalOpinion: number;
    litigation: number;
    call: number;
    serviceRequest: number;
    total: number;
  }> {
    // Get membership status
    const status = await this.membershipService.getMembershipStatus(userId);
    if (!status.hasMembership || !status.membershipId) {
      return {
        consultation: 0,
        legalOpinion: 0,
        litigation: 0,
        call: 0,
        serviceRequest: 0,
        total: 0,
      };
    }

    // Get unbilled usage
    const unbilledUsage = await this.membershipService.getUnbilledUsage(
      status.membershipId,
    );

    // Aggregate by service type
    const aggregated = {
      consultation: 0,
      legalOpinion: 0,
      litigation: 0,
      call: 0,
      serviceRequest: 0,
      total: 0,
    };

    for (const usage of unbilledUsage) {
      const amount = usage.chargedAmount || 0;
      aggregated.total += amount;

      switch (usage.serviceId) {
        case ServiceType.CONSULTATION:
          aggregated.consultation += amount;
          break;
        case ServiceType.LEGAL_OPINION:
          aggregated.legalOpinion += amount;
          break;
        case ServiceType.LITIGATION:
          aggregated.litigation += amount;
          break;
        case ServiceType.CALL:
          aggregated.call += amount;
          break;
        case ServiceType.SERVICE_REQUEST:
          aggregated.serviceRequest += amount;
          break;
      }
    }

    return aggregated;
  }
}

// ============================================
// PROCESS BATCH SERVICE USAGE BILLING
// (For scheduled billing jobs)
// ============================================

@Injectable()
export class ProcessBatchServiceUsageBillingUseCase {
  constructor(
    private readonly generateInvoice: GenerateServiceUsageInvoiceUseCase,
    @Inject('IMembershipRepository')
    private readonly membershipRepo: any,
  ) {}

  async execute(daysUntilDue: number = 14): Promise<{
    processedCount: number;
    totalInvoiced: number;
    invoiceIds: string[];
    errors: { membershipId: string; error: string }[];
  }> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysUntilDue);

    const result = {
      processedCount: 0,
      totalInvoiced: 0,
      invoiceIds: [] as string[],
      errors: [] as { membershipId: string; error: string }[],
    };

    try {
      // Get all active memberships
      const activeMemberships = await this.membershipRepo.list({
        isActive: true,
        limit: 1000,
      });

      for (const membership of activeMemberships) {
        try {
          const invoice = await this.generateInvoice.execute({
            membershipId: membership.id,
            userId: membership.userId,
            dueDate,
          });

          if (invoice) {
            result.processedCount++;
            result.totalInvoiced += invoice.amount.amount;
            result.invoiceIds.push(invoice.id);
          }
        } catch (error: any) {
          result.errors.push({
            membershipId: membership.id,
            error: error.message || 'Unknown error',
          });
        }
      }
    } catch (error: any) {
      console.error('Batch billing failed:', error);
    }

    return result;
  }
}

// ============================================
// GET COMBINED MEMBERSHIP & USAGE BILLING
// ============================================

@Injectable()
export class GetCombinedBillingSummaryUseCase {
  constructor(
    private readonly membershipService: MembershipIntegrationService,
    @Inject('IMembershipInvoiceRepository')
    private readonly invoiceRepo: IMembershipInvoiceRepository,
  ) {}

  async execute(userId: string): Promise<{
    membershipStatus: {
      hasMembership: boolean;
      isActive: boolean;
      tierName: string | null;
      expiresAt: Date | null;
    };
    pendingInvoices: {
      id: string;
      invoiceNumber: string;
      amount: number;
      dueDate: Date;
      status: string;
    }[];
    unbilledUsage: {
      totalAmount: number;
      itemCount: number;
    };
    totalOwed: number;
    currency: string;
  }> {
    // Get membership status
    const status = await this.membershipService.getMembershipStatus(userId);

    // Initialize result
    const result = {
      membershipStatus: {
        hasMembership: status.hasMembership,
        isActive: status.isActive,
        tierName: status.tierName,
        expiresAt: status.expiresAt,
      },
      pendingInvoices: [] as any[],
      unbilledUsage: {
        totalAmount: 0,
        itemCount: 0,
      },
      totalOwed: 0,
      currency: 'SAR',
    };

    if (!status.membershipId) {
      return result;
    }

    // Get pending invoices
    const unpaidInvoices = await this.invoiceRepo.findUnpaidByMembershipId(
      status.membershipId,
    );
    result.pendingInvoices = unpaidInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount.amount,
      dueDate: inv.dueDate,
      status: inv.status.getValue(),
    }));

    // Get unbilled usage
    const unbilledUsage = await this.membershipService.getUnbilledUsage(
      status.membershipId,
    );
    result.unbilledUsage.itemCount = unbilledUsage.length;
    result.unbilledUsage.totalAmount = unbilledUsage.reduce(
      (sum, u) => sum + (u.chargedAmount || 0),
      0,
    );

    // Calculate total owed
    const invoiceTotal = result.pendingInvoices.reduce(
      (sum, inv) => sum + inv.amount,
      0,
    );
    result.totalOwed = invoiceTotal + result.unbilledUsage.totalAmount;

    return result;
  }
}
