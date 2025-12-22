// ============================================
// LIST ALL PAYMENT METHODS USE CASE (ADMIN)
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';

export interface ListPaymentMethodsQuery {
    filters?: any;
    pagination?: any;
}

@Injectable()
export class ListPaymentMethodsUseCase {
    constructor(
        @Inject('IPaymentMethodRepository')
        private readonly repository: IPaymentMethodRepository,
    ) {}

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
