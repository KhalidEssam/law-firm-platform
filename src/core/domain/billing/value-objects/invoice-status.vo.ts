// ============================================
// INVOICE STATUS VALUE OBJECT
// src/core/domain/billing/value-objects/invoice-status.vo.ts
// ============================================

export enum InvoiceStatusEnum {
    UNPAID = 'unpaid',
    PAID = 'paid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
}

export class InvoiceStatus {
    private static readonly allowedStatuses = Object.values(InvoiceStatusEnum);

    private constructor(private readonly value: InvoiceStatusEnum) {}

    static create(value: string): InvoiceStatus {
        const normalizedValue = value.toLowerCase() as InvoiceStatusEnum;
        if (!InvoiceStatus.allowedStatuses.includes(normalizedValue)) {
            throw new Error(`Invalid invoice status: ${value}`);
        }
        return new InvoiceStatus(normalizedValue);
    }

    static unpaid(): InvoiceStatus {
        return new InvoiceStatus(InvoiceStatusEnum.UNPAID);
    }

    static paid(): InvoiceStatus {
        return new InvoiceStatus(InvoiceStatusEnum.PAID);
    }

    static overdue(): InvoiceStatus {
        return new InvoiceStatus(InvoiceStatusEnum.OVERDUE);
    }

    static cancelled(): InvoiceStatus {
        return new InvoiceStatus(InvoiceStatusEnum.CANCELLED);
    }

    getValue(): InvoiceStatusEnum {
        return this.value;
    }

    // State query methods
    isUnpaid(): boolean {
        return this.value === InvoiceStatusEnum.UNPAID;
    }

    isPaid(): boolean {
        return this.value === InvoiceStatusEnum.PAID;
    }

    isOverdue(): boolean {
        return this.value === InvoiceStatusEnum.OVERDUE;
    }

    isCancelled(): boolean {
        return this.value === InvoiceStatusEnum.CANCELLED;
    }

    // Business rule methods
    canBePaid(): boolean {
        return [InvoiceStatusEnum.UNPAID, InvoiceStatusEnum.OVERDUE].includes(this.value);
    }

    canBeCancelled(): boolean {
        return this.value === InvoiceStatusEnum.UNPAID;
    }

    canBeMarkedOverdue(): boolean {
        return this.value === InvoiceStatusEnum.UNPAID;
    }

    equals(other: InvoiceStatus): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}
