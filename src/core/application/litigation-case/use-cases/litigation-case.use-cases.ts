// ============================================
// LITIGATION CASE USE CASES - ALL IN ONE FILE
// Application Layer - Business Logic
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { type ILitigationCaseRepository } from '../../../domain/litigation-case/port/litigation-case.repository';
import { LitigationCase } from '../../../domain/litigation-case/entities/litigation-case.entity';
import { LitigationStatusHistory } from '../../../domain/litigation-case/entities/litigation-status-history.entity';
import {
  CaseId,
  // CaseNumber,
  UserId,
  CaseType,
  CaseSubtype,
  CaseTitle,
  CaseDescription,
  // CaseStatus,
  CourtName,
  CaseDetails,
  Money,
  QuoteDetails,
  // PaymentReference,
} from '../../../domain/litigation-case/value-objects/litigation-case.vo';
import {
  type ILitigationUnitOfWork,
  LITIGATION_UNIT_OF_WORK,
} from '../../../domain/litigation-case/ports/litigation.uow';

// ============================================
// CREATE LITIGATION CASE
// ============================================

export interface CreateLitigationCaseCommand {
  subscriberId: string;
  caseType: string;
  caseSubtype?: string;
  title: string;
  description: string;
  courtName?: string;
  caseDetails?: any;
}

@Injectable()
export class CreateLitigationCaseUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(command: CreateLitigationCaseCommand): Promise<any> {
    const litigationCase = LitigationCase.create({
      subscriberId: UserId.create(command.subscriberId),
      caseType: CaseType.create(command.caseType),
      caseSubtype: command.caseSubtype
        ? CaseSubtype.create(command.caseSubtype)
        : undefined,
      title: CaseTitle.create(command.title),
      description: CaseDescription.create(command.description),
      courtName: command.courtName
        ? CourtName.create(command.courtName)
        : undefined,
      caseDetails: command.caseDetails
        ? CaseDetails.create(command.caseDetails)
        : undefined,
    });

    const saved = await this.repository.save(litigationCase);
    return this.toDto(saved);
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      subscriberId: litigationCase.subscriberId.getValue(),
      assignedProviderId: litigationCase.assignedProviderId?.getValue(),
      caseType: litigationCase.caseType.getValue(),
      caseSubtype: litigationCase.caseSubtype?.getValue(),
      title: litigationCase.title.getValue(),
      description: litigationCase.description.getValue(),
      courtName: litigationCase.courtName?.getValue(),
      caseDetails: litigationCase.caseDetails?.toJSON(),
      status: litigationCase.status.getValue(),
      quoteAmount: litigationCase.quoteAmount?.toJSON(),
      quoteDetails: litigationCase.quoteDetails?.toJSON(),
      quoteValidUntil: litigationCase.quoteValidUntil?.toISOString(),
      quoteAcceptedAt: litigationCase.quoteAcceptedAt?.toISOString(),
      paymentStatus: litigationCase.paymentStatus.getValue(),
      paymentReference: litigationCase.paymentReference?.getValue(),
      submittedAt: litigationCase.submittedAt.toISOString(),
      closedAt: litigationCase.closedAt?.toISOString(),
      createdAt: litigationCase.createdAt.toISOString(),
      updatedAt: litigationCase.updatedAt.toISOString(),
    };
  }
}

// ============================================
// UPDATE LITIGATION CASE
// ============================================

export interface UpdateLitigationCaseCommand {
  caseId: string;
  userId: string;
  title?: string;
  description?: string;
  courtName?: string;
  caseDetails?: any;
}

@Injectable()
export class UpdateLitigationCaseUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(command: UpdateLitigationCaseCommand): Promise<any> {
    const litigationCase = await this.repository.findById(
      CaseId.create(command.caseId),
    );

    if (!litigationCase) {
      throw new NotFoundException('Litigation case not found');
    }

    if (litigationCase.subscriberId.getValue() !== command.userId) {
      throw new ForbiddenException('You can only update your own cases');
    }

    if (!litigationCase.canBeModified()) {
      throw new BadRequestException('Cannot modify case in current status');
    }

    if (command.title) {
      litigationCase.updateTitle(CaseTitle.create(command.title));
    }

    if (command.description) {
      litigationCase.updateDescription(
        CaseDescription.create(command.description),
      );
    }

    if (command.courtName) {
      litigationCase.setCourtName(CourtName.create(command.courtName));
    }

    if (command.caseDetails) {
      litigationCase.updateDetails(CaseDetails.create(command.caseDetails));
    }

    const updated = await this.repository.update(litigationCase);
    return this.toDto(updated);
  }

  private toDto(litigationCase: LitigationCase): any {
    return new CreateLitigationCaseUseCase(this.repository as any)['toDto'](
      litigationCase,
    );
  }
}

// ============================================
// ASSIGN PROVIDER
// ============================================

export interface AssignProviderCommand {
  caseId: string;
  providerId: string;
  assignedBy: string;
}

@Injectable()
export class AssignProviderUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(command: AssignProviderCommand): Promise<any> {
    const litigationCase = await this.repository.findById(
      CaseId.create(command.caseId),
    );

    if (!litigationCase) {
      throw new NotFoundException('Litigation case not found');
    }

    litigationCase.assignProvider(UserId.create(command.providerId));

    const updated = await this.repository.update(litigationCase);
    return this.toDto(updated);
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      assignedProviderId: litigationCase.assignedProviderId?.getValue(),
      status: litigationCase.status.getValue(),
      updatedAt: litigationCase.updatedAt.toISOString(),
    };
  }
}

// ============================================
// SEND QUOTE
// ============================================

export interface SendQuoteCommand {
  caseId: string;
  providerId: string;
  amount: number;
  currency: string;
  validUntil: string;
  quoteDetails?: any;
}

@Injectable()
export class SendQuoteUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(command: SendQuoteCommand): Promise<any> {
    const litigationCase = await this.repository.findById(
      CaseId.create(command.caseId),
    );

    if (!litigationCase) {
      throw new NotFoundException('Litigation case not found');
    }

    if (litigationCase.assignedProviderId?.getValue() !== command.providerId) {
      throw new ForbiddenException('Only assigned provider can send quote');
    }

    const amount = Money.create(command.amount, command.currency);
    const validUntil = new Date(command.validUntil);
    const quoteDetails = command.quoteDetails
      ? QuoteDetails.create(command.quoteDetails)
      : undefined;

    litigationCase.sendQuote(amount, validUntil, quoteDetails);

    const updated = await this.repository.update(litigationCase);
    return this.toDto(updated);
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      status: litigationCase.status.getValue(),
      quoteAmount: litigationCase.quoteAmount?.toJSON(),
      quoteDetails: litigationCase.quoteDetails?.toJSON(),
      quoteValidUntil: litigationCase.quoteValidUntil?.toISOString(),
      updatedAt: litigationCase.updatedAt.toISOString(),
    };
  }
}

// ============================================
// ACCEPT QUOTE
// ============================================

export interface AcceptQuoteCommand {
  caseId: string;
  userId: string;
}

@Injectable()
export class AcceptQuoteUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(command: AcceptQuoteCommand): Promise<any> {
    const litigationCase = await this.repository.findById(
      CaseId.create(command.caseId),
    );

    if (!litigationCase) {
      throw new NotFoundException('Litigation case not found');
    }

    if (litigationCase.subscriberId.getValue() !== command.userId) {
      throw new ForbiddenException('Only case owner can accept quote');
    }

    litigationCase.acceptQuote();

    const updated = await this.repository.update(litigationCase);
    return this.toDto(updated);
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      status: litigationCase.status.getValue(),
      quoteAcceptedAt: litigationCase.quoteAcceptedAt?.toISOString(),
      updatedAt: litigationCase.updatedAt.toISOString(),
    };
  }
}

// ============================================
// MARK AS PAID (Uses UoW for ACID guarantees with status history)
// ============================================

export interface MarkAsPaidCommand {
  caseId: string;
  paymentReference: string;
  amount?: number;
  currency?: string;
  markedBy?: string;
}

@Injectable()
export class MarkAsPaidUseCase {
  constructor(
    @Inject(LITIGATION_UNIT_OF_WORK)
    private readonly litigationUow: ILitigationUnitOfWork,
  ) {}

  /**
   * Marks a litigation case as paid atomically with status history.
   *
   * All operations are atomic:
   * 1. Updates case payment status
   * 2. Creates status history record for audit
   */
  async execute(command: MarkAsPaidCommand): Promise<any> {
    return await this.litigationUow.transaction(async (uow) => {
      const litigationCase = await uow.cases.findById(
        CaseId.create(command.caseId),
      );

      if (!litigationCase) {
        throw new NotFoundException('Litigation case not found');
      }

      const oldStatus = litigationCase.status;
      const amount =
        command.amount && command.currency
          ? Money.create(command.amount, command.currency)
          : undefined;

      litigationCase.markAsPaid(command.paymentReference, amount);

      const updated = await uow.cases.update(litigationCase);

      // Create status history record atomically
      const statusHistory = LitigationStatusHistory.create({
        litigationCaseId: litigationCase.id,
        fromStatus: oldStatus,
        toStatus: updated.status,
        reason: `Payment received: ${command.paymentReference}`,
        changedBy: command.markedBy
          ? UserId.create(command.markedBy)
          : undefined,
      });
      await uow.statusHistories.create(statusHistory);

      return this.toDto(updated);
    });
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      paymentStatus: litigationCase.paymentStatus.getValue(),
      paymentReference: litigationCase.paymentReference?.getValue(),
      updatedAt: litigationCase.updatedAt.toISOString(),
    };
  }
}

// ============================================
// ACTIVATE CASE (Uses UoW for ACID guarantees with status history)
// ============================================

export interface ActivateCaseCommand {
  caseId: string;
  activatedBy?: string;
}

@Injectable()
export class ActivateCaseUseCase {
  constructor(
    @Inject(LITIGATION_UNIT_OF_WORK)
    private readonly litigationUow: ILitigationUnitOfWork,
  ) {}

  /**
   * Activates a litigation case atomically with status history.
   */
  async execute(command: ActivateCaseCommand): Promise<any> {
    return await this.litigationUow.transaction(async (uow) => {
      const litigationCase = await uow.cases.findById(
        CaseId.create(command.caseId),
      );

      if (!litigationCase) {
        throw new NotFoundException('Litigation case not found');
      }

      const oldStatus = litigationCase.status;
      litigationCase.activate();

      const updated = await uow.cases.update(litigationCase);

      // Create status history record atomically
      const statusHistory = LitigationStatusHistory.create({
        litigationCaseId: litigationCase.id,
        fromStatus: oldStatus,
        toStatus: updated.status,
        reason: 'Case activated',
        changedBy: command.activatedBy
          ? UserId.create(command.activatedBy)
          : undefined,
      });
      await uow.statusHistories.create(statusHistory);

      return this.toDto(updated);
    });
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      status: litigationCase.status.getValue(),
      updatedAt: litigationCase.updatedAt.toISOString(),
    };
  }
}

// ============================================
// CLOSE CASE (Uses UoW for ACID guarantees with status history)
// ============================================

export interface CloseCaseCommand {
  caseId: string;
  closedBy?: string;
  reason?: string;
}

@Injectable()
export class CloseCaseUseCase {
  constructor(
    @Inject(LITIGATION_UNIT_OF_WORK)
    private readonly litigationUow: ILitigationUnitOfWork,
  ) {}

  /**
   * Closes a litigation case atomically with status history.
   */
  async execute(command: CloseCaseCommand): Promise<any> {
    return await this.litigationUow.transaction(async (uow) => {
      const litigationCase = await uow.cases.findById(
        CaseId.create(command.caseId),
      );

      if (!litigationCase) {
        throw new NotFoundException('Litigation case not found');
      }

      const oldStatus = litigationCase.status;
      litigationCase.close();

      const updated = await uow.cases.update(litigationCase);

      // Create status history record atomically
      const statusHistory = LitigationStatusHistory.create({
        litigationCaseId: litigationCase.id,
        fromStatus: oldStatus,
        toStatus: updated.status,
        reason: command.reason || 'Case closed',
        changedBy: command.closedBy
          ? UserId.create(command.closedBy)
          : undefined,
      });
      await uow.statusHistories.create(statusHistory);

      return this.toDto(updated);
    });
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      status: litigationCase.status.getValue(),
      closedAt: litigationCase.closedAt?.toISOString(),
      updatedAt: litigationCase.updatedAt.toISOString(),
    };
  }
}

// ============================================
// CANCEL CASE (Uses UoW for ACID guarantees with status history)
// ============================================

export interface CancelCaseCommand {
  caseId: string;
  userId: string;
  reason?: string;
}

@Injectable()
export class CancelCaseUseCase {
  constructor(
    @Inject(LITIGATION_UNIT_OF_WORK)
    private readonly litigationUow: ILitigationUnitOfWork,
  ) {}

  /**
   * Cancels a litigation case atomically with status history.
   */
  async execute(command: CancelCaseCommand): Promise<any> {
    return await this.litigationUow.transaction(async (uow) => {
      const litigationCase = await uow.cases.findById(
        CaseId.create(command.caseId),
      );

      if (!litigationCase) {
        throw new NotFoundException('Litigation case not found');
      }

      if (litigationCase.subscriberId.getValue() !== command.userId) {
        throw new ForbiddenException('Only case owner can cancel');
      }

      const oldStatus = litigationCase.status;
      litigationCase.cancel(command.reason);

      const updated = await uow.cases.update(litigationCase);

      // Create status history record atomically
      const statusHistory = LitigationStatusHistory.create({
        litigationCaseId: litigationCase.id,
        fromStatus: oldStatus,
        toStatus: updated.status,
        reason: command.reason || 'Case cancelled by owner',
        changedBy: UserId.create(command.userId),
      });
      await uow.statusHistories.create(statusHistory);

      return this.toDto(updated);
    });
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      status: litigationCase.status.getValue(),
      updatedAt: litigationCase.updatedAt.toISOString(),
    };
  }
}

// ============================================
// PROCESS REFUND
// ============================================

export interface ProcessRefundCommand {
  caseId: string;
  refundReference: string;
}

@Injectable()
export class ProcessRefundUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(command: ProcessRefundCommand): Promise<any> {
    const litigationCase = await this.repository.findById(
      CaseId.create(command.caseId),
    );

    if (!litigationCase) {
      throw new NotFoundException('Litigation case not found');
    }

    litigationCase.processRefund(command.refundReference);

    const updated = await this.repository.update(litigationCase);
    return this.toDto(updated);
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      paymentStatus: litigationCase.paymentStatus.getValue(),
      updatedAt: litigationCase.updatedAt.toISOString(),
    };
  }
}

// ============================================
// GET LITIGATION CASE BY ID
// ============================================

export interface GetLitigationCaseQuery {
  caseId: string;
  userId: string;
  userRole: string;
}

@Injectable()
export class GetLitigationCaseUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(query: GetLitigationCaseQuery): Promise<any> {
    const litigationCase = await this.repository.findById(
      CaseId.create(query.caseId),
    );

    if (!litigationCase) {
      throw new NotFoundException('Litigation case not found');
    }

    const isOwner = litigationCase.subscriberId.getValue() === query.userId;
    const isAssigned =
      litigationCase.assignedProviderId?.getValue() === query.userId;
    const isAdmin = ['admin', 'manager'].includes(query.userRole);

    if (!isOwner && !isAssigned && !isAdmin) {
      throw new ForbiddenException('No access to this case');
    }

    return this.toDto(litigationCase);
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      subscriberId: litigationCase.subscriberId.getValue(),
      assignedProviderId: litigationCase.assignedProviderId?.getValue(),
      caseType: litigationCase.caseType.getValue(),
      caseSubtype: litigationCase.caseSubtype?.getValue(),
      title: litigationCase.title.getValue(),
      description: litigationCase.description.getValue(),
      courtName: litigationCase.courtName?.getValue(),
      caseDetails: litigationCase.caseDetails?.toJSON(),
      status: litigationCase.status.getValue(),
      quoteAmount: litigationCase.quoteAmount?.toJSON(),
      quoteDetails: litigationCase.quoteDetails?.toJSON(),
      quoteValidUntil: litigationCase.quoteValidUntil?.toISOString(),
      quoteAcceptedAt: litigationCase.quoteAcceptedAt?.toISOString(),
      paymentStatus: litigationCase.paymentStatus.getValue(),
      paymentReference: litigationCase.paymentReference?.getValue(),
      submittedAt: litigationCase.submittedAt.toISOString(),
      closedAt: litigationCase.closedAt?.toISOString(),
      createdAt: litigationCase.createdAt.toISOString(),
      updatedAt: litigationCase.updatedAt.toISOString(),
    };
  }
}

// ============================================
// LIST LITIGATION CASES
// ============================================

export interface ListLitigationCasesQuery {
  filters?: any;
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

@Injectable()
export class ListLitigationCasesUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(query: ListLitigationCasesQuery): Promise<any> {
    const result = await this.repository.findAll(
      query.filters || {},
      query.pagination || {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    );

    return {
      data: result.data.map((c) => this.toDto(c)),
      pagination: result.pagination,
    };
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      subscriberId: litigationCase.subscriberId.getValue(),
      assignedProviderId: litigationCase.assignedProviderId?.getValue(),
      caseType: litigationCase.caseType.getValue(),
      title: litigationCase.title.getValue(),
      status: litigationCase.status.getValue(),
      paymentStatus: litigationCase.paymentStatus.getValue(),
      submittedAt: litigationCase.submittedAt.toISOString(),
      createdAt: litigationCase.createdAt.toISOString(),
    };
  }
}

// ============================================
// GET MY CASES (CLIENT)
// ============================================

export interface GetMyCasesQuery {
  userId: string;
  pagination?: any;
}

@Injectable()
export class GetMyCasesUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(query: GetMyCasesQuery): Promise<any> {
    const result = await this.repository.findBySubscriberId(
      UserId.create(query.userId),
      query.pagination,
    );

    return {
      data: result.data.map((c) => this.toDto(c)),
      pagination: result.pagination,
    };
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      caseType: litigationCase.caseType.getValue(),
      title: litigationCase.title.getValue(),
      status: litigationCase.status.getValue(),
      paymentStatus: litigationCase.paymentStatus.getValue(),
      quoteAmount: litigationCase.quoteAmount?.toJSON(),
      submittedAt: litigationCase.submittedAt.toISOString(),
    };
  }
}

// ============================================
// GET PROVIDER CASES
// ============================================

export interface GetProviderCasesQuery {
  providerId: string;
  pagination?: any;
}

@Injectable()
export class GetProviderCasesUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(query: GetProviderCasesQuery): Promise<any> {
    const result = await this.repository.findByProviderId(
      UserId.create(query.providerId),
      query.pagination,
    );

    return {
      data: result.data.map((c) => this.toDto(c)),
      pagination: result.pagination,
    };
  }

  private toDto(litigationCase: LitigationCase): any {
    return {
      id: litigationCase.id.getValue(),
      caseNumber: litigationCase.caseNumber.toString(),
      subscriberId: litigationCase.subscriberId.getValue(),
      caseType: litigationCase.caseType.getValue(),
      title: litigationCase.title.getValue(),
      status: litigationCase.status.getValue(),
      paymentStatus: litigationCase.paymentStatus.getValue(),
      submittedAt: litigationCase.submittedAt.toISOString(),
    };
  }
}

// ============================================
// GET STATISTICS
// ============================================

export interface GetStatisticsQuery {
  filters?: any;
}

@Injectable()
export class GetLitigationStatisticsUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(query: GetStatisticsQuery): Promise<any> {
    return await this.repository.getStatistics(query.filters);
  }
}

// ============================================
// DELETE LITIGATION CASE
// ============================================

export interface DeleteLitigationCaseCommand {
  caseId: string;
  deletedBy: string;
}

@Injectable()
export class DeleteLitigationCaseUseCase {
  constructor(
    @Inject('ILitigationCaseRepository')
    private readonly repository: ILitigationCaseRepository,
  ) {}

  async execute(command: DeleteLitigationCaseCommand): Promise<void> {
    const litigationCase = await this.repository.findById(
      CaseId.create(command.caseId),
    );

    if (!litigationCase) {
      throw new NotFoundException('Litigation case not found');
    }

    litigationCase.softDelete();
    await this.repository.update(litigationCase);
  }
}
