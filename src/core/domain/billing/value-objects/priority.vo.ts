// ============================================
// PRIORITY VALUE OBJECT
// src/core/domain/billing/value-objects/priority.vo.ts
// ============================================

export enum PriorityEnum {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent',
}

export class Priority {
    private static readonly allowedPriorities = Object.values(PriorityEnum);
    private static readonly priorityOrder: Record<PriorityEnum, number> = {
        [PriorityEnum.LOW]: 1,
        [PriorityEnum.NORMAL]: 2,
        [PriorityEnum.HIGH]: 3,
        [PriorityEnum.URGENT]: 4,
    };

    private constructor(private readonly value: PriorityEnum) {}

    static create(value: string): Priority {
        const normalizedValue = value.toLowerCase() as PriorityEnum;
        if (!Priority.allowedPriorities.includes(normalizedValue)) {
            throw new Error(`Invalid priority: ${value}`);
        }
        return new Priority(normalizedValue);
    }

    static low(): Priority {
        return new Priority(PriorityEnum.LOW);
    }

    static normal(): Priority {
        return new Priority(PriorityEnum.NORMAL);
    }

    static high(): Priority {
        return new Priority(PriorityEnum.HIGH);
    }

    static urgent(): Priority {
        return new Priority(PriorityEnum.URGENT);
    }

    getValue(): PriorityEnum {
        return this.value;
    }

    getOrder(): number {
        return Priority.priorityOrder[this.value];
    }

    // State query methods
    isLow(): boolean {
        return this.value === PriorityEnum.LOW;
    }

    isNormal(): boolean {
        return this.value === PriorityEnum.NORMAL;
    }

    isHigh(): boolean {
        return this.value === PriorityEnum.HIGH;
    }

    isUrgent(): boolean {
        return this.value === PriorityEnum.URGENT;
    }

    // Business rule methods
    requiresImmediateAttention(): boolean {
        return [PriorityEnum.HIGH, PriorityEnum.URGENT].includes(this.value);
    }

    isHigherThan(other: Priority): boolean {
        return this.getOrder() > other.getOrder();
    }

    isLowerThan(other: Priority): boolean {
        return this.getOrder() < other.getOrder();
    }

    equals(other: Priority): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}
