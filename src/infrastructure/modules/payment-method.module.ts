// ============================================
// PAYMENT METHOD MODULE
// Module Registration with All Dependencies
// ============================================

import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

// Controller
import { PaymentMethodController } from '../../interface/http/payment-method.controller';

// Repository
import { PrismaPaymentMethodRepository } from '../persistence/payment-method/prisma.repository';

// Use Cases
import {
    AddPaymentMethodUseCase,
    UpdatePaymentMethodUseCase,
    SetDefaultPaymentMethodUseCase,
    VerifyPaymentMethodUseCase,
    MarkPaymentMethodAsUsedUseCase,
    RecordFailedPaymentAttemptUseCase,
    ResetFailedAttemptsUseCase,
    ActivatePaymentMethodUseCase,
    DeactivatePaymentMethodUseCase,
    DeletePaymentMethodUseCase,
    RestorePaymentMethodUseCase,
    GetPaymentMethodUseCase,
    GetMyPaymentMethodsUseCase,
    GetDefaultPaymentMethodUseCase,
    ListPaymentMethodsUseCase,
    GetExpiringPaymentMethodsUseCase,
    GetPaymentMethodStatisticsUseCase,
    HardDeletePaymentMethodUseCase,
} from '../../core/application/payment-method/use-cases/payment-method.use-cases';

@Module({
    imports: [PrismaModule],
    controllers: [PaymentMethodController],
    providers: [
        // Repository
        {
            provide: 'IPaymentMethodRepository',
            useClass: PrismaPaymentMethodRepository,
        },

        // Use Cases - Management
        AddPaymentMethodUseCase,
        UpdatePaymentMethodUseCase,
        SetDefaultPaymentMethodUseCase,
        VerifyPaymentMethodUseCase,
        DeletePaymentMethodUseCase,
        RestorePaymentMethodUseCase,

        // Use Cases - Status Management
        ActivatePaymentMethodUseCase,
        DeactivatePaymentMethodUseCase,
        MarkPaymentMethodAsUsedUseCase,
        RecordFailedPaymentAttemptUseCase,
        ResetFailedAttemptsUseCase,

        // Use Cases - Query
        GetPaymentMethodUseCase,
        GetMyPaymentMethodsUseCase,
        GetDefaultPaymentMethodUseCase,
        ListPaymentMethodsUseCase,
        GetExpiringPaymentMethodsUseCase,
        GetPaymentMethodStatisticsUseCase,

        // Use Cases - Admin
        HardDeletePaymentMethodUseCase,
    ],
    exports: [
        'IPaymentMethodRepository',

        // Export commonly used use cases for other modules
        AddPaymentMethodUseCase,
        GetDefaultPaymentMethodUseCase,
        MarkPaymentMethodAsUsedUseCase,
        RecordFailedPaymentAttemptUseCase,
        VerifyPaymentMethodUseCase,
    ],
})
export class PaymentMethodModule { }