// ============================================
// USER REPOSITORY INTERFACE (PORT)
// domain/repositories/IUserRepository.ts
// ============================================

import { User } from '../entities/user.entity';

/**
 * User Repository Interface
 * Defines all operations for user persistence
 */
export interface IUserRepository {
    // ============================================
    // CREATE
    // ============================================
    /**
     * Create a new user
     * @param user - User entity to create
     * @returns Created user entity
     */
    create(user: User): Promise<User>;

    // ============================================
    // READ
    // ============================================
    /**
     * Find user by ID
     * @param id - User ID
     * @returns User entity or null if not found
     */
    findById(id: string): Promise<User | null>;

    /**
     * Find user by Auth0 ID
     * @param auth0Id - Auth0 ID
     * @returns User entity or null if not found
     */
    findByAuth0Id(auth0Id: string): Promise<User | null>;

    /**
     * Find user by email
     * @param email - Email address
     * @returns User entity or null if not found
     */
    findByEmail(email: string): Promise<User | null>;

    /**
     * Find user by username
     * @param username - Username
     * @returns User entity or null if not found
     */
    findByUsername(username: string): Promise<User | null>;

    /**
     * Check if email exists
     * @param email - Email to check
     * @returns True if email exists
     */
    emailExists(email: string): Promise<boolean>;

    /**
     * Check if username exists
     * @param username - Username to check
     * @returns True if username exists
     */
    usernameExists(username: string): Promise<boolean>;

    /**
     * List users with pagination and filters
     * @param options - Query options
     * @returns Array of users
     */
    list(options?: {
        limit?: number;
        offset?: number;
        emailVerified?: boolean;
        mobileVerified?: boolean;
        gender?: string;
        city?: string;
        nationality?: string;
        ageGroup?: string;
        includeDeleted?: boolean;
    }): Promise<User[]>;

    /**
     * Count users with filters
     * @param options - Filter options
     * @returns Total count
     */
    count(options?: {
        emailVerified?: boolean;
        mobileVerified?: boolean;
        gender?: string;
        city?: string;
        nationality?: string;
        ageGroup?: string;
        includeDeleted?: boolean;
    }): Promise<number>;

    // ============================================
    // UPDATE
    // ============================================
    /**
     * Update user profile
     * @param user - User entity with updated data
     * @returns Updated user entity
     */
    update(user: User): Promise<User>;

    /**
     * Verify user email
     * @param userId - User ID
     * @returns Updated user entity
     */
    verifyEmail(userId: string): Promise<User>;

    /**
     * Verify user mobile
     * @param userId - User ID
     * @returns Updated user entity
     */
    verifyMobile(userId: string): Promise<User>;

    /**
     * Update profile status
     * @param userId - User ID
     * @param status - New status
     * @returns Updated user entity
     */
    updateProfileStatus(userId: string, status: string): Promise<User>;

    // ============================================
    // DELETE
    // ============================================
    /**
     * Soft delete user
     * @param userId - User ID
     * @returns Deleted user entity
     */
    softDelete(userId: string): Promise<User>;

    /**
     * Hard delete user (permanent)
     * @param userId - User ID
     * @returns void
     */
    delete(userId: string): Promise<void>;

    /**
     * Restore soft deleted user
     * @param userId - User ID
     * @returns Restored user entity
     */
    restore(userId: string): Promise<User>;

    // ============================================
    // SEARCH
    // ============================================
    /**
     * Search users by query
     * @param query - Search query
     * @param options - Search options
     * @returns Array of matching users
     */
    search(
        query: string,
        options?: {
            limit?: number;
            offset?: number;
            fields?: ('email' | 'username' | 'fullName')[];
        }
    ): Promise<User[]>;
}


export interface IUserFilters {
    ageGroup?: string;
    employmentSector?: string;
    nationality?: string;
    profession?: string;
}

export interface IPaginationOptions {
    page?: number;
    limit?: number;
}

export interface IPaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}