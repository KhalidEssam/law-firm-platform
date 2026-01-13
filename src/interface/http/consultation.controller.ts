// ============================================
// CONSULTATION REQUEST CONTROLLER
// REST API Endpoints with RBAC
// ============================================

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

// Use Cases
import {
  CreateConsultationRequestUseCase,
  GetConsultationRequestUseCase,
  ListConsultationRequestsUseCase,
  AssignConsultationToProviderUseCase,
  MarkConsultationAsInProgressUseCase,
  CompleteConsultationRequestUseCase,
  CancelConsultationRequestUseCase,
  DisputeConsultationRequestUseCase,
  UploadDocumentUseCase,
  SendMessageUseCase,
  AddRatingUseCase,
  GetConsultationStatisticsUseCase,
  UpdateSLAStatusesUseCase,
} from '../../core/application/consultation/use-cases/consultation.use-cases';
import { GetUserByAuth0IdUseCase } from '../../core/application/use-cases/get-user-by-auth0.use-case';

// DTOs
import {
  CreateConsultationRequestDTO,
  ConsultationRequestResponseDTO,
  ListConsultationRequestsQueryDTO,
  PaginatedConsultationResponseDTO,
  AssignConsultationDTO,
  CancelConsultationDTO,
  DisputeConsultationDTO,
  UploadDocumentDTO,
  DocumentResponseDTO,
  SendMessageDTO,
  MessageResponseDTO,
  AddRatingDTO,
  RatingResponseDTO,
  ConsultationStatisticsDTO,
  UpdateSLAStatusesResponseDTO,
  ErrorResponseDTO,
  StatisticsQueryDTO,
} from '../../core/application/consultation/consultation request.dtos';

// Notification Integration
import { NotificationIntegrationService } from '../../core/application/notification/notification-integration.service';

@ApiTags('Consultation Requests')
@Controller('consultation-requests')
@ApiBearerAuth()
export class ConsultationRequestController {
  constructor(
    private readonly createUseCase: CreateConsultationRequestUseCase,
    private readonly getUseCase: GetConsultationRequestUseCase,
    private readonly listUseCase: ListConsultationRequestsUseCase,
    private readonly assignUseCase: AssignConsultationToProviderUseCase,
    private readonly markInProgressUseCase: MarkConsultationAsInProgressUseCase,
    private readonly completeUseCase: CompleteConsultationRequestUseCase,
    private readonly cancelUseCase: CancelConsultationRequestUseCase,
    private readonly disputeUseCase: DisputeConsultationRequestUseCase,
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly addRatingUseCase: AddRatingUseCase,
    private readonly statisticsUseCase: GetConsultationStatisticsUseCase,
    private readonly updateSLAUseCase: UpdateSLAStatusesUseCase,
    private readonly notificationService: NotificationIntegrationService,
    private readonly getUserByAuth0Id: GetUserByAuth0IdUseCase,
  ) {}

  // ============================================
  // COLLECTION ENDPOINTS (no path params)
  // These must be defined BEFORE parameterized routes
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('subscriber', 'admin')
  @Permissions('consultation:create')
  @ApiOperation({
    summary: 'Create a new consultation request',
    description: 'Allows subscribers to create a new consultation request',
  })
  @ApiResponse({
    status: 201,
    description: 'Consultation request created successfully',
    type: ConsultationRequestResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: ErrorResponseDTO,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(
    @Body() dto: CreateConsultationRequestDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConsultationRequestResponseDTO> {
    // Resolve subscriber ID from authenticated user
    let subscriberId = dto.subscriberId;

    if (user.sub) {
      // Auth0 user - look up database UUID from Auth0 ID
      const dbUser = await this.getUserByAuth0Id.execute(user.sub);
      subscriberId = dbUser.id;
    } else if (user.id) {
      // Local auth with direct ID
      subscriberId = user.id;
    }

    if (!subscriberId) {
      throw new BadRequestException('subscriberId is required');
    }

    // Create new DTO with resolved subscriber ID (avoid mutation)
    const createDto: CreateConsultationRequestDTO = {
      ...dto,
      subscriberId,
    };

    return this.createUseCase.execute(createDto);
  }

  @Get()
  @Roles('subscriber', 'provider', 'admin')
  @Permissions('consultation:read')
  @ApiOperation({
    summary: 'List consultation requests with filters and pagination',
    description:
      'Get paginated list of consultation requests with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of consultation requests',
    type: PaginatedConsultationResponseDTO,
  })
  async list(
    @Query() query: ListConsultationRequestsQueryDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedConsultationResponseDTO> {
    // Build filters based on user role (avoid DTO mutation)
    const roleBasedFilters: Record<string, string | undefined> = {};

    if (user.role === 'subscriber' && user.id) {
      roleBasedFilters.subscriberId = user.id;
    } else if (user.role === 'provider' && user.id) {
      roleBasedFilters.assignedProviderId = user.id;
    }

    const filters = {
      subscriberId: roleBasedFilters.subscriberId ?? query.subscriberId,
      assignedProviderId:
        roleBasedFilters.assignedProviderId ?? query.assignedProviderId,
      status: query.status,
      consultationType: query.consultationType,
      urgency: query.urgency,
      slaStatus: query.slaStatus,
      searchTerm: query.searchTerm,
    };

    const pagination = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    return this.listUseCase.execute(filters, pagination);
  }

  // ============================================
  // SPECIFIC PATH ENDPOINTS
  // Must come BEFORE /:id to avoid route conflicts
  // ============================================

  @Get('my/consultations')
  @Roles('subscriber')
  @Permissions('consultation:read')
  @ApiOperation({
    summary: 'Get my consultation requests',
    description:
      'Get all consultation requests for the authenticated subscriber',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "List of user's consultation requests",
    type: PaginatedConsultationResponseDTO,
  })
  async getMyConsultations(
    @Query() query: ListConsultationRequestsQueryDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedConsultationResponseDTO> {
    const filters = {
      subscriberId: user.id,
    };

    const pagination = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    return this.listUseCase.execute(filters, pagination);
  }

  @Get('assigned/me')
  @Roles('provider')
  @Permissions('consultation:read')
  @ApiOperation({
    summary: 'Get consultations assigned to me',
    description:
      'Get all consultation requests assigned to the authenticated provider',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of assigned consultation requests',
    type: PaginatedConsultationResponseDTO,
  })
  async getAssignedToMe(
    @Query() query: ListConsultationRequestsQueryDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedConsultationResponseDTO> {
    const filters = {
      assignedProviderId: user.id,
    };

    const pagination = {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    return this.listUseCase.execute(filters, pagination);
  }

  @Get('statistics/overview')
  @Roles('admin', 'provider_manager', 'analytics')
  @Permissions('consultation:view-statistics')
  @ApiOperation({
    summary: 'Get consultation statistics',
    description: 'Get comprehensive statistics about consultations',
  })
  @ApiQuery({ name: 'subscriberId', required: false, type: String })
  @ApiQuery({ name: 'assignedProviderId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Consultation statistics',
    type: ConsultationStatisticsDTO,
  })
  async getStatistics(
    @Query() query: StatisticsQueryDTO,
  ): Promise<ConsultationStatisticsDTO> {
    return this.statisticsUseCase.execute(query);
  }

  @Post('sla/update')
  @Roles('admin', 'system')
  @Permissions('consultation:update-sla')
  @ApiOperation({
    summary: 'Update SLA statuses (Background job)',
    description:
      'Batch update SLA statuses for all consultations. Typically called by cron job.',
  })
  @ApiResponse({
    status: 200,
    description: 'SLA statuses updated successfully',
    type: UpdateSLAStatusesResponseDTO,
  })
  async updateSLAStatuses(): Promise<UpdateSLAStatusesResponseDTO> {
    return this.updateSLAUseCase.execute();
  }

  // ============================================
  // PARAMETERIZED ENDPOINTS (/:id)
  // Must come AFTER specific path endpoints
  // ============================================

  @Get(':id')
  @Roles('subscriber', 'provider', 'admin')
  @Permissions('consultation:read')
  @ApiOperation({
    summary: 'Get consultation request by ID',
    description: 'Retrieve a specific consultation request',
  })
  @ApiParam({
    name: 'id',
    description: 'Consultation request ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Consultation request found',
    type: ConsultationRequestResponseDTO,
  })
  @ApiResponse({
    status: 404,
    description: 'Consultation request not found',
  })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConsultationRequestResponseDTO> {
    return this.getUseCase.execute(id);
  }

  @Put(':id/assign')
  @Roles('admin', 'provider_manager')
  @Permissions('consultation:assign')
  @ApiOperation({
    summary: 'Assign consultation to a provider',
    description: 'Assign a pending consultation request to a legal provider',
  })
  @ApiParam({ name: 'id', description: 'Consultation request ID' })
  @ApiResponse({
    status: 200,
    description: 'Consultation assigned successfully',
    type: ConsultationRequestResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot assign - invalid status',
  })
  @ApiResponse({
    status: 404,
    description: 'Consultation not found',
  })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignConsultationDTO,
  ): Promise<ConsultationRequestResponseDTO> {
    const result = await this.assignUseCase.execute(id, dto.providerId);

    // Send notifications to both subscriber and provider
    await Promise.all([
      this.notificationService.notifyConsultationAssignedToSubscriber({
        consultationId: result.id,
        consultationNumber: result.requestNumber,
        subscriberId: result.subscriberId,
        providerId: dto.providerId,
        subject: result.subject,
      }),
      this.notificationService.notifyConsultationAssignedToProvider({
        consultationId: result.id,
        consultationNumber: result.requestNumber,
        subscriberId: result.subscriberId,
        providerId: dto.providerId,
        subject: result.subject,
      }),
    ]);

    return result;
  }

  @Put(':id/in-progress')
  @Roles('provider', 'admin')
  @Permissions('consultation:update')
  @ApiOperation({
    summary: 'Mark consultation as in progress',
    description: 'Provider marks the consultation as in progress',
  })
  @ApiParam({ name: 'id', description: 'Consultation request ID' })
  @ApiResponse({
    status: 200,
    description: 'Consultation marked as in progress',
    type: ConsultationRequestResponseDTO,
  })
  async markInProgress(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConsultationRequestResponseDTO> {
    return this.markInProgressUseCase.execute(id);
  }

  @Put(':id/complete')
  @Roles('provider', 'admin')
  @Permissions('consultation:complete')
  @ApiOperation({
    summary: 'Mark consultation as completed',
    description: 'Provider marks the consultation as completed',
  })
  @ApiParam({ name: 'id', description: 'Consultation request ID' })
  @ApiResponse({
    status: 200,
    description: 'Consultation completed successfully',
    type: ConsultationRequestResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot complete - invalid status',
  })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConsultationRequestResponseDTO> {
    const result = await this.completeUseCase.execute(id);

    // Notify subscriber that consultation is completed
    await this.notificationService.notifyConsultationCompleted({
      consultationId: result.id,
      consultationNumber: result.requestNumber,
      subscriberId: result.subscriberId,
      subject: result.subject,
    });

    return result;
  }

  @Put(':id/cancel')
  @Roles('subscriber', 'admin')
  @Permissions('consultation:cancel')
  @ApiOperation({
    summary: 'Cancel consultation request',
    description: 'Subscriber or admin can cancel a consultation',
  })
  @ApiParam({ name: 'id', description: 'Consultation request ID' })
  @ApiResponse({
    status: 200,
    description: 'Consultation cancelled successfully',
    type: ConsultationRequestResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel - already completed',
  })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelConsultationDTO,
  ): Promise<ConsultationRequestResponseDTO> {
    return this.cancelUseCase.execute(id, dto.reason);
  }

  @Post(':id/dispute')
  @Roles('subscriber', 'admin')
  @Permissions('consultation:dispute')
  @ApiOperation({
    summary: 'Dispute a completed consultation',
    description:
      'Subscriber can dispute a completed consultation within 48 hours',
  })
  @ApiParam({ name: 'id', description: 'Consultation request ID' })
  @ApiResponse({
    status: 200,
    description: 'Consultation disputed successfully',
    type: ConsultationRequestResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot dispute - period expired or invalid status',
  })
  async dispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisputeConsultationDTO,
  ): Promise<ConsultationRequestResponseDTO> {
    return this.disputeUseCase.execute(id, dto.reason);
  }

  @Post(':id/documents')
  @Roles('subscriber', 'provider', 'admin')
  @Permissions('consultation:upload-document')
  @ApiOperation({
    summary: 'Upload document to consultation',
    description: 'Upload a document related to the consultation',
  })
  @ApiParam({ name: 'id', description: 'Consultation request ID' })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentResponseDTO,
  })
  async uploadDocument(
    @Param('id', ParseUUIDPipe) consultationId: string,
    @Body() dto: UploadDocumentDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DocumentResponseDTO> {
    // Create new DTO with context (avoid mutation)
    const uploadDto: UploadDocumentDTO = {
      ...dto,
      consultationId,
      uploadedBy: user.id,
    };

    return this.uploadDocumentUseCase.execute(uploadDto);
  }

  @Post(':id/messages')
  @Roles('subscriber', 'provider', 'admin')
  @Permissions('consultation:send-message')
  @ApiOperation({
    summary: 'Send message in consultation',
    description: 'Send a message in the consultation conversation',
  })
  @ApiParam({ name: 'id', description: 'Consultation request ID' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: MessageResponseDTO,
  })
  async sendMessage(
    @Param('id', ParseUUIDPipe) consultationId: string,
    @Body() dto: SendMessageDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MessageResponseDTO> {
    // Create new DTO with context (avoid mutation)
    const messageDto: SendMessageDTO = {
      ...dto,
      consultationId,
      senderId: user.id,
    };

    return this.sendMessageUseCase.execute(messageDto);
  }

  @Post(':id/rating')
  @Roles('subscriber', 'admin')
  @Permissions('consultation:rate')
  @ApiOperation({
    summary: 'Add rating to completed consultation',
    description: 'Subscriber can rate a completed consultation',
  })
  @ApiParam({ name: 'id', description: 'Consultation request ID' })
  @ApiResponse({
    status: 201,
    description: 'Rating added successfully',
    type: RatingResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot rate - not completed or already rated',
  })
  async addRating(
    @Param('id', ParseUUIDPipe) consultationId: string,
    @Body() dto: AddRatingDTO,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RatingResponseDTO> {
    // Create new DTO with context (avoid mutation)
    const ratingDto: AddRatingDTO = {
      ...dto,
      consultationId,
      subscriberId: user.id,
    };

    return this.addRatingUseCase.execute(ratingDto);
  }
}
