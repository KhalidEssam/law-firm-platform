// src/core/domain/membership/repositories/service-usage.repository.ts

import { ServiceUsage } from '../entities/service-usage.entity';

export interface ServiceUsageFilter {
    membershipId?: string;
    serviceId?: string;
    periodStart?: Date;
    periodEnd?: Date;
    isBilled?: boolean;
    requestType?: 'consultation' | 'legal_opinion' | 'service' | 'litigation' | 'call';
}

export interface ServiceUsageSummary {
    serviceId: string;
    serviceName?: string;
    totalUsage: number;
    billedUsage: number;
    freeUsage: number;
    totalChargedAmount: number;
    currency: string;
}

export interface IServiceUsageRepository {
    /** Create a new service usage record */
    create(serviceUsage: ServiceUsage): Promise<ServiceUsage>;

    /** Find by ID */
    findById(id: string): Promise<ServiceUsage | null>;

    /** Find by membership ID with optional filters */
    findByMembershipId(
        membershipId: string,
        options?: {
            serviceId?: string;
            periodStart?: Date;
            periodEnd?: Date;
            limit?: number;
            offset?: number;
        }
    ): Promise<ServiceUsage[]>;

    /** Find by filter */
    findByFilter(filter: ServiceUsageFilter): Promise<ServiceUsage[]>;

    /** Count usage for membership and service in period */
    countUsageInPeriod(
        membershipId: string,
        serviceId: string,
        periodStart: Date,
        periodEnd: Date
    ): Promise<number>;

    /** Get usage summary by service for membership */
    getUsageSummaryByService(
        membershipId: string,
        periodStart?: Date,
        periodEnd?: Date
    ): Promise<ServiceUsageSummary[]>;

    /** Get total usage count for membership in period */
    getTotalUsageCount(
        membershipId: string,
        periodStart: Date,
        periodEnd: Date
    ): Promise<number>;

    /** Mark usage as billed */
    markAsBilled(id: string, amount: number, currency: string): Promise<ServiceUsage>;

    /** Get unbilled usage for membership */
    getUnbilledUsage(membershipId: string): Promise<ServiceUsage[]>;

    /** Delete service usage */
    delete(id: string): Promise<void>;

    /** Check if request has usage record */
    hasUsageForRequest(
        requestType: 'consultation' | 'legal_opinion' | 'service' | 'litigation' | 'call',
        requestId: string
    ): Promise<boolean>;
}
