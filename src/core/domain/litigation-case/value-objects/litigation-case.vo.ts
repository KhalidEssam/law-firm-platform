// ============================================
// LITIGATION CASE VALUE OBJECTS - PART 1
// Domain-Driven Design - Immutable Value Objects
// ============================================

// ============================================
// CASE ID
// ============================================
export class CaseId {
    private constructor(private readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (!this.value || this.value.trim().length === 0) {
            throw new Error('Case ID cannot be empty');
        }
        // UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(this.value)) {
            throw new Error('Case ID must be a valid UUID');
        }
    }

    static create(value?: string): CaseId {
        return new CaseId(value || crypto.randomUUID());
    }

    getValue(): string {
        return this.value;
    }

    equals(other: CaseId): boolean {
        return this.value === other.value;
    }
}

// ============================================
// CASE NUMBER
// ============================================
export class CaseNumber {
    private constructor(private readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (!this.value || this.value.trim().length === 0) {
            throw new Error('Case number cannot be empty');
        }
    }

    static create(value: string): CaseNumber {
        return new CaseNumber(value);
    }

    static generate(): CaseNumber {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        return new CaseNumber(`LIT-${year}${month}${day}-${random}`);
    }

    toString(): string {
        return this.value;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: CaseNumber): boolean {
        return this.value === other.value;
    }
}

// ============================================
// CASE TYPE
// ============================================
export enum CaseTypeEnum {
    CIVIL = 'civil',
    CRIMINAL = 'criminal',
    COMMERCIAL = 'commercial',
    LABOR = 'labor',
    FAMILY = 'family',
    ADMINISTRATIVE = 'administrative',
    REAL_ESTATE = 'real_estate',
    INSURANCE = 'insurance',
    INTELLECTUAL_PROPERTY = 'intellectual_property',
}

export class CaseType {
    private constructor(private readonly value: CaseTypeEnum) { }

    private static readonly validTypes = Object.values(CaseTypeEnum);

    static create(value: string): CaseType {
        const normalizedValue = value.toLowerCase() as CaseTypeEnum;

        if (!this.validTypes.includes(normalizedValue)) {
            throw new Error(`Invalid case type: ${value}. Must be one of: ${this.validTypes.join(', ')}`);
        }

        return new CaseType(normalizedValue);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: CaseType): boolean {
        return this.value === other.value;
    }

    isCivil(): boolean {
        return this.value === CaseTypeEnum.CIVIL;
    }

    isCriminal(): boolean {
        return this.value === CaseTypeEnum.CRIMINAL;
    }

    isCommercial(): boolean {
        return this.value === CaseTypeEnum.COMMERCIAL;
    }
}


import { RequestStatus as PrismaRequestStatus } from '@prisma/client';

// ============================================
// CASE STATUS
// ============================================
export enum CaseStatusEnum {
    PENDING = 'pending',
    SCHEDULED = 'scheduled',
    QUOTE_SENT = 'quote_sent',
    QUOTE_ACCEPTED = 'quote_accepted',
    ACTIVE = 'active',
    CLOSED = 'closed',
    CANCELLED = 'cancelled',
}

export class CaseStatus {
    private constructor(private readonly value: CaseStatusEnum) { }

    private static readonly validStatuses = Object.values(CaseStatusEnum);

    static create(value: string): CaseStatus {
        const normalizedValue = value.toLowerCase() as CaseStatusEnum;

        if (!this.validStatuses.includes(normalizedValue)) {
            throw new Error(`Invalid case status: ${value}`);
        }

        return new CaseStatus(normalizedValue);
    }

    // Create from Prisma enum
    static fromPrisma(prismaStatus: PrismaRequestStatus): CaseStatus {
        const mapping: Record<PrismaRequestStatus, CaseStatusEnum> = {
            [PrismaRequestStatus.pending]: CaseStatusEnum.PENDING,
            [PrismaRequestStatus.assigned]: CaseStatusEnum.PENDING,
            [PrismaRequestStatus.scheduled]: CaseStatusEnum.SCHEDULED,
            [PrismaRequestStatus.in_progress]: CaseStatusEnum.ACTIVE,
            [PrismaRequestStatus.quote_sent]: CaseStatusEnum.QUOTE_SENT,
            [PrismaRequestStatus.quote_accepted]: CaseStatusEnum.QUOTE_ACCEPTED,
            [PrismaRequestStatus.completed]: CaseStatusEnum.CLOSED,
            [PrismaRequestStatus.disputed]: CaseStatusEnum.ACTIVE,
            [PrismaRequestStatus.cancelled]: CaseStatusEnum.CANCELLED,
            [PrismaRequestStatus.closed]: CaseStatusEnum.CLOSED,
        };
        return new CaseStatus(mapping[prismaStatus]);
    }

    getValue(): CaseStatusEnum {
        return this.value;
    }

    // Convert to Prisma enum for queries
    toPrisma(): PrismaRequestStatus {
        const mapping: Record<CaseStatusEnum, PrismaRequestStatus> = {
            [CaseStatusEnum.PENDING]: PrismaRequestStatus.pending,
            [CaseStatusEnum.QUOTE_SENT]: PrismaRequestStatus.quote_sent,
            [CaseStatusEnum.SCHEDULED]: PrismaRequestStatus.scheduled,
            [CaseStatusEnum.QUOTE_ACCEPTED]: PrismaRequestStatus.quote_accepted,
            [CaseStatusEnum.ACTIVE]: PrismaRequestStatus.in_progress,
            [CaseStatusEnum.CLOSED]: PrismaRequestStatus.closed,
            [CaseStatusEnum.CANCELLED]: PrismaRequestStatus.cancelled,
        };
        return mapping[this.value];
    }

    equals(other: CaseStatus): boolean {
        return this.value === other.value;
    }

    isPending(): boolean {
        return this.value === CaseStatusEnum.PENDING;
    }

    isActive(): boolean {
        return this.value === CaseStatusEnum.ACTIVE;
    }

    isClosed(): boolean {
        return this.value === CaseStatusEnum.CLOSED;
    }

    canTransitionTo(newStatus: CaseStatus): boolean {
        const transitions: Record<CaseStatusEnum, CaseStatusEnum[]> = {
            [CaseStatusEnum.PENDING]: [CaseStatusEnum.QUOTE_SENT, CaseStatusEnum.CANCELLED],
            [CaseStatusEnum.SCHEDULED]: [CaseStatusEnum.QUOTE_SENT, CaseStatusEnum.CANCELLED],
            [CaseStatusEnum.QUOTE_SENT]: [CaseStatusEnum.QUOTE_ACCEPTED, CaseStatusEnum.CANCELLED],
            [CaseStatusEnum.QUOTE_ACCEPTED]: [CaseStatusEnum.ACTIVE, CaseStatusEnum.CANCELLED],
            [CaseStatusEnum.ACTIVE]: [CaseStatusEnum.CLOSED, CaseStatusEnum.CANCELLED],
            [CaseStatusEnum.CLOSED]: [],
            [CaseStatusEnum.CANCELLED]: [],
        };

        const allowedTransitions = transitions[this.value];
        return allowedTransitions.includes(newStatus.value);
    }
}

// ============================================
// CASE TITLE
// ============================================
export class CaseTitle {
    private constructor(private readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (!this.value || this.value.trim().length === 0) {
            throw new Error('Case title cannot be empty');
        }
        if (this.value.length < 10) {
            throw new Error('Case title must be at least 10 characters');
        }
        if (this.value.length > 200) {
            throw new Error('Case title cannot exceed 200 characters');
        }
    }

    static create(value: string): CaseTitle {
        return new CaseTitle(value.trim());
    }

    getValue(): string {
        return this.value;
    }

    toString(): string {
        return this.value;
    }
}

// ============================================
// CASE DESCRIPTION
// ============================================
export class CaseDescription {
    private constructor(private readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (!this.value || this.value.trim().length === 0) {
            throw new Error('Case description cannot be empty');
        }
        if (this.value.length < 50) {
            throw new Error('Case description must be at least 50 characters');
        }
        if (this.value.length > 5000) {
            throw new Error('Case description cannot exceed 5000 characters');
        }
    }

    static create(value: string): CaseDescription {
        return new CaseDescription(value.trim());
    }

    getValue(): string {
        return this.value;
    }

    getExcerpt(maxLength: number = 100): string {
        if (this.value.length <= maxLength) {
            return this.value;
        }
        return this.value.substring(0, maxLength) + '...';
    }
}

// ============================================
// MONEY (Reusable)
// ============================================
export class Money {
    private constructor(
        private readonly amount: number,
        private readonly currency: string,
    ) {
        this.validate();
    }

    private validate(): void {
        if (this.amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        if (!this.currency || this.currency.length !== 3) {
            throw new Error('Currency must be a 3-letter ISO code (e.g., SAR, USD)');
        }
    }

    static create(amount: number, currency: string = 'SAR'): Money {
        return new Money(amount, currency.toUpperCase());
    }

    static zero(currency: string = 'SAR'): Money {
        return new Money(0, currency);
    }

    getAmount(): number {
        return this.amount;
    }

    getCurrency(): string {
        return this.currency;
    }

    add(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error('Cannot add money with different currencies');
        }
        return new Money(this.amount + other.amount, this.currency);
    }

    subtract(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error('Cannot subtract money with different currencies');
        }
        return new Money(this.amount - other.amount, this.currency);
    }

    multiply(factor: number): Money {
        return new Money(this.amount * factor, this.currency);
    }

    equals(other: Money): boolean {
        return this.amount === other.amount && this.currency === other.currency;
    }

    isGreaterThan(other: Money): boolean {
        if (this.currency !== other.currency) {
            throw new Error('Cannot compare money with different currencies');
        }
        return this.amount > other.amount;
    }

    toString(): string {
        return `${this.amount.toFixed(2)} ${this.currency}`;
    }

    toJSON() {
        return {
            amount: this.amount,
            currency: this.currency,
        };
    }
}

// ============================================
// USER ID (Reusable)
// ============================================
export class UserId {
    private constructor(private readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (!this.value || this.value.trim().length === 0) {
            throw new Error('User ID cannot be empty');
        }
    }

    static create(value: string): UserId {
        return new UserId(value);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: UserId): boolean {
        return this.value === other.value;
    }
}

// ============================================
// PAYMENT STATUS
// ============================================
export enum PaymentStatusEnum {
    PENDING = 'pending',
    PAID = 'paid',
    REFUNDED = 'refunded',
    PARTIALLY_PAID = 'partially_paid',
}

export class PaymentStatus {
    private constructor(private readonly value: PaymentStatusEnum) { }

    static create(value: string): PaymentStatus {
        const normalizedValue = value.toLowerCase() as PaymentStatusEnum;

        if (!Object.values(PaymentStatusEnum).includes(normalizedValue)) {
            throw new Error(`Invalid payment status: ${value}`);
        }

        return new PaymentStatus(normalizedValue);
    }

    getValue(): string {
        return this.value;
    }

    isPending(): boolean {
        return this.value === PaymentStatusEnum.PENDING;
    }

    isPaid(): boolean {
        return this.value === PaymentStatusEnum.PAID;
    }

    isRefunded(): boolean {
        return this.value === PaymentStatusEnum.REFUNDED;
    }

    equals(other: PaymentStatus): boolean {
        return this.value === other.value;
    }
}

export interface CaseDetailsData {
    courtFileNumber?: string;
    courtName?: string;
    courtLocation?: string;
    plaintiff?: PartyInfo;
    defendant?: PartyInfo;
    witnesses?: PartyInfo[];
    claimAmount?: number;
    claimCurrency?: string;
    filingDate?: Date;
    hearingDates?: Date[];
    [key: string]: any; // Allow additional fields
}

export class CaseDetails {
    private constructor(private readonly data: CaseDetailsData) {
        this.validate();
    }

    private validate(): void {
        // Basic validation
        if (this.data.claimAmount !== undefined && this.data.claimAmount < 0) {
            throw new Error('Claim amount cannot be negative');
        }
    }

    static create(data: CaseDetailsData): CaseDetails {
        return new CaseDetails(data);
    }

    getData(): CaseDetailsData {
        return { ...this.data };
    }

    getCourtFileNumber(): string | undefined {
        return this.data.courtFileNumber;
    }

    getCourtName(): string | undefined {
        return this.data.courtName;
    }

    getClaimAmount(): number | undefined {
        return this.data.claimAmount;
    }

    toJSON(): CaseDetailsData {
        return this.getData();
    }
}

// ============================================
// PARTY INFO
// ============================================
export interface PartyInfo {
    name: string;
    nameAr?: string;
    type: 'individual' | 'company' | 'government';
    idNumber?: string;
    commercialRegister?: string;
    contact?: {
        email?: string;
        phone?: string;
        address?: string;
    };
    legalRepresentative?: {
        name: string;
        licenseNumber?: string;
        contact?: string;
    };
}

// ============================================
// QUOTE DETAILS
// ============================================
export interface QuoteDetailsData {
    baseAmount?: number;
    courtFees?: number;
    expertFees?: number;
    administrativeFees?: number;
    contingencyFee?: boolean;
    contingencyPercentage?: number;
    notes?: string;
    breakdown?: Array<{
        item: string;
        amount: number;
        description?: string;
    }>;
}

export class QuoteDetails {
    private constructor(private readonly data: QuoteDetailsData) {
        this.validate();
    }

    private validate(): void {
        if (this.data.contingencyPercentage !== undefined) {
            if (this.data.contingencyPercentage < 0 || this.data.contingencyPercentage > 100) {
                throw new Error('Contingency percentage must be between 0 and 100');
            }
        }

        // Validate amounts
        const amounts = [
            this.data.baseAmount,
            this.data.courtFees,
            this.data.expertFees,
            this.data.administrativeFees,
        ];

        for (const amount of amounts) {
            if (amount !== undefined && amount < 0) {
                throw new Error('Quote amounts cannot be negative');
            }
        }
    }

    static create(data: QuoteDetailsData): QuoteDetails {
        return new QuoteDetails(data);
    }

    getData(): QuoteDetailsData {
        return { ...this.data };
    }

    getTotalAmount(): number {
        const { baseAmount = 0, courtFees = 0, expertFees = 0, administrativeFees = 0 } = this.data;
        return baseAmount + courtFees + expertFees + administrativeFees;
    }

    hasContingencyFee(): boolean {
        return this.data.contingencyFee === true;
    }

    toJSON(): QuoteDetailsData {
        return this.getData();
    }
}

// ============================================
// CASE SUBTYPE
// ============================================
export class CaseSubtype {
    private constructor(private readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (!this.value || this.value.trim().length === 0) {
            throw new Error('Case subtype cannot be empty');
        }
        if (this.value.length > 100) {
            throw new Error('Case subtype cannot exceed 100 characters');
        }
    }

    static create(value: string): CaseSubtype {
        return new CaseSubtype(value.trim());
    }

    getValue(): string {
        return this.value;
    }

    equals(other: CaseSubtype): boolean {
        return this.value === other.value;
    }
}

// ============================================
// COURT NAME
// ============================================
export class CourtName {
    private constructor(private readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (!this.value || this.value.trim().length === 0) {
            throw new Error('Court name cannot be empty');
        }
        if (this.value.length > 200) {
            throw new Error('Court name cannot exceed 200 characters');
        }
    }

    static create(value: string): CourtName {
        return new CourtName(value.trim());
    }

    getValue(): string {
        return this.value;
    }

    toString(): string {
        return this.value;
    }
}

export class PaymentReference {
    private constructor(private readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (!this.value || this.value.trim().length === 0) {
            throw new Error('Payment reference cannot be empty');
        }
    }

    static create(value: string): PaymentReference {
        return new PaymentReference(value.trim());
    }

    getValue(): string {
        return this.value;
    }

    equals(other: PaymentReference): boolean {
        return this.value === other.value;
    }
}