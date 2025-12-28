// ============================================
// PRISMA ROUTING DATA PROVIDER
// src/infrastructure/persistence/routing/prisma-routing-data-provider.ts
// ============================================

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RequestStatus, VerificationStatus } from '@prisma/client';
import {
  IRoutingDataProvider,
  ProviderDetails,
  RequestAssignmentData,
  RequestStatusType,
} from '../../../core/application/routing/ports/routing-data-provider';
import { ProviderInfo } from '../../../core/domain/routing/value-objects/provider-target.vo';

/**
 * Map domain status to Prisma status
 */
function mapStatusToPrisma(status: RequestStatusType): RequestStatus {
  const mapping: Record<RequestStatusType, RequestStatus> = {
    pending: RequestStatus.pending,
    assigned: RequestStatus.assigned,
    in_progress: RequestStatus.in_progress,
    quote_sent: RequestStatus.quote_sent,
    completed: RequestStatus.completed,
    cancelled: RequestStatus.cancelled,
    closed: RequestStatus.closed,
  };
  return mapping[status];
}

@Injectable()
export class PrismaRoutingDataProvider implements IRoutingDataProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableProviders(): Promise<ProviderDetails[]> {
    const providerUsers = await this.prisma.providerUser.findMany({
      where: {
        isActive: true,
        canAcceptRequests: true,
        deletedAt: null,
        provider: {
          isActive: true,
          verificationStatus: VerificationStatus.approved,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        provider: {
          include: {
            specializations: {
              include: {
                specialization: true,
              },
            },
          },
        },
      },
    });

    return providerUsers.map((pu) => ({
      userId: pu.userId,
      fullName: pu.user.fullName,
      username: pu.user.username,
      providerId: pu.providerId,
      isActive: pu.isActive,
      canAcceptRequests: pu.canAcceptRequests,
      specializations: pu.provider.specializations.map(
        (ps) => ps.specialization.name,
      ),
      isCertified: pu.provider.specializations.some((s) => s.isCertified),
      experienceYears: pu.provider.specializations.reduce(
        (max, s) => Math.max(max, s.experienceYears || 0),
        0,
      ),
    }));
  }

  async getProviderActiveRequestCount(providerId: string): Promise<number> {
    const activeStatuses = [
      RequestStatus.pending,
      RequestStatus.assigned,
      RequestStatus.in_progress,
      RequestStatus.quote_sent,
    ];

    const [consultations, opinions, services, litigations, calls] =
      await Promise.all([
        this.prisma.consultationRequest.count({
          where: {
            assignedProviderId: providerId,
            status: { in: activeStatuses },
          },
        }),
        this.prisma.legalOpinionRequest.count({
          where: {
            assignedProviderId: providerId,
            status: { in: activeStatuses },
          },
        }),
        this.prisma.serviceRequest.count({
          where: {
            assignedProviderId: providerId,
            status: { in: activeStatuses },
          },
        }),
        this.prisma.litigationCase.count({
          where: {
            assignedProviderId: providerId,
            status: { in: activeStatuses },
          },
        }),
        this.prisma.callRequest.count({
          where: {
            assignedProviderId: providerId,
            status: { in: activeStatuses },
          },
        }),
      ]);

    return consultations + opinions + services + litigations + calls;
  }

  async getProviderRequestCountByStatus(
    providerId: string,
    statuses: RequestStatusType[],
  ): Promise<number> {
    const prismaStatuses = statuses.map(mapStatusToPrisma);

    const [c, o, s, l, call] = await Promise.all([
      this.prisma.consultationRequest.count({
        where: {
          assignedProviderId: providerId,
          status: { in: prismaStatuses },
        },
      }),
      this.prisma.legalOpinionRequest.count({
        where: {
          assignedProviderId: providerId,
          status: { in: prismaStatuses },
        },
      }),
      this.prisma.serviceRequest.count({
        where: {
          assignedProviderId: providerId,
          status: { in: prismaStatuses },
        },
      }),
      this.prisma.litigationCase.count({
        where: {
          assignedProviderId: providerId,
          status: { in: prismaStatuses },
        },
      }),
      this.prisma.callRequest.count({
        where: {
          assignedProviderId: providerId,
          status: { in: prismaStatuses },
        },
      }),
    ]);

    return c + o + s + l + call;
  }

  async getProviderCompletedTodayCount(providerId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [c, o, s, l, call] = await Promise.all([
      this.prisma.consultationRequest.count({
        where: {
          assignedProviderId: providerId,
          status: RequestStatus.completed,
          completedAt: { gte: startOfDay },
        },
      }),
      this.prisma.legalOpinionRequest.count({
        where: {
          assignedProviderId: providerId,
          status: RequestStatus.completed,
          completedAt: { gte: startOfDay },
        },
      }),
      this.prisma.serviceRequest.count({
        where: {
          assignedProviderId: providerId,
          status: RequestStatus.completed,
          completedAt: { gte: startOfDay },
        },
      }),
      this.prisma.litigationCase.count({
        where: {
          assignedProviderId: providerId,
          status: RequestStatus.closed,
          closedAt: { gte: startOfDay },
        },
      }),
      this.prisma.callRequest.count({
        where: {
          assignedProviderId: providerId,
          status: RequestStatus.completed,
          completedAt: { gte: startOfDay },
        },
      }),
    ]);

    return c + o + s + l + call;
  }

  async getProviderRating(providerId: string): Promise<number | undefined> {
    const result = await this.prisma.providerReview.aggregate({
      where: { providerId, isPublic: true },
      _avg: { rating: true },
    });
    return result._avg.rating || undefined;
  }

  async getProviderUserDetails(userId: string): Promise<{
    fullName: string | null;
    username: string | null;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, username: true },
    });
    return user;
  }

  async verifyProviderAvailable(userId: string): Promise<{
    isAvailable: boolean;
    fullName?: string;
    username?: string;
  }> {
    const provider = await this.prisma.providerUser.findFirst({
      where: {
        userId,
        isActive: true,
        canAcceptRequests: true,
      },
      include: {
        user: {
          select: { fullName: true, username: true },
        },
      },
    });

    if (!provider) {
      return { isAvailable: false };
    }

    return {
      isAvailable: true,
      fullName: provider.user.fullName || undefined,
      username: provider.user.username || undefined,
    };
  }

  async assignRequestToProvider(data: RequestAssignmentData): Promise<void> {
    const now = data.assignedAt || new Date();

    switch (data.requestType) {
      case 'consultation':
        await this.prisma.consultationRequest.update({
          where: { id: data.requestId },
          data: {
            assignedProviderId: data.providerId,
            assignedAt: now,
            status: RequestStatus.assigned,
          },
        });
        break;

      case 'legal_opinion':
        await this.prisma.legalOpinionRequest.update({
          where: { id: data.requestId },
          data: {
            assignedProviderId: data.providerId,
            status: RequestStatus.assigned,
          },
        });
        break;

      case 'service':
        await this.prisma.serviceRequest.update({
          where: { id: data.requestId },
          data: {
            assignedProviderId: data.providerId,
            status: RequestStatus.assigned,
          },
        });
        break;

      case 'litigation':
        await this.prisma.litigationCase.update({
          where: { id: data.requestId },
          data: {
            assignedProviderId: data.providerId,
            status: RequestStatus.assigned,
          },
        });
        break;

      case 'call':
        await this.prisma.callRequest.update({
          where: { id: data.requestId },
          data: {
            assignedProviderId: data.providerId,
            status: RequestStatus.assigned,
          },
        });
        break;

      default:
        throw new BadRequestException(
          `Unknown request type: ${data.requestType}`,
        );
    }
  }

  async updateRequestProvider(data: RequestAssignmentData): Promise<void> {
    switch (data.requestType) {
      case 'consultation':
        await this.prisma.consultationRequest.update({
          where: { id: data.requestId },
          data: { assignedProviderId: data.providerId },
        });
        break;

      case 'legal_opinion':
        await this.prisma.legalOpinionRequest.update({
          where: { id: data.requestId },
          data: { assignedProviderId: data.providerId },
        });
        break;

      case 'service':
        await this.prisma.serviceRequest.update({
          where: { id: data.requestId },
          data: { assignedProviderId: data.providerId },
        });
        break;

      case 'litigation':
        await this.prisma.litigationCase.update({
          where: { id: data.requestId },
          data: { assignedProviderId: data.providerId },
        });
        break;

      case 'call':
        await this.prisma.callRequest.update({
          where: { id: data.requestId },
          data: { assignedProviderId: data.providerId },
        });
        break;

      default:
        throw new BadRequestException(
          `Unknown request type: ${data.requestType}`,
        );
    }
  }

  async getProviderInfoForRouting(
    requestType: string,
  ): Promise<ProviderInfo[]> {
    const providers = await this.getAvailableProviders();
    const providerInfos: ProviderInfo[] = [];

    for (const provider of providers) {
      const [activeRequestCount, rating] = await Promise.all([
        this.getProviderActiveRequestCount(provider.userId),
        this.getProviderRating(provider.providerId),
      ]);

      providerInfos.push({
        id: provider.userId,
        isActive: provider.isActive,
        canAcceptRequests: provider.canAcceptRequests,
        activeRequestCount,
        rating,
        specializations: provider.specializations,
        region: undefined,
        isCertified: provider.isCertified,
        experienceYears: provider.experienceYears,
      });
    }

    return providerInfos;
  }
}
