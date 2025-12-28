// ============================================
// LEGAL OPINION REQUEST CONTROLLER
// Presentation Layer with Complete RBAC
// ============================================

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  // ApiQuery,
} from '@nestjs/swagger';

// DTOs
import {
  CreateOpinionRequestDto,
  UpdateOpinionRequestDto,
  AssignToLawyerDto,
  SetEstimatedCostDto,
  MarkAsPaidDto,
  RequestRevisionDto,
  CancelOpinionRequestDto,
  RejectOpinionRequestDto,
  ListOpinionRequestsDto,
  OpinionRequestResponseDto,
  PaginatedOpinionRequestResponseDto,
  OpinionStatisticsResponseDto,
  //   ValidationErrorResponseDto,
} from '../../core/application/legal-opinion/legal-opinion-request.dtos';

import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CreateOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/create-opinion-request.use-case';
import { UpdateOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/update-opinion-request.use-case';
import { SubmitOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/submit-opinion-request.use-case';
import { AssignToLawyerUseCase } from '../../core/application/legal-opinion/use-cases/assign-to-lawyer.use-case';
import { StartResearchUseCase } from '../../core/application/legal-opinion/use-cases/start-research.use-case';
import { StartDraftingUseCase } from '../../core/application/legal-opinion/use-cases/start-drafting.use-case';
import { SubmitForReviewUseCase } from '../../core/application/legal-opinion/use-cases/submit-for-review.use-case';
import { RequestRevisionUseCase } from '../../core/application/legal-opinion/use-cases/request-revision.use-case';
// import { StartRevisingUseCase } from '../../core/application/legal-opinion/use-cases/start-revising.use-case';
import { CompleteOpinionUseCase } from '../../core/application/legal-opinion/use-cases/complete-opinion.use-case';
import { SetEstimatedCostUseCase } from '../../core/application/legal-opinion/use-cases/set-estimated-cost.use-case';
import { MarkAsPaidUseCase } from '../../core/application/legal-opinion/use-cases/mark-as-paid.use-case';
import { CancelOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/cancel-opinion-request.use-case';
import { RejectOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/reject-opinion-request.use-case';
import { GetOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/get-opinion-request.use-case';
import { ListOpinionRequestsUseCase } from '../../core/application/legal-opinion/use-cases/list-opinion-requests.use-case';
import { GetMyOpinionRequestsUseCase } from '../../core/application/legal-opinion/use-cases/get-my-opinion-requests.use-case';
import { GetLawyerOpinionRequestsUseCase } from '../../core/application/legal-opinion/use-cases/get-lawyer-opinion-requests.use-case';
import { GetOpinionStatisticsUseCase } from '../../core/application/legal-opinion/use-cases/get-opinion-statistics.use-case';
import { DeleteOpinionRequestUseCase } from '../../core/application/legal-opinion/use-cases/delete-opinion-request.use-case';

// Notification Integration
import { NotificationIntegrationService } from '../../core/application/notification/notification-integration.service';

/**
 * Legal Opinion Request Controller
 *
 * Role-Based Access Control (RBAC):
 * - CLIENT: Can create, view own, update own (draft), submit, cancel
 * - LAWYER/PROVIDER: Can view assigned, update workflow, complete
 * - ADMIN: Full access to all operations
 *
 * Permissions:
 * - opinion:create - Create new opinion request
 * - opinion:read - View opinion requests
 * - opinion:update - Update opinion requests
 * - opinion:delete - Delete opinion requests
 * - opinion:assign - Assign to lawyers
 * - opinion:manage - Full management access
 */
@ApiTags('Legal Opinion Requests')
@ApiBearerAuth()
@Controller('legal-opinion-requests')
export class LegalOpinionRequestController {
  constructor(
    private readonly createOpinionRequestUseCase: CreateOpinionRequestUseCase,
    private readonly updateOpinionRequestUseCase: UpdateOpinionRequestUseCase,
    private readonly submitOpinionRequestUseCase: SubmitOpinionRequestUseCase,
    private readonly assignToLawyerUseCase: AssignToLawyerUseCase,
    private readonly startResearchUseCase: StartResearchUseCase,
    private readonly startDraftingUseCase: StartDraftingUseCase,
    private readonly submitForReviewUseCase: SubmitForReviewUseCase,
    private readonly requestRevisionUseCase: RequestRevisionUseCase,
    private readonly completeOpinionUseCase: CompleteOpinionUseCase,
    private readonly setEstimatedCostUseCase: SetEstimatedCostUseCase,
    private readonly markAsPaidUseCase: MarkAsPaidUseCase,
    private readonly cancelOpinionRequestUseCase: CancelOpinionRequestUseCase,
    private readonly rejectOpinionRequestUseCase: RejectOpinionRequestUseCase,
    private readonly getOpinionRequestUseCase: GetOpinionRequestUseCase,
    private readonly listOpinionRequestsUseCase: ListOpinionRequestsUseCase,
    private readonly getMyOpinionRequestsUseCase: GetMyOpinionRequestsUseCase,
    private readonly getLawyerOpinionRequestsUseCase: GetLawyerOpinionRequestsUseCase,
    private readonly getOpinionStatisticsUseCase: GetOpinionStatisticsUseCase,
    private readonly deleteOpinionRequestUseCase: DeleteOpinionRequestUseCase,
    private readonly notificationService: NotificationIntegrationService,
  ) {}

  // ============================================
  // CLIENT ENDPOINTS
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('client', 'admin')
  @Permissions('opinion:create')
  @ApiOperation({
    summary: 'Create a new legal opinion request',
    description: 'Client creates a new opinion request in draft status',
  })
  @ApiResponse({
    status: 201,
    description: 'Opinion request created successfully',
    type: OpinionRequestResponseDto,
  })
  //   @ApiResponse({ status: 400, description: 'Invalid input', type: ValidationErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async create(
    @Body() dto: CreateOpinionRequestDto,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.createOpinionRequestUseCase.execute({
      ...dto,
      clientId: user.userId,
    });
  }

  @Put(':id')
  @Roles('client', 'admin')
  @Permissions('opinion:update')
  @ApiOperation({
    summary: 'Update opinion request',
    description: 'Update opinion request (only in draft status)',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Opinion request updated',
    type: OpinionRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update - not in draft status',
  })
  @ApiResponse({ status: 404, description: 'Opinion request not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpinionRequestDto,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.updateOpinionRequestUseCase.execute({
      opinionRequestId: id,
      userId: user.userId,
      updates: dto,
    });
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @Roles('client', 'admin')
  @Permissions('opinion:update')
  @ApiOperation({
    summary: 'Submit opinion request',
    description: 'Submit draft opinion request for review',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Opinion request submitted',
    type: OpinionRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot submit - invalid status or missing information',
  })
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.submitOpinionRequestUseCase.execute({
      opinionRequestId: id,
      userId: user.userId,
    });
  }

  @Get('my-requests')
  @Roles('client', 'admin')
  @Permissions('opinion:read')
  @ApiOperation({
    summary: 'Get my opinion requests',
    description: 'Get all opinion requests for the authenticated client',
  })
  @ApiResponse({
    status: 200,
    description: 'Opinion requests retrieved',
    type: PaginatedOpinionRequestResponseDto,
  })
  async getMyRequests(
    @Query() query: ListOpinionRequestsDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedOpinionRequestResponseDto> {
    return await this.getMyOpinionRequestsUseCase.execute({
      userId: user.userId,
      filters: query,
      pagination: {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('client', 'admin')
  @Permissions('opinion:update')
  @ApiOperation({
    summary: 'Cancel opinion request',
    description: 'Client cancels their opinion request (only in early stages)',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Opinion request cancelled',
    type: OpinionRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot cancel - invalid status' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOpinionRequestDto,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.cancelOpinionRequestUseCase.execute({
      opinionRequestId: id,
      userId: user.userId,
      reason: dto.reason,
    });
  }

  // ============================================
  // LAWYER/PROVIDER ENDPOINTS
  // ============================================

  @Get('my-assignments')
  @Roles('lawyer', 'provider', 'admin')
  @Permissions('opinion:read')
  @ApiOperation({
    summary: 'Get my assigned opinions',
    description: 'Get all opinions assigned to the authenticated lawyer',
  })
  @ApiResponse({
    status: 200,
    description: 'Assigned opinions retrieved',
    type: PaginatedOpinionRequestResponseDto,
  })
  async getMyAssignments(
    @Query() query: ListOpinionRequestsDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedOpinionRequestResponseDto> {
    return await this.getLawyerOpinionRequestsUseCase.execute({
      lawyerId: user.userId,
      filters: query,
      pagination: {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
  }

  @Post(':id/start-research')
  @HttpCode(HttpStatus.OK)
  @Roles('lawyer', 'provider', 'admin')
  @Permissions('opinion:update')
  @ApiOperation({
    summary: 'Start research phase',
    description: 'Lawyer starts research on assigned opinion',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Research started',
    type: OpinionRequestResponseDto,
  })
  async startResearch(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.startResearchUseCase.execute({
      opinionRequestId: id,
      lawyerId: user.userId,
    });
  }

  @Post(':id/start-drafting')
  @HttpCode(HttpStatus.OK)
  @Roles('lawyer', 'provider', 'admin')
  @Permissions('opinion:update')
  @ApiOperation({
    summary: 'Start drafting opinion',
    description: 'Lawyer starts drafting the legal opinion',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Drafting started',
    type: OpinionRequestResponseDto,
  })
  async startDrafting(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.startDraftingUseCase.execute({
      opinionRequestId: id,
      lawyerId: user.userId,
    });
  }

  @Post(':id/submit-for-review')
  @HttpCode(HttpStatus.OK)
  @Roles('lawyer', 'provider', 'admin')
  @Permissions('opinion:update')
  @ApiOperation({
    summary: 'Submit for internal review',
    description: 'Submit drafted opinion for internal quality review',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Submitted for review',
    type: OpinionRequestResponseDto,
  })
  async submitForReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.submitForReviewUseCase.execute({
      opinionRequestId: id,
      lawyerId: user.userId,
    });
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get()
  @Roles('admin', 'manager')
  @Permissions('opinion:read')
  @ApiOperation({
    summary: 'List all opinion requests',
    description: 'Admin can list all opinion requests with filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Opinion requests retrieved',
    type: PaginatedOpinionRequestResponseDto,
  })
  async listAll(
    @Query() query: ListOpinionRequestsDto,
  ): Promise<PaginatedOpinionRequestResponseDto> {
    return await this.listOpinionRequestsUseCase.execute({
      filters: query,
      pagination: {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager')
  @Permissions('opinion:assign')
  @ApiOperation({
    summary: 'Assign opinion to lawyer',
    description: 'Admin assigns opinion request to a specific lawyer',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Opinion assigned',
    type: OpinionRequestResponseDto,
  })
  async assignToLawyer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignToLawyerDto,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    const result = await this.assignToLawyerUseCase.execute({
      opinionRequestId: id,
      lawyerId: dto.lawyerId,
      assignedBy: user.userId,
    });

    // Send notifications to both client and lawyer
    await Promise.all([
      this.notificationService.notifyLegalOpinionAssignedToSubscriber({
        opinionId: result.id,
        opinionNumber: result.requestNumber,
        subscriberId: result.clientId,
        lawyerId: dto.lawyerId,
        subject: result.subject,
      }),
      this.notificationService.notifyLegalOpinionAssignedToLawyer({
        opinionId: result.id,
        opinionNumber: result.requestNumber,
        subscriberId: result.clientId,
        lawyerId: dto.lawyerId,
        subject: result.subject,
      }),
    ]);

    return result;
  }

  @Post(':id/set-estimated-cost')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager')
  @Permissions('opinion:manage')
  @ApiOperation({
    summary: 'Set estimated cost',
    description: 'Set estimated cost for the opinion',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Cost set',
    type: OpinionRequestResponseDto,
  })
  async setEstimatedCost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetEstimatedCostDto,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.setEstimatedCostUseCase.execute({
      opinionRequestId: id,
      estimatedCost: dto.estimatedCost,
      setBy: user.userId,
    });
  }

  @Post(':id/mark-as-paid')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager')
  @Permissions('opinion:manage')
  @ApiOperation({
    summary: 'Mark as paid',
    description: 'Mark opinion as paid after payment confirmation',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Marked as paid',
    type: OpinionRequestResponseDto,
  })
  async markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkAsPaidDto,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.markAsPaidUseCase.execute({
      opinionRequestId: id,
      paymentReference: dto.paymentReference,
      finalCost: dto.finalCost,
      markedBy: user.userId,
    });
  }

  @Post(':id/request-revision')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager')
  @Permissions('opinion:manage')
  @ApiOperation({
    summary: 'Request revision',
    description: 'Request revision on drafted opinion (internal review)',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Revision requested',
    type: OpinionRequestResponseDto,
  })
  async requestRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestRevisionDto,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.requestRevisionUseCase.execute({
      opinionRequestId: id,
      reason: dto.reason,
      requestedBy: user.userId,
    });
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager')
  @Permissions('opinion:manage')
  @ApiOperation({
    summary: 'Complete opinion',
    description: 'Mark opinion as completed and deliver to client',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Opinion completed',
    type: OpinionRequestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot complete - not paid or invalid status',
  })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    const result = await this.completeOpinionUseCase.execute({
      opinionRequestId: id,
      completedBy: user.userId,
    });

    // Notify client that the legal opinion is completed
    await this.notificationService.notifyLegalOpinionCompleted({
      opinionId: result.id,
      opinionNumber: result.requestNumber,
      subscriberId: result.clientId,
      subject: result.subject,
    });

    return result;
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager')
  @Permissions('opinion:manage')
  @ApiOperation({
    summary: 'Reject opinion request',
    description: 'Reject opinion request (out of scope, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Opinion rejected',
    type: OpinionRequestResponseDto,
  })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectOpinionRequestDto,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.rejectOpinionRequestUseCase.execute({
      opinionRequestId: id,
      reason: dto.reason,
      rejectedBy: user.userId,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @Permissions('opinion:delete')
  @ApiOperation({
    summary: 'Delete opinion request',
    description: 'Soft delete opinion request (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({ status: 204, description: 'Opinion deleted' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.deleteOpinionRequestUseCase.execute({
      opinionRequestId: id,
      deletedBy: user.userId,
    });
  }

  @Get('statistics')
  @Roles('admin', 'manager')
  @Permissions('opinion:read')
  @ApiOperation({
    summary: 'Get opinion statistics',
    description: 'Get comprehensive statistics about opinion requests',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved',
    type: OpinionStatisticsResponseDto,
  })
  async getStatistics(
    @Query() filters: ListOpinionRequestsDto,
  ): Promise<OpinionStatisticsResponseDto> {
    return await this.getOpinionStatisticsUseCase.execute({ filters });
  }

  // ============================================
  // SHARED ENDPOINTS
  // ============================================

  @Get(':id')
  @Roles('client', 'lawyer', 'provider', 'admin', 'manager')
  @Permissions('opinion:read')
  @ApiOperation({
    summary: 'Get opinion request by ID',
    description: 'Get specific opinion request details',
  })
  @ApiParam({ name: 'id', description: 'Opinion request ID' })
  @ApiResponse({
    status: 200,
    description: 'Opinion request retrieved',
    type: OpinionRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Opinion request not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to this opinion',
  })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<OpinionRequestResponseDto> {
    return await this.getOpinionRequestUseCase.execute({
      opinionRequestId: id,
      userId: user.userId,
      userRole: user.role,
    });
  }
}
