// ============================================
// LITIGATION CASE CONTROLLER
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
  // UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Use Cases
import {
  CreateLitigationCaseUseCase,
  UpdateLitigationCaseUseCase,
  AssignProviderUseCase,
  SendQuoteUseCase,
  AcceptQuoteUseCase,
  MarkAsPaidUseCase,
  ActivateCaseUseCase,
  CloseCaseUseCase,
  CancelCaseUseCase,
  ProcessRefundUseCase,
  GetLitigationCaseUseCase,
  ListLitigationCasesUseCase,
  GetMyCasesUseCase,
  GetProviderCasesUseCase,
  GetLitigationStatisticsUseCase,
  DeleteLitigationCaseUseCase,
} from '../../core/application/litigation-case/use-cases/litigation-case.use-cases';

/**
 * Litigation Case Controller
 *
 * RBAC:
 * - subscriber: Can create, view own, update own, accept quote, cancel
 * - partner/provider: Can view assigned, send quote, update workflow
 * - platform/admin: Full access to all operations
 */
@ApiTags('Litigation Cases')
@ApiBearerAuth()
@Controller('litigation-cases')
export class LitigationCaseController {
  constructor(
    private readonly createLitigationCaseUseCase: CreateLitigationCaseUseCase,
    private readonly updateLitigationCaseUseCase: UpdateLitigationCaseUseCase,
    private readonly assignProviderUseCase: AssignProviderUseCase,
    private readonly sendQuoteUseCase: SendQuoteUseCase,
    private readonly acceptQuoteUseCase: AcceptQuoteUseCase,
    private readonly markAsPaidUseCase: MarkAsPaidUseCase,
    private readonly activateCaseUseCase: ActivateCaseUseCase,
    private readonly closeCaseUseCase: CloseCaseUseCase,
    private readonly cancelCaseUseCase: CancelCaseUseCase,
    private readonly processRefundUseCase: ProcessRefundUseCase,
    private readonly getLitigationCaseUseCase: GetLitigationCaseUseCase,
    private readonly listLitigationCasesUseCase: ListLitigationCasesUseCase,
    private readonly getMyCasesUseCase: GetMyCasesUseCase,
    private readonly getProviderCasesUseCase: GetProviderCasesUseCase,
    private readonly getLitigationStatisticsUseCase: GetLitigationStatisticsUseCase,
    private readonly deleteLitigationCaseUseCase: DeleteLitigationCaseUseCase,
  ) {}

  // ============================================
  // SUBSCRIBER ENDPOINTS
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('subscriber', 'admin')
  @Permissions('case:create')
  @ApiOperation({
    summary: 'Create new litigation case',
    description: 'Subscriber creates a new case in pending status',
  })
  @ApiResponse({ status: 201, description: 'Case created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: any, @CurrentUser() user: any): Promise<any> {
    return await this.createLitigationCaseUseCase.execute({
      ...dto,
      subscriberId: user.userId,
    });
  }

  @Put(':id')
  @Roles('subscriber', 'admin')
  @Permissions('case:update')
  @ApiOperation({
    summary: 'Update litigation case',
    description: 'Update case details (only in pending/quote_sent status)',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 200, description: 'Case updated' })
  @ApiResponse({ status: 400, description: 'Cannot update - invalid status' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ): Promise<any> {
    return await this.updateLitigationCaseUseCase.execute({
      caseId: id,
      userId: user.userId,
      ...dto,
    });
  }

  @Get('my-cases')
  @Roles('subscriber', 'admin')
  @Permissions('case:read')
  @ApiOperation({
    summary: 'Get my litigation cases',
    description: 'Get all cases for authenticated subscriber',
  })
  @ApiResponse({ status: 200, description: 'Cases retrieved' })
  async getMyCases(
    @Query() query: any,
    @CurrentUser() user: any,
  ): Promise<any> {
    return await this.getMyCasesUseCase.execute({
      userId: user.userId,
      pagination: query,
    });
  }

  @Post(':id/accept-quote')
  @HttpCode(HttpStatus.OK)
  @Roles('subscriber', 'admin')
  @Permissions('case:update')
  @ApiOperation({
    summary: 'Accept quote',
    description: 'Subscriber accepts the quote sent by provider',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 200, description: 'Quote accepted' })
  @ApiResponse({
    status: 400,
    description: 'Cannot accept - quote expired or invalid status',
  })
  async acceptQuote(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return await this.acceptQuoteUseCase.execute({
      caseId: id,
      userId: user.userId,
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('subscriber', 'admin')
  @Permissions('case:update')
  @ApiOperation({
    summary: 'Cancel case',
    description: 'Subscriber cancels their case (early stages only)',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 200, description: 'Case cancelled' })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel - invalid status or payment completed',
  })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ): Promise<any> {
    return await this.cancelCaseUseCase.execute({
      caseId: id,
      userId: user.userId,
      reason: dto.reason,
    });
  }

  // ============================================
  // PROVIDER ENDPOINTS
  // ============================================

  @Get('my-assignments')
  @Roles('partner', 'provider', 'admin')
  @Permissions('case:read')
  @ApiOperation({
    summary: 'Get my assigned cases',
    description: 'Get all cases assigned to authenticated provider',
  })
  @ApiResponse({ status: 200, description: 'Assigned cases retrieved' })
  async getMyAssignments(
    @Query() query: any,
    @CurrentUser() user: any,
  ): Promise<any> {
    return await this.getProviderCasesUseCase.execute({
      providerId: user.userId,
      pagination: query,
    });
  }

  @Post(':id/send-quote')
  @HttpCode(HttpStatus.OK)
  @Roles('partner', 'provider', 'admin')
  @Permissions('case:update')
  @ApiOperation({
    summary: 'Send quote to client',
    description: 'Provider sends price quote for the case',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 200, description: 'Quote sent' })
  @ApiResponse({
    status: 400,
    description: 'Cannot send quote - invalid status',
  })
  async sendQuote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ): Promise<any> {
    return await this.sendQuoteUseCase.execute({
      caseId: id,
      providerId: user.userId,
      ...dto,
    });
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get()
  @Roles('platform', 'admin')
  @Permissions('case:read')
  @ApiOperation({
    summary: 'List all litigation cases',
    description: 'Admin can list all cases with filters',
  })
  @ApiResponse({ status: 200, description: 'Cases retrieved' })
  async listAll(@Query() query: any): Promise<any> {
    return await this.listLitigationCasesUseCase.execute({
      filters: query,
      pagination: query,
    });
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @Roles('platform', 'admin')
  @Permissions('case:assign')
  @ApiOperation({
    summary: 'Assign case to provider',
    description: 'Admin assigns case to specific provider',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 200, description: 'Case assigned' })
  async assignProvider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ): Promise<any> {
    return await this.assignProviderUseCase.execute({
      caseId: id,
      providerId: dto.providerId,
      assignedBy: user.userId,
    });
  }

  @Post(':id/mark-as-paid')
  @HttpCode(HttpStatus.OK)
  @Roles('platform', 'admin')
  @Permissions('case:manage')
  @ApiOperation({
    summary: 'Mark as paid',
    description: 'Mark case as paid after payment confirmation',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 200, description: 'Marked as paid' })
  async markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
  ): Promise<any> {
    return await this.markAsPaidUseCase.execute({
      caseId: id,
      ...dto,
    });
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Roles('platform', 'admin')
  @Permissions('case:manage')
  @ApiOperation({
    summary: 'Activate case',
    description: 'Activate case after payment (start working on it)',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 200, description: 'Case activated' })
  @ApiResponse({
    status: 400,
    description: 'Cannot activate - payment not completed',
  })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return await this.activateCaseUseCase.execute({
      caseId: id,
    });
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @Roles('platform', 'admin')
  @Permissions('case:manage')
  @ApiOperation({
    summary: 'Close case',
    description: 'Close active case (mark as completed)',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 200, description: 'Case closed' })
  @ApiResponse({ status: 400, description: 'Cannot close - not active' })
  async close(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return await this.closeCaseUseCase.execute({
      caseId: id,
    });
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @Roles('platform', 'admin')
  @Permissions('case:manage')
  @ApiOperation({
    summary: 'Process refund',
    description: 'Process refund for paid case',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  async processRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
  ): Promise<any> {
    return await this.processRefundUseCase.execute({
      caseId: id,
      refundReference: dto.refundReference,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  @Permissions('case:delete')
  @ApiOperation({
    summary: 'Delete case',
    description: 'Soft delete case (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 204, description: 'Case deleted' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.deleteLitigationCaseUseCase.execute({
      caseId: id,
      deletedBy: user.userId,
    });
  }

  @Get('statistics')
  @Roles('platform', 'admin')
  @Permissions('case:read')
  @ApiOperation({
    summary: 'Get case statistics',
    description: 'Get comprehensive statistics about litigation cases',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics(@Query() filters: any): Promise<any> {
    return await this.getLitigationStatisticsUseCase.execute({ filters });
  }

  // ============================================
  // SHARED ENDPOINTS
  // ============================================

  @Get(':id')
  @Roles('subscriber', 'partner', 'provider', 'platform', 'admin')
  @Permissions('case:read')
  @ApiOperation({
    summary: 'Get case by ID',
    description: 'Get specific case details',
  })
  @ApiParam({ name: 'id', description: 'Case ID' })
  @ApiResponse({ status: 200, description: 'Case retrieved' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to this case',
  })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return await this.getLitigationCaseUseCase.execute({
      caseId: id,
      userId: user.userId,
      userRole: user.role,
    });
  }
}
