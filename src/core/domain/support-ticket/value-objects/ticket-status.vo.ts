// ============================================
// TICKET STATUS VALUE OBJECT
// src/core/domain/support-ticket/value-objects/ticket-status.vo.ts
// ============================================

export enum TicketStatusEnum {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

export class TicketStatus {
    private static readonly allowedStatuses = Object.values(TicketStatusEnum);

    private constructor(private readonly value: TicketStatusEnum) {}

    static create(value: string): TicketStatus {
        const normalizedValue = value.toLowerCase() as TicketStatusEnum;
        if (!TicketStatus.allowedStatuses.includes(normalizedValue)) {
            throw new Error(`Invalid ticket status: ${value}`);
        }
        return new TicketStatus(normalizedValue);
    }

    static open(): TicketStatus {
        return new TicketStatus(TicketStatusEnum.OPEN);
    }

    static inProgress(): TicketStatus {
        return new TicketStatus(TicketStatusEnum.IN_PROGRESS);
    }

    static resolved(): TicketStatus {
        return new TicketStatus(TicketStatusEnum.RESOLVED);
    }

    static closed(): TicketStatus {
        return new TicketStatus(TicketStatusEnum.CLOSED);
    }

    getValue(): TicketStatusEnum {
        return this.value;
    }

    // State query methods
    isOpen(): boolean {
        return this.value === TicketStatusEnum.OPEN;
    }

    isInProgress(): boolean {
        return this.value === TicketStatusEnum.IN_PROGRESS;
    }

    isResolved(): boolean {
        return this.value === TicketStatusEnum.RESOLVED;
    }

    isClosed(): boolean {
        return this.value === TicketStatusEnum.CLOSED;
    }

    // Business rule methods
    canStartProgress(): boolean {
        return this.value === TicketStatusEnum.OPEN;
    }

    canBeResolved(): boolean {
        return [TicketStatusEnum.OPEN, TicketStatusEnum.IN_PROGRESS].includes(this.value);
    }

    canBeClosed(): boolean {
        return this.value === TicketStatusEnum.RESOLVED;
    }

    canBeReopened(): boolean {
        return [TicketStatusEnum.RESOLVED, TicketStatusEnum.CLOSED].includes(this.value);
    }

    canBeAssigned(): boolean {
        return [TicketStatusEnum.OPEN, TicketStatusEnum.IN_PROGRESS].includes(this.value);
    }

    isActive(): boolean {
        return [TicketStatusEnum.OPEN, TicketStatusEnum.IN_PROGRESS].includes(this.value);
    }

    isFinal(): boolean {
        return this.value === TicketStatusEnum.CLOSED;
    }

    equals(other: TicketStatus): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    toJSON(): string {
        return this.value;
    }
}
