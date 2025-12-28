// ============================================
// UPDATE PAYMENT METHOD USE CASE
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';
import {
  PaymentMethodId,
  CardDetails,
} from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface UpdatePaymentMethodCommand {
  paymentMethodId: string;
  userId: string;
  nickname?: string;
  details?: any;
}

@Injectable()
export class UpdatePaymentMethodUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

  async execute(command: UpdatePaymentMethodCommand): Promise<any> {
    const paymentMethod = await this.repository.findById(
      PaymentMethodId.create(command.paymentMethodId),
    );

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    if (paymentMethod.userId.getValue() !== command.userId) {
      throw new ForbiddenException(
        'You can only update your own payment methods',
      );
    }

    if (command.nickname !== undefined) {
      paymentMethod.updateNickname(command.nickname);
    }

    // Update card details if provided (for card renewal)
    if (command.details && paymentMethod.isCard()) {
      const newCardDetails = CardDetails.create(command.details);
      paymentMethod.updateCardDetails(newCardDetails);
    }

    const updated = await this.repository.update(paymentMethod);
    return this.toDto(updated);
  }

  private toDto(paymentMethod: PaymentMethod): any {
    return paymentMethod.toJSON();
  }
}
