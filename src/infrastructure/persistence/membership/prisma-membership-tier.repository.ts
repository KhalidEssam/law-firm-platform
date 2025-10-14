import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IMembershipTierRepository } from '../../../core/domain/membership/repositories/membership-tier.repository';
import { MembershipTier } from '../../../core/domain/membership/entities/membership-tier.entity';
import { Money } from '../../../core/domain/membership/value-objects/money.vo';
import { BillingCycle } from '../../../core/domain/membership/value-objects/billing-cycle.vo';

@Injectable()
export class PrismaMembershipTierRepository implements IMembershipTierRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: number): Promise<MembershipTier | null> {
        const tier = await this.prisma.membershipTier.findUnique({
            where: { id },
        });
        return tier ? this.toDomain(tier) : null;
    }

    async findAllActive(): Promise<MembershipTier[]> {
        const tiers = await this.prisma.membershipTier.findMany({
            where: { isActive: true },
        });
        return tiers.map(tier => this.toDomain(tier));
    }

    private toDomain(record: any): MembershipTier {
        return MembershipTier.rehydrate({
            id: record.id,
            name: record.name,
            nameAr: record.nameAr,
            description: record.description,
            descriptionAr: record.descriptionAr,
            price: record.price,
            currency: record.currency,
            billingCycle: record.billingCycle,
            consultationsPerMonth: record.consultationsPerMonth,
            opinionsPerMonth: record.opinionsPerMonth,
            servicesPerMonth: record.servicesPerMonth,
            casesPerMonth: record.casesPerMonth,
            callMinutesPerMonth: record.callMinutesPerMonth,
            benefits: record.benefits || {},
            isActive: record.isActive,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }
}