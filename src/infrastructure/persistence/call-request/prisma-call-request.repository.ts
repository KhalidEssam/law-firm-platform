// src/infrastructure/persistence/call-request/prisma-call-request.repository.ts

import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CallRequest } from '../../../core/domain/call-request/entities/call-request.entity';
import {
  CallStatus,
  mapPrismaStatusToCallStatus,
  // mapCallStatusToPrisma - unused
} from '../../../core/domain/call-request/value-objects/call-status.vo';
import {
  ICallRequestRepository,
  CallRequestFilter,
  PaginationOptions,
  PaginatedResult,
} from '../../../core/application/call-request/ports/call-request.repository';

@Injectable()
export class PrismaCallRequestRepository implements ICallRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // MAPPING METHODS
  // ============================================

  private mapToDomain(data: any): CallRequest {
    return CallRequest.rehydrate({
      id: data.id,
      requestNumber: data.requestNumber,
      subscriberId: data.subscriberId,
      assignedProviderId: data.assignedProviderId,
      consultationType: data.consultationType,
      purpose: data.purpose,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      status: mapPrismaStatusToCallStatus(data.status),
      scheduledAt: data.scheduledAt,
      scheduledDuration: data.scheduledDuration,
      actualDuration: data.actualDuration,
      callStartedAt: data.callStartedAt,
      callEndedAt: data.callEndedAt,
      recordingUrl: data.recordingUrl,
      callPlatform: data.callPlatform,
      callLink: data.callLink,
      submittedAt: data.submittedAt,
      completedAt: data.completedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private mapStatusToPrisma(status: CallStatus): RequestStatus {
    const statusMap: Record<CallStatus, RequestStatus> = {
      [CallStatus.PENDING]: RequestStatus.pending,
      [CallStatus.ASSIGNED]: RequestStatus.assigned,
      [CallStatus.SCHEDULED]: RequestStatus.scheduled,
      [CallStatus.IN_PROGRESS]: RequestStatus.in_progress,
      [CallStatus.COMPLETED]: RequestStatus.completed,
      [CallStatus.CANCELLED]: RequestStatus.cancelled,
      [CallStatus.NO_SHOW]: RequestStatus.cancelled,
      [CallStatus.RESCHEDULED]: RequestStatus.scheduled,
    };
    return statusMap[status];
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async create(callRequest: CallRequest): Promise<CallRequest> {
    const data = callRequest.toObject();
    const created = await this.prisma.callRequest.create({
      data: {
        id: data.id,
        requestNumber: data.requestNumber,
        subscriberId: data.subscriberId,
        assignedProviderId: data.assignedProviderId,
        consultationType: data.consultationType,
        purpose: data.purpose,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        status: this.mapStatusToPrisma(data.status),
        scheduledAt: data.scheduledAt,
        scheduledDuration: data.scheduledDuration,
        actualDuration: data.actualDuration,
        callStartedAt: data.callStartedAt,
        callEndedAt: data.callEndedAt,
        recordingUrl: data.recordingUrl,
        callPlatform: data.callPlatform,
        callLink: data.callLink,
        submittedAt: data.submittedAt,
        completedAt: data.completedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
    return this.mapToDomain(created);
  }

  async update(callRequest: CallRequest): Promise<CallRequest> {
    const data = callRequest.toObject();
    const updated = await this.prisma.callRequest.update({
      where: { id: data.id },
      data: {
        assignedProviderId: data.assignedProviderId,
        consultationType: data.consultationType,
        purpose: data.purpose,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        status: this.mapStatusToPrisma(data.status),
        scheduledAt: data.scheduledAt,
        scheduledDuration: data.scheduledDuration,
        actualDuration: data.actualDuration,
        callStartedAt: data.callStartedAt,
        callEndedAt: data.callEndedAt,
        recordingUrl: data.recordingUrl,
        callPlatform: data.callPlatform,
        callLink: data.callLink,
        completedAt: data.completedAt,
        updatedAt: new Date(),
      },
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.callRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.callRequest.delete({
      where: { id },
    });
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  async findById(id: string): Promise<CallRequest | null> {
    const data = await this.prisma.callRequest.findUnique({
      where: { id, deletedAt: null },
    });
    return data ? this.mapToDomain(data) : null;
  }

  async findByRequestNumber(
    requestNumber: string,
  ): Promise<CallRequest | null> {
    const data = await this.prisma.callRequest.findUnique({
      where: { requestNumber, deletedAt: null },
    });
    return data ? this.mapToDomain(data) : null;
  }

  async findAll(
    filter?: CallRequestFilter,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CallRequest>> {
    const where: Prisma.CallRequestWhereInput = { deletedAt: null };

    if (filter?.subscriberId) where.subscriberId = filter.subscriberId;
    if (filter?.assignedProviderId)
      where.assignedProviderId = filter.assignedProviderId;
    if (filter?.consultationType)
      where.consultationType = filter.consultationType;

    if (filter?.status) {
      if (Array.isArray(filter.status)) {
        where.status = {
          in: filter.status.map((s) => this.mapStatusToPrisma(s)),
        };
      } else {
        where.status = this.mapStatusToPrisma(filter.status);
      }
    }

    if (filter?.scheduledAfter || filter?.scheduledBefore) {
      where.scheduledAt = {};
      if (filter.scheduledAfter) where.scheduledAt.gte = filter.scheduledAfter;
      if (filter.scheduledBefore)
        where.scheduledAt.lte = filter.scheduledBefore;
    }

    if (filter?.createdAfter || filter?.createdBefore) {
      where.createdAt = {};
      if (filter.createdAfter) where.createdAt.gte = filter.createdAfter;
      if (filter.createdBefore) where.createdAt.lte = filter.createdBefore;
    }

    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDirection = pagination?.orderDirection || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.callRequest.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [orderBy]: orderDirection },
      }),
      this.prisma.callRequest.count({ where }),
    ]);

    return {
      data: data.map((d) => this.mapToDomain(d)),
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  async findBySubscriber(
    subscriberId: string,
    options?: PaginationOptions,
  ): Promise<CallRequest[]> {
    const data = await this.prisma.callRequest.findMany({
      where: { subscriberId, deletedAt: null },
      take: options?.limit || 20,
      skip: options?.offset || 0,
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.orderDirection || 'desc',
      },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  async findByProvider(
    providerId: string,
    options?: PaginationOptions,
  ): Promise<CallRequest[]> {
    const data = await this.prisma.callRequest.findMany({
      where: { assignedProviderId: providerId, deletedAt: null },
      take: options?.limit || 20,
      skip: options?.offset || 0,
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.orderDirection || 'desc',
      },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  async findByStatus(
    status: CallStatus | CallStatus[],
    options?: PaginationOptions,
  ): Promise<CallRequest[]> {
    const statusArray = Array.isArray(status) ? status : [status];
    const prismaStatuses = statusArray.map((s) => this.mapStatusToPrisma(s));

    const data = await this.prisma.callRequest.findMany({
      where: {
        status: { in: prismaStatuses },
        deletedAt: null,
      },
      take: options?.limit || 20,
      skip: options?.offset || 0,
      orderBy: {
        [options?.orderBy || 'createdAt']: options?.orderDirection || 'desc',
      },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  async findScheduledCalls(
    startDate: Date,
    endDate: Date,
    providerId?: string,
  ): Promise<CallRequest[]> {
    const where: Prisma.CallRequestWhereInput = {
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
      status: { in: [RequestStatus.scheduled, RequestStatus.in_progress] },
      deletedAt: null,
    };

    if (providerId) where.assignedProviderId = providerId;

    const data = await this.prisma.callRequest.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  async findUpcomingCallsForProvider(
    providerId: string,
    limit: number = 10,
  ): Promise<CallRequest[]> {
    const now = new Date();
    const data = await this.prisma.callRequest.findMany({
      where: {
        assignedProviderId: providerId,
        scheduledAt: { gte: now },
        status: RequestStatus.assigned,
        deletedAt: null,
      },
      take: limit,
      orderBy: { scheduledAt: 'asc' },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  async findOverdueCalls(): Promise<CallRequest[]> {
    const now = new Date();
    const data = await this.prisma.callRequest.findMany({
      where: {
        scheduledAt: { lt: now },
        status: RequestStatus.assigned,
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return data.map((d) => this.mapToDomain(d));
  }

  // ============================================
  // AGGREGATION OPERATIONS
  // ============================================

  async countByStatus(status: CallStatus): Promise<number> {
    return await this.prisma.callRequest.count({
      where: {
        status: this.mapStatusToPrisma(status),
        deletedAt: null,
      },
    });
  }

  async countBySubscriber(
    subscriberId: string,
    status?: CallStatus,
  ): Promise<number> {
    const where: Prisma.CallRequestWhereInput = {
      subscriberId,
      deletedAt: null,
    };
    if (status) where.status = this.mapStatusToPrisma(status);

    return await this.prisma.callRequest.count({ where });
  }

  async countByProvider(
    providerId: string,
    status?: CallStatus,
  ): Promise<number> {
    const where: Prisma.CallRequestWhereInput = {
      assignedProviderId: providerId,
      deletedAt: null,
    };
    if (status) where.status = this.mapStatusToPrisma(status);

    return await this.prisma.callRequest.count({ where });
  }

  async getTotalCallMinutes(
    subscriberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.callRequest.aggregate({
      where: {
        subscriberId,
        status: RequestStatus.completed,
        callEndedAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      _sum: {
        actualDuration: true,
      },
    });
    return result._sum.actualDuration || 0;
  }

  async findConflictingCalls(
    providerId: string,
    scheduledAt: Date,
    durationMinutes: number,
  ): Promise<CallRequest[]> {
    const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    const data = await this.prisma.callRequest.findMany({
      where: {
        assignedProviderId: providerId,
        status: { in: [RequestStatus.scheduled, RequestStatus.in_progress] },
        deletedAt: null,
        AND: [
          {
            OR: [
              // Existing call starts during new call
              {
                scheduledAt: {
                  gte: scheduledAt,
                  lt: endTime,
                },
              },
              // Existing call ends during new call
              {
                AND: [
                  { scheduledAt: { lt: scheduledAt } },
                  { scheduledDuration: { not: null } },
                ],
              },
            ],
          },
        ],
      },
    });

    // Further filter for overlapping calls
    return data
      .filter((d) => {
        if (!d.scheduledAt || !d.scheduledDuration) return false;
        const existingEnd = new Date(
          d.scheduledAt.getTime() + d.scheduledDuration * 60000,
        );
        // Check for overlap
        return d.scheduledAt < endTime && existingEnd > scheduledAt;
      })
      .map((d) => this.mapToDomain(d));
  }

  // ============================================
  // EXISTENCE CHECKS
  // ============================================

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.callRequest.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async hasPendingCalls(subscriberId: string): Promise<boolean> {
    const count = await this.prisma.callRequest.count({
      where: {
        subscriberId,
        status: { in: [RequestStatus.pending, RequestStatus.assigned] },
        deletedAt: null,
      },
    });
    return count > 0;
  }

  async isProviderAvailable(
    providerId: string,
    scheduledAt: Date,
    durationMinutes: number,
  ): Promise<boolean> {
    const conflicts = await this.findConflictingCalls(
      providerId,
      scheduledAt,
      durationMinutes,
    );
    return conflicts.length === 0;
  }
}
