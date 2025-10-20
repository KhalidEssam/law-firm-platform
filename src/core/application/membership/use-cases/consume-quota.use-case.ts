// // src/core/application/use-cases/consume-quota.use-case.ts

// import { IMembershipRepository } from '../../../domain/membership/repositories/membership.repository';
// import { IMembershipTierRepository } from '../../../domain/membership/repositories/membership-tier.repository';
// import { IMembershipQuotaUsageRepository } from '../../../domain/membership/repositories/membership-quota-usage.repository';
// import { MembershipQuotaUsage } from '../../../domain/membership/entities/membership-quota-usage.entity';
// import { QuotaResource } from '../../../domain/membership/value-objects/quota-resource.vo';
// export class ConsumeQuotaUseCase {
//     constructor(
//         private readonly membershipRepo: IMembershipRepository,
//         private readonly tierRepo: IMembershipTierRepository,
//         private readonly quotaRepo: IMembershipQuotaUsageRepository,
//     ) { }

//     async execute(userId: string, resource: QuotaResource, amount: number = 1): Promise<void> {
//         // 1️⃣ Find active membership
//         const membership = await this.membershipRepo.findActiveByUserId(userId);
//         if (!membership) {
//             throw new Error('No active membership found');
//         }

//         // 2️⃣ Get tier to check limits
//         const tier = await this.tierRepo.findById(membership.tierId);
//         if (!tier) {
//             throw new Error('Membership tier not found');
//         }

//         // 3️⃣ Get or create current quota usage period
//         let quotaUsage = await this.quotaRepo.findCurrentByMembership(membership.id);

//         if (!quotaUsage) {
//             // Create new quota period (monthly)
//             const now = new Date();
//             const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
//             const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

//             quotaUsage = MembershipQuotaUsage.create({
//                 membershipId: membership.id,
//                 periodStart,
//                 periodEnd,
//             });
//             quotaUsage = await this.quotaRepo.create(quotaUsage);
//         }

//         // 4️⃣ Check if quota is available
//         const limit = tier.getQuotaLimit(resource);
//         const isUnlimited = tier.hasUnlimitedQuota(resource);

//         if (!isUnlimited && limit) {
//             const currentUsage = quotaUsage.getUsage(resource);
//             if (currentUsage + amount > limit) {
//                 throw new Error(`${resource} quota exceeded. Limit: ${limit}, Current: ${currentUsage}`);
//             }
//         }

//         // 5️⃣ Increment usage
//         const updatedQuota = quotaUsage.incrementUsage(resource, amount);
//         await this.quotaRepo.update(updatedQuota);
//     }
// }
