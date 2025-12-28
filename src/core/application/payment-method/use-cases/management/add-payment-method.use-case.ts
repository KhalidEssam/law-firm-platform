// ============================================
// ADD PAYMENT METHOD USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';
import { PaymentMethod } from '../../../../domain/payment-method/entities/payment-method.entities';
import {
  UserId,
  PaymentMethodType,
  PaymentMethodDetailsFactory,
  PaymentNickname,
} from '../../../../domain/payment-method/value-objects/payment-method.vo';

export interface AddPaymentMethodCommand {
  userId: string;
  type: string;
  details: any;
  nickname?: string;
  setAsDefault?: boolean;
}

@Injectable()
export class AddPaymentMethodUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

  async execute(command: AddPaymentMethodCommand): Promise<any> {
    const userId = UserId.create(command.userId);
    const type = PaymentMethodType.create(command.type);

    // Create payment method details based on type
    const details = PaymentMethodDetailsFactory.create(
      type.getValue() as any,
      command.details,
    );

    const paymentMethod = PaymentMethod.create({
      userId,
      type,
      details,
      nickname: PaymentNickname.create(command.nickname),
    });

    // If this should be default, unset all other defaults first
    if (command.setAsDefault) {
      await this.repository.unsetAllDefaultsForUser(userId);
      paymentMethod.verify(); // Auto-verify if setting as default
      paymentMethod.setAsDefault();
    }

    const saved = await this.repository.save(paymentMethod);
    return this.toDto(saved);
  }

  private toDto(paymentMethod: PaymentMethod): any {
    return paymentMethod.toJSON();
  }
}
