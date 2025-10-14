import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IMembershipCouponRepository } from '../../../core/domain/membership/repositories/membership-coupon.repository';
import { MembershipCoupon } from '../../../core/domain/membership/entities/membership-coupon.entity';

@Injectable()
export class PrismaMembershipCouponRepository implements IMembershipCouponRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByCode(code: string): Promise<MembershipCoupon | null> {
        const coupon = await this.prisma.membershipCoupon.findUnique({
            where: { code },
        });

        if (!coupon) return null;

        return MembershipCoupon.create({
            code: coupon.code,
            discountPercentage: coupon.discountType === 'percentage' ? coupon.discountValue : 0,
            validFrom: coupon.validFrom,
            validUntil: coupon.validUntil ?? new Date(),
            usageLimit: coupon.maxRedemptions ?? 0
        });
    }

    async update(coupon: MembershipCoupon): Promise<MembershipCoupon> {
        const updated = await this.prisma.membershipCoupon.update({
            where: { id: coupon.id },
            data: {
                currentRedemptions: coupon.usedCount,
                isActive: coupon.isActive,
            },
        });

        return MembershipCoupon.create({
            code: updated.code,
            discountPercentage: updated.discountType === 'percentage' ? updated.discountValue : 0,
            validFrom: updated.validFrom,
            validUntil: updated.validUntil ?? new Date(),
            usageLimit: updated.maxRedemptions ?? 0
        });
    }
}