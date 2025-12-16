// ============================================
// TICKET CATEGORY VALUE OBJECT
// src/core/domain/support-ticket/value-objects/ticket-category.vo.ts
// ============================================

export enum TicketCategoryEnum {
    TECHNICAL = 'technical',
    BILLING = 'billing',
    GENERAL = 'general',
    COMPLAINT = 'complaint',
}

export class TicketCategory {
    private static readonly allowedCategories = Object.values(TicketCategoryEnum);

    private constructor(private readonly value: TicketCategoryEnum) {}

    static create(value: string): TicketCategory {
        const normalizedValue = value.toLowerCase() as TicketCategoryEnum;
        if (!TicketCategory.allowedCategories.includes(normalizedValue)) {
            throw new Error(`Invalid ticket category: ${value}`);
        }
        return new TicketCategory(normalizedValue);
    }

    static technical(): TicketCategory {
        return new TicketCategory(TicketCategoryEnum.TECHNICAL);
    }

    static billing(): TicketCategory {
        return new TicketCategory(TicketCategoryEnum.BILLING);
    }

    static general(): TicketCategory {
        return new TicketCategory(TicketCategoryEnum.GENERAL);
    }

    static complaint(): TicketCategory {
        return new TicketCategory(TicketCategoryEnum.COMPLAINT);
    }

    getValue(): TicketCategoryEnum {
        return this.value;
    }

    // State query methods
    isTechnical(): boolean {
        return this.value === TicketCategoryEnum.TECHNICAL;
    }

    isBilling(): boolean {
        return this.value === TicketCategoryEnum.BILLING;
    }

    isGeneral(): boolean {
        return this.value === TicketCategoryEnum.GENERAL;
    }

    isComplaint(): boolean {
        return this.value === TicketCategoryEnum.COMPLAINT;
    }

    // Business rule methods
    requiresSpecialist(): boolean {
        return [TicketCategoryEnum.TECHNICAL, TicketCategoryEnum.BILLING].includes(this.value);
    }

    isHighPriorityByDefault(): boolean {
        return this.value === TicketCategoryEnum.COMPLAINT;
    }

    equals(other: TicketCategory): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}
