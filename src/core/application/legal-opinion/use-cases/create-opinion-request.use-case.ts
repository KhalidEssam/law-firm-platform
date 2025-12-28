// ============================================
// USE CASES - PART 1: CRUD OPERATIONS
// Application Layer - Business Logic
// ============================================

import { Injectable, Inject } from '@nestjs/common';
// import { ILegalOpinionRequestRepository } from '../../../domain/legal-opinion/port/legal-opinion-request.repository.interface';
import { LegalOpinionRequest } from '../../../domain/legal-opinion/entities/legal-opinion-request.entity';
import { BackgroundContext } from '../../../domain/legal-opinion/value-objects/background-context.vo';
import { OpinionTypeVO } from 'src/core/domain/legal-opinion/value-objects/opinion-type.vo';
import { OpinionType } from 'src/core/domain/legal-opinion/value-objects/opinion-type.vo';
import { OpinionPriorityVO } from 'src/core/domain/legal-opinion/value-objects/opinion-priority.vo';
import { OpinionPriority } from 'src/core/domain/legal-opinion/value-objects/opinion-priority.vo';
import { DeliveryFormatVO } from 'src/core/domain/legal-opinion/value-objects/delivery-format.vo';
import { DeliveryFormat } from 'src/core/domain/legal-opinion/value-objects/delivery-format.vo';
import { ConfidentialityLevel } from 'src/core/domain/legal-opinion/value-objects/confidentiality-level.vo';
import { Jurisdiction } from 'src/core/domain/legal-opinion/value-objects/jurisdiction.vo';
import { SpecificIssues } from 'src/core/domain/legal-opinion/value-objects/specific-issues.vo';
import { RelevantFacts } from 'src/core/domain/legal-opinion/value-objects/relevant-facts.vo';
import { UserId } from 'src/core/domain/consultation/value-objects/consultation-request-domain';
import { OpinionSubject } from 'src/core/domain/legal-opinion/value-objects/opinion-subject.vo';
import { LegalQuestion } from 'src/core/domain/legal-opinion/value-objects/legal-question.vo';

import { type ILegalOpinionRequestRepository } from '../../../domain/legal-opinion/port/legal-opinion-request.repository.interface';
// ============================================
// CREATE OPINION REQUEST USE CASE
// ============================================

export interface CreateOpinionRequestCommand {
  clientId: string;
  opinionType: string;
  subject: string;
  legalQuestion: string;
  backgroundContext: string;
  relevantFacts: string;
  specificIssues?: string;
  jurisdiction: {
    country: string;
    region?: string;
    city?: string;
    legalSystem?: string;
  };
  priority?: string;
  requestedDeliveryDate?: string;
  deliveryFormat?: string;
  includeExecutiveSummary?: boolean;
  includeCitations?: boolean;
  includeRecommendations?: boolean;
  confidentialityLevel?: string;
}

@Injectable()
export class CreateOpinionRequestUseCase {
  constructor(
    @Inject('ILegalOpinionRequestRepository')
    private readonly repository: ILegalOpinionRequestRepository,
  ) {}

  async execute(command: CreateOpinionRequestCommand): Promise<any> {
    // Build jurisdiction
    const jurisdiction = Jurisdiction.create({
      country: command.jurisdiction.country,
      region: command.jurisdiction.region,
      city: command.jurisdiction.city,
      //   legalSystem: command.jurisdiction.legalSystem,
    });

    // Create opinion request entity
    const opinion = LegalOpinionRequest.create({
      clientId: UserId.create(command.clientId),
      opinionType: OpinionTypeVO.create(command.opinionType as OpinionType),
      subject: OpinionSubject.create(command.subject),
      legalQuestion: LegalQuestion.create(command.legalQuestion),
      backgroundContext: BackgroundContext.create(command.backgroundContext),
      relevantFacts: RelevantFacts.create(command.relevantFacts),
      specificIssues: command.specificIssues
        ? SpecificIssues.create(command.specificIssues)
        : undefined,
      jurisdiction,
      priority: OpinionPriorityVO.create(
        (command.priority as OpinionPriority) || OpinionPriority.STANDARD,
      ),
      requestedDeliveryDate: command.requestedDeliveryDate
        ? new Date(command.requestedDeliveryDate)
        : undefined,
      deliveryFormat: DeliveryFormatVO.create(
        (command.deliveryFormat as DeliveryFormat) || DeliveryFormat.PDF,
      ),
      includeExecutiveSummary: command.includeExecutiveSummary ?? true,
      includeCitations: command.includeCitations ?? true,
      includeRecommendations: command.includeRecommendations ?? true,
      confidentialityLevel: ConfidentialityLevel.create(
        command.confidentialityLevel || 'standard',
      ),
    });

    // Save to repository
    const saved = await this.repository.save(opinion);

    // Return DTO
    return this.toDto(saved);
  }

  private toDto(opinion: LegalOpinionRequest): any {
    return {
      id: opinion.id.getValue(),
      opinionNumber: opinion.opinionNumber.toString(),
      clientId: opinion.clientId.getValue(),
      assignedLawyerId: opinion.assignedLawyerId?.getValue(),
      opinionType: opinion.opinionType.getValue(),
      subject: opinion.subject.getValue(),
      legalQuestion: opinion.legalQuestion.getValue(),
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
      requestedDeliveryDate: opinion.requestedDeliveryDate?.toISOString(),
      actualDeliveryDate: opinion.actualDeliveryDate?.toISOString(),
      status: opinion.status.getValue(),
      draftVersion: opinion.draftVersion,
      finalVersion: opinion.finalVersion,
      deliveryFormat: opinion.deliveryFormat.getValue(),
      includeExecutiveSummary: opinion.includeExecutiveSummary,
      includeCitations: opinion.includeCitations,
      includeRecommendations: opinion.includeRecommendations,
      estimatedCost: opinion.estimatedCost
        ? {
            amount: opinion.estimatedCost.getAmount(),
            currency: opinion.estimatedCost.getCurrency(),
          }
        : undefined,
      finalCost: opinion.finalCost
        ? {
            amount: opinion.finalCost.getAmount(),
            currency: opinion.finalCost.getCurrency(),
          }
        : undefined,
      isPaid: opinion.isPaid,
      paymentReference: opinion.paymentReference,
      submittedAt: opinion.submittedAt?.toISOString(),
      assignedAt: opinion.assignedAt?.toISOString(),
      completedAt: opinion.completedAt?.toISOString(),
      expectedCompletionDate: opinion.expectedCompletionDate?.toISOString(),
      confidentialityLevel: opinion.confidentialityLevel.getValue(),
      isUrgent: opinion.isUrgent,
      createdAt: opinion.createdAt.toISOString(),
      updatedAt: opinion.updatedAt.toISOString(),
    };
  }
}
