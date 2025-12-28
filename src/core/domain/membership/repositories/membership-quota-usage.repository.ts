import { MembershipQuotaUsage } from '../entities/membership-quota-usage.entity';

export interface IMembershipQuotaUsageRepository {
  findCurrentByMembership(
    membershipId: string,
  ): Promise<MembershipQuotaUsage | null>;
  create(usage: MembershipQuotaUsage): Promise<MembershipQuotaUsage>;
  update(usage: MembershipQuotaUsage): Promise<MembershipQuotaUsage>;
}
