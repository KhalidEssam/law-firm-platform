// ============================================
// PRISMA LEGAL OPINION REQUEST REPOSITORY
// Infrastructure Layer - Database Implementation
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  Prisma,
  RequestStatus as PrismaRequestStatus,
  PaymentStatus as PrismaPaymentStatus,
} from '@prisma/client';

import {
  ILegalOpinionRequestRepository,
  OpinionRequestFilters,
  PaginationParams,
  PaginatedResult,
  OpinionStatistics,
} from '../../../core/domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from '../../../core/domain/legal-opinion/entities/legal-opinion-request.entity';
import { OpinionRequestId } from '../../../core/domain/legal-opinion/value-objects/opinion-requestid.vo';
import { OpinionNumber } from '../../../core/domain/legal-opinion/value-objects/opinion-number.vo';
import { UserId } from '../../../core/domain/consultation/value-objects/consultation-request-domain';
import { OpinionSubject } from '../../../core/domain/legal-opinion/value-objects/opinion-subject.vo';
import { LegalQuestion } from '../../../core/domain/legal-opinion/value-objects/legal-question.vo';
import { BackgroundContext } from '../../../core/domain/legal-opinion/value-objects/background-context.vo';
import { RelevantFacts } from '../../../core/domain/legal-opinion/value-objects/relevant-facts.vo';
import { SpecificIssues } from '../../../core/domain/legal-opinion/value-objects/specific-issues.vo';
import { Jurisdiction } from '../../../core/domain/legal-opinion/value-objects/jurisdiction.vo';
import { OpinionStatusVO } from '../../../core/domain/legal-opinion/value-objects/opinion-status.vo';
import { OpinionStatus } from '../../../core/domain/legal-opinion/value-objects/opinion-status.vo';
import { OpinionTypeVO } from '../../../core/domain/legal-opinion/value-objects/opinion-type.vo';
import { OpinionPriorityVO } from '../../../core/domain/legal-opinion/value-objects/opinion-priority.vo';
import { OpinionPriority } from '../../../core/domain/legal-opinion/value-objects/opinion-priority.vo';
import { DeliveryFormatVO } from '../../../core/domain/legal-opinion/value-objects/delivery-format.vo';
import { Money } from '../../../core/domain/legal-opinion/value-objects/money.vo';
import { ConfidentialityLevel } from '../../../core/domain/legal-opinion/value-objects/confidentiality-level.vo';
import { OpinionType } from '../../../core/domain/legal-opinion/value-objects/opinion-type.vo';
import { DeliveryFormat } from '../../../core/domain/legal-opinion/value-objects/delivery-format.vo';
/**
 * Prisma Repository Implementation (Adapted to Current Schema)
 *
 * Maps between Domain entities and your existing database schema:
 *
 * Domain Entity Field → Database Field
 * - opinionNumber → requestNumber
 * - clientId → subscriberId
 * - assignedLawyerId → assignedProviderId
 * - legalQuestion → description
 * - backgroundContext → caseDetails (JSON)
 * - relevantFacts → caseDetails (JSON)
 * - etc.
 */

@Injectable()
export class PrismaLegalOpinionRequestRepository
  implements ILegalOpinionRequestRepository
{
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async save(opinion: LegalOpinionRequest): Promise<LegalOpinionRequest> {
    const data = this.toPrisma(opinion);

    const created = await this.prisma.legalOpinionRequest.create({
      data,
      include: this.getIncludeRelations(),
    });

    return this.toDomain(created);
  }

  async update(opinion: LegalOpinionRequest): Promise<LegalOpinionRequest> {
    const data = this.toPrisma(opinion);
    const { id: _id, ...updateData } = data;

    const updated = await this.prisma.legalOpinionRequest.update({
      where: { id: opinion.id.getValue() },
      data: updateData,
      include: this.getIncludeRelations(),
    });

    return this.toDomain(updated);
  }

  async findById(id: OpinionRequestId): Promise<LegalOpinionRequest | null> {
    const opinion = await this.prisma.legalOpinionRequest.findUnique({
      where: { id: id.getValue() },
      include: this.getIncludeRelations(),
    });

    return opinion ? this.toDomain(opinion) : null;
  }

  async findByOpinionNumber(
    opinionNumber: string,
  ): Promise<LegalOpinionRequest | null> {
    // Schema uses 'requestNumber' instead of 'opinionNumber'
    const opinion = await this.prisma.legalOpinionRequest.findUnique({
      where: { requestNumber: opinionNumber },
      include: this.getIncludeRelations(),
    });

    return opinion ? this.toDomain(opinion) : null;
  }

  async findAll(
    filters?: OpinionRequestFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>> {
    const where = this.buildWhereClause(filters);
    const { skip, take, orderBy } = this.buildPaginationClause(pagination);

    const [opinions, total] = await Promise.all([
      this.prisma.legalOpinionRequest.findMany({
        where,
        skip,
        take,
        orderBy,
        include: this.getIncludeRelations(),
      }),
      this.prisma.legalOpinionRequest.count({ where }),
    ]);

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return {
      data: opinions.map((o) => this.toDomain(o)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async delete(id: OpinionRequestId): Promise<boolean> {
    try {
      await this.prisma.legalOpinionRequest.update({
        where: { id: id.getValue() },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // QUERY BY USER
  // ============================================

  async findByClientId(
    clientId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>> {
    return this.findAll({ clientId: clientId.getValue() }, pagination);
  }

  async findByLawyerId(
    lawyerId: UserId,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>> {
    return this.findAll({ assignedLawyerId: lawyerId.getValue() }, pagination);
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  async findOverdue(
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>> {
    // For now, return all in-progress opinions
    // You can enhance this with SLA logic later
    return this.findAll(
      { status: OpinionStatus.DRAFTING as any }, // Map to 'in_progress' in your schema
      pagination,
    );
  }

  async findUnpaid(
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>> {
    const where: Prisma.LegalOpinionRequestWhereInput = {
      status: PrismaRequestStatus.completed,

      paymentStatus: PrismaPaymentStatus.pending,
      deletedAt: null,
    };

    const { skip, take, orderBy } = this.buildPaginationClause(pagination);

    const [opinions, total] = await Promise.all([
      this.prisma.legalOpinionRequest.findMany({
        where,
        skip,
        take,
        orderBy,
        include: this.getIncludeRelations(),
      }),
      this.prisma.legalOpinionRequest.count({ where }),
    ]);

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return {
      data: opinions.map((o) => this.toDomain(o)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async findByStatuses(
    statuses: OpinionStatus[],
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>> {
    // Map domain statuses to database statuses
    statuses.map((s) => this.mapDomainStatusToDb(s));

    return this.findAll({ status: statuses as any }, pagination);
  }

  async findByPriority(
    _priority: OpinionPriority,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<LegalOpinionRequest>> {
    // Schema doesn't have priority field yet - return all for now
    return this.findAll({}, pagination);
  }

  // ============================================
  // COUNTS & STATISTICS
  // ============================================

  async count(filters?: OpinionRequestFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.legalOpinionRequest.count({ where });
  }

  async getStatistics(
    filters?: OpinionRequestFilters,
  ): Promise<OpinionStatistics> {
    const where = this.buildWhereClause(filters);

    // Get total count
    const total = await this.prisma.legalOpinionRequest.count({ where });

    // Get counts by status
    const statusCounts = await this.prisma.legalOpinionRequest.groupBy({
      by: ['status'],
      where,
      _count: true,
    });
    const byStatus: Record<string, number> = {};
    statusCounts.forEach((item) => {
      byStatus[item.status] = item._count;
    });

    // Your schema doesn't have type/priority fields
    // Return empty objects for now
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    // Payment stats
    const paidCount = await this.prisma.legalOpinionRequest.count({
      where: { ...where, paymentStatus: PrismaPaymentStatus.paid },
    });

    const unpaidCount = await this.prisma.legalOpinionRequest.count({
      where: { ...where, paymentStatus: { in: [PrismaPaymentStatus.pending] } },
    });

    // Revenue statistics

    const revenueStats = await this.prisma.legalOpinionRequest.aggregate({
      where: {
        ...where,
        quoteAmount: { not: null },
        paymentStatus: PrismaPaymentStatus.paid,
      },
      _sum: { quoteAmount: true },
      _avg: { quoteAmount: true },
    });

    // Calculate average completion time
    const completedOpinions = await this.prisma.legalOpinionRequest.findMany({
      where: {
        ...where,
        status: 'completed',
      },
      select: {
        submittedAt: true,
        completedAt: true,
      },
    });

    let averageCompletionTime = 0;
    if (completedOpinions.length > 0) {
      const totalHours = completedOpinions.reduce((sum, opinion) => {
        if (opinion.submittedAt && opinion.completedAt) {
          const hours =
            (opinion.completedAt.getTime() - opinion.submittedAt.getTime()) /
            (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);
      averageCompletionTime = totalHours / completedOpinions.length;
    }

    return {
      total,
      byStatus,
      byType,
      byPriority,
      averageCompletionTime,
      overdueCount: 0, // Implement SLA logic later
      paidCount,
      unpaidCount,
      totalRevenue: revenueStats._sum.quoteAmount || 0,
      averageRevenue: revenueStats._avg.quoteAmount || 0,
    };
  }

  async countByClientId(clientId: UserId): Promise<number> {
    return this.count({ clientId: clientId.getValue() });
  }

  async countByLawyerId(lawyerId: UserId): Promise<number> {
    return this.count({ assignedLawyerId: lawyerId.getValue() });
  }

  async getLawyerWorkload(lawyerId: UserId): Promise<number> {
    return this.prisma.legalOpinionRequest.count({
      where: {
        assignedProviderId: lawyerId.getValue(),
        status: {
          in: [
            PrismaRequestStatus.in_progress,
            PrismaRequestStatus.quote_accepted,
          ],
        },
        deletedAt: null,
      },
    });
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  async findNeedingSLAUpdate(): Promise<LegalOpinionRequest[]> {
    // Implement SLA logic based on your business rules
    const opinions = await this.prisma.legalOpinionRequest.findMany({
      where: {
        status: { in: ['in_progress', 'quote_accepted'] },
        deletedAt: null,
      },
      include: this.getIncludeRelations(),
    });

    return opinions.map((o) => this.toDomain(o));
  }

  async batchUpdate(
    opinions: LegalOpinionRequest[],
  ): Promise<LegalOpinionRequest[]> {
    const updates = opinions.map((opinion) => {
      const data = this.toPrisma(opinion);
      const { id: _id, ...updateData } = data;

      return this.prisma.legalOpinionRequest.update({
        where: { id: opinion.id.getValue() },
        data: updateData,
        include: this.getIncludeRelations(),
      });
    });

    const updated = await Promise.all(updates);
    return updated.map((o) => this.toDomain(o));
  }

  // ============================================
  // EXISTENCE CHECKS
  // ============================================

  async exists(id: OpinionRequestId): Promise<boolean> {
    const count = await this.prisma.legalOpinionRequest.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async existsByOpinionNumber(opinionNumber: string): Promise<boolean> {
    const count = await this.prisma.legalOpinionRequest.count({
      where: { requestNumber: opinionNumber },
    });
    return count > 0;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(
    filters?: OpinionRequestFilters,
  ): Prisma.LegalOpinionRequestWhereInput {
    if (!filters) return { deletedAt: null };

    const where: Prisma.LegalOpinionRequestWhereInput = {
      deletedAt: null,
    };

    // Client ID (schema uses subscriberId)
    if (filters.clientId) {
      where.subscriberId = filters.clientId;
    }

    // Assigned Lawyer ID (schema uses assignedProviderId)
    if (filters.assignedLawyerId) {
      where.assignedProviderId = filters.assignedLawyerId;
    }

    // Status - map domain statuses to database statuses
    if (filters.status) {
      const dbStatuses = Array.isArray(filters.status)
        ? filters.status.map((s) => this.mapDomainStatusToDb(s))
        : this.mapDomainStatusToDb(filters.status);
      where.status = Array.isArray(dbStatuses)
        ? { in: dbStatuses }
        : dbStatuses;
    }

    // Payment status
    if (filters.isPaid !== undefined) {
      where.paymentStatus = filters.isPaid
        ? PrismaPaymentStatus.paid
        : { in: [PrismaPaymentStatus.pending] };
    }

    // Search term (search in subject and description)
    if (filters.searchTerm) {
      where.OR = [
        { subject: { contains: filters.searchTerm, mode: 'insensitive' } },
        { description: { contains: filters.searchTerm, mode: 'insensitive' } },
      ];
    }

    // Date ranges
    if (filters.submittedFrom || filters.submittedTo) {
      where.submittedAt = {};
      if (filters.submittedFrom) {
        where.submittedAt.gte = filters.submittedFrom;
      }
      if (filters.submittedTo) {
        where.submittedAt.lte = filters.submittedTo;
      }
    }

    if (filters.completedFrom || filters.completedTo) {
      where.completedAt = {};
      if (filters.completedFrom) {
        where.completedAt.gte = filters.completedFrom;
      }
      if (filters.completedTo) {
        where.completedAt.lte = filters.completedTo;
      }
    }

    return where;
  }

  /**
   * Build pagination and sorting clause
   */
  private buildPaginationClause(pagination?: PaginationParams) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const take = limit;

    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const orderBy = { [sortBy]: sortOrder };

    return { skip, take, orderBy };
  }

  /**
   * Get relations to include in queries
   */
  private getIncludeRelations() {
    return {
      subscriber: true,
      assignedProvider: true,
      documents: true,
      messages: true,
      statusHistory: true,
      rating: true,
    };
  }

  /**
   * Map Domain Status to Database Status
   *
   * Domain → Database
   * DRAFT → pending
   * SUBMITTED → pending
   * ASSIGNED → quote_sent
   * IN_PROGRESS → in_progress
   * COMPLETED → completed
   * CANCELLED → cancelled
   */
  private mapDomainStatusToDb(
    status: OpinionStatus | string,
  ): PrismaRequestStatus {
    const statusMap: Record<string, PrismaRequestStatus> = {
      [OpinionStatus.DRAFT]: PrismaRequestStatus.pending,

      [OpinionStatus.SUBMITTED]: PrismaRequestStatus.pending,

      [OpinionStatus.UNDER_REVIEW]: PrismaRequestStatus.pending,

      [OpinionStatus.ASSIGNED]: PrismaRequestStatus.quote_sent,

      [OpinionStatus.RESEARCH_PHASE]: PrismaRequestStatus.quote_accepted,

      [OpinionStatus.DRAFTING]: PrismaRequestStatus.in_progress,

      [OpinionStatus.INTERNAL_REVIEW]: PrismaRequestStatus.in_progress,

      [OpinionStatus.REVISION_REQUESTED]: PrismaRequestStatus.in_progress,

      [OpinionStatus.REVISING]: PrismaRequestStatus.in_progress,

      [OpinionStatus.COMPLETED]: PrismaRequestStatus.completed,

      [OpinionStatus.CANCELLED]: PrismaRequestStatus.cancelled,

      [OpinionStatus.REJECTED]: PrismaRequestStatus.cancelled,
    };

    return statusMap[status] || PrismaRequestStatus.pending;
  }

  /**
   * Map Database Status to Domain Status
   */
  private mapDbStatusToDomain(dbStatus: string): OpinionStatus {
    const statusMap: Record<string, OpinionStatus> = {
      [PrismaRequestStatus.pending]: OpinionStatus.SUBMITTED,

      [PrismaRequestStatus.quote_sent]: OpinionStatus.ASSIGNED,

      [PrismaRequestStatus.quote_accepted]: OpinionStatus.RESEARCH_PHASE,

      [PrismaRequestStatus.in_progress]: OpinionStatus.DRAFTING,

      [PrismaRequestStatus.completed]: OpinionStatus.COMPLETED,

      [PrismaRequestStatus.disputed]: OpinionStatus.REVISION_REQUESTED,

      [PrismaRequestStatus.cancelled]: OpinionStatus.CANCELLED,
    };

    return statusMap[dbStatus] || OpinionStatus.SUBMITTED;
  }

  /**
   * Map Domain Entity to Prisma Model
   */
  private toPrisma(opinion: LegalOpinionRequest): any {
    // Store complex domain objects in JSON
    const caseDetails = {
      opinionType: opinion.opinionType.getValue(),
      backgroundContext: opinion.backgroundContext.getValue(),
      relevantFacts: opinion.relevantFacts.getValue(),
      specificIssues: opinion.specificIssues?.getValue(),
      jurisdiction: {
        country: opinion.jurisdiction.getCountry(),
        region: opinion.jurisdiction.getRegion(),
        city: opinion.jurisdiction.getCity(),
        legalSystem: opinion.jurisdiction.getLegalSystem(),
      },
      priority: opinion.priority.getValue(),
      deliveryFormat: opinion.deliveryFormat.getValue(),
      confidentialityLevel: opinion.confidentialityLevel.getValue(),
      includeExecutiveSummary: opinion.includeExecutiveSummary,
      includeCitations: opinion.includeCitations,
      includeRecommendations: opinion.includeRecommendations,
    };

    return {
      id: opinion.id.getValue(),
      requestNumber: opinion.opinionNumber.toString(),
      subscriberId: opinion.clientId.getValue(),
      assignedProviderId: opinion.assignedLawyerId?.getValue() || null,
      subject: opinion.subject.getValue(),
      description: opinion.legalQuestion.getValue(),
      caseDetails,
      status: this.mapDomainStatusToDb(opinion.status.getValue()),
      quoteAmount:
        opinion.estimatedCost?.getAmount() ||
        opinion.finalCost?.getAmount() ||
        null,
      quoteCurrency:
        opinion.estimatedCost?.getCurrency() ||
        opinion.finalCost?.getCurrency() ||
        'SAR',
      paymentStatus: opinion.isPaid
        ? PrismaPaymentStatus.paid
        : PrismaPaymentStatus.pending,
      paymentReference: opinion.paymentReference || null,
      submittedAt: opinion.submittedAt || new Date(),
      completedAt: opinion.completedAt || null,
      createdAt: opinion.createdAt,
      updatedAt: opinion.updatedAt,
      deletedAt: opinion.deletedAt || null,
    };
  }

  /**
   * Map Prisma Model to Domain Entity
   */
  private toDomain(data: any): LegalOpinionRequest {
    // Extract from JSON caseDetails
    const caseDetails = data.caseDetails || {};

    // Build jurisdiction
    const jurisdiction = Jurisdiction.create({
      country: caseDetails.jurisdiction?.country || 'Saudi Arabia',
      region: caseDetails.jurisdiction?.region,
      city: caseDetails.jurisdiction?.city,
      legalSystem: caseDetails.jurisdiction?.legalSystem,
    });

    // Build money value objects
    const estimatedCost = data.quoteAmount
      ? Money.create(data.quoteAmount, data.quoteCurrency || 'SAR')
      : undefined;

    const finalCost =
      data.paymentStatus === PrismaPaymentStatus.paid && data.quoteAmount
        ? Money.create(data.quoteAmount, data.quoteCurrency || 'SAR')
        : undefined;

    return LegalOpinionRequest.reconstitute({
      id: OpinionRequestId.create(data.id),
      opinionNumber: OpinionNumber.create(data.requestNumber),
      clientId: UserId.create(data.subscriberId),
      assignedLawyerId: data.assignedProviderId
        ? UserId.create(data.assignedProviderId)
        : undefined,
      reviewedBy: undefined,

      // Opinion Details
      opinionType: OpinionTypeVO.create(
        caseDetails.opinionType || OpinionType.LEGAL_ANALYSIS,
      ),
      subject: OpinionSubject.create(data.subject),
      legalQuestion: LegalQuestion.create(data.description),
      backgroundContext: BackgroundContext.create(
        caseDetails.backgroundContext || data.description,
      ),
      relevantFacts: RelevantFacts.create(
        caseDetails.relevantFacts || 'See case details',
      ),
      specificIssues: caseDetails.specificIssues
        ? SpecificIssues.create(caseDetails.specificIssues)
        : undefined,
      jurisdiction,

      // Priority & Deadlines
      priority: OpinionPriorityVO.create(
        caseDetails.priority || OpinionPriority.STANDARD,
      ),
      requestedDeliveryDate: undefined,
      actualDeliveryDate: data.deliveredAt,

      // Status & Workflow
      status: OpinionStatusVO.create(this.mapDbStatusToDomain(data.status)),
      draftVersion: 0,
      finalVersion: data.status === 'completed' ? 1 : undefined,

      // Deliverables
      deliveryFormat: DeliveryFormatVO.create(
        caseDetails.deliveryFormat || DeliveryFormat.PDF,
      ),
      includeExecutiveSummary: caseDetails.includeExecutiveSummary ?? true,
      includeCitations: caseDetails.includeCitations ?? true,
      includeRecommendations: caseDetails.includeRecommendations ?? true,

      // Pricing
      estimatedCost,
      finalCost,
      isPaid: data.paymentStatus === PrismaPaymentStatus.paid,
      paymentReference: data.paymentReference,

      // Timestamps
      submittedAt: data.submittedAt,
      assignedAt:
        data.status === PrismaRequestStatus.quote_sent ||
        data.status === PrismaRequestStatus.in_progress
          ? data.updatedAt
          : undefined,
      researchStartedAt:
        data.status === PrismaRequestStatus.in_progress
          ? data.updatedAt
          : undefined,
      draftCompletedAt:
        data.status === PrismaRequestStatus.completed
          ? data.completedAt
          : undefined,
      completedAt: data.completedAt,
      expectedCompletionDate: data.quoteValidUntil,

      // Metadata
      confidentialityLevel: ConfidentialityLevel.create(
        caseDetails.confidentialityLevel || 'standard',
      ),
      isUrgent: caseDetails.priority === OpinionPriority.URGENT,
      requiresCollaboration: false,

      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    });
  }
}
