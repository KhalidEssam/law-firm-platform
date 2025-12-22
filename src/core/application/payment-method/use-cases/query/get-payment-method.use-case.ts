// ============================================
// GET PAYMENT METHOD USE CASE
// ============================================

import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';
import { PaymentMethodId } from '../../../../domain/payment-method/value-objects/payment-method.vo';

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
    ) {}

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
