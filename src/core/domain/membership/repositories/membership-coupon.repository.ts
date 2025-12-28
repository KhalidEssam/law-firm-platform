import { MembershipCoupon } from '../entities/membership-coupon.entity';

export interface IMembershipCouponRepository {
  findByCode(code: string): Promise<MembershipCoupon | null>;
  update(coupon: MembershipCoupon): Promise<MembershipCoupon>;
}
