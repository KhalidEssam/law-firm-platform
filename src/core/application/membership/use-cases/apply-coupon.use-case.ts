// src/core/application/use-cases/apply-coupon.use-case.ts

import { IMembershipRepository } from "../../../domain/membership/repositories/membership.repository";
import { IMembershipCouponRepository } from '../../../domain/membership/repositories/membership-coupon.repository';
import { IMembershipCouponRedemptionRepository } from '../../../domain/membership/repositories/membership-coupon-redemption.repository';
import { MembershipCouponRedemption } from '../../../domain/membership/entities/membership-coupon-redemption.entity';

export class ApplyCouponUseCase {
    constructor(
        private readonly membershipRepo: IMembershipRepository,
        private readonly couponRepo: IMembershipCouponRepository,
        private readonly redemptionRepo: IMembershipCouponRedemptionRepository,
    ) { }

    async execute(membershipId: string, couponCode: string): Promise<{ discountAmount: number }> {
        // 1️⃣ Find membership
        const membership = await this.membershipRepo.findByUserId(membershipId);
        if (!membership) {
            throw new Error('Membership not found');
        }

        // 2️⃣ Find coupon by code
        const coupon = await this.couponRepo.findByCode(couponCode);
        if (!coupon) {
            throw new Error('Coupon not found');
        }

        // 3️⃣ Check if coupon is valid
        const validation = coupon.canBeRedeemed();
        if (!validation.valid) {
            throw new Error(validation.reason || 'Coupon is invalid');
        }

        // 4️⃣ Check if user already redeemed this coupon
        const alreadyRedeemed = await this.redemptionRepo.hasUserRedeemedCoupon(
            membership.id,
            coupon.id,
        );
        if (alreadyRedeemed) {
            throw new Error('You have already used this coupon');
        }

        // 5️⃣ Calculate discount (assuming tier price is available)
        // You may need to fetch tier details for actual price
        const discountAmount = coupon.calculateDiscount(100); // Replace with actual price

        // 6️⃣ Create redemption record
        const redemption = MembershipCouponRedemption.create({
            couponId: coupon.id,
            membershipId: membership.id,
        });
        await this.redemptionRepo.create(redemption);

        // 7️⃣ Increment coupon redemption count
        const updatedCoupon = coupon.incrementRedemptions();
        await this.couponRepo.update(updatedCoupon);

        return { discountAmount };
    }
}