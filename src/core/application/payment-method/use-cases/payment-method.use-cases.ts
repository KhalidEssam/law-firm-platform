// ============================================
// PAYMENT METHOD USE CASES - ALL IN ONE FILE
// Application Layer - Business Logic
// ============================================

import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../domain/payment-method/entities/payment-method.entities';
import {
    PaymentMethodId,
    UserId,
    PaymentMethodType,
    CardDetails,
    WalletDetails,
    BankTransferDetails,
    PaymentMethodDetailsFactory,
    PaymentNickname,
} from '../../../domain/payment-method/value-objects/payment-method.vo';

// ============================================
// ADD PAYMENT METHOD
// ============================================

export interface AddPaymentMethodCommand {
    userId: string;
    type: string;
    details: any;
    nickname?: string;
    setAsDefault?: boolean;
}

@Injectable()
export class AddPaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: AddPaymentMethodCommand): Promise<any> {
        const userId = UserId.create(command.userId);
        const type = PaymentMethodType.create(command.type);

        // Create payment method details based on type
        const details = PaymentMethodDetailsFactory.create(
            type.getValue() as any,
            command.details,
        );

        const paymentMethod = PaymentMethod.create({
            userId,
            type,
            details,
            nickname: PaymentNickname.create(command.nickname),
        });

        // If this should be default, unset all other defaults first
        if (command.setAsDefault) {
            await this.repository.unsetAllDefaultsForUser(userId);
            paymentMethod.verify(); // Auto-verify if setting as default
            paymentMethod.setAsDefault();
        }

        const saved = await this.repository.save(paymentMethod);
        return this.toDto(saved);
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// UPDATE PAYMENT METHOD
// ============================================

export interface UpdatePaymentMethodCommand {
    paymentMethodId: string;
    userId: string;
    nickname?: string;
    details?: any;
}

@Injectable()
export class UpdatePaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: UpdatePaymentMethodCommand): Promise<any> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        if (paymentMethod.userId.getValue() !== command.userId) {
            throw new ForbiddenException('You can only update your own payment methods');
        }

        if (command.nickname !== undefined) {
            paymentMethod.updateNickname(command.nickname);
        }

        // Update card details if provided (for card renewal)
        if (command.details && paymentMethod.isCard()) {
            const newCardDetails = CardDetails.create(command.details);
            paymentMethod.updateCardDetails(newCardDetails);
        }

        const updated = await this.repository.update(paymentMethod);
        return this.toDto(updated);
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// SET DEFAULT PAYMENT METHOD
// ============================================

export interface SetDefaultPaymentMethodCommand {
    paymentMethodId: string;
    userId: string;
}

@Injectable()
export class SetDefaultPaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: SetDefaultPaymentMethodCommand): Promise<any> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        if (paymentMethod.userId.getValue() !== command.userId) {
            throw new ForbiddenException('You can only modify your own payment methods');
        }

        if (!paymentMethod.canBeUsed()) {
            throw new BadRequestException('This payment method cannot be used. Please verify or update it first.');
        }

        // Unset all other defaults for this user
        await this.repository.unsetAllDefaultsForUser(UserId.create(command.userId));

        // Set this as default
        paymentMethod.setAsDefault();

        const updated = await this.repository.update(paymentMethod);
        return this.toDto(updated);
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// VERIFY PAYMENT METHOD
// ============================================

export interface VerifyPaymentMethodCommand {
    paymentMethodId: string;
    userId: string;
    verificationCode?: string;
}

@Injectable()
export class VerifyPaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: VerifyPaymentMethodCommand): Promise<any> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        if (paymentMethod.userId.getValue() !== command.userId) {
            throw new ForbiddenException('You can only verify your own payment methods');
        }

        // TODO: Implement actual verification logic with payment gateway
        // For now, just mark as verified
        paymentMethod.verify();

        const updated = await this.repository.update(paymentMethod);
        return this.toDto(updated);
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// MARK PAYMENT METHOD AS USED
// ============================================

export interface MarkPaymentMethodAsUsedCommand {
    paymentMethodId: string;
}

@Injectable()
export class MarkPaymentMethodAsUsedUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: MarkPaymentMethodAsUsedCommand): Promise<void> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        paymentMethod.markAsUsed();
        await this.repository.update(paymentMethod);
    }
}

// ============================================
// RECORD FAILED PAYMENT ATTEMPT
// ============================================

export interface RecordFailedPaymentAttemptCommand {
    paymentMethodId: string;
    reason?: string;
}

@Injectable()
export class RecordFailedPaymentAttemptUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: RecordFailedPaymentAttemptCommand): Promise<any> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        paymentMethod.recordFailedAttempt();

        const updated = await this.repository.update(paymentMethod);
        return {
            id: updated.id.getValue(),
            failedAttempts: updated.failedAttempts,
            isActive: updated.isActive,
            isBlocked: updated.failedAttempts >= 3,
        };
    }
}

// ============================================
// RESET FAILED ATTEMPTS
// ============================================

export interface ResetFailedAttemptsCommand {
    paymentMethodId: string;
    userId: string;
}

@Injectable()
export class ResetFailedAttemptsUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: ResetFailedAttemptsCommand): Promise<any> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        if (paymentMethod.userId.getValue() !== command.userId) {
            throw new ForbiddenException('You can only reset your own payment methods');
        }

        paymentMethod.resetFailedAttempts();

        // Reactivate if it was auto-deactivated
        if (!paymentMethod.isActive) {
            paymentMethod.activate();
        }

        const updated = await this.repository.update(paymentMethod);
        return this.toDto(updated);
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// ACTIVATE PAYMENT METHOD
// ============================================

export interface ActivatePaymentMethodCommand {
    paymentMethodId: string;
    userId: string;
}

@Injectable()
export class ActivatePaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: ActivatePaymentMethodCommand): Promise<any> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        if (paymentMethod.userId.getValue() !== command.userId) {
            throw new ForbiddenException('You can only activate your own payment methods');
        }

        paymentMethod.activate();

        const updated = await this.repository.update(paymentMethod);
        return this.toDto(updated);
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// DEACTIVATE PAYMENT METHOD
// ============================================

export interface DeactivatePaymentMethodCommand {
    paymentMethodId: string;
    userId: string;
}

@Injectable()
export class DeactivatePaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: DeactivatePaymentMethodCommand): Promise<any> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        if (paymentMethod.userId.getValue() !== command.userId) {
            throw new ForbiddenException('You can only deactivate your own payment methods');
        }

        paymentMethod.deactivate();

        const updated = await this.repository.update(paymentMethod);
        return this.toDto(updated);
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// DELETE PAYMENT METHOD
// ============================================

export interface DeletePaymentMethodCommand {
    paymentMethodId: string;
    userId: string;
}

@Injectable()
export class DeletePaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: DeletePaymentMethodCommand): Promise<void> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        if (paymentMethod.userId.getValue() !== command.userId) {
            throw new ForbiddenException('You can only delete your own payment methods');
        }

        // Check if this is the only payment method
        const count = await this.repository.countByUserId(UserId.create(command.userId));
        if (count === 1 && paymentMethod.isDefault) {
            throw new BadRequestException('Cannot delete the only payment method');
        }

        paymentMethod.softDelete();
        await this.repository.update(paymentMethod);
    }
}

// ============================================
// RESTORE PAYMENT METHOD
// ============================================

export interface RestorePaymentMethodCommand {
    paymentMethodId: string;
    userId: string;
}

@Injectable()
export class RestorePaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: RestorePaymentMethodCommand): Promise<any> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        if (paymentMethod.userId.getValue() !== command.userId) {
            throw new ForbiddenException('You can only restore your own payment methods');
        }

        if (!paymentMethod.isDeleted()) {
            throw new BadRequestException('Payment method is not deleted');
        }

        paymentMethod.restore();

        const updated = await this.repository.update(paymentMethod);
        return this.toDto(updated);
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// GET PAYMENT METHOD BY ID
// ============================================

export interface GetPaymentMethodQuery {
    paymentMethodId: string;
    userId: string;
    userRole?: string;
}

@Injectable()
export class GetPaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(query: GetPaymentMethodQuery): Promise<any> {
        const paymentMethod = await this.repository.findById(
            PaymentMethodId.create(query.paymentMethodId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('Payment method not found');
        }

        const isOwner = paymentMethod.userId.getValue() === query.userId;
        const isAdmin = query.userRole === 'admin' || query.userRole === 'platform';

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('No access to this payment method');
        }

        return this.toDto(paymentMethod);
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// GET MY PAYMENT METHODS
// ============================================

export interface GetMyPaymentMethodsQuery {
    userId: string;
    includeInactive?: boolean;
    pagination?: any;
}

@Injectable()
export class GetMyPaymentMethodsUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(query: GetMyPaymentMethodsQuery): Promise<any> {
        const userId = UserId.create(query.userId);

        const result = query.includeInactive
            ? await this.repository.findByUserId(userId, query.pagination)
            : await this.repository.findActiveByUserId(userId, query.pagination);

        return {
            data: result.data.map(pm => this.toDto(pm)),
            pagination: result.pagination,
        };
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// GET DEFAULT PAYMENT METHOD
// ============================================

export interface GetDefaultPaymentMethodQuery {
    userId: string;
}

@Injectable()
export class GetDefaultPaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(query: GetDefaultPaymentMethodQuery): Promise<any> {
        const paymentMethod = await this.repository.findDefaultByUserId(
            UserId.create(query.userId),
        );

        if (!paymentMethod) {
            throw new NotFoundException('No default payment method found');
        }

        return this.toDto(paymentMethod);
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// LIST ALL PAYMENT METHODS (ADMIN)
// ============================================

export interface ListPaymentMethodsQuery {
    filters?: any;
    pagination?: any;
}

@Injectable()
export class ListPaymentMethodsUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(query: ListPaymentMethodsQuery): Promise<any> {
        const result = await this.repository.findAll(
            query.filters || {},
            query.pagination || { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' },
        );

        return {
            data: result.data.map(pm => this.toDto(pm)),
            pagination: result.pagination,
        };
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// GET EXPIRING PAYMENT METHODS
// ============================================

export interface GetExpiringPaymentMethodsQuery {
    days?: number;
    pagination?: any;
}

@Injectable()
export class GetExpiringPaymentMethodsUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(query: GetExpiringPaymentMethodsQuery): Promise<any> {
        const result = await this.repository.findExpiringSoon(
            query.days || 30,
            query.pagination,
        );

        return {
            data: result.data.map(pm => this.toDto(pm)),
            pagination: result.pagination,
        };
    }

    private toDto(paymentMethod: PaymentMethod): any {
        return paymentMethod.toJSON();
    }
}

// ============================================
// GET STATISTICS
// ============================================

export interface GetPaymentMethodStatisticsQuery {
    filters?: any;
}

@Injectable()
export class GetPaymentMethodStatisticsUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(query: GetPaymentMethodStatisticsQuery): Promise<any> {
        return await this.repository.getStatistics(query.filters);
    }
}

// ============================================
// HARD DELETE PAYMENT METHOD (ADMIN)
// ============================================

export interface HardDeletePaymentMethodCommand {
    paymentMethodId: string;
}

@Injectable()
export class HardDeletePaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) { }

    async execute(command: HardDeletePaymentMethodCommand): Promise<void> {
        const exists = await this.repository.exists(
            PaymentMethodId.create(command.paymentMethodId),
        );

        if (!exists) {
            throw new NotFoundException('Payment method not found');
        }

        await this.repository.hardDelete(PaymentMethodId.create(command.paymentMethodId));
    }
}