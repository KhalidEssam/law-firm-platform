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
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

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
  // USE CASE 1: CREATE CONSULTATION REQUEST
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
    @Request() req: any,
  ): Promise<ConsultationRequestResponseDTO> {
    // Get user ID from authenticated user or body
    if (req.user?.sub) {
      // Auth0 user - look up database UUID from Auth0 ID
      const user = await this.getUserByAuth0Id.execute(req.user.sub);
      dto.subscriberId = user.id;
    } else if (req.user?.id) {
      // Local auth with direct ID
      dto.subscriberId = req.user.id;
    } else if (!dto.subscriberId) {
      throw new Error('subscriberId is required');
    }

    return await this.createUseCase.execute(dto);
  }

  // ============================================
  // USE CASE 2: GET CONSULTATION REQUEST BY ID
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
    return await this.getUseCase.execute(id);
  }

  // ============================================
  // USE CASE 3: LIST CONSULTATION REQUESTS
  // ============================================

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
    @Request() req: any,
  ): Promise<PaginatedConsultationResponseDTO> {
    // If user is subscriber, only show their consultations
    if (req.user.role === 'subscriber') {
      query.subscriberId = req.user.id;
    }

    // If user is provider, only show their assigned consultations
    if (req.user.role === 'provider') {
      query.assignedProviderId = req.user.id;
    }

    // Map DTO to filters (string types are compatible with the repository)
    const filters = {
      subscriberId: query.subscriberId ? query.subscriberId : undefined,
      assignedProviderId: query.assignedProviderId,
      status: query.status,
      consultationType: query.consultationType,
      urgency: query.urgency,
      slaStatus: query.slaStatus,
      searchTerm: query.searchTerm,
    };

    const pagination = {
      page: query.page ? query.page : 1,
      limit: query.limit ? query.limit : 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    return await this.listUseCase.execute(filters, pagination);
  }

  // ============================================
  // CONVENIENCE ENDPOINTS
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
    @Request() req: any,
  ): Promise<PaginatedConsultationResponseDTO> {
    const filters = {
      subscriberId: req.user.id,
    };

    const pagination = {
      page: query.page ? query.page : 1,
      limit: query.limit ? query.limit : 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    return await this.listUseCase.execute(filters, pagination);
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
    @Request() req: any,
  ): Promise<PaginatedConsultationResponseDTO> {
    const filters = {
      assignedProviderId: req.user.id,
    };

    const pagination = {
      page: query.page ? query.page : 1,
      limit: query.limit ? query.limit : 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    return await this.listUseCase.execute(filters, pagination);
  }

  // ============================================
  // USE CASE 4: ASSIGN TO PROVIDER
  // ============================================

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

  // ============================================
  // USE CASE 5: MARK AS IN PROGRESS
  // ============================================

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
    return await this.markInProgressUseCase.execute(id);
  }

  // ============================================
  // USE CASE 6: COMPLETE CONSULTATION
  // ============================================

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

  // ============================================
  // USE CASE 7: CANCEL CONSULTATION
  // ============================================

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
    return await this.cancelUseCase.execute(id, dto.reason);
  }

  // ============================================
  // USE CASE 8: DISPUTE CONSULTATION
  // ============================================

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
    return await this.disputeUseCase.execute(id, dto.reason);
  }

  // ============================================
  // USE CASE 9: UPLOAD DOCUMENT
  // ============================================

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
    @Request() req: any,
  ): Promise<DocumentResponseDTO> {
    dto.consultationId = consultationId;
    dto.uploadedBy = req.user.id;

    return await this.uploadDocumentUseCase.execute(dto);
  }

  // ============================================
  // USE CASE 10: SEND MESSAGE
  // ============================================

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
    @Request() req: any,
  ): Promise<MessageResponseDTO> {
    dto.consultationId = consultationId;
    dto.senderId = req.user.id;

    return await this.sendMessageUseCase.execute(dto);
  }

  // ============================================
  // USE CASE 11: ADD RATING
  // ============================================

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
    @Request() req: any,
  ): Promise<RatingResponseDTO> {
    dto.consultationId = consultationId;
    dto.subscriberId = req.user.id;

    return await this.addRatingUseCase.execute(dto);
  }

  // ============================================
  // USE CASE 12: GET STATISTICS
  // ============================================

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
  async getStatistics(@Query() query: any): Promise<ConsultationStatisticsDTO> {
    return await this.statisticsUseCase.execute(query);
  }

  // ============================================
  // USE CASE 13: UPDATE SLA STATUSES
  // (Background Job - Admin Only)
  // ============================================

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
    return await this.updateSLAUseCase.execute();
  }
}
