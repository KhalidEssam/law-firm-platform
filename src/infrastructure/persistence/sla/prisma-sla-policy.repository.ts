// src/infrastructure/persistence/sla/prisma-sla-policy.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ISLAPolicyRepository } from '../../../core/domain/sla/ports/sla-policy.repository';
import { SLAPolicy } from '../../../core/domain/sla/entities/sla-policy.entity';
import { RequestType } from '../../../core/domain/sla/value-objects/request-type.vo';
import { Priority } from '../../../core/domain/sla/value-objects/priority.vo';

@Injectable()
export class PrismaSLAPolicyRepository implements ISLAPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(policy: SLAPolicy): Promise<SLAPolicy> {
    const data = policy.toObject();

    const result = await this.prisma.sLAPolicy.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        requestType: data.requestType,
        priority: data.priority,
        responseTime: data.responseTime,
        resolutionTime: data.resolutionTime,
        escalationTime: data.escalationTime,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
      create: {
        id: data.id,
        name: data.name,
        requestType: data.requestType,
        priority: data.priority,
        responseTime: data.responseTime,
        resolutionTime: data.resolutionTime,
        escalationTime: data.escalationTime,
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapToDomain(result);
  }

  async findById(_id: string): Promise<SLAPolicy | null> {
    const result = await this.prisma.sLAPolicy.findUnique({
      where: { id },
    });

    return result ? this.mapToDomain(result) : null;
  }

  async findByName(name: string): Promise<SLAPolicy | null> {
    const result = await this.prisma.sLAPolicy.findUnique({
      where: { name },
    });

    return result ? this.mapToDomain(result) : null;
  }

  async findByTypeAndPriority(
    requestType: RequestType,
    priority: Priority,
  ): Promise<SLAPolicy | null> {
    const result = await this.prisma.sLAPolicy.findFirst({
      where: {
        requestType,
        priority,
        isActive: true,
      },
    });

    return result ? this.mapToDomain(result) : null;
  }

  async findBestMatch(
    requestType: RequestType,
    priority?: Priority,
  ): Promise<SLAPolicy | null> {
    // First try exact match
    if (priority) {
      const exactMatch = await this.findByTypeAndPriority(
        requestType,
        priority,
      );
      if (exactMatch) return exactMatch;
    }

    // Fall back to normal priority
    const normalMatch = await this.findByTypeAndPriority(
      requestType,
      Priority.NORMAL,
    );
    if (normalMatch) return normalMatch;

    // Fall back to any active policy for this type
    const anyMatch = await this.prisma.sLAPolicy.findFirst({
      where: {
        requestType,
        isActive: true,
      },
      orderBy: { priority: 'asc' },
    });

    return anyMatch ? this.mapToDomain(anyMatch) : null;
  }

  async findByRequestType(requestType: RequestType): Promise<SLAPolicy[]> {
    const results = await this.prisma.sLAPolicy.findMany({
      where: { requestType },
      orderBy: { priority: 'asc' },
    });

    return results.map(this.mapToDomain);
  }

  async findAllActive(): Promise<SLAPolicy[]> {
    const results = await this.prisma.sLAPolicy.findMany({
      where: { isActive: true },
      orderBy: [{ requestType: 'asc' }, { priority: 'asc' }],
    });

    return results.map(this.mapToDomain);
  }

  async findAll(): Promise<SLAPolicy[]> {
    const results = await this.prisma.sLAPolicy.findMany({
      orderBy: [{ requestType: 'asc' }, { priority: 'asc' }],
    });

    return results.map(this.mapToDomain);
  }

  async delete(_id: string): Promise<void> {
    await this.prisma.sLAPolicy.delete({
      where: { id },
    });
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.sLAPolicy.count({
      where: { name },
    });
    return count > 0;
  }

  async existsByTypeAndPriority(
    requestType: RequestType,
    priority: Priority,
  ): Promise<boolean> {
    const count = await this.prisma.sLAPolicy.count({
      where: { requestType, priority },
    });
    return count > 0;
  }

  private mapToDomain(record: any): SLAPolicy {
    return SLAPolicy.rehydrate({
      id: record.id,
      name: record.name,
      requestType: record.requestType,
      priority: record.priority,
      responseTime: record.responseTime,
      resolutionTime: record.resolutionTime,
      escalationTime: record.escalationTime,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
