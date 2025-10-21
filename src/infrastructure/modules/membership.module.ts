// ============================================
// MEMBERSHIP MODULE - COMPLETE
// infrastructure/modules/MembershipModule.ts
// ============================================

import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipController } from '../../interface/http/membership.controller';

// Repositories
import {
    PrismaMembershipRepository,
    PrismaMembershipTierRepository,
    PrismaMembershipPaymentRepository,
    PrismaMembershipCouponRepository,
    PrismaMembershipCouponRedemptionRepository,
    PrismaMembershipQuotaUsageRepository,
} from '../persistence/membership/prisma.repository';

// Use Cases
import {
    CreateMembershipUseCase,
    GetMembershipByIdUseCase,
    GetActiveMembershipByUserUseCase,
    CancelMembershipUseCase,
    RenewMembershipUseCase,
    ToggleAutoRenewUseCase,
    ApplyCouponUseCase,
    CheckQuotaUseCase,
    ConsumeQuotaUseCase,
    ListMembershipTiersUseCase,
    CreatePaymentUseCase,
    CompletePaymentUseCase,
} from '../../core/application/membership/use-cases/membership.use-cases';

@Module({
    controllers: [MembershipController],
    providers: [
        PrismaService,

        // ============================================
        // REPOSITORIES
        // ============================================
        {
            provide: 'IMembershipRepository',
            useClass: PrismaMembershipRepository,
        },
        {
            provide: 'IMembershipTierRepository',
            useClass: PrismaMembershipTierRepository,
        },
        {
            provide: 'IMembershipPaymentRepository',
            useClass: PrismaMembershipPaymentRepository,
        },
        {
            provide: 'IMembershipCouponRepository',
            useClass: PrismaMembershipCouponRepository,
        },
        {
            provide: 'IMembershipCouponRedemptionRepository',
            useClass: PrismaMembershipCouponRedemptionRepository,
        },
        {
            provide: 'IMembershipQuotaUsageRepository',
            useClass: PrismaMembershipQuotaUsageRepository,
        },

        // ============================================
        // USE CASES
        // ============================================
        CreateMembershipUseCase,
        GetMembershipByIdUseCase,
        GetActiveMembershipByUserUseCase,
        CancelMembershipUseCase,
        RenewMembershipUseCase,
        ToggleAutoRenewUseCase,
        ApplyCouponUseCase,
        CheckQuotaUseCase,
        ConsumeQuotaUseCase,
        ListMembershipTiersUseCase,
        CreatePaymentUseCase,
        CompletePaymentUseCase,
    ],
    exports: [
        'IMembershipRepository',
        'IMembershipTierRepository',
        'IMembershipQuotaUsageRepository',
        GetActiveMembershipByUserUseCase,
        CheckQuotaUseCase,
        ConsumeQuotaUseCase,
    ],
})
export class MembershipModule { }
