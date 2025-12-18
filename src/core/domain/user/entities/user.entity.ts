import crypto from 'crypto';
import { Email } from '../value-objects/email.vo';
import { Username } from '../value-objects/username.vo';
import { City } from '../value-objects/city.vo';
import { Biography } from '../value-objects/biography.vo';
import { Profession } from '../value-objects/profession.vo';
import { UserPhoto } from '../value-objects/user-photo.vo';
import { UserAgeGroup } from '../value-objects/age-group.vo';
import { Nationality } from '../value-objects/nationality.vo';
import { UserEmploymentSector } from '../value-objects/employment-sector.vo';

// ============================================
// PROFILE STATUS ENUM
// ============================================
export enum ProfileStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    DEACTIVATED = 'deactivated',
}

// ============================================
// USER ENTITY
// ============================================
export interface UserProps {
    id: string;
    email: Email;
    username: Username;
    auth0Id?: string;
    nickname?: string;
    fullName?: string;
    gender?: string;
    city?: City;
    personalEmail?: string;
    emailVerified: boolean;
    mobileVerified: boolean;
    biography?: Biography;
    profession?: Profession;
    photo?: UserPhoto;
    ageGroup?: UserAgeGroup;
    nationality?: Nationality;
    employmentSector?: UserEmploymentSector;
    // Status & Tier
    profileStatus: ProfileStatus;
    loyaltyTier?: string;
    subscriptionTier?: string;
    // Balances
    pointsBalance: number;
    walletBalance: number;
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export class User {
    private constructor(private readonly props: UserProps) {}

    // ============================================
    // GETTERS
    // ============================================
    get id(): string { return this.props.id; }
    get email(): Email { return this.props.email; }
    get username(): Username { return this.props.username; }
    get auth0Id(): string | undefined { return this.props.auth0Id; }
    get nickname(): string | undefined { return this.props.nickname; }
    get fullName(): string | undefined { return this.props.fullName; }
    get gender(): string | undefined { return this.props.gender; }
    get city(): City | undefined { return this.props.city; }
    get personalEmail(): string | undefined { return this.props.personalEmail; }
    get emailVerified(): boolean { return this.props.emailVerified; }
    get mobileVerified(): boolean { return this.props.mobileVerified; }
    get biography(): Biography | undefined { return this.props.biography; }
    get profession(): Profession | undefined { return this.props.profession; }
    get photo(): UserPhoto | undefined { return this.props.photo; }
    get ageGroup(): UserAgeGroup | undefined { return this.props.ageGroup; }
    get nationality(): Nationality | undefined { return this.props.nationality; }
    get employmentSector(): UserEmploymentSector | undefined { return this.props.employmentSector; }
    get profileStatus(): ProfileStatus { return this.props.profileStatus; }
    get loyaltyTier(): string | undefined { return this.props.loyaltyTier; }
    get subscriptionTier(): string | undefined { return this.props.subscriptionTier; }
    get pointsBalance(): number { return this.props.pointsBalance; }
    get walletBalance(): number { return this.props.walletBalance; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }
    get deletedAt(): Date | undefined { return this.props.deletedAt; }

    // ============================================
    // FACTORY METHODS
    // ============================================

    /**
     * Create a new User
     */
    static create(props: {
        email: Email;
        username: Username;
        auth0Id?: string;
        nickname?: string;
        fullName?: string;
        gender?: string;
        city?: City;
        personalEmail?: string;
        emailVerified?: boolean;
        mobileVerified?: boolean;
        biography?: Biography;
        profession?: Profession;
        photo?: UserPhoto;
        ageGroup?: UserAgeGroup;
        nationality?: Nationality;
        employmentSector?: UserEmploymentSector;
        profileStatus?: ProfileStatus;
        loyaltyTier?: string;
        subscriptionTier?: string;
        pointsBalance?: number;
        walletBalance?: number;
    }): User {
        const now = new Date();
        return new User({
            id: crypto.randomUUID(),
            email: props.email,
            username: props.username,
            auth0Id: props.auth0Id,
            nickname: props.nickname,
            fullName: props.fullName,
            gender: props.gender,
            city: props.city,
            personalEmail: props.personalEmail,
            emailVerified: props.emailVerified ?? false,
            mobileVerified: props.mobileVerified ?? false,
            biography: props.biography,
            profession: props.profession,
            photo: props.photo,
            ageGroup: props.ageGroup,
            nationality: props.nationality,
            employmentSector: props.employmentSector,
            profileStatus: props.profileStatus ?? ProfileStatus.PENDING,
            loyaltyTier: props.loyaltyTier,
            subscriptionTier: props.subscriptionTier,
            pointsBalance: props.pointsBalance ?? 0,
            walletBalance: props.walletBalance ?? 0,
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Reconstitute from persistence
     */
    static reconstitute(props: UserProps): User {
        return new User(props);
    }

    // ============================================
    // DOMAIN BEHAVIORS - Profile Updates
    // ============================================

    /**
     * Update profile information (returns new immutable instance)
     */
    updateProfile(data: {
        nickname?: string;
        fullName?: string;
        gender?: string;
        city?: City;
        personalEmail?: string;
        biography?: Biography;
        profession?: Profession;
        photo?: UserPhoto;
        ageGroup?: UserAgeGroup;
        nationality?: Nationality;
        employmentSector?: UserEmploymentSector;
    }): User {
        return new User({
            ...this.props,
            nickname: data.nickname ?? this.props.nickname,
            fullName: data.fullName ?? this.props.fullName,
            gender: data.gender ?? this.props.gender,
            city: data.city ?? this.props.city,
            personalEmail: data.personalEmail ?? this.props.personalEmail,
            biography: data.biography ?? this.props.biography,
            profession: data.profession ?? this.props.profession,
            photo: data.photo ?? this.props.photo,
            ageGroup: data.ageGroup ?? this.props.ageGroup,
            nationality: data.nationality ?? this.props.nationality,
            employmentSector: data.employmentSector ?? this.props.employmentSector,
            updatedAt: new Date(),
        });
    }

    // ============================================
    // DOMAIN BEHAVIORS - Status Management
    // ============================================

    /**
     * Activate the user account
     */
    activate(): User {
        if (this.props.profileStatus === ProfileStatus.ACTIVE) {
            throw new Error('User is already active');
        }
        return new User({
            ...this.props,
            profileStatus: ProfileStatus.ACTIVE,
            updatedAt: new Date(),
        });
    }

    /**
     * Suspend the user account
     */
    suspend(): User {
        if (this.props.profileStatus === ProfileStatus.SUSPENDED) {
            throw new Error('User is already suspended');
        }
        return new User({
            ...this.props,
            profileStatus: ProfileStatus.SUSPENDED,
            updatedAt: new Date(),
        });
    }

    /**
     * Deactivate the user account
     */
    deactivate(): User {
        if (this.props.profileStatus === ProfileStatus.DEACTIVATED) {
            throw new Error('User is already deactivated');
        }
        return new User({
            ...this.props,
            profileStatus: ProfileStatus.DEACTIVATED,
            updatedAt: new Date(),
        });
    }

    /**
     * Change profile status
     */
    changeStatus(status: ProfileStatus): User {
        return new User({
            ...this.props,
            profileStatus: status,
            updatedAt: new Date(),
        });
    }

    // ============================================
    // DOMAIN BEHAVIORS - Verification
    // ============================================

    /**
     * Mark email as verified
     */
    verifyEmail(): User {
        if (this.props.emailVerified) {
            throw new Error('Email is already verified');
        }
        return new User({
            ...this.props,
            emailVerified: true,
            updatedAt: new Date(),
        });
    }

    /**
     * Mark mobile as verified
     */
    verifyMobile(): User {
        if (this.props.mobileVerified) {
            throw new Error('Mobile is already verified');
        }
        return new User({
            ...this.props,
            mobileVerified: true,
            updatedAt: new Date(),
        });
    }

    // ============================================
    // DOMAIN BEHAVIORS - Balance Management
    // ============================================

    /**
     * Add points to user's balance
     */
    addPoints(points: number): User {
        if (points < 0) {
            throw new Error('Points cannot be negative');
        }
        return new User({
            ...this.props,
            pointsBalance: this.props.pointsBalance + points,
            updatedAt: new Date(),
        });
    }

    /**
     * Deduct points from user's balance
     */
    deductPoints(points: number): User {
        if (points < 0) {
            throw new Error('Points cannot be negative');
        }
        if (points > this.props.pointsBalance) {
            throw new Error('Insufficient points balance');
        }
        return new User({
            ...this.props,
            pointsBalance: this.props.pointsBalance - points,
            updatedAt: new Date(),
        });
    }

    /**
     * Add funds to wallet
     */
    addWalletFunds(amount: number): User {
        if (amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        return new User({
            ...this.props,
            walletBalance: this.props.walletBalance + amount,
            updatedAt: new Date(),
        });
    }

    /**
     * Deduct funds from wallet
     */
    deductWalletFunds(amount: number): User {
        if (amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        if (amount > this.props.walletBalance) {
            throw new Error('Insufficient wallet balance');
        }
        return new User({
            ...this.props,
            walletBalance: this.props.walletBalance - amount,
            updatedAt: new Date(),
        });
    }

    // ============================================
    // DOMAIN BEHAVIORS - Tier Management
    // ============================================

    /**
     * Update loyalty tier
     */
    updateLoyaltyTier(tier: string): User {
        return new User({
            ...this.props,
            loyaltyTier: tier,
            updatedAt: new Date(),
        });
    }

    /**
     * Update subscription tier
     */
    updateSubscriptionTier(tier: string): User {
        return new User({
            ...this.props,
            subscriptionTier: tier,
            updatedAt: new Date(),
        });
    }

    // ============================================
    // DOMAIN BEHAVIORS - Soft Delete
    // ============================================

    /**
     * Soft delete the user
     */
    softDelete(): User {
        if (this.props.deletedAt) {
            throw new Error('User is already deleted');
        }
        return new User({
            ...this.props,
            deletedAt: new Date(),
            updatedAt: new Date(),
        });
    }

    /**
     * Restore a soft-deleted user
     */
    restore(): User {
        if (!this.props.deletedAt) {
            throw new Error('User is not deleted');
        }
        return new User({
            ...this.props,
            deletedAt: undefined,
            updatedAt: new Date(),
        });
    }

    // ============================================
    // QUERY METHODS
    // ============================================

    isActive(): boolean {
        return this.props.profileStatus === ProfileStatus.ACTIVE;
    }

    isSuspended(): boolean {
        return this.props.profileStatus === ProfileStatus.SUSPENDED;
    }

    isPending(): boolean {
        return this.props.profileStatus === ProfileStatus.PENDING;
    }

    isDeactivated(): boolean {
        return this.props.profileStatus === ProfileStatus.DEACTIVATED;
    }

    isDeleted(): boolean {
        return this.props.deletedAt !== undefined;
    }

    isVerified(): boolean {
        return this.props.emailVerified && this.props.mobileVerified;
    }

    hasWalletFunds(amount: number): boolean {
        return this.props.walletBalance >= amount;
    }

    hasPoints(points: number): boolean {
        return this.props.pointsBalance >= points;
    }

    // ============================================
    // SERIALIZATION
    // ============================================

    toObject(): UserProps {
        return { ...this.props };
    }
}
