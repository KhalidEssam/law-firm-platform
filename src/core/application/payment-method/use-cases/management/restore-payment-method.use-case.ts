// ============================================
// RESTORE PAYMENT METHOD USE CASE
// ============================================

import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';
import { PaymentMethodId } from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface RestorePaymentMethodCommand {
    paymentMethodId: string;
    userId: string;
}

@Injectable()
export class RestorePaymentMethodUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) {}

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
