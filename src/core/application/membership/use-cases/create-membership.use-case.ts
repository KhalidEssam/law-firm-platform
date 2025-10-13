// src/core/application/use-cases/create-membership.use-case.ts

import { IMembershipRepository } from '../../../domain/membership/repositories/membership.repository';
import { CreateMembershipDTO } from '../dto/create-membership.dto';
import { Membership } from '../../../domain/membership/entities/membership.entity';
import { Money } from '../../../domain/membership/value-objects/money.vo';
import { BillingCycle } from '../../../domain/membership/value-objects/billing-cycle.vo';

export class CreateMembershipUseCase {
    constructor(private readonly membershipRepo: IMembershipRepository) { }

    async execute(dto: CreateMembershipDTO): Promise<Membership> {
        // 1️⃣ Check if user already has an active membership
        const existing = await this.membershipRepo.findActiveByUserId(dto.userId);
        if (existing) {
            throw new Error('User already has an active membership');
        }

        // 2️⃣ Create Value Objects
        const price = Money.create(dto.amount, dto.currency);
        const billingCycle = BillingCycle.create(dto.billingCycle);

        // 3️⃣ Create Membership entity
        const membership = Membership.create({
            userId: dto.userId,
            tierId: dto.tierId,
            price,
            billingCycle,
            autoRenew: dto.autoRenew ?? true,
        });

        // 4️⃣ Save it to the repository
        const savedMembership = await this.membershipRepo.create(membership);

        return savedMembership;
    }
}
