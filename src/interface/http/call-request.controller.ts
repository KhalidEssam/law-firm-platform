// src/interface/http/call-request.controller.ts

import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    Inject,
    Optional,
    Logger,
} from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';

// Use Cases
import {
    CreateCallRequestUseCase,
    GetCallRequestByIdUseCase,
    GetCallRequestsUseCase,
    AssignProviderUseCase,
    ScheduleCallUseCase,
    RescheduleCallUseCase,
    StartCallUseCase,
    EndCallUseCase,
    CancelCallUseCase,
    MarkNoShowUseCase,
    UpdateCallLinkUseCase,
    GetSubscriberCallsUseCase,
    GetProviderCallsUseCase,
    GetUpcomingCallsUseCase,
    GetOverdueCallsUseCase,
    GetCallMinutesSummaryUseCase,
    CheckProviderAvailabilityUseCase,
    GetScheduledCallsUseCase,
} from '../../core/application/call-request/use-cases/call-request.use-cases';

// DTOs
import {
    CreateCallRequestDto,
    ScheduleCallDto,
    AssignProviderDto,
    RescheduleCallDto,
    EndCallDto,
    CancelCallDto,
    UpdateCallLinkDto,
    GetCallRequestsQueryDto,
    CallRequestResponseDto,
    CallRequestListResponseDto,
} from '../../core/application/call-request/dto/call-request.dto';

// Notification Integration Service Interface
export interface ICallNotificationService {
    notifyCallAssigned(callRequestId: string, providerId: string): Promise<void>;
    notifyCallScheduled(callRequestId: string): Promise<void>;
    notifyCallRescheduled(callRequestId: string): Promise<void>;
    notifyCallCompleted(callRequestId: string): Promise<void>;
}

export const CALL_NOTIFICATION_SERVICE = Symbol('CALL_NOTIFICATION_SERVICE');

@Controller('call-requests')
export class CallRequestController {
    private readonly logger = new Logger(CallRequestController.name);

    constructor(
        private readonly createCallRequest: CreateCallRequestUseCase,
        private readonly getCallRequestById: GetCallRequestByIdUseCase,
        private readonly getCallRequests: GetCallRequestsUseCase,
        private readonly assignProvider: AssignProviderUseCase,
        private readonly scheduleCall: ScheduleCallUseCase,
        private readonly rescheduleCall: RescheduleCallUseCase,
        private readonly startCall: StartCallUseCase,
        private readonly endCall: EndCallUseCase,
        private readonly cancelCall: CancelCallUseCase,
        private readonly markNoShow: MarkNoShowUseCase,
        private readonly updateCallLink: UpdateCallLinkUseCase,
        private readonly getSubscriberCalls: GetSubscriberCallsUseCase,
        private readonly getProviderCalls: GetProviderCallsUseCase,
        private readonly getUpcomingCalls: GetUpcomingCallsUseCase,
        private readonly getOverdueCalls: GetOverdueCallsUseCase,
        private readonly getCallMinutesSummary: GetCallMinutesSummaryUseCase,
        private readonly checkProviderAvailability: CheckProviderAvailabilityUseCase,
        private readonly getScheduledCalls: GetScheduledCallsUseCase,
        @Optional() @Inject(CALL_NOTIFICATION_SERVICE)
        private readonly notificationService?: ICallNotificationService,
    ) {}

    // ============================================
    // CALL REQUEST CRUD
    // ============================================

    /**
     * Create a new call request
     */
    @Post()
    @Roles('user', 'system admin')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateCallRequestDto): Promise<{ callRequest: CallRequestResponseDto }> {
        const callRequest = await this.createCallRequest.execute(dto);
        return { callRequest: this.mapToResponse(callRequest) };
    }

    /**
     * Get all call requests with filters
     */
    @Get()
    @Roles('system admin', 'platform')
    async findAll(@Query() query: GetCallRequestsQueryDto): Promise<CallRequestListResponseDto> {
        const result = await this.getCallRequests.execute(query);
        return {
            data: result.data.map(cr => this.mapToResponse(cr)),
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            hasMore: result.hasMore,
        };
    }

    /**
     * Get call request by ID
     */
    @Get(':id')
    @Roles('user', 'partner', 'system admin')
    async findById(@Param('id') id: string): Promise<{ callRequest: CallRequestResponseDto }> {
        const callRequest = await this.getCallRequestById.execute(id);
        return { callRequest: this.mapToResponse(callRequest) };
    }

    /**
     * Cancel a call request
     */
    @Delete(':id')
    @Roles('user', 'system admin')
    @HttpCode(HttpStatus.OK)
    async cancel(
        @Param('id') id: string,
        @Body() dto: CancelCallDto,
    ): Promise<{ callRequest: CallRequestResponseDto }> {
        const callRequest = await this.cancelCall.execute(id, dto);
        return { callRequest: this.mapToResponse(callRequest) };
    }

    // ============================================
    // PROVIDER OPERATIONS
    // ============================================

    /**
     * Assign a provider to a call request
     */
    @Post(':id/assign')
    @Roles('system admin', 'platform')
    @HttpCode(HttpStatus.OK)
    async assign(
        @Param('id') id: string,
        @Body() dto: AssignProviderDto,
    ): Promise<{ callRequest: CallRequestResponseDto }> {
        const callRequest = await this.assignProvider.execute(id, dto);

        // Send notification to provider (non-blocking)
        this.sendNotificationSafe(() =>
            this.notificationService?.notifyCallAssigned(callRequest.id, dto.providerId)
        );

        return { callRequest: this.mapToResponse(callRequest) };
    }

    // ============================================
    // SCHEDULING OPERATIONS
    // ============================================

    /**
     * Schedule a call
     */
    @Post(':id/schedule')
    @Roles('partner', 'system admin', 'platform')
    @HttpCode(HttpStatus.OK)
    async schedule(
        @Param('id') id: string,
        @Body() dto: ScheduleCallDto,
    ): Promise<{ callRequest: CallRequestResponseDto }> {
        const callRequest = await this.scheduleCall.execute(id, dto);

        // Send notification to subscriber (non-blocking)
        this.sendNotificationSafe(() =>
            this.notificationService?.notifyCallScheduled(callRequest.id)
        );

        return { callRequest: this.mapToResponse(callRequest) };
    }

    /**
     * Reschedule a call
     */
    @Post(':id/reschedule')
    @Roles('user', 'partner', 'system admin')
    @HttpCode(HttpStatus.OK)
    async reschedule(
        @Param('id') id: string,
        @Body() dto: RescheduleCallDto,
    ): Promise<{ callRequest: CallRequestResponseDto }> {
        const callRequest = await this.rescheduleCall.execute(id, dto);

        // Send notification (non-blocking)
        this.sendNotificationSafe(() =>
            this.notificationService?.notifyCallRescheduled(callRequest.id)
        );

        return { callRequest: this.mapToResponse(callRequest) };
    }

    /**
     * Update call link
     */
    @Patch(':id/call-link')
    @Roles('partner', 'system admin')
    async updateLink(
        @Param('id') id: string,
        @Body() dto: UpdateCallLinkDto,
    ): Promise<{ callRequest: CallRequestResponseDto }> {
        const callRequest = await this.updateCallLink.execute(id, dto);
        return { callRequest: this.mapToResponse(callRequest) };
    }

    // ============================================
    // CALL SESSION OPERATIONS
    // ============================================

    /**
     * Start a call
     */
    @Post(':id/start')
    @Roles('partner', 'system admin')
    @HttpCode(HttpStatus.OK)
    async start(@Param('id') id: string): Promise<{ callRequest: CallRequestResponseDto }> {
        const callRequest = await this.startCall.execute(id);
        return { callRequest: this.mapToResponse(callRequest) };
    }

    /**
     * End a call
     */
    @Post(':id/end')
    @Roles('partner', 'system admin')
    @HttpCode(HttpStatus.OK)
    async end(
        @Param('id') id: string,
        @Body() dto: EndCallDto,
    ): Promise<{ callRequest: CallRequestResponseDto }> {
        const callRequest = await this.endCall.execute(id, dto);

        // Send completion notification (non-blocking)
        this.sendNotificationSafe(() =>
            this.notificationService?.notifyCallCompleted(callRequest.id)
        );

        return { callRequest: this.mapToResponse(callRequest) };
    }

    /**
     * Mark call as no-show
     */
    @Post(':id/no-show')
    @Roles('partner', 'system admin')
    @HttpCode(HttpStatus.OK)
    async noShow(@Param('id') id: string): Promise<{ callRequest: CallRequestResponseDto }> {
        const callRequest = await this.markNoShow.execute(id);
        return { callRequest: this.mapToResponse(callRequest) };
    }

    // ============================================
    // SUBSCRIBER QUERIES
    // ============================================

    /**
     * Get calls for a subscriber
     */
    @Get('subscriber/:subscriberId')
    @Roles('user', 'system admin')
    async findBySubscriber(
        @Param('subscriberId') subscriberId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ): Promise<{ callRequests: CallRequestResponseDto[] }> {
        const callRequests = await this.getSubscriberCalls.execute(subscriberId, {
            limit: limit ? parseInt(limit) : 20,
            offset: offset ? parseInt(offset) : 0,
        });
        return { callRequests: callRequests.map(cr => this.mapToResponse(cr)) };
    }

    /**
     * Get call minutes summary for a subscriber
     */
    @Get('subscriber/:subscriberId/minutes')
    @Roles('user', 'system admin')
    async getMinutesSummary(
        @Param('subscriberId') subscriberId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ): Promise<{ summary: { totalMinutes: number; billableMinutes: number } }> {
        const summary = await this.getCallMinutesSummary.execute(
            subscriberId,
            new Date(startDate),
            new Date(endDate),
        );
        return { summary };
    }

    // ============================================
    // PROVIDER QUERIES
    // ============================================

    /**
     * Get calls for a provider
     */
    @Get('provider/:providerId')
    @Roles('partner', 'system admin')
    async findByProvider(
        @Param('providerId') providerId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ): Promise<{ callRequests: CallRequestResponseDto[] }> {
        const callRequests = await this.getProviderCalls.execute(providerId, {
            limit: limit ? parseInt(limit) : 20,
            offset: offset ? parseInt(offset) : 0,
        });
        return { callRequests: callRequests.map(cr => this.mapToResponse(cr)) };
    }

    /**
     * Get upcoming calls for a provider
     */
    @Get('provider/:providerId/upcoming')
    @Roles('partner', 'system admin')
    async findUpcoming(
        @Param('providerId') providerId: string,
        @Query('limit') limit?: string,
    ): Promise<{ callRequests: CallRequestResponseDto[] }> {
        const callRequests = await this.getUpcomingCalls.execute(
            providerId,
            limit ? parseInt(limit) : 10,
        );
        return { callRequests: callRequests.map(cr => this.mapToResponse(cr)) };
    }

    /**
     * Check provider availability
     */
    @Get('provider/:providerId/availability')
    @Roles('partner', 'system admin', 'platform')
    async checkAvailability(
        @Param('providerId') providerId: string,
        @Query('scheduledAt') scheduledAt: string,
        @Query('durationMinutes') durationMinutes: string,
    ): Promise<{ isAvailable: boolean; conflictingCalls: CallRequestResponseDto[] }> {
        const result = await this.checkProviderAvailability.execute(
            providerId,
            new Date(scheduledAt),
            parseInt(durationMinutes),
        );
        return {
            isAvailable: result.isAvailable,
            conflictingCalls: result.conflictingCalls.map(cr => this.mapToResponse(cr)),
        };
    }

    // ============================================
    // ADMIN QUERIES
    // ============================================

    /**
     * Get overdue calls
     */
    @Get('admin/overdue')
    @Roles('system admin', 'platform')
    async findOverdue(): Promise<{ callRequests: CallRequestResponseDto[] }> {
        const callRequests = await this.getOverdueCalls.execute();
        return { callRequests: callRequests.map(cr => this.mapToResponse(cr)) };
    }

    /**
     * Get scheduled calls for a date range
     */
    @Get('admin/scheduled')
    @Roles('system admin', 'platform')
    async findScheduled(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('providerId') providerId?: string,
    ): Promise<{ callRequests: CallRequestResponseDto[] }> {
        const callRequests = await this.getScheduledCalls.execute(
            new Date(startDate),
            new Date(endDate),
            providerId,
        );
        return { callRequests: callRequests.map(cr => this.mapToResponse(cr)) };
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Safely send notification without blocking the main request
     */
    private sendNotificationSafe(notificationFn: () => Promise<void> | undefined): void {
        if (!this.notificationService) {
            return;
        }

        const promise = notificationFn();
        if (promise) {
            promise.catch((error) => {
                this.logger.error('Failed to send notification', error);
            });
        }
    }

    private mapToResponse(callRequest: any): CallRequestResponseDto {
        return {
            id: callRequest.id,
            requestNumber: callRequest.requestNumber,
            subscriberId: callRequest.subscriberId,
            assignedProviderId: callRequest.assignedProviderId,
            consultationType: callRequest.consultationType,
            purpose: callRequest.purpose,
            preferredDate: callRequest.preferredDate,
            preferredTime: callRequest.preferredTime,
            status: callRequest.status,
            scheduledAt: callRequest.scheduledAt,
            scheduledDuration: callRequest.scheduledDuration,
            actualDuration: callRequest.actualDuration,
            callStartedAt: callRequest.callStartedAt,
            callEndedAt: callRequest.callEndedAt,
            recordingUrl: callRequest.recordingUrl,
            callPlatform: callRequest.callPlatform,
            callLink: callRequest.callLink,
            submittedAt: callRequest.submittedAt,
            completedAt: callRequest.completedAt,
            createdAt: callRequest.createdAt,
            updatedAt: callRequest.updatedAt,
        };
    }
}
