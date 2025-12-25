// ============================================
// MEMBERSHIP UNIT OF WORK INTERFACE
// src/core/domain/membership/ports/membership.uow.ts
// ============================================

import { IBaseUnitOfWork } from '../../shared/ports/base-unit-of-work.interface';
import {
    IMembershipRepository,
    IMembershipTierRepository,
    IMembershipCouponRepository,
    IMembershipCouponRedemptionRepository,
    IMembershipQuotaUsageRepository,
} from '../../../application/membership/ports/repository';

/**
 * Unit of Work interface for Membership domain.
 *
 * Provides atomic transaction support for membership operations that involve
 * multiple entities, such as:
 * - Quota consumption (read-check-update with race condition prevention)
 * - Coupon redemption (validation + redemption record + usage increment)
 * - Membership tier changes (membership update + change log)
 *
 * @example
 * ```typescript
 * // Consuming quota atomically with race condition prevention
 * await membershipUow.transaction(async (uow) => {
 *   const membership = await uow.memberships.findById(membershipId);
 *   const tier = await uow.tiers.findById(membership.tierId);
 *
 *   // Within transaction, quota check is atomic
 *   const quota = await uow.quotaUsage.findCurrentByMembership(membershipId);
 *   if (quota.getUsage(resource) + amount > tier.getQuotaLimit(resource)) {
 *     throw new Error('Quota exceeded');
 *   }
 *
 *   await uow.quotaUsage.incrementUsage(membershipId, resource, amount);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Redeeming a coupon atomically
 * await membershipUow.transaction(async (uow) => {
 *   const coupon = await uow.coupons.findByCode(code);
 *
 *   // Check already redeemed within transaction
 *   const alreadyRedeemed = await uow.redemptions.hasUserRedeemedCoupon(
 *     membershipId,
 *     coupon.id,
 *   );
 *   if (alreadyRedeemed) {
 *     throw new Error('Coupon already redeemed');
 *   }
 *
 *   // Create redemption record and increment usage atomically
 *   await uow.redemptions.create(redemption);
 *   await uow.coupons.incrementUsage(coupon.id);
 * });
 * ```
 */
export interface IMembershipUnitOfWork extends IBaseUnitOfWork<IMembershipUnitOfWork> {
    /**
     * Repository for membership operations within the transaction.
     */
    readonly memberships: IMembershipRepository;

    /**
     * Repository for membership tier operations within the transaction.
     * Used to check quota limits and tier validation.
     */
    readonly tiers: IMembershipTierRepository;

    /**
     * Repository for coupon operations within the transaction.
     */
    readonly coupons: IMembershipCouponRepository;

    /**
     * Repository for coupon redemption operations within the transaction.
     * Critical for preventing duplicate redemptions.
     */
    readonly redemptions: IMembershipCouponRedemptionRepository;

    /**
     * Repository for quota usage operations within the transaction.
     * Critical for preventing race conditions in quota consumption.
     */
    readonly quotaUsage: IMembershipQuotaUsageRepository;
}

/**
 * DI token for IMembershipUnitOfWork injection.
 */
export const MEMBERSHIP_UNIT_OF_WORK = Symbol('IMembershipUnitOfWork');
