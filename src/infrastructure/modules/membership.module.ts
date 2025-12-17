// ============================================
// MEMBERSHIP MODULE - COMPLETE
// infrastructure/modules/MembershipModule.ts
// ============================================

import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MembershipController } from '../../interface/http/membership.controller';
import { NotificationModule } from '../../interface/notification/notification.module';

// Repositories
import {
    PrismaMembershipRepository,
    PrismaMembershipTierRepository,
    PrismaMembershipPaymentRepository,
    PrismaMembershipCouponRepository,
    PrismaMembershipCouponRedemptionRepository,
    PrismaMembershipQuotaUsageRepository,
    PrismaTierServiceRepository,
    PrismaServiceUsageRepository,
    PrismaMembershipChangeLogRepository,
} from '../persistence/membership/prisma.repository';

// Core Use Cases
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

// Tier Service Use Cases
import {
    CreateTierServiceUseCase,
    GetTierServiceByIdUseCase,
    GetTierServicesByTierIdUseCase,
    UpdateTierServiceUseCase,
    DeleteTierServiceUseCase,
    BulkCreateTierServicesUseCase,
    CheckServiceQuotaUseCase,
} from '../../core/application/membership/use-cases/tier-service.use-cases';

// Service Usage Use Cases
import {
    RecordServiceUsageUseCase,
    GetServiceUsageHistoryUseCase,
    GetServiceUsageByIdUseCase,
    GetServiceUsageSummaryUseCase,
    GetTotalUsageCountUseCase,
    MarkUsageAsBilledUseCase,
    GetUnbilledUsageUseCase,
    CheckRemainingServiceQuotaUseCase,
} from '../../core/application/membership/use-cases/service-usage.use-cases';

// Tier Change Use Cases
import {
    ChangeMembershipTierUseCase,
    UpgradeMembershipUseCase,
    DowngradeMembershipUseCase,
    GetMembershipChangeHistoryUseCase,
    GetLatestMembershipChangeUseCase,
    GetTierChangeStatisticsUseCase,
} from '../../core/application/membership/use-cases/tier-change.use-cases';

// Lifecycle Use Cases
import {
    PauseMembershipUseCase,
    ResumeMembershipUseCase,
    ExpireMembershipsUseCase,
    GetExpiringMembershipsUseCase,
    ReactivateMembershipUseCase,
    CheckMembershipStatusUseCase,
} from '../../core/application/membership/use-cases/membership-lifecycle.use-cases';

// Admin Use Cases
import {
    ListMembershipsUseCase,
    GetMembershipStatisticsUseCase,
    GetMembershipActivitySummaryUseCase,
    GetTierDistributionUseCase,
} from '../../core/application/membership/use-cases/membership-admin.use-cases';

// Integration Service (for cross-module integration)
import { MembershipIntegrationService } from '../../core/application/membership/services/membership-integration.service';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => NotificationModule), // Notification integration
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
        {
            provide: 'ITierServiceRepository',
            useClass: PrismaTierServiceRepository,
        },
        {
            provide: 'IServiceUsageRepository',
            useClass: PrismaServiceUsageRepository,
        },
        {
            provide: 'IMembershipChangeLogRepository',
            useClass: PrismaMembershipChangeLogRepository,
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

        // ============================================
        // TIER SERVICE USE CASES
        // ============================================
        CreateTierServiceUseCase,
        GetTierServiceByIdUseCase,
        GetTierServicesByTierIdUseCase,
        UpdateTierServiceUseCase,
        DeleteTierServiceUseCase,
        BulkCreateTierServicesUseCase,
        CheckServiceQuotaUseCase,

        // ============================================
        // SERVICE USAGE USE CASES
        // ============================================
        RecordServiceUsageUseCase,
        GetServiceUsageHistoryUseCase,
        GetServiceUsageByIdUseCase,
        GetServiceUsageSummaryUseCase,
        GetTotalUsageCountUseCase,
        MarkUsageAsBilledUseCase,
        GetUnbilledUsageUseCase,
        CheckRemainingServiceQuotaUseCase,

        // ============================================
        // TIER CHANGE USE CASES
        // ============================================
        ChangeMembershipTierUseCase,
        UpgradeMembershipUseCase,
        DowngradeMembershipUseCase,
        GetMembershipChangeHistoryUseCase,
        GetLatestMembershipChangeUseCase,
        GetTierChangeStatisticsUseCase,

        // ============================================
        // LIFECYCLE USE CASES
        // ============================================
        PauseMembershipUseCase,
        ResumeMembershipUseCase,
        ExpireMembershipsUseCase,
        GetExpiringMembershipsUseCase,
        ReactivateMembershipUseCase,
        CheckMembershipStatusUseCase,

        // ============================================
        // ADMIN USE CASES
        // ============================================
        ListMembershipsUseCase,
        GetMembershipStatisticsUseCase,
        GetMembershipActivitySummaryUseCase,
        GetTierDistributionUseCase,

        // ============================================
        // INTEGRATION SERVICE
        // ============================================
        MembershipIntegrationService,
    ],
    exports: [
        // Export repositories for other modules to use
        'IMembershipRepository',
        'IMembershipTierRepository',
        'IMembershipQuotaUsageRepository',
        'IMembershipPaymentRepository',
        'IMembershipCouponRepository',
        'ITierServiceRepository',
        'IServiceUsageRepository',
        'IMembershipChangeLogRepository',

        // Export commonly used use cases
        GetActiveMembershipByUserUseCase,
        GetMembershipByIdUseCase,
        CheckQuotaUseCase,
        ConsumeQuotaUseCase,

        // Export tier use cases
        CreateMembershipTierUseCase,
        UpdateMembershipTierUseCase,
        DeleteMembershipTierUseCase,
        GetMembershipTierByIdUseCase,
        ListMembershipTiersUseCase,

        // Export tier service use cases
        CheckServiceQuotaUseCase,
        GetTierServicesByTierIdUseCase,

        // Export service usage use cases
        RecordServiceUsageUseCase,
        CheckRemainingServiceQuotaUseCase,

        // Export tier change use cases
        ChangeMembershipTierUseCase,
        GetMembershipChangeHistoryUseCase,

        // Export lifecycle use cases
        CheckMembershipStatusUseCase,
        GetExpiringMembershipsUseCase,
        ExpireMembershipsUseCase,

        // Export admin use cases
        GetMembershipStatisticsUseCase,

        // Export integration service for cross-module use
        MembershipIntegrationService,
    ],
})
export class MembershipModule { }
