// ============================================
// GET DEFAULT PAYMENT METHOD USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';
import { UserId } from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface GetDefaultPaymentMethodQuery {
  userId: string;
}

@Injectable()
export class GetDefaultPaymentMethodUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

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
