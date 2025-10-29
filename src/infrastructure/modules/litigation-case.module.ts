// ============================================
// LITIGATION CASE MODULE
// Module Registration with All Dependencies
// ============================================

import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
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

@Module({
    imports: [PrismaModule],
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
    ],
})
export class LitigationCaseModule { }