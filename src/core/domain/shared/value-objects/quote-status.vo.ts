// ============================================
// QUOTE STATUS VALUE OBJECT
// src/core/domain/shared/value-objects/quote-status.vo.ts
// ============================================

/**
 * QuoteStatus enum matching Prisma schema
 */
export enum QuoteStatusEnum {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
}

/**
 * QuoteStatus Value Object
 * Represents the status of a service quote/proposal
 */
export class QuoteStatus {
    private static readonly validStatuses = Object.values(QuoteStatusEnum);

    private constructor(private readonly value: QuoteStatusEnum) {}

    static create(value: string): QuoteStatus {
        const normalizedValue = value.toLowerCase() as QuoteStatusEnum;
        if (!QuoteStatus.validStatuses.includes(normalizedValue)) {
            throw new Error(
                `Invalid quote status: ${value}. Must be one of: ${QuoteStatus.validStatuses.join(', ')}`
            );
        }
        return new QuoteStatus(normalizedValue);
    }

    static pending(): QuoteStatus {
        return new QuoteStatus(QuoteStatusEnum.PENDING);
    }

    static accepted(): QuoteStatus {
        return new QuoteStatus(QuoteStatusEnum.ACCEPTED);
    }

    static rejected(): QuoteStatus {
        return new QuoteStatus(QuoteStatusEnum.REJECTED);
    }

    static expired(): QuoteStatus {
        return new QuoteStatus(QuoteStatusEnum.EXPIRED);
    }

    getValue(): QuoteStatusEnum {
        return this.value;
    }

    // State query methods
    isPending(): boolean {
        return this.value === QuoteStatusEnum.PENDING;
    }

    isAccepted(): boolean {
        return this.value === QuoteStatusEnum.ACCEPTED;
    }

    isRejected(): boolean {
        return this.value === QuoteStatusEnum.REJECTED;
    }

    isExpired(): boolean {
        return this.value === QuoteStatusEnum.EXPIRED;
    }

    // Business rule methods
    canBeAccepted(): boolean {
        return this.value === QuoteStatusEnum.PENDING;
    }

    canBeRejected(): boolean {
        return this.value === QuoteStatusEnum.PENDING;
    }

    canExpire(): boolean {
        return this.value === QuoteStatusEnum.PENDING;
    }

    isFinal(): boolean {
        return [
            QuoteStatusEnum.ACCEPTED,
            QuoteStatusEnum.REJECTED,
            QuoteStatusEnum.EXPIRED,
        ].includes(this.value);
    }

    isActionable(): boolean {
        return this.value === QuoteStatusEnum.PENDING;
    }

    equals(other: QuoteStatus): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}

/**
 * Check if a string is a valid quote status
 */
export function isValidQuoteStatus(value: string): value is QuoteStatusEnum {
    return Object.values(QuoteStatusEnum).includes(value as QuoteStatusEnum);
}

/**
 * Map Prisma enum to domain QuoteStatus
 */
export function mapQuoteStatusFromPrisma(prismaStatus: string): QuoteStatus {
    if (isValidQuoteStatus(prismaStatus)) {
        return QuoteStatus.create(prismaStatus);
    }
    return QuoteStatus.pending();
}

/**
 * Map domain QuoteStatus to Prisma enum value
 */
export function mapQuoteStatusToPrisma(status: QuoteStatus): string {
    return status.getValue();
}
