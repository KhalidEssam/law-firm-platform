// ============================================
// GET PAYMENT METHOD STATISTICS USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { type IPaymentMethodRepository } from '../../../../domain/payment-method/port/payment-method.repository';

export interface GetPaymentMethodStatisticsQuery {
  filters?: any;
}

@Injectable()
export class GetPaymentMethodStatisticsUseCase {
  constructor(
    @Inject('IPaymentMethodRepository')
    private readonly repository: IPaymentMethodRepository,
  ) {}

  async execute(query: GetPaymentMethodStatisticsQuery): Promise<any> {
    return await this.repository.getStatistics(query.filters);
  }
}
