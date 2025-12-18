// ============================================
// OTP REPOSITORY INTERFACE (PORT)
// src/core/domain/user/ports/otp.repository.ts
// ============================================

/**
 * OTP Data structure
 */
export interface OtpData {
    userId: string;
    phoneNumber: string;
    otpCode: string;
    expiresAt: Date;
    isVerified: boolean;
}

/**
 * OTP Repository Interface
 * Manages OTP storage using UserPhoneNumber model
 */
export interface IOtpRepository {
    /**
     * Store OTP for a phone number
     * @param userId - User ID
     * @param phoneNumber - Phone number
     * @param otpCode - Generated OTP code
     * @param expiresAt - Expiration timestamp
     */
    storeOtp(userId: string, phoneNumber: string, otpCode: string, expiresAt: Date): Promise<void>;

    /**
     * Get OTP data for a phone number
     * @param userId - User ID
     * @param phoneNumber - Phone number
     * @returns OTP data or null if not found
     */
    getOtp(userId: string, phoneNumber: string): Promise<OtpData | null>;

    /**
     * Verify OTP and mark phone as verified if successful
     * @param userId - User ID
     * @param phoneNumber - Phone number
     * @param otpCode - OTP code to verify
     * @returns True if OTP is valid and not expired
     */
    verifyOtp(userId: string, phoneNumber: string, otpCode: string): Promise<boolean>;

    /**
     * Clear OTP after successful verification
     * @param userId - User ID
     * @param phoneNumber - Phone number
     */
    clearOtp(userId: string, phoneNumber: string): Promise<void>;

    /**
     * Check if a phone number exists for a user
     * @param userId - User ID
     * @param phoneNumber - Phone number
     */
    phoneExists(userId: string, phoneNumber: string): Promise<boolean>;

    /**
     * Add phone number for user if not exists
     * @param userId - User ID
     * @param phoneNumber - Phone number
     */
    addPhoneNumber(userId: string, phoneNumber: string): Promise<void>;
}

export const IOtpRepository = Symbol('IOtpRepository');
