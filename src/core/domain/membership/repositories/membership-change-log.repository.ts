// src/core/domain/membership/repositories/membership-change-log.repository.ts

import { MembershipChangeLog } from '../entities/membership-change-log.entity';

export interface IMembershipChangeLogRepository {
  /** Create a new change log entry */
  create(changeLog: MembershipChangeLog): Promise<MembershipChangeLog>;

  /** Find by ID */
  findById(id: string): Promise<MembershipChangeLog | null>;

  /** Find all change logs for a membership */
  findByMembershipId(
    membershipId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'asc' | 'desc';
    },
  ): Promise<MembershipChangeLog[]>;

  /** Find change logs by date range */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      membershipId?: string;
      reason?: string;
    },
  ): Promise<MembershipChangeLog[]>;

  /** Get latest change for membership */
  getLatestChange(membershipId: string): Promise<MembershipChangeLog | null>;

  /** Count changes for membership */
  countByMembershipId(membershipId: string): Promise<number>;

  /** Get tier change statistics */
  getTierChangeStats(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    upgrades: number;
    downgrades: number;
    cancellations: number;
    reactivations: number;
  }>;
}
