// src/core/application/use-cases/check-quota.use-case.ts

import { IMembershipRepository } from '../../../domain/membership/repositories/membership.repository';
import { IMembershipTierRepository } from '../../../domain/membership/repositories/membership-tier.repository';
import { IMembershipQuotaUsageRepository } from '../../../domain/membership/repositories/membership-quota-usage.repository';
import { QuotaResource } from '../../../domain/membership/value-objects/quota-resource.vo';

export class CheckQuotaUseCase {
    constructor(
        private readonly membershipRepo: IMembershipRepository,
        private readonly tierRepo: IMembershipTierRepository,
        private readonly quotaRepo: IMembershipQuotaUsageRepository,
    ) { }

    async execute(userId: string, resource: QuotaResource): Promise<{
        available: boolean;
        used: number;
        limit: number | null;
        remaining: number | null;
    }> {
        // 1️⃣ Find active membership
        const membership = await this.membershipRepo.findActiveByUserId(userId);
        if (!membership) {
            throw new Error('No active membership found');
        }

        // 2️⃣ Get tier details
        const tier = await this.tierRepo.findById(membership.tierId);
        if (!tier) {
            throw new Error('Membership tier not found');
        }

        // 3️⃣ Get quota limit for resource
        const limit = tier.getQuotaLimit(resource);
        const isUnlimited = tier.hasUnlimitedQuota(resource);

        // 4️⃣ Get current usage
        const quotaUsage = await this.quotaRepo.findCurrentByMembership(membership.id);
        const used = quotaUsage ? quotaUsage.getUsage(resource) : 0;

        // 5️⃣ Calculate availability
        if (isUnlimited) {
            return {
                available: true,
                used,
                limit: null,
                remaining: null,
            };
        }

        const remaining = limit ? limit - used : 0;
        const available = remaining > 0;

        return {
            available,
            used,
            limit: limit ?? 0,
            remaining,
        };
    }
}