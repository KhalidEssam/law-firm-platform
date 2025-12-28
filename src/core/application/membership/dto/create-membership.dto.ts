// src/core/application/dto/create-membership.dto.ts

export interface CreateMembershipDTO {
  userId: string;
  tierId: number;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  autoRenew?: boolean;
}
