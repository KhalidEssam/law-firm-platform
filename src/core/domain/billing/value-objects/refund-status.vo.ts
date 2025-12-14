// ============================================
// REFUND STATUS VALUE OBJECT
// src/core/domain/billing/value-objects/refund-status.vo.ts
// ============================================

export enum RefundStatusEnum {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PROCESSED = 'processed',
}

export class RefundStatus {
    private static readonly allowedStatuses = Object.values(RefundStatusEnum);

    private constructor(private readonly value: RefundStatusEnum) {}

    static create(value: string): RefundStatus {
        const normalizedValue = value.toLowerCase() as RefundStatusEnum;
        if (!RefundStatus.allowedStatuses.includes(normalizedValue)) {
            throw new Error(`Invalid refund status: ${value}`);
        }
        return new RefundStatus(normalizedValue);
    }

    static pending(): RefundStatus {
        return new RefundStatus(RefundStatusEnum.PENDING);
    }

    static approved(): RefundStatus {
        return new RefundStatus(RefundStatusEnum.APPROVED);
    }

    static rejected(): RefundStatus {
        return new RefundStatus(RefundStatusEnum.REJECTED);
    }

    static processed(): RefundStatus {
        return new RefundStatus(RefundStatusEnum.PROCESSED);
    }

    getValue(): RefundStatusEnum {
        return this.value;
    }

    // State query methods
    isPending(): boolean {
        return this.value === RefundStatusEnum.PENDING;
    }

    isApproved(): boolean {
        return this.value === RefundStatusEnum.APPROVED;
    }

    isRejected(): boolean {
        return this.value === RefundStatusEnum.REJECTED;
    }

    isProcessed(): boolean {
        return this.value === RefundStatusEnum.PROCESSED;
    }

    // Business rule methods
    canBeReviewed(): boolean {
        return this.value === RefundStatusEnum.PENDING;
    }

    canBeProcessed(): boolean {
        return this.value === RefundStatusEnum.APPROVED;
    }

    isFinal(): boolean {
        return [RefundStatusEnum.REJECTED, RefundStatusEnum.PROCESSED].includes(this.value);
    }

    equals(other: RefundStatus): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}
