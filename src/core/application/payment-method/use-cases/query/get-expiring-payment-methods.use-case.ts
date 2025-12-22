// ============================================
// GET EXPIRING PAYMENT METHODS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';

export interface GetExpiringPaymentMethodsQuery {
    days?: number;
    pagination?: any;
}

@Injectable()
export class GetExpiringPaymentMethodsUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) {}

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
