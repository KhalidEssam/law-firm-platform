import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IMembershipCouponRedemptionRepository } from '../../../core/domain/membership/repositories/membership-coupon-redemption.repository';
import { MembershipCouponRedemption } from '../../../core/domain/membership/entities/membership-coupon-redemption.entity';

@Injectable()
export class PrismaMembershipCouponRedemptionRepository
  implements IMembershipCouponRedemptionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    redemption: MembershipCouponRedemption,
  ): Promise<MembershipCouponRedemption> {
    // Get the coupon details first to calculate the discount amount
    const coupon = await this.prisma.membershipCoupon.findUnique({
      where: { id: redemption.couponId },
    });

    if (!coupon) throw new Error('Coupon not found');

    // Create the redemption record
    const created = await this.prisma.membershipCouponRedemption.create({
      data: {
        id: redemption.id,
        couponId: redemption.couponId,
        membershipId: redemption.membershipId,
        redeemedAt: redemption.redeemedAt,
        discountAmount: 0, // This will be updated later when applying to invoice
      },
    });

    // Increment the currentRedemptions counter on the coupon
    await this.prisma.membershipCoupon.update({
      where: { id: redemption.couponId },
      data: {
        currentRedemptions: {
          increment: 1,
        },
      },
    });

    return MembershipCouponRedemption.create({
      membershipId: created.membershipId,
      couponId: created.couponId,
    });
  }

  async hasUserRedeemedCoupon(
    membershipId: string,
    couponId: string,
  ): Promise<boolean> {
    const redemption = await this.prisma.membershipCouponRedemption.findFirst({
      where: {
        membershipId,
        couponId,
      },
    });

    return !!redemption;
  }
}
