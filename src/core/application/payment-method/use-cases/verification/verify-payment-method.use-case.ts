// ============================================
// VERIFY PAYMENT METHOD USE CASE
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';
import { PaymentMethodId } from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface VerifyPaymentMethodCommand {
  paymentMethodId: string;
  userId: string;
  verificationCode?: string;
}

@Injectable()
export class VerifyPaymentMethodUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

  async execute(command: VerifyPaymentMethodCommand): Promise<any> {
    const paymentMethod = await this.repository.findById(
      PaymentMethodId.create(command.paymentMethodId),
    );

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    if (paymentMethod.userId.getValue() !== command.userId) {
      throw new ForbiddenException(
        'You can only verify your own payment methods',
      );
    }

    // TODO: Implement actual verification logic with payment gateway
    // For now, just mark as verified
    paymentMethod.verify();

    const updated = await this.repository.update(paymentMethod);
    return this.toDto(updated);
  }

  private toDto(paymentMethod: PaymentMethod): any {
    return paymentMethod.toJSON();
  }
}
