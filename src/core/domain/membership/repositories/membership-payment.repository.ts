import { MembershipPayment } from '../entities/membership-payment.entity';

// src/core/domain/membership/repositories/membership-payment.repository.ts

export interface IMembershipPaymentRepository {
  create(payment: MembershipPayment): Promise<MembershipPayment>;
  findById(id: string): Promise<MembershipPayment | null>;
  findByInvoice(invoiceId: string): Promise<MembershipPayment[]>;
  findByProviderTxnId(providerTxnId: string): Promise<MembershipPayment | null>;
  findPendingPayments(): Promise<MembershipPayment[]>;
  update(payment: MembershipPayment): Promise<MembershipPayment>;
}
