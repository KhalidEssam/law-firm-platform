// ============================================
// MEMBERSHIP REPOSITORY INTERFACES (PORTS)
// core/domain/membership/repositories/
// ============================================

import { Membership } from '../../../domain/membership/entities/membership.entity';
import { MembershipTier } from '../../../domain/membership/entities/membership-tier.entity';
import { MembershipPayment } from '../../../domain/membership/entities/membership-payment.entity';
import { MembershipQuotaUsage } from '../../../domain/membership/entities/membership-quota-usage.entity';
import { MembershipCoupon } from '../../../domain/membership/entities/membership-coupon.entity';
import { MembershipCouponRedemption } from '../../../domain/membership/entities/membership-coupon-redemption.entity';
import { QuotaResource } from '../../../domain/membership/value-objects/quota-resource.vo';

import { MembershipCoupon } from 'src/core/domain/membership/entities/membership-coupon.entity';
import { MembershipCouponRedemption } from 'src/core/domain/membership/entities/membership-coupon-redemption.entity';
// Re-export from domain repositories
export { type ITierServiceRepository } from '../../../domain/membership/repositories/tier-service.repository';
export {
  type IServiceUsageRepository,
  type ServiceUsageFilter,
  type ServiceUsageSummary,
} from '../../../domain/membership/repositories/service-usage.repository';
export { type IMembershipChangeLogRepository } from '../../../domain/membership/repositories/membership-change-log.repository';

// ============================================
// MEMBERSHIP REPOSITORY
// ============================================

export interface IMembershipRepository {
  // Create
  create(membership: Membership): Promise<Membership>;

  // Read
  findById(id: string): Promise<Membership | null>;
  findByUserId(userId: string): Promise<Membership | null>;
  findActiveByUserId(userId: string): Promise<Membership | null>;
  list(options?: {
    isActive?: boolean;
    tierId?: number;
    limit?: number;
    offset?: number;
  }): Promise<Membership[]>;
  count(options?: { isActive?: boolean; tierId?: number }): Promise<number>;

  // Update
  update(membership: Membership): Promise<Membership>;
  cancel(membershipId: string): Promise<Membership>;
  renew(membershipId: string, durationInMonths: number): Promise<Membership>;
  toggleAutoRenew(
    membershipId: string,
    autoRenew: boolean,
  ): Promise<Membership>;

  // Delete
  delete(id: string): Promise<void>;

  // Business Logic
  findExpiringSoon(days: number): Promise<Membership[]>;
  findExpired(): Promise<Membership[]>;
}

// ============================================
// MEMBERSHIP TIER REPOSITORY
// ============================================

export interface IMembershipTierRepository {
  // Read
  findById(id: number): Promise<MembershipTier | null>;
  findByName(name: string): Promise<MembershipTier | null>;
  findAll(options?: { isActive?: boolean }): Promise<MembershipTier[]>;
  findActive(): Promise<MembershipTier[]>;
  // Create (Admin only)
  create(tier: MembershipTier): Promise<MembershipTier>;
  // Update (Admin only)
  update(tier: MembershipTier): Promise<MembershipTier>;
  activate(tierId: number): Promise<MembershipTier>;
  deactivate(tierId: number): Promise<MembershipTier>;
  findByStatus(isActive: boolean): Promise<MembershipTier[]>;
  hasActiveMemberships(tierId: number): Promise<boolean>;

  // Delete (Admin only)
  delete(id: number): Promise<void>;
}

// ============================================
// MEMBERSHIP PAYMENT REPOSITORY
// ============================================

export interface IMembershipPaymentRepository {
  // Create
  create(payment: MembershipPayment): Promise<MembershipPayment>;

  // Read
  findById(id: string): Promise<MembershipPayment | null>;
  findByInvoiceId(invoiceId: string): Promise<MembershipPayment | null>;
  findByProviderTxnId(providerTxnId: string): Promise<MembershipPayment | null>;
  findByMembership(
    membershipId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<MembershipPayment[]>;

  // Update
  update(payment: MembershipPayment): Promise<MembershipPayment>;
  markAsCompleted(
    paymentId: string,
    providerTxnId: string,
  ): Promise<MembershipPayment>;
  markAsFailed(paymentId: string, reason?: string): Promise<MembershipPayment>;
  markAsRefunded(
    paymentId: string,
    refundReason?: string,
  ): Promise<MembershipPayment>;

  // Analytics
  getTotalRevenue(options?: {
    startDate?: Date;
    endDate?: Date;
    tierId?: number;
  }): Promise<number>;
  getPaymentStats(options?: { startDate?: Date; endDate?: Date }): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
  }>;
}

// ============================================
// MEMBERSHIP COUPON REPOSITORY
// ============================================

export interface IMembershipCouponRepository {
  // Create
  create(coupon: MembershipCoupon): Promise<MembershipCoupon>;

  // Read
  findById(id: string): Promise<MembershipCoupon | null>;
  findByCode(code: string): Promise<MembershipCoupon | null>;
  findAll(options?: {
    isActive?: boolean;
    validAt?: Date;
    limit?: number;
    offset?: number;
  }): Promise<MembershipCoupon[]>;
  findActive(): Promise<MembershipCoupon[]>;

  // Update
  update(coupon: MembershipCoupon): Promise<MembershipCoupon>;
  incrementUsage(couponId: string): Promise<MembershipCoupon>;
  activate(couponId: string): Promise<MembershipCoupon>;
  deactivate(couponId: string): Promise<MembershipCoupon>;

  // Delete
  delete(id: string): Promise<void>;

  // Business Logic
  validateCoupon(
    code: string,
  ): Promise<{ valid: boolean; reason?: string; coupon?: MembershipCoupon }>;
}

// ============================================
// MEMBERSHIP COUPON REDEMPTION REPOSITORY
// ============================================

export interface IMembershipCouponRedemptionRepository {
  // Create
  create(
    redemption: MembershipCouponRedemption,
  ): Promise<MembershipCouponRedemption>;

  // Read
  findById(id: string): Promise<MembershipCouponRedemption | null>;
  findByMembership(membershipId: string): Promise<MembershipCouponRedemption[]>;
  findByCoupon(couponId: string): Promise<MembershipCouponRedemption[]>;
  hasUserRedeemedCoupon(
    membershipId: string,
    couponId: string,
  ): Promise<boolean>;

  // Delete
  delete(id: string): Promise<void>;
}

// ============================================
// MEMBERSHIP QUOTA USAGE REPOSITORY
// ============================================

export interface IMembershipQuotaUsageRepository {
  // Create
  create(quotaUsage: MembershipQuotaUsage): Promise<MembershipQuotaUsage>;

  // Read
  findById(id: string): Promise<MembershipQuotaUsage | null>;
  findCurrentByMembership(
    membershipId: string,
  ): Promise<MembershipQuotaUsage | null>;
  findByMembership(
    membershipId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<MembershipQuotaUsage[]>;

  // Update
  update(quotaUsage: MembershipQuotaUsage): Promise<MembershipQuotaUsage>;
  incrementUsage(
    membershipId: string,
    resource: QuotaResource,
    amount: number,
  ): Promise<MembershipQuotaUsage>;

  // Business Logic
  getRemainingQuota(
    membershipId: string,
    resource: QuotaResource,
    tierLimit?: number,
  ): Promise<number | null>; // null = unlimited

  hasAvailableQuota(
    membershipId: string,
    resource: QuotaResource,
    required: number,
    tierLimit?: number,
  ): Promise<boolean>;

  // Reset quota for new billing period
  resetQuota(membershipId: string): Promise<MembershipQuotaUsage>;
}
