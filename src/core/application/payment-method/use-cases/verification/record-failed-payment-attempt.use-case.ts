// ============================================
// RECORD FAILED PAYMENT ATTEMPT USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethodId } from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface RecordFailedPaymentAttemptCommand {
  paymentMethodId: string;
  reason?: string;
}

@Injectable()
export class RecordFailedPaymentAttemptUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

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
