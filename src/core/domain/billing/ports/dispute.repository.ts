// ============================================
// DISPUTE REPOSITORY PORT
// src/core/domain/billing/ports/dispute.repository.ts
// ============================================

import { Dispute, DisputeResolutionData, DisputeEscalationData } from '../entities/dispute.entity';
import { DisputeStatusEnum } from '../value-objects/dispute-status.vo';
import { PriorityEnum } from '../value-objects/priority.vo';

export interface DisputeListOptions {
    userId?: string;
    status?: DisputeStatusEnum;
    priority?: PriorityEnum;
    resolvedBy?: string;
    escalatedTo?: string;
    consultationId?: string;
    legalOpinionId?: string;
    serviceRequestId?: string;
    litigationCaseId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'priority' | 'resolvedAt' | 'escalatedAt';
    orderDir?: 'asc' | 'desc';
}

export interface DisputeCountOptions {
    userId?: string;
    status?: DisputeStatusEnum;
    priority?: PriorityEnum;
    resolvedBy?: string;
    escalatedTo?: string;
    consultationId?: string;
    legalOpinionId?: string;
    serviceRequestId?: string;
    litigationCaseId?: string;
    fromDate?: Date;
    toDate?: Date;
}

export interface DisputeStatistics {
    totalOpen: number;
    totalUnderReview: number;
    totalEscalated: number;
    totalResolved: number;
    totalClosed: number;
    averageResolutionTime: number | null;
    byPriority: {
        low: number;
        normal: number;
        high: number;
        urgent: number;
    };
}

export interface IDisputeRepository {
    // ============================================
    // CREATE
    // ============================================
    create(dispute: Dispute): Promise<Dispute>;

    // ============================================
    // READ
    // ============================================
    findById(id: string): Promise<Dispute | null>;
    findByUserId(userId: string): Promise<Dispute[]>;
    findByConsultationId(consultationId: string): Promise<Dispute[]>;
    findByLegalOpinionId(legalOpinionId: string): Promise<Dispute[]>;
    findByServiceRequestId(serviceRequestId: string): Promise<Dispute[]>;
    findByLitigationCaseId(litigationCaseId: string): Promise<Dispute[]>;
    list(options?: DisputeListOptions): Promise<Dispute[]>;
    count(options?: DisputeCountOptions): Promise<number>;

    // ============================================
    // UPDATE
    // ============================================
    update(dispute: Dispute): Promise<Dispute>;
    startReview(id: string): Promise<Dispute>;
    escalate(id: string, escalationData: DisputeEscalationData): Promise<Dispute>;
    resolve(id: string, resolutionData: DisputeResolutionData): Promise<Dispute>;
    close(id: string): Promise<Dispute>;
    updatePriority(id: string, priority: PriorityEnum): Promise<Dispute>;

    // ============================================
    // DELETE
    // ============================================
    delete(id: string): Promise<void>;

    // ============================================
    // BUSINESS QUERIES
    // ============================================
    findOpenDisputes(): Promise<Dispute[]>;
    findActiveDisputes(): Promise<Dispute[]>;
    findEscalatedDisputes(): Promise<Dispute[]>;
    findHighPriorityDisputes(): Promise<Dispute[]>;
    findDisputesRequiringAttention(): Promise<Dispute[]>;
    findByResolver(resolvedBy: string): Promise<Dispute[]>;
    findByEscalatee(escalatedTo: string): Promise<Dispute[]>;
    getStatistics(fromDate?: Date, toDate?: Date): Promise<DisputeStatistics>;
    hasActiveDispute(
        relatedEntityType: 'consultation' | 'legal_opinion' | 'service_request' | 'litigation_case',
        relatedEntityId: string
    ): Promise<boolean>;
}
