
import { Module } from '@nestjs/common';
import { MembershipController } from '../../interface/http/membership.controller';
// import { CreateMembershipUseCase } from '../../core/application/membership/use-cases/create-membership.use-case';
// import { ApplyCouponUseCase } from '../../core/application/membership/use-cases/apply-coupon.use-case';
// import { CheckQuotaUseCase } from '../../core/application/membership/use-cases/check-quota.use-case';
// import { ConsumeQuotaUseCase } from '../../core/application/membership/use-cases/consume-quota.use-case';
import { CreateMembershipUseCase,
    ApplyCouponUseCase,
    CheckQuotaUseCase,
    ConsumeQuotaUseCase
 } from 'src/core/application/membership/use-cases/membership.use-cases';
import { PrismaMembershipRepository } from '../persistence/membership/prisma-membership.repository';
import { PrismaMembershipTierRepository } from '../persistence/membership/prisma-membership-tier.repository';
import { PrismaMembershipQuotaUsageRepository } from '../persistence/membership/prisma-membership-quota-usage.repository';
import { PrismaMembershipCouponRepository } from '../persistence/membership/prisma-membership-coupon.repository';
import { PrismaMembershipCouponRedemptionRepository } from '../persistence/membership/prisma-membership-coupon-redemption.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [MembershipController],
    providers: [
        PrismaService,
        CreateMembershipUseCase,
        ApplyCouponUseCase,
        CheckQuotaUseCase,
        ConsumeQuotaUseCase,
        {
            provide: 'IMembershipRepository',
            useClass: PrismaMembershipRepository,
        },
        {
            provide: 'IMembershipTierRepository',
            useClass: PrismaMembershipTierRepository,
        },
        {
            provide: 'IMembershipQuotaUsageRepository',
            useClass: PrismaMembershipQuotaUsageRepository,
        },
        {
            provide: 'IMembershipCouponRepository',
            useClass: PrismaMembershipCouponRepository,
        },
        {
            provide: 'IMembershipCouponRedemptionRepository',
            useClass: PrismaMembershipCouponRedemptionRepository,
        },
    ],
})
export class MembershipModule { }
