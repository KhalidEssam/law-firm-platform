// ============================================
// MEMBERSHIP INVOICE USE CASES
// src/core/application/billing/use-cases/membership-invoice.use-cases.ts
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { MembershipInvoice } from '../../../domain/billing/entities/membership-invoice.entity';
import { Money, CurrencyEnum } from '../../../domain/billing/value-objects/money.vo';
import { InvoiceStatusEnum } from '../../../domain/billing/value-objects/invoice-status.vo';
import {
    type IMembershipInvoiceRepository,
    MembershipInvoiceListOptions
} from '../../../domain/billing/ports/membership-invoice.repository';
import {
    CreateMembershipInvoiceDto,
    ListMembershipInvoicesQueryDto,
} from '../dto/membership-invoice.dto';

// ============================================
// CREATE INVOICE
// ============================================
@Injectable()
export class CreateMembershipInvoiceUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(dto: CreateMembershipInvoiceDto): Promise<MembershipInvoice> {
        const invoiceNumber = MembershipInvoice.generateInvoiceNumber('INV');

        const invoice = MembershipInvoice.create({
            membershipId: dto.membershipId,
            invoiceNumber,
            amount: Money.create({
                amount: dto.amount,
                currency: dto.currency ?? CurrencyEnum.SAR,
            }),
            dueDate: new Date(dto.dueDate),
        });

        return await this.invoiceRepository.create(invoice);
    }
}

// ============================================
// GET INVOICE BY ID
// ============================================
@Injectable()
export class GetMembershipInvoiceByIdUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(id: string): Promise<MembershipInvoice> {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new NotFoundException(`Invoice with ID ${id} not found`);
        }
        return invoice;
    }
}

// ============================================
// GET INVOICE BY NUMBER
// ============================================
@Injectable()
export class GetMembershipInvoiceByNumberUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(invoiceNumber: string): Promise<MembershipInvoice> {
        const invoice = await this.invoiceRepository.findByInvoiceNumber(invoiceNumber);
        if (!invoice) {
            throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
        }
        return invoice;
    }
}

// ============================================
// LIST INVOICES
// ============================================
@Injectable()
export class ListMembershipInvoicesUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(query: ListMembershipInvoicesQueryDto): Promise<{
        invoices: MembershipInvoice[];
        total: number;
    }> {
        const options: MembershipInvoiceListOptions = {
            membershipId: query.membershipId,
            status: query.status as InvoiceStatusEnum,
            dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined,
            dueAfter: query.dueAfter ? new Date(query.dueAfter) : undefined,
            limit: query.limit ?? 20,
            offset: query.offset ?? 0,
            orderBy: query.orderBy as 'createdAt' | 'dueDate' | 'amount',
            orderDir: query.orderDir as 'asc' | 'desc',
        };

        const [invoices, total] = await Promise.all([
            this.invoiceRepository.list(options),
            this.invoiceRepository.count({
                membershipId: query.membershipId,
                status: query.status as InvoiceStatusEnum,
                dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined,
                dueAfter: query.dueAfter ? new Date(query.dueAfter) : undefined,
            }),
        ]);

        return { invoices, total };
    }
}

// ============================================
// GET INVOICES BY MEMBERSHIP
// ============================================
@Injectable()
export class GetInvoicesByMembershipUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(membershipId: string): Promise<MembershipInvoice[]> {
        return await this.invoiceRepository.findByMembershipId(membershipId);
    }
}

// ============================================
// MARK INVOICE AS PAID
// ============================================
@Injectable()
export class MarkInvoicePaidUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(id: string): Promise<MembershipInvoice> {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new NotFoundException(`Invoice with ID ${id} not found`);
        }

        if (!invoice.status.canBePaid()) {
            throw new BadRequestException(
                `Cannot mark invoice as paid. Current status: ${invoice.status.getValue()}`
            );
        }

        const updatedInvoice = invoice.markAsPaid();
        return await this.invoiceRepository.update(updatedInvoice);
    }
}

// ============================================
// MARK INVOICE AS OVERDUE
// ============================================
@Injectable()
export class MarkInvoiceOverdueUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(id: string): Promise<MembershipInvoice> {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new NotFoundException(`Invoice with ID ${id} not found`);
        }

        if (!invoice.status.canBeMarkedOverdue()) {
            throw new BadRequestException(
                `Cannot mark invoice as overdue. Current status: ${invoice.status.getValue()}`
            );
        }

        const updatedInvoice = invoice.markAsOverdue();
        return await this.invoiceRepository.update(updatedInvoice);
    }
}

// ============================================
// CANCEL INVOICE
// ============================================
@Injectable()
export class CancelMembershipInvoiceUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(id: string): Promise<MembershipInvoice> {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new NotFoundException(`Invoice with ID ${id} not found`);
        }

        if (!invoice.status.canBeCancelled()) {
            throw new BadRequestException(
                `Cannot cancel invoice. Current status: ${invoice.status.getValue()}`
            );
        }

        const updatedInvoice = invoice.cancel();
        return await this.invoiceRepository.update(updatedInvoice);
    }
}

// ============================================
// GET OVERDUE INVOICES
// ============================================
@Injectable()
export class GetOverdueInvoicesUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(): Promise<MembershipInvoice[]> {
        return await this.invoiceRepository.findOverdueInvoices();
    }
}

// ============================================
// GET INVOICES DUE SOON
// ============================================
@Injectable()
export class GetInvoicesDueSoonUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(daysAhead: number = 7): Promise<MembershipInvoice[]> {
        return await this.invoiceRepository.findDueSoon(daysAhead);
    }
}

// ============================================
// GET UNPAID INVOICES BY MEMBERSHIP
// ============================================
@Injectable()
export class GetUnpaidInvoicesByMembershipUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(membershipId: string): Promise<MembershipInvoice[]> {
        return await this.invoiceRepository.findUnpaidByMembershipId(membershipId);
    }
}

// ============================================
// GET TOTAL UNPAID AMOUNT
// ============================================
@Injectable()
export class GetTotalUnpaidAmountUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(membershipId: string): Promise<number> {
        return await this.invoiceRepository.getTotalUnpaidAmount(membershipId);
    }
}

// ============================================
// DELETE INVOICE
// ============================================
@Injectable()
export class DeleteMembershipInvoiceUseCase {
    constructor(
        @Inject('IMembershipInvoiceRepository')
        private readonly invoiceRepository: IMembershipInvoiceRepository,
    ) {}

    async execute(id: string): Promise<void> {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice) {
            throw new NotFoundException(`Invoice with ID ${id} not found`);
        }

        // Only allow deleting cancelled invoices
        if (!invoice.status.isCancelled()) {
            throw new BadRequestException('Only cancelled invoices can be deleted');
        }

        await this.invoiceRepository.delete(id);
    }
}
