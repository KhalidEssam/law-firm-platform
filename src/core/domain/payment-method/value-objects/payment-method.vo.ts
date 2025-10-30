// ============================================
// PAYMENT METHOD VALUE OBJECTS - ALL IN ONE
// Domain Layer - Immutable Value Objects
// ============================================

// ============================================
// PAYMENT METHOD ID
// ============================================
export class PaymentMethodId {
    private constructor(private readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (!this.value || this.value.trim().length === 0) {
            throw new Error('Payment method ID cannot be empty');
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(this.value)) {
            throw new Error('Payment method ID must be a valid UUID');
        }
    }

    static create(value?: string): PaymentMethodId {
        return new PaymentMethodId(value || crypto.randomUUID());
    }

    getValue(): string {
        return this.value;
    }

    equals(other: PaymentMethodId): boolean {
        return this.value === other.value;
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
// PAYMENT METHOD TYPE
// ============================================
export enum PaymentMethodTypeEnum {
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
    WALLET = 'wallet',
    BANK_TRANSFER = 'bank_transfer',
    APPLE_PAY = 'apple_pay',
    GOOGLE_PAY = 'google_pay',
    MADA = 'mada', // Saudi local card scheme
}

export class PaymentMethodType {
    private constructor(private readonly value: PaymentMethodTypeEnum) { }

    private static readonly validTypes = Object.values(PaymentMethodTypeEnum);

    static create(value: string): PaymentMethodType {
        const normalizedValue = value.toLowerCase() as PaymentMethodTypeEnum;

        if (!this.validTypes.includes(normalizedValue)) {
            throw new Error(`Invalid payment method type: ${value}. Must be one of: ${this.validTypes.join(', ')}`);
        }

        return new PaymentMethodType(normalizedValue);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: PaymentMethodType): boolean {
        return this.value === other.value;
    }

    isCard(): boolean {
        return this.value === PaymentMethodTypeEnum.CREDIT_CARD ||
            this.value === PaymentMethodTypeEnum.DEBIT_CARD ||
            this.value === PaymentMethodTypeEnum.MADA;
    }

    isDigitalWallet(): boolean {
        return this.value === PaymentMethodTypeEnum.WALLET ||
            this.value === PaymentMethodTypeEnum.APPLE_PAY ||
            this.value === PaymentMethodTypeEnum.GOOGLE_PAY;
    }

    isMada(): boolean {
        return this.value === PaymentMethodTypeEnum.MADA;
    }
}

// ============================================
// CARD DETAILS
// ============================================
export interface CardDetailsData {
    cardNumber?: string; // Last 4 digits only
    cardHolderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
    brand?: string; // visa, mastercard, amex, mada
    bankName?: string;
    issuerCountry?: string;
    token?: string; // Tokenized card from payment gateway
}

export class CardDetails {
    private constructor(private readonly data: CardDetailsData) {
        this.validate();
    }

    private validate(): void {
        // Validate card number (should be masked - last 4 digits only)
        if (this.data.cardNumber) {
            if (this.data.cardNumber.length > 4) {
                throw new Error('Card number should only store last 4 digits');
            }
            if (!/^\d{4}$/.test(this.data.cardNumber)) {
                throw new Error('Card number must be 4 digits');
            }
        }

        // Validate expiry month
        if (this.data.expiryMonth) {
            const month = parseInt(this.data.expiryMonth);
            if (month < 1 || month > 12) {
                throw new Error('Invalid expiry month');
            }
        }

        // Validate expiry year
        if (this.data.expiryYear) {
            const year = parseInt(this.data.expiryYear);
            const currentYear = new Date().getFullYear();
            if (year < currentYear || year > currentYear + 20) {
                throw new Error('Invalid expiry year');
            }
        }

        // Validate card holder name
        if (this.data.cardHolderName) {
            if (this.data.cardHolderName.length < 2 || this.data.cardHolderName.length > 100) {
                throw new Error('Card holder name must be between 2 and 100 characters');
            }
        }
    }

    static create(data: CardDetailsData): CardDetails {
        return new CardDetails(data);
    }

    getData(): CardDetailsData {
        return { ...this.data };
    }

    getLastFourDigits(): string | undefined {
        return this.data.cardNumber;
    }

    getCardBrand(): string | undefined {
        return this.data.brand;
    }

    getMaskedNumber(): string {
        if (!this.data.cardNumber) return '****';
        return `**** **** **** ${this.data.cardNumber}`;
    }

    isExpired(): boolean {
        if (!this.data.expiryMonth || !this.data.expiryYear) return false;

        const now = new Date();
        const expiryDate = new Date(
            parseInt(this.data.expiryYear),
            parseInt(this.data.expiryMonth) - 1,
            1
        );

        return expiryDate < now;
    }

    getExpiryString(): string {
        if (!this.data.expiryMonth || !this.data.expiryYear) return '';
        return `${this.data.expiryMonth.padStart(2, '0')}/${this.data.expiryYear}`;
    }

    toJSON(): CardDetailsData {
        return this.getData();
    }
}

// ============================================
// WALLET DETAILS
// ============================================
export interface WalletDetailsData {
    walletProvider?: string; // stc_pay, apple_pay, google_pay
    walletId?: string;
    phoneNumber?: string;
    email?: string;
    verified?: boolean;
}

export class WalletDetails {
    private constructor(private readonly data: WalletDetailsData) {
        this.validate();
    }

    private validate(): void {
        if (this.data.phoneNumber) {
            // Basic phone validation
            if (!/^\+?[1-9]\d{1,14}$/.test(this.data.phoneNumber)) {
                throw new Error('Invalid phone number format');
            }
        }

        if (this.data.email) {
            // Basic email validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.data.email)) {
                throw new Error('Invalid email format');
            }
        }
    }

    static create(data: WalletDetailsData): WalletDetails {
        return new WalletDetails(data);
    }

    getData(): WalletDetailsData {
        return { ...this.data };
    }

    getProvider(): string | undefined {
        return this.data.walletProvider;
    }

    isVerified(): boolean {
        return this.data.verified === true;
    }

    toJSON(): WalletDetailsData {
        return this.getData();
    }
}

// ============================================
// BANK TRANSFER DETAILS
// ============================================
export interface BankTransferDetailsData {
    accountHolderName?: string;
    accountNumber?: string; // Last 4 digits only
    bankName?: string;
    bankCode?: string;
    iban?: string; // Masked
    swiftCode?: string;
}

export class BankTransferDetails {
    private constructor(private readonly data: BankTransferDetailsData) {
        this.validate();
    }

    private validate(): void {
        if (this.data.accountNumber) {
            if (!/^\d{4}$/.test(this.data.accountNumber)) {
                throw new Error('Account number should only store last 4 digits');
            }
        }

        if (this.data.accountHolderName) {
            if (this.data.accountHolderName.length < 2 || this.data.accountHolderName.length > 100) {
                throw new Error('Account holder name must be between 2 and 100 characters');
            }
        }
    }

    static create(data: BankTransferDetailsData): BankTransferDetails {
        return new BankTransferDetails(data);
    }

    getData(): BankTransferDetailsData {
        return { ...this.data };
    }

    getMaskedAccountNumber(): string {
        if (!this.data.accountNumber) return '****';
        return `**** **** ${this.data.accountNumber}`;
    }

    getMaskedIban(): string {
        if (!this.data.iban) return '';
        // Show first 4 and last 4 characters of IBAN
        const iban = this.data.iban;
        if (iban.length <= 8) return iban;
        return `${iban.substring(0, 4)}****${iban.substring(iban.length - 4)}`;
    }

    toJSON(): BankTransferDetailsData {
        return this.getData();
    }
}

// ============================================
// PAYMENT METHOD DETAILS (Union Type)
// ============================================
export type PaymentMethodDetails = CardDetails | WalletDetails | BankTransferDetails;

export interface PaymentMethodDetailsJson {
    type: 'card' | 'wallet' | 'bank_transfer';
    data: CardDetailsData | WalletDetailsData | BankTransferDetailsData;
}

export class PaymentMethodDetailsFactory {
    static create(type: PaymentMethodTypeEnum, data: any): PaymentMethodDetails {
        if (type === PaymentMethodTypeEnum.CREDIT_CARD ||
            type === PaymentMethodTypeEnum.DEBIT_CARD ||
            type === PaymentMethodTypeEnum.MADA) {
            return CardDetails.create(data);
        }

        if (type === PaymentMethodTypeEnum.WALLET ||
            type === PaymentMethodTypeEnum.APPLE_PAY ||
            type === PaymentMethodTypeEnum.GOOGLE_PAY) {
            return WalletDetails.create(data);
        }

        if (type === PaymentMethodTypeEnum.BANK_TRANSFER) {
            return BankTransferDetails.create(data);
        }

        throw new Error(`Unsupported payment method type: ${type}`);
    }

    static toJSON(details: PaymentMethodDetails): PaymentMethodDetailsJson {
        if (details instanceof CardDetails) {
            return {
                type: 'card',
                data: details.toJSON(),
            };
        }

        if (details instanceof WalletDetails) {
            return {
                type: 'wallet',
                data: details.toJSON(),
            };
        }

        if (details instanceof BankTransferDetails) {
            return {
                type: 'bank_transfer',
                data: details.toJSON(),
            };
        }

        throw new Error('Unknown payment method details type');
    }

    static fromJSON(json: PaymentMethodDetailsJson): PaymentMethodDetails {
        switch (json.type) {
            case 'card':
                return CardDetails.create(json.data as CardDetailsData);
            case 'wallet':
                return WalletDetails.create(json.data as WalletDetailsData);
            case 'bank_transfer':
                return BankTransferDetails.create(json.data as BankTransferDetailsData);
            default:
                throw new Error(`Unknown payment method type: ${json.type}`);
        }
    }
}

// ============================================
// PAYMENT NICKNAME
// ============================================
export class PaymentNickname {
    private constructor(private readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (this.value && this.value.length > 50) {
            throw new Error('Payment nickname cannot exceed 50 characters');
        }
    }

    static create(value?: string): PaymentNickname | undefined {
        if (!value || value.trim().length === 0) {
            return undefined;
        }
        return new PaymentNickname(value.trim());
    }

    getValue(): string {
        return this.value;
    }

    toString(): string {
        return this.value;
    }
}