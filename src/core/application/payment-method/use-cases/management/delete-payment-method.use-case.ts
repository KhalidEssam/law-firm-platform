// ============================================
// DELETE PAYMENT METHOD USE CASE
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import {
  PaymentMethodId,
  UserId,
} from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface DeletePaymentMethodCommand {
  paymentMethodId: string;
  userId: string;
}

@Injectable()
export class DeletePaymentMethodUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

  async execute(command: DeletePaymentMethodCommand): Promise<void> {
    const paymentMethod = await this.repository.findById(
      PaymentMethodId.create(command.paymentMethodId),
    );

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    if (paymentMethod.userId.getValue() !== command.userId) {
      throw new ForbiddenException(
        'You can only delete your own payment methods',
      );
    }

    // Check if this is the only payment method
    const count = await this.repository.countByUserId(
      UserId.create(command.userId),
    );
    if (count === 1 && paymentMethod.isDefault) {
      throw new BadRequestException('Cannot delete the only payment method');
    }

    paymentMethod.softDelete();
    await this.repository.update(paymentMethod);
  }
}
