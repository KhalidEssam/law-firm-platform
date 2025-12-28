// ============================================
// SET DEFAULT PAYMENT METHOD USE CASE
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';
import {
  PaymentMethodId,
  UserId,
} from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface SetDefaultPaymentMethodCommand {
  paymentMethodId: string;
  userId: string;
}

@Injectable()
export class SetDefaultPaymentMethodUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

  async execute(command: SetDefaultPaymentMethodCommand): Promise<any> {
    const paymentMethod = await this.repository.findById(
      PaymentMethodId.create(command.paymentMethodId),
    );

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    if (paymentMethod.userId.getValue() !== command.userId) {
      throw new ForbiddenException(
        'You can only modify your own payment methods',
      );
    }

    if (!paymentMethod.canBeUsed()) {
      throw new BadRequestException(
        'This payment method cannot be used. Please verify or update it first.',
      );
    }

    // Unset all other defaults for this user
    await this.repository.unsetAllDefaultsForUser(
      UserId.create(command.userId),
    );

    // Set this as default
    paymentMethod.setAsDefault();

    const updated = await this.repository.update(paymentMethod);
    return this.toDto(updated);
  }

  private toDto(paymentMethod: PaymentMethod): any {
    return paymentMethod.toJSON();
  }
}
