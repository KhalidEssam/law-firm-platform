// ============================================
// LITIGATION CASE MODULE
// Module Registration with All Dependencies
// ============================================

import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MembershipModule } from './membership.module';

// Controller
import { LitigationCaseController } from '../../interface/http/litigation-case.controller';

// Repository
import { PrismaLitigationCaseRepository } from '../persistence/litigation-case/prisma.repository';

// Use Cases
import {
    CreateLitigationCaseUseCase,
    UpdateLitigationCaseUseCase,
    AssignProviderUseCase,
    SendQuoteUseCase,
    AcceptQuoteUseCase,
    MarkAsPaidUseCase,
    ActivateCaseUseCase,
    CloseCaseUseCase,
    CancelCaseUseCase,
    ProcessRefundUseCase,
    GetLitigationCaseUseCase,
    ListLitigationCasesUseCase,
    GetMyCasesUseCase,
    GetProviderCasesUseCase,
    GetLitigationStatisticsUseCase,
    DeleteLitigationCaseUseCase,
} from '../../core/application/litigation-case/use-cases/litigation-case.use-cases';

// Membership-Aware Use Cases
import {
    CreateLitigationWithMembershipUseCase,
    CheckLitigationQuotaUseCase,
    CloseLitigationWithUsageTrackingUseCase,
} from '../../core/application/litigation-case/use-cases/membership-aware-litigation.use-cases';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => MembershipModule), // Membership quota/usage integration
    ],
    controllers: [LitigationCaseController],
    providers: [
        // Repository
        {
            provide: 'ILitigationCaseRepository',
            useClass: PrismaLitigationCaseRepository,
        },

        // Use Cases
        CreateLitigationCaseUseCase,
        UpdateLitigationCaseUseCase,
        AssignProviderUseCase,
        SendQuoteUseCase,
        AcceptQuoteUseCase,
        MarkAsPaidUseCase,
        ActivateCaseUseCase,
        CloseCaseUseCase,
        CancelCaseUseCase,
        ProcessRefundUseCase,
        GetLitigationCaseUseCase,
        ListLitigationCasesUseCase,
        GetMyCasesUseCase,
        GetProviderCasesUseCase,
        GetLitigationStatisticsUseCase,
        DeleteLitigationCaseUseCase,

        // Membership-Aware Use Cases
        CreateLitigationWithMembershipUseCase,
        CheckLitigationQuotaUseCase,
        CloseLitigationWithUsageTrackingUseCase,
    ],
    exports: [
        'ILitigationCaseRepository',
        CreateLitigationCaseUseCase,
        UpdateLitigationCaseUseCase,
        AssignProviderUseCase,
        SendQuoteUseCase,
        AcceptQuoteUseCase,
        MarkAsPaidUseCase,
        ActivateCaseUseCase,
        CloseCaseUseCase,
        CancelCaseUseCase,
        ProcessRefundUseCase,
        GetLitigationCaseUseCase,
        ListLitigationCasesUseCase,
        GetMyCasesUseCase,
        GetProviderCasesUseCase,
        GetLitigationStatisticsUseCase,
        DeleteLitigationCaseUseCase,

        // Export membership-aware use cases
        CreateLitigationWithMembershipUseCase,
        CheckLitigationQuotaUseCase,
        CloseLitigationWithUsageTrackingUseCase,
    ],
})
export class LitigationCaseModule { }
