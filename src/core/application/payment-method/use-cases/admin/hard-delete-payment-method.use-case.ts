// ============================================
// HARD DELETE PAYMENT METHOD USE CASE (ADMIN)
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethodId } from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface HardDeletePaymentMethodCommand {
  paymentMethodId: string;
}

@Injectable()
export class HardDeletePaymentMethodUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

  async execute(command: HardDeletePaymentMethodCommand): Promise<void> {
    const exists = await this.repository.exists(
      PaymentMethodId.create(command.paymentMethodId),
    );

    if (!exists) {
      throw new NotFoundException('Payment method not found');
    }

    await this.repository.hardDelete(
      PaymentMethodId.create(command.paymentMethodId),
    );
  }
}
