import { MembershipTier } from '../entities/membership-tier.entity';

export interface IMembershipTierRepository {
  findById(id: number): Promise<MembershipTier | null>;
  findAllActive(): Promise<MembershipTier[]>;
}
