// ============================================
// RESET FAILED ATTEMPTS USE CASE
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

export interface ResetFailedAttemptsCommand {
  paymentMethodId: string;
  userId: string;
}

@Injectable()
export class ResetFailedAttemptsUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

  async execute(command: ResetFailedAttemptsCommand): Promise<any> {
    const paymentMethod = await this.repository.findById(
      PaymentMethodId.create(command.paymentMethodId),
    );

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    if (paymentMethod.userId.getValue() !== command.userId) {
      throw new ForbiddenException(
        'You can only reset your own payment methods',
      );
    }

    paymentMethod.resetFailedAttempts();

    // Reactivate if it was auto-deactivated
    if (!paymentMethod.isActive) {
      paymentMethod.activate();
    }

    const updated = await this.repository.update(paymentMethod);
    return this.toDto(updated);
  }

  private toDto(paymentMethod: PaymentMethod): any {
    return paymentMethod.toJSON();
  }
}
