// ============================================
// MEMBERSHIP MODULE - COMPLETE
// infrastructure/modules/MembershipModule.ts
// ============================================

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module'; // 👈 Import PrismaModule instead of PrismaService
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
    CreateMembershipTierUseCase,
    UpdateMembershipTierUseCase,
    DeleteMembershipTierUseCase,
    GetMembershipTierByIdUseCase,
} from '../../core/application/membership/use-cases/membership.use-cases';

@Module({
    imports: [
        PrismaModule, // 👈 Import PrismaModule to get PrismaService
    ],
    controllers: [MembershipController],
    providers: [
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
        // MEMBERSHIP USE CASES
        // ============================================
        CreateMembershipUseCase,
        GetMembershipByIdUseCase,
        GetActiveMembershipByUserUseCase,
        CancelMembershipUseCase,
        RenewMembershipUseCase,
        ToggleAutoRenewUseCase,

        // ============================================
        // COUPON USE CASES
        // ============================================
        ApplyCouponUseCase,

        // ============================================
        // QUOTA USE CASES
        // ============================================
        CheckQuotaUseCase,
        ConsumeQuotaUseCase,

        // ============================================
        // TIER USE CASES
        // ============================================
        CreateMembershipTierUseCase,
        UpdateMembershipTierUseCase,
        DeleteMembershipTierUseCase,
        GetMembershipTierByIdUseCase,
        ListMembershipTiersUseCase,

        // ============================================
        // PAYMENT USE CASES
        // ============================================
        CreatePaymentUseCase,
        CompletePaymentUseCase,
    ],
    exports: [
        // Export repositories for other modules to use
        'IMembershipRepository',
        'IMembershipTierRepository',
        'IMembershipQuotaUsageRepository',
        'IMembershipPaymentRepository', // 👈 Added
        'IMembershipCouponRepository', // 👈 Added

        // Export commonly used use cases
        GetActiveMembershipByUserUseCase,
        GetMembershipByIdUseCase, // 👈 Added
        CheckQuotaUseCase,
        ConsumeQuotaUseCase,

        // Export tier use cases
        CreateMembershipTierUseCase,
        UpdateMembershipTierUseCase,
        DeleteMembershipTierUseCase,
        GetMembershipTierByIdUseCase,
        ListMembershipTiersUseCase,
    ],
})
export class MembershipModule { }