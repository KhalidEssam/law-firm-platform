// ============================================
// PAYMENT METHOD CONTROLLER
// Presentation Layer - HTTP Endpoints with RBAC
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
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.decorator';
import { Permissions } from 'src/auth/permissions.decorator';
import {
  StrictRateLimit,
  StandardRateLimit,
  RelaxedRateLimit,
} from '../../common/decorators/throttle.decorator';
// Use Cases
import {
  AddPaymentMethodUseCase,
  UpdatePaymentMethodUseCase,
  SetDefaultPaymentMethodUseCase,
  VerifyPaymentMethodUseCase,
  MarkPaymentMethodAsUsedUseCase,
  RecordFailedPaymentAttemptUseCase,
  ResetFailedAttemptsUseCase,
  ActivatePaymentMethodUseCase,
  DeactivatePaymentMethodUseCase,
  DeletePaymentMethodUseCase,
  RestorePaymentMethodUseCase,
  GetPaymentMethodUseCase,
  GetMyPaymentMethodsUseCase,
  GetDefaultPaymentMethodUseCase,
  ListPaymentMethodsUseCase,
  GetExpiringPaymentMethodsUseCase,
  GetPaymentMethodStatisticsUseCase,
  HardDeletePaymentMethodUseCase,
} from '../../core/application/payment-method/use-cases/payment-method.use-cases';

// DTOs
import {
  AddPaymentMethodDto,
  UpdatePaymentMethodDto,
  VerifyPaymentMethodDto,
  // ResetFailedAttemptsDto,
  GetMyPaymentMethodsDto,
  ListPaymentMethodsDto,
  GetExpiringPaymentMethodsDto,
} from '../../core/application/payment-method/dtos/payment-method.dto';

@ApiTags('Payment Methods')
@Controller('payment-methods')
@ApiBearerAuth()
export class PaymentMethodController {
  constructor(
    private readonly addPaymentMethodUseCase: AddPaymentMethodUseCase,
    private readonly updatePaymentMethodUseCase: UpdatePaymentMethodUseCase,
    private readonly setDefaultPaymentMethodUseCase: SetDefaultPaymentMethodUseCase,
    private readonly verifyPaymentMethodUseCase: VerifyPaymentMethodUseCase,
    private readonly markPaymentMethodAsUsedUseCase: MarkPaymentMethodAsUsedUseCase,
    private readonly recordFailedPaymentAttemptUseCase: RecordFailedPaymentAttemptUseCase,
    private readonly resetFailedAttemptsUseCase: ResetFailedAttemptsUseCase,
    private readonly activatePaymentMethodUseCase: ActivatePaymentMethodUseCase,
    private readonly deactivatePaymentMethodUseCase: DeactivatePaymentMethodUseCase,
    private readonly deletePaymentMethodUseCase: DeletePaymentMethodUseCase,
    private readonly restorePaymentMethodUseCase: RestorePaymentMethodUseCase,
    private readonly getPaymentMethodUseCase: GetPaymentMethodUseCase,
    private readonly getMyPaymentMethodsUseCase: GetMyPaymentMethodsUseCase,
    private readonly getDefaultPaymentMethodUseCase: GetDefaultPaymentMethodUseCase,
    private readonly listPaymentMethodsUseCase: ListPaymentMethodsUseCase,
    private readonly getExpiringPaymentMethodsUseCase: GetExpiringPaymentMethodsUseCase,
    private readonly getPaymentMethodStatisticsUseCase: GetPaymentMethodStatisticsUseCase,
    private readonly hardDeletePaymentMethodUseCase: HardDeletePaymentMethodUseCase,
  ) {}

  // ============================================
  // USER ENDPOINTS (Authenticated Users)
  // ============================================

  @Post()
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('write:payment-methods')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add payment method' })
  @ApiResponse({
    status: 201,
    description: 'Payment method added successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addPaymentMethod(
    @Body() dto: AddPaymentMethodDto,
    @Req() req: any,
  ): Promise<any> {
    return await this.addPaymentMethodUseCase.execute({
      userId: req.user.sub,
      type: dto.type,
      details: dto.details,
      nickname: dto.nickname,
      setAsDefault: dto.setAsDefault,
    });
  }

  @Put(':id')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('write:payment-methods')
  @ApiOperation({ summary: 'Update payment method' })
  @ApiResponse({ status: 200, description: 'Payment method updated' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updatePaymentMethod(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
    @Req() req: any,
  ): Promise<any> {
    return await this.updatePaymentMethodUseCase.execute({
      paymentMethodId: id,
      userId: req.user.sub,
      nickname: dto.nickname,
      details: dto.details,
    });
  }

  @Post(':id/set-default')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('write:payment-methods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set payment method as default' })
  @ApiResponse({ status: 200, description: 'Payment method set as default' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot set as default - not verified',
  })
  async setAsDefault(@Param('id') id: string, @Req() req: any): Promise<any> {
    return await this.setDefaultPaymentMethodUseCase.execute({
      paymentMethodId: id,
      userId: req.user.sub,
    });
  }

  @Post(':id/verify')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('write:payment-methods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment method' })
  @ApiResponse({ status: 200, description: 'Payment method verified' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async verifyPaymentMethod(
    @Param('id') id: string,
    @Body() dto: VerifyPaymentMethodDto,
    @Req() req: any,
  ): Promise<any> {
    return await this.verifyPaymentMethodUseCase.execute({
      paymentMethodId: id,
      userId: req.user.sub,
      verificationCode: dto.verificationCode,
    });
  }

  @Post(':id/activate')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('write:payment-methods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate payment method' })
  @ApiResponse({ status: 200, description: 'Payment method activated' })
  async activatePaymentMethod(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<any> {
    return await this.activatePaymentMethodUseCase.execute({
      paymentMethodId: id,
      userId: req.user.sub,
    });
  }

  @Post(':id/deactivate')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('write:payment-methods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate payment method' })
  @ApiResponse({ status: 200, description: 'Payment method deactivated' })
  async deactivatePaymentMethod(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<any> {
    return await this.deactivatePaymentMethodUseCase.execute({
      paymentMethodId: id,
      userId: req.user.sub,
    });
  }

  @Post(':id/reset-failed-attempts')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('write:payment-methods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset failed payment attempts' })
  @ApiResponse({ status: 200, description: 'Failed attempts reset' })
  async resetFailedAttempts(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<any> {
    return await this.resetFailedAttemptsUseCase.execute({
      paymentMethodId: id,
      userId: req.user.sub,
    });
  }

  @Delete(':id')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('delete:payment-methods')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete payment method (soft delete)' })
  @ApiResponse({ status: 204, description: 'Payment method deleted' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete default payment method',
  })
  async deletePaymentMethod(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<void> {
    await this.deletePaymentMethodUseCase.execute({
      paymentMethodId: id,
      userId: req.user.sub,
    });
  }

  @Post(':id/restore')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('write:payment-methods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore deleted payment method' })
  @ApiResponse({ status: 200, description: 'Payment method restored' })
  async restorePaymentMethod(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<any> {
    return await this.restorePaymentMethodUseCase.execute({
      paymentMethodId: id,
      userId: req.user.sub,
    });
  }

  @Get('my-methods')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('read:payment-methods')
  @ApiOperation({ summary: 'Get my payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved' })
  async getMyPaymentMethods(
    @Query() query: GetMyPaymentMethodsDto,
    @Req() req: any,
  ): Promise<any> {
    return await this.getMyPaymentMethodsUseCase.execute({
      userId: req.user.sub,
      includeInactive: query.includeInactive,
      pagination: {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
  }

  @Get('my-default')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('read:payment-methods')
  @ApiOperation({ summary: 'Get my default payment method' })
  @ApiResponse({ status: 200, description: 'Default payment method retrieved' })
  @ApiResponse({ status: 404, description: 'No default payment method found' })
  async getDefaultPaymentMethod(@Req() req: any): Promise<any> {
    return await this.getDefaultPaymentMethodUseCase.execute({
      userId: req.user.sub,
    });
  }

  @Get(':id')
  @Roles('subscriber', 'partner', 'platform', 'admin')
  @Permissions('read:payment-methods')
  @ApiOperation({ summary: 'Get payment method by ID' })
  @ApiResponse({ status: 200, description: 'Payment method retrieved' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPaymentMethod(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<any> {
    return await this.getPaymentMethodUseCase.execute({
      paymentMethodId: id,
      userId: req.user.sub,
      userRole: req.user.role,
    });
  }

  // ============================================
  // ADMIN / PLATFORM ENDPOINTS
  // ============================================

  @Get()
  @Roles('platform', 'admin')
  @Permissions('read:payment-methods')
  @ApiOperation({ summary: 'List all payment methods (Admin)' })
  @ApiResponse({ status: 200, description: 'Payment methods listed' })
  async listPaymentMethods(
    @Query() query: ListPaymentMethodsDto,
  ): Promise<any> {
    return await this.listPaymentMethodsUseCase.execute({
      filters: {
        userId: query.userId,
        type: query.type,
        isDefault: query.isDefault,
        isVerified: query.isVerified,
        isActive: query.isActive,
        searchTerm: query.searchTerm,
        createdFrom: query.createdFrom,
        createdTo: query.createdTo,
      },
      pagination: {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
  }

  @Get('expiring/soon')
  @Roles('platform', 'admin')
  @Permissions('read:payment-methods')
  @ApiOperation({ summary: 'Get expiring payment methods (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Expiring payment methods retrieved',
  })
  async getExpiringPaymentMethods(
    @Query() query: GetExpiringPaymentMethodsDto,
  ): Promise<any> {
    return await this.getExpiringPaymentMethodsUseCase.execute({
      days: query.days,
      pagination: {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
  }

  @Get('statistics/overview')
  @Roles('platform', 'admin')
  @Permissions('read:payment-methods')
  @ApiOperation({ summary: 'Get payment method statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics(@Query('userId') userId?: string): Promise<any> {
    return await this.getPaymentMethodStatisticsUseCase.execute({
      filters: userId ? { userId } : undefined,
    });
  }

  @Delete(':id/permanent')
  @Roles('admin')
  @Permissions('delete:payment-methods')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete payment method (Admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Payment method permanently deleted',
  })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async hardDeletePaymentMethod(@Param('id') id: string): Promise<void> {
    await this.hardDeletePaymentMethodUseCase.execute({
      paymentMethodId: id,
    });
  }

  // ============================================
  // INTERNAL ENDPOINTS (System Use Only)
  // ============================================

  @Post(':id/mark-as-used')
  @Roles('platform', 'admin')
  @Permissions('write:payment-methods')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark payment method as used (Internal)' })
  @ApiResponse({ status: 204, description: 'Payment method marked as used' })
  async markAsUsed(@Param('id') id: string): Promise<void> {
    await this.markPaymentMethodAsUsedUseCase.execute({
      paymentMethodId: id,
    });
  }

  @Post(':id/record-failed-attempt')
  @Roles('platform', 'admin')
  @Permissions('write:payment-methods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record failed payment attempt (Internal)' })
  @ApiResponse({ status: 200, description: 'Failed attempt recorded' })
  async recordFailedAttempt(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<any> {
    return await this.recordFailedPaymentAttemptUseCase.execute({
      paymentMethodId: id,
      reason,
    });
  }
}
