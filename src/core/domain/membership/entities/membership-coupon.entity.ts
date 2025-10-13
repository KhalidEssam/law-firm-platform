import crypto from 'crypto';

export class MembershipCoupon {
    private constructor(
        public readonly id: string,
        public readonly code: string,
        public readonly discountPercentage: number,
        public readonly validFrom: Date,
        public readonly validUntil: Date,
        public readonly usageLimit: number,
        public readonly usedCount: number,
        public readonly isActive: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        code: string;
        discountPercentage: number;
        validFrom: Date;
        validUntil: Date;
        usageLimit: number;
    }): MembershipCoupon {
        return new MembershipCoupon(
            crypto.randomUUID(),
            props.code,
            props.discountPercentage,
            props.validFrom,
            props.validUntil,
            props.usageLimit,
            0,
            true,
            new Date(),
            new Date(),
        );
    }

    incrementUsage(): MembershipCoupon {
        return new MembershipCoupon(
            this.id,
            this.code,
            this.discountPercentage,
            this.validFrom,
            this.validUntil,
            this.usageLimit,
            this.usedCount + 1,
            this.isActive,
            this.createdAt,
            new Date(),
        );
    }

    isValid(): boolean {
        const now = new Date();
        return (
            this.isActive &&
            this.usedCount < this.usageLimit &&
            now >= this.validFrom &&
            now <= this.validUntil
        );
    }
    canBeRedeemed(): { valid: boolean; reason?: string } {
        const now = new Date();

        if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
        if (now < this.validFrom) return { valid: false, reason: 'Coupon not yet valid' };
        if (now > this.validUntil) return { valid: false, reason: 'Coupon expired' };
        if (this.usedCount >= this.usageLimit) return { valid: false, reason: 'Usage limit reached' };

        return { valid: true };
    }

    calculateDiscount(originalPrice: number): number {
        if (this.discountPercentage <= 0) return 0;
        return (originalPrice * this.discountPercentage) / 100;
    }

    incrementRedemptions(): MembershipCoupon {
        return new MembershipCoupon(
            this.id,
            this.code,
            this.discountPercentage,
            this.validFrom,
            this.validUntil,
            this.usageLimit,
            this.usedCount + 1,
            this.isActive,
            this.createdAt,
            new Date(),
        );
    }

}
