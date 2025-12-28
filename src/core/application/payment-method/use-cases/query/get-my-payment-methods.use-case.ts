// ============================================
// GET MY PAYMENT METHODS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';
import { UserId } from '../../../../domain/payment-method/value-objects/payment-method.vo';

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
  ) {}

  async execute(query: GetMyPaymentMethodsQuery): Promise<any> {
    const userId = UserId.create(query.userId);

    const result = query.includeInactive
      ? await this.repository.findByUserId(userId, query.pagination)
      : await this.repository.findActiveByUserId(userId, query.pagination);

    return {
      data: result.data.map((pm) => this.toDto(pm)),
      pagination: result.pagination,
    };
  }

  private toDto(paymentMethod: PaymentMethod): any {
    return paymentMethod.toJSON();
  }
}
