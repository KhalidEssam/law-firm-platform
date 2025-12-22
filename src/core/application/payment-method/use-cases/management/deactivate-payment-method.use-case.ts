// ============================================
// DEACTIVATE PAYMENT METHOD USE CASE
// ============================================

import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';
import { PaymentMethodId } from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface DeactivatePaymentMethodCommand {
    paymentMethodId: string;
    userId: string;
}

@Injectable()
export class DeactivatePaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) {}

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
