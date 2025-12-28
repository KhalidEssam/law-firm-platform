// ============================================
// MARK PAYMENT METHOD AS USED USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethodId } from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface MarkPaymentMethodAsUsedCommand {
  paymentMethodId: string;
}

@Injectable()
export class MarkPaymentMethodAsUsedUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

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
