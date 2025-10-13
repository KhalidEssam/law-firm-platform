import crypto from 'crypto';

export class MembershipCouponRedemption {
    private constructor(
        public readonly id: string,
        public readonly membershipId: string,
        public readonly couponId: string,
        public readonly redeemedAt: Date,
    ) { }

    static create(props: { membershipId: string; couponId: string }): MembershipCouponRedemption {
        return new MembershipCouponRedemption(
            crypto.randomUUID(),
            props.membershipId,
            props.couponId,
            new Date(),
        );
    }
}
