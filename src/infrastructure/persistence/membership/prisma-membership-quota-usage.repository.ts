import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IMembershipQuotaUsageRepository } from '../../../core/domain/membership/repositories/membership-quota-usage.repository';
import { MembershipQuotaUsage } from '../../../core/domain/membership/entities/membership-quota-usage.entity';
import { QuotaResource } from '../../../core/domain/membership/value-objects/quota-resource.vo';

@Injectable()
export class PrismaMembershipQuotaUsageRepository
  implements IMembershipQuotaUsageRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findCurrentByMembership(
    membershipId: string,
  ): Promise<MembershipQuotaUsage | null> {
    const now = new Date();
    const usage = await this.prisma.membershipQuotaUsage.findFirst({
      where: {
        membershipId,
        periodStart: {
          lte: now,
        },
        periodEnd: {
          gte: now,
        },
      },
    });

    if (!usage) return null;

    return MembershipQuotaUsage.create({
      membershipId: usage.membershipId,
      usage: {
        [QuotaResource.CONSULTATIONS]: usage.consultationsUsed,
        [QuotaResource.OPINIONS]: usage.opinionsUsed,
        [QuotaResource.SERVICES]: usage.servicesUsed,
        [QuotaResource.CASES]: usage.casesUsed,
        [QuotaResource.CALL_MINUTES]: usage.callMinutesUsed,
      },
      periodStart: usage.periodStart,
      periodEnd: usage.periodEnd,
    });
  }

  async create(usage: MembershipQuotaUsage): Promise<MembershipQuotaUsage> {
    const usageData = usage.getAllUsage();
    const created = await this.prisma.membershipQuotaUsage.create({
      data: {
        id: usage.id,
        membershipId: usage.membershipId,
        consultationsUsed: usageData[QuotaResource.CONSULTATIONS],
        opinionsUsed: usageData[QuotaResource.OPINIONS],
        servicesUsed: usageData[QuotaResource.SERVICES],
        casesUsed: usageData[QuotaResource.CASES],
        callMinutesUsed: usageData[QuotaResource.CALL_MINUTES],
        periodStart: usage.periodStart,
        periodEnd: usage.periodEnd,
        createdAt: usage.createdAt,
        updatedAt: usage.updatedAt,
      },
    });

    return MembershipQuotaUsage.create({
      membershipId: created.membershipId,
      usage: {
        [QuotaResource.CONSULTATIONS]: created.consultationsUsed,
        [QuotaResource.OPINIONS]: created.opinionsUsed,
        [QuotaResource.SERVICES]: created.servicesUsed,
        [QuotaResource.CASES]: created.casesUsed,
        [QuotaResource.CALL_MINUTES]: created.callMinutesUsed,
      },
      periodStart: created.periodStart,
      periodEnd: created.periodEnd,
    });
  }

  async update(usage: MembershipQuotaUsage): Promise<MembershipQuotaUsage> {
    const usageData = usage.getAllUsage();
    const updated = await this.prisma.membershipQuotaUsage.update({
      where: { id: usage.id },
      data: {
        consultationsUsed: usageData[QuotaResource.CONSULTATIONS],
        opinionsUsed: usageData[QuotaResource.OPINIONS],
        servicesUsed: usageData[QuotaResource.SERVICES],
        casesUsed: usageData[QuotaResource.CASES],
        callMinutesUsed: usageData[QuotaResource.CALL_MINUTES],
        updatedAt: usage.updatedAt,
      },
    });

    return MembershipQuotaUsage.create({
      membershipId: updated.membershipId,
      usage: {
        [QuotaResource.CONSULTATIONS]: updated.consultationsUsed,
        [QuotaResource.OPINIONS]: updated.opinionsUsed,
        [QuotaResource.SERVICES]: updated.servicesUsed,
        [QuotaResource.CASES]: updated.casesUsed,
        [QuotaResource.CALL_MINUTES]: updated.callMinutesUsed,
      },
      periodStart: updated.periodStart,
      periodEnd: updated.periodEnd,
    });
  }
}
