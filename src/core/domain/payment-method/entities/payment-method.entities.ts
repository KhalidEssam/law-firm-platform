// ============================================
// PAYMENT METHOD ENTITY
// Aggregate Root with Business Logic
// ============================================

import {
    PaymentMethodId,
    UserId,
    PaymentMethodType,
    PaymentMethodDetails,
    PaymentMethodDetailsFactory,
    CardDetails,
    WalletDetails,
    BankTransferDetails,
    PaymentNickname,
} from '../value-objects/payment-method.vo';

export interface PaymentMethodProps {
    id: PaymentMethodId;
    userId: UserId;
    type: PaymentMethodType;
    details: PaymentMethodDetails;
    nickname?: PaymentNickname;
    isDefault: boolean;
    isVerified: boolean;
    isActive: boolean;
    lastUsedAt?: Date;
    failedAttempts: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

/**
 * PaymentMethod Aggregate Root
 * 
 * Represents a user's saved payment method
 * Contains business rules for payment method management
 * 
 * Business Rules:
 * - User can only have one default payment method
 * - Card must not be expired
 * - Failed attempts tracked (max 3 before blocking)
 * - Sensitive data must be stored securely (tokenized)
 * - Cannot delete default payment method if it's the only one
 * - Verification required before use
 */
export class PaymentMethod {
    private constructor(private readonly props: PaymentMethodProps) {
        this.validate();
    }

    // ============================================
    // FACTORY METHODS
    // ============================================

    /**
     * Create new payment method
     */
    static create(props: Omit<PaymentMethodProps, 'id' | 'isDefault' | 'isVerified' | 'isActive' | 'failedAttempts' | 'createdAt' | 'updatedAt'>): PaymentMethod {
        const now = new Date();

        return new PaymentMethod({
            ...props,
            id: PaymentMethodId.create(),
            isDefault: false,
            isVerified: false,
            isActive: true,
            failedAttempts: 0,
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Reconstitute from database
     */
    static reconstitute(props: PaymentMethodProps): PaymentMethod {
        return new PaymentMethod(props);
    }

    // ============================================
    // VALIDATION
    // ============================================

    private validate(): void {
        // Card expiration validation
        if (this.props.details instanceof CardDetails) {
            if (this.props.details.isExpired()) {
                throw new Error('Payment method card is expired');
            }
        }

        // Failed attempts limit
        if (this.props.failedAttempts >= 3) {
            throw new Error('Payment method has exceeded maximum failed attempts');
        }

        // Cannot be default if not verified
        if (this.props.isDefault && !this.props.isVerified) {
            throw new Error('Unverified payment method cannot be set as default');
        }

        // Cannot be default if not active
        if (this.props.isDefault && !this.props.isActive) {
            throw new Error('Inactive payment method cannot be set as default');
        }
    }

    // ============================================
    // GETTERS
    // ============================================

    get id(): PaymentMethodId {
        return this.props.id;
    }

    get userId(): UserId {
        return this.props.userId;
    }

    get type(): PaymentMethodType {
        return this.props.type;
    }

    get details(): PaymentMethodDetails {
        return this.props.details;
    }

    get nickname(): PaymentNickname | undefined {
        return this.props.nickname;
    }

    get isDefault(): boolean {
        return this.props.isDefault;
    }

    get isVerified(): boolean {
        return this.props.isVerified;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get lastUsedAt(): Date | undefined {
        return this.props.lastUsedAt;
    }

    get failedAttempts(): number {
        return this.props.failedAttempts;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    get deletedAt(): Date | undefined {
        return this.props.deletedAt;
    }

    // ============================================
    // BUSINESS LOGIC - Payment Method Management
    // ============================================

    /**
     * Set as default payment method
     */
    setAsDefault(): void {
        if (!this.props.isVerified) {
            throw new Error('Cannot set unverified payment method as default');
        }

        if (!this.props.isActive) {
            throw new Error('Cannot set inactive payment method as default');
        }

        this.props.isDefault = true;
        this.props.updatedAt = new Date();
    }

    /**
     * Remove default status
     */
    removeDefault(): void {
        this.props.isDefault = false;
        this.props.updatedAt = new Date();
    }

    /**
     * Verify payment method
     */
    verify(): void {
        if (this.props.isVerified) {
            throw new Error('Payment method is already verified');
        }

        // Reset failed attempts on successful verification
        this.props.isVerified = true;
        this.props.failedAttempts = 0;
        this.props.updatedAt = new Date();
    }

    /**
     * Mark payment method as used
     */
    markAsUsed(): void {
        if (!this.props.isVerified) {
            throw new Error('Cannot use unverified payment method');
        }

        if (!this.props.isActive) {
            throw new Error('Cannot use inactive payment method');
        }

        if (this.props.details instanceof CardDetails && this.props.details.isExpired()) {
            throw new Error('Cannot use expired card');
        }

        this.props.lastUsedAt = new Date();
        this.props.updatedAt = new Date();
    }

    /**
     * Record failed payment attempt
     */
    recordFailedAttempt(): void {
        this.props.failedAttempts += 1;
        this.props.updatedAt = new Date();

        // Auto-deactivate after 3 failed attempts
        if (this.props.failedAttempts >= 3) {
            this.deactivate();
        }
    }

    /**
     * Reset failed attempts
     */
    resetFailedAttempts(): void {
        this.props.failedAttempts = 0;
        this.props.updatedAt = new Date();
    }

    /**
     * Activate payment method
     */
    activate(): void {
        if (this.props.isActive) {
            throw new Error('Payment method is already active');
        }

        // Reset failed attempts when reactivating
        this.props.isActive = true;
        this.props.failedAttempts = 0;
        this.props.updatedAt = new Date();
    }

    /**
     * Deactivate payment method
     */
    deactivate(): void {
        if (!this.props.isActive) {
            throw new Error('Payment method is already inactive');
        }

        // Remove default status if deactivating
        if (this.props.isDefault) {
            this.props.isDefault = false;
        }

        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }

    /**
     * Update nickname
     */
    updateNickname(nickname?: string): void {
        this.props.nickname = PaymentNickname.create(nickname);
        this.props.updatedAt = new Date();
    }

    /**
     * Update card details (for expired card renewal)
     */
    updateCardDetails(newDetails: CardDetails): void {
        if (!(this.props.details instanceof CardDetails)) {
            throw new Error('Cannot update card details on non-card payment method');
        }

        if (newDetails.isExpired()) {
            throw new Error('Cannot update to expired card');
        }

        this.props.details = newDetails;
        this.props.isVerified = false; // Require re-verification
        this.props.failedAttempts = 0;
        this.props.updatedAt = new Date();
    }

    /**
     * Soft delete
     */
    softDelete(): void {
        if (this.props.isDefault) {
            throw new Error('Cannot delete default payment method. Please set another payment method as default first.');
        }

        this.props.isActive = false;
        this.props.deletedAt = new Date();
        this.props.updatedAt = new Date();
    }

    /**
     * Restore deleted payment method
     */
    restore(): void {
        if (!this.props.deletedAt) {
            throw new Error('Payment method is not deleted');
        }

        this.props.deletedAt = undefined;
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }

    // ============================================
    // QUERY METHODS
    // ============================================

    /**
     * Check if payment method can be used
     */
    canBeUsed(): boolean {
        if (!this.props.isVerified) return false;
        if (!this.props.isActive) return false;
        if (this.props.deletedAt) return false;
        if (this.props.failedAttempts >= 3) return false;

        if (this.props.details instanceof CardDetails) {
            if (this.props.details.isExpired()) return false;
        }

        return true;
    }

    /**
     * Check if card is expiring soon (within 30 days)
     */
    isExpiringSoon(): boolean {
        if (!(this.props.details instanceof CardDetails)) return false;

        const details = this.props.details as CardDetails;
        const data = details.getData();

        if (!data.expiryMonth || !data.expiryYear) return false;

        const expiryDate = new Date(
            parseInt(data.expiryYear),
            parseInt(data.expiryMonth) - 1,
            1
        );

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
    }

    /**
     * Check if this is a card payment method
     */
    isCard(): boolean {
        return this.props.type.isCard();
    }

    /**
     * Check if this is a digital wallet
     */
    isDigitalWallet(): boolean {
        return this.props.type.isDigitalWallet();
    }

    /**
     * Check if this is Mada card (Saudi local card)
     */
    isMada(): boolean {
        return this.props.type.isMada();
    }

    /**
     * Check if payment method is deleted
     */
    isDeleted(): boolean {
        return this.props.deletedAt !== undefined;
    }

    /**
     * Get display name for payment method
     */
    getDisplayName(): string {
        if (this.props.nickname) {
            return this.props.nickname.getValue();
        }

        if (this.props.details instanceof CardDetails) {
            return `Card ending in ${this.props.details.getLastFourDigits()}`;
        }

        if (this.props.details instanceof WalletDetails) {
            return `${this.props.details.getProvider()} Wallet`;
        }

        if (this.props.details instanceof BankTransferDetails) {
            const data = this.props.details.getData();
            return `${data.bankName || 'Bank'} Account`;
        }

        return 'Payment Method';
    }

    /**
     * Get masked details for display
     */
    getMaskedDetails(): string {
        if (this.props.details instanceof CardDetails) {
            return this.props.details.getMaskedNumber();
        }

        if (this.props.details instanceof BankTransferDetails) {
            return this.props.details.getMaskedAccountNumber();
        }

        return 'Payment Method';
    }

    // ============================================
    // SERIALIZATION
    // ============================================

    /**
     * Convert to JSON for API response
     */
    toJSON(): any {
        return {
            id: this.props.id.getValue(),
            userId: this.props.userId.getValue(),
            type: this.props.type.getValue(),
            details: PaymentMethodDetailsFactory.toJSON(this.props.details),
            nickname: this.props.nickname?.getValue(),
            displayName: this.getDisplayName(),
            maskedDetails: this.getMaskedDetails(),
            isDefault: this.props.isDefault,
            isVerified: this.props.isVerified,
            isActive: this.props.isActive,
            canBeUsed: this.canBeUsed(),
            isExpiringSoon: this.isExpiringSoon(),
            lastUsedAt: this.props.lastUsedAt?.toISOString(),
            failedAttempts: this.props.failedAttempts,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
            deletedAt: this.props.deletedAt?.toISOString(),
        };
    }
}