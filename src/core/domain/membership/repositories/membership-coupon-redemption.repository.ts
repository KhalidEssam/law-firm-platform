import { MembershipCouponRedemption } from '../entities/membership-coupon-redemption.entity';

export interface IMembershipCouponRedemptionRepository {
  create(
    redemption: MembershipCouponRedemption,
  ): Promise<MembershipCouponRedemption>;
  hasUserRedeemedCoupon(
    membershipId: string,
    couponId: string,
  ): Promise<boolean>;
}
