import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IMembershipRepository } from '../../../core/domain/membership/repositories/membership.repository';
import { Membership } from '../../../core/domain/membership/entities/membership.entity';

@Injectable()
export class PrismaMembershipRepository implements IMembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Create membership
  async create(m: Membership): Promise<Membership> {
    const created = await this.prisma.membership.create({
      data: {
        id: m.id,
        userId: m.userId,
        tierId: m.tierId,
        startDate: m.startDate,
        endDate: m.endDate,
        isActive: m.isActive,
        autoRenew: m.autoRenew,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      },
    });
    return this.toDomain(created);
  }

  // ✅ Find membership by user ID
  async findByUserId(userId: string): Promise<Membership | null> {
    const found = await this.prisma.membership.findUnique({
      where: { userId },
    });
    return found ? this.toDomain(found) : null;
  }

  // ✅ Find active membership
  async findActiveByUserId(userId: string): Promise<Membership | null> {
    const found = await this.prisma.membership.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return found ? this.toDomain(found) : null;
  }

  // ✅ Update membership
  async update(m: Membership): Promise<Membership> {
    const updated = await this.prisma.membership.update({
      where: { id: m.id },
      data: {
        tierId: m.tierId,
        startDate: m.startDate,
        endDate: m.endDate,
        isActive: m.isActive,
        autoRenew: m.autoRenew,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(updated);
  }

  // ✅ Deactivate membership
  async deactivate(membershipId: string): Promise<void> {
    await this.prisma.membership.update({
      where: { id: membershipId },
      data: { isActive: false, autoRenew: false, updatedAt: new Date() },
    });
  }

  // 🧠 Map DB record → Domain entity
  private toDomain(record: any): Membership {
    return Membership.rehydrate({
      id: record.id,
      userId: record.userId,
      tierId: record.tierId,
      startDate: record.startDate,
      endDate: record.endDate,
      isActive: record.isActive,
      autoRenew: record.autoRenew,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
