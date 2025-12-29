// ============================================
// MEMBERSHIP CONTROLLER - COMPLETE
// interface/http/MembershipController.ts
// ============================================

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
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';

// Use Cases
import {
  CreateMembershipUseCase,
  GetMembershipByIdUseCase,
  GetActiveMembershipByUserUseCase,
  CancelMembershipUseCase,
  RenewMembershipUseCase,
  ToggleAutoRenewUseCase,
  ApplyCouponUseCase,
  CheckQuotaUseCase,
  ConsumeQuotaUseCase,
  ListMembershipTiersUseCase,
  CreateMembershipTierUseCase,
  UpdateMembershipTierUseCase,
  DeleteMembershipTierUseCase,
  GetMembershipTierByIdUseCase,
  CreatePaymentUseCase,
  CompletePaymentUseCase,
} from '../../core/application/membership/use-cases/membership.use-cases';

// Tier Service Use Cases
import {
  CreateTierServiceUseCase,
  // GetTierServiceByIdUseCase,
  GetTierServicesByTierIdUseCase,
  UpdateTierServiceUseCase,
  DeleteTierServiceUseCase,
  CheckServiceQuotaUseCase,
} from '../../core/application/membership/use-cases/tier-service.use-cases';

// Service Usage Use Cases
import {
  RecordServiceUsageUseCase,
  GetServiceUsageHistoryUseCase,
  GetServiceUsageSummaryUseCase,
  CheckRemainingServiceQuotaUseCase,
  GetUnbilledUsageUseCase,
  MarkUsageAsBilledUseCase,
} from '../../core/application/membership/use-cases/service-usage.use-cases';

// Tier Change Use Cases
import {
  ChangeMembershipTierUseCase,
  UpgradeMembershipUseCase,
  DowngradeMembershipUseCase,
  GetMembershipChangeHistoryUseCase,
  GetTierChangeStatisticsUseCase,
} from '../../core/application/membership/use-cases/tier-change.use-cases';

// Lifecycle Use Cases
import {
  PauseMembershipUseCase,
  ResumeMembershipUseCase,
  GetExpiringMembershipsUseCase,
  ReactivateMembershipUseCase,
  CheckMembershipStatusUseCase,
} from '../../core/application/membership/use-cases/membership-lifecycle.use-cases';

// Admin Use Cases
import {
  ListMembershipsUseCase,
  GetMembershipStatisticsUseCase,
  GetTierDistributionUseCase,
} from '../../core/application/membership/use-cases/membership-admin.use-cases';

// DTOs
import {
  CreateMembershipDto,
  // CancelMembershipDto,
  RenewMembershipDto,
  ToggleAutoRenewDto,
  ApplyCouponDto,
  ConsumeQuotaDto,
  CreateMembershipTierDto,
  UpdateMembershipTierDto,
  // CreateCouponDto,
  // UpdateCouponDto,
  CreatePaymentDto,
  CompletePaymentDto,
  // ListMembershipsQueryDto,
  ListTiersQueryDto,
  // ListCouponsQueryDto,
  MembershipResponseDto,
  MembershipTierResponseDto,
  QuotaResponseDto,
  PaymentResponseDto,
  // CouponResponseDto,
  ApplyCouponResponseDto,
} from '../../core/application/membership/dto/index.dto';

import { QuotaResource } from '../../core/domain/membership/value-objects/quota-resource.vo';

@Controller('memberships')
// @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class MembershipController {
  constructor(
    // Core membership use cases
    private readonly createMembership: CreateMembershipUseCase,
    private readonly getMembershipById: GetMembershipByIdUseCase,
    private readonly getActiveMembershipByUser: GetActiveMembershipByUserUseCase,
    private readonly cancelMembership: CancelMembershipUseCase,
    private readonly renewMembership: RenewMembershipUseCase,
    private readonly toggleAutoRenew: ToggleAutoRenewUseCase,
    private readonly applyCoupon: ApplyCouponUseCase,
    private readonly checkQuota: CheckQuotaUseCase,
    private readonly consumeQuota: ConsumeQuotaUseCase,
    private readonly listTiers: ListMembershipTiersUseCase,
    private readonly createTier: CreateMembershipTierUseCase,
    private readonly updateTier: UpdateMembershipTierUseCase,
    private readonly deleteTier: DeleteMembershipTierUseCase,
    private readonly getTierById: GetMembershipTierByIdUseCase,
    private readonly createPayment: CreatePaymentUseCase,
    private readonly completePayment: CompletePaymentUseCase,

    // Tier Service use cases
    private readonly createTierService: CreateTierServiceUseCase,
    // private readonly getTierServiceById: GetTierServiceByIdUseCase,
    private readonly getTierServicesByTierId: GetTierServicesByTierIdUseCase,
    private readonly updateTierService: UpdateTierServiceUseCase,
    private readonly deleteTierService: DeleteTierServiceUseCase,
    private readonly checkServiceQuota: CheckServiceQuotaUseCase,

    // Service Usage use cases
    private readonly recordServiceUsage: RecordServiceUsageUseCase,
    private readonly getServiceUsageHistory: GetServiceUsageHistoryUseCase,
    private readonly getServiceUsageSummary: GetServiceUsageSummaryUseCase,
    private readonly checkRemainingServiceQuota: CheckRemainingServiceQuotaUseCase,
    private readonly getUnbilledUsage: GetUnbilledUsageUseCase,
    private readonly markUsageAsBilled: MarkUsageAsBilledUseCase,

    // Tier Change use cases
    private readonly changeMembershipTier: ChangeMembershipTierUseCase,
    private readonly upgradeMembership: UpgradeMembershipUseCase,
    private readonly downgradeMembership: DowngradeMembershipUseCase,
    private readonly getMembershipChangeHistory: GetMembershipChangeHistoryUseCase,
    private readonly getTierChangeStatistics: GetTierChangeStatisticsUseCase,

    // Lifecycle use cases
    private readonly pauseMembership: PauseMembershipUseCase,
    private readonly resumeMembership: ResumeMembershipUseCase,
    private readonly getExpiringMemberships: GetExpiringMembershipsUseCase,
    private readonly reactivateMembership: ReactivateMembershipUseCase,
    private readonly checkMembershipStatus: CheckMembershipStatusUseCase,

    // Admin use cases
    private readonly listMemberships: ListMembershipsUseCase,
    private readonly getMembershipStatistics: GetMembershipStatisticsUseCase,
    private readonly getTierDistribution: GetTierDistributionUseCase,
  ) {}

  // ============================================
  // MEMBERSHIP ENDPOINTS
  // ============================================

  /**
   * Create a new membership
   * Accessible by: user, partner, platform, system admin
   */
  @Post()
  @Public()
  // @Roles('user', 'partner', 'platform', 'system admin')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateMembershipDto,
  ): Promise<{ membership: MembershipResponseDto }> {
    const membership = await this.createMembership.execute(dto);
    return {
      membership: this.mapMembershipToResponse(membership),
    };
  }

  /**
   * Get current user's active membership
   * Accessible by: user, partner, platform, system admin
   */
  @Get('me')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getMyMembership(
    @Req() req,
  ): Promise<{ membership: MembershipResponseDto | null }> {
    const userId = req.user.userId;
    const membership = await this.getActiveMembershipByUser.execute(userId);
    return {
      membership: membership ? this.mapMembershipToResponse(membership) : null,
    };
  }

  /**
   * Get user's active membership by user ID
   * Accessible by: system admin, platform
   */
  @Get('user/:userId')
  @Roles('system admin', 'platform')
  @Public()
  // @Permissions('read:memberships')
  async getByUserId(
    @Param('userId') userId: string,
  ): Promise<{ membership: MembershipResponseDto | null }> {
    const membership = await this.getActiveMembershipByUser.execute(userId);
    return {
      membership: membership ? this.mapMembershipToResponse(membership) : null,
    };
  }

  /**
   * Cancel membership
   * Accessible by: owner, system admin
   */
  @Delete(':id')
  @Roles('user', 'system admin')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    // @Body() dto: CancelMembershipDto,
  ): Promise<{ membership: MembershipResponseDto }> {
    const membership = await this.cancelMembership.execute(id);
    return {
      membership: this.mapMembershipToResponse(membership),
    };
  }

  /**
   * Renew membership
   * Accessible by: owner, system admin
   */
  @Post(':id/renew')
  @Roles('user', 'system admin')
  @HttpCode(HttpStatus.OK)
  async renew(
    @Param('id') id: string,
    @Body() dto: RenewMembershipDto,
  ): Promise<{ membership: MembershipResponseDto }> {
    const membership = await this.renewMembership.execute({
      membershipId: id,
      durationInMonths: dto.durationInMonths,
    });
    return {
      membership: this.mapMembershipToResponse(membership),
    };
  }

  /**
   * Toggle auto-renew
   * Accessible by: owner, system admin
   */
  @Patch(':id/auto-renew')
  @Roles('user', 'system admin')
  async toggleAutoRenewStatus(
    @Param('id') id: string,
    @Body() dto: ToggleAutoRenewDto,
  ): Promise<{ membership: MembershipResponseDto }> {
    const membership = await this.toggleAutoRenew.execute(id, dto.autoRenew);
    return {
      membership: this.mapMembershipToResponse(membership),
    };
  }

  /**
   * Get membership by ID
   * Accessible by: system admin, platform
   */
  @Get(':id')
  @Roles('system admin', 'platform')
  @Permissions('read:memberships')
  async getById(
    @Param('id') id: string,
  ): Promise<{ membership: MembershipResponseDto }> {
    const membership = await this.getMembershipById.execute(id);
    return {
      membership: this.mapMembershipToResponse(membership),
    };
  }

  // ============================================
  // TIER ENDPOINTS
  // ============================================

  /**
   * List all tiers (Public)
   * Accessible by: everyone
   */
  @Public()
  @Get('tiers')
  async listAllTiers(
    @Query() query: ListTiersQueryDto,
  ): Promise<{ tiers: MembershipTierResponseDto[] }> {
    const tiers = await this.listTiers.execute(query);
    return {
      tiers: tiers.map((tier) => this.mapTierToResponse(tier)),
    };
  }

  /**
   * Get tier by ID (Public)
   * Accessible by: everyone
   */
  @Public()
  @Get('tiers/:id')
  async getTier(
    @Param('id') id: string,
  ): Promise<{ tier: MembershipTierResponseDto }> {
    const tier = await this.getTierById.execute(parseInt(id));
    return {
      tier: this.mapTierToResponse(tier),
    };
  }

  /**
   * Create new tier
   * Accessible by: system admin only
   */
  @Post('tiers')
  @Public()
  // @Roles('system admin')
  // @Permissions('create:tiers')
  @HttpCode(HttpStatus.CREATED)
  async createNewTier(
    @Body() dto: CreateMembershipTierDto,
  ): Promise<{ tier: MembershipTierResponseDto }> {
    const tier = await this.createTier.execute(dto);
    return {
      tier: this.mapTierToResponse(tier),
    };
  }

  /**
   * Update tier
   * Accessible by: system admin only
   */
  @Put('tiers/:id')
  @Roles('system admin')
  @Permissions('update:tiers')
  @HttpCode(HttpStatus.OK)
  async updateExistingTier(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipTierDto,
  ): Promise<{ tier: MembershipTierResponseDto }> {
    const tier = await this.updateTier.execute(parseInt(id), dto);
    return {
      tier: this.mapTierToResponse(tier),
    };
  }

  /**
   * Delete tier (soft delete)
   * Accessible by: system admin only
   */
  @Delete('tiers/:id')
  @Roles('system admin')
  @Permissions('delete:tiers')
  @HttpCode(HttpStatus.OK)
  async deleteTierById(@Param('id') id: string): Promise<{ message: string }> {
    await this.deleteTier.execute(parseInt(id));
    return {
      message: 'Tier deleted successfully',
    };
  }

  // ============================================
  // COUPON ENDPOINTS
  // ============================================

  /**
   * Apply coupon to membership
   * Accessible by: owner, system admin
   */
  @Post(':id/coupons/apply')
  @Roles('user', 'system admin')
  @HttpCode(HttpStatus.OK)
  async applyCouponCode(
    @Param('id') id: string,
    @Body() dto: ApplyCouponDto,
  ): Promise<ApplyCouponResponseDto> {
    const result = await this.applyCoupon.execute(id, dto.couponCode);
    return {
      discountAmount: result.discountAmount,
      message: 'Coupon applied successfully',
    };
  }

  // ============================================
  // QUOTA ENDPOINTS
  // ============================================

  /**
   * Check quota for a resource
   * Accessible by: owner, system admin, platform
   */
  @Get(':id/quota/:resource')
  // @Roles('user', 'partner', 'platform', 'system admin')
  @Public()
  async checkResourceQuota(
    @Param('id') id: string,
    @Param('resource') resource: QuotaResource,
  ): Promise<{ quota: QuotaResponseDto }> {
    const quota = await this.checkQuota.execute(id, resource);
    return { quota };
  }

  /**
   * Consume quota (internal use by other services)
   * Accessible by: system admin, platform
   */
  @Put(':id/quota/:resource/consume')
  @Public()
  // @Roles('platform', 'system admin')
  // @Permissions('update:quotas')
  @HttpCode(HttpStatus.OK)
  async consumeResourceQuota(
    @Param('id') id: string,
    @Param('resource') resource: QuotaResource,
    @Body() dto: ConsumeQuotaDto,
  ): Promise<{ message: string }> {
    await this.consumeQuota.execute(id, resource, dto.amount);
    return {
      message: `Successfully consumed ${dto.amount} ${resource}`,
    };
  }

  // ============================================
  // PAYMENT ENDPOINTS
  // ============================================

  /**
   * Create payment for membership
   * Accessible by: owner, system admin
   */
  @Post(':id/payments')
  // @Roles('user', 'system admin')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createMembershipPayment(
    // @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ): Promise<{ payment: PaymentResponseDto }> {
    const payment = await this.createPayment.execute({
      invoiceId: dto.invoiceId,
      provider: dto.provider,
      amount: dto.amount,
      currency: dto.currency,
      metadata: dto.metadata,
    });
    return {
      payment: this.mapPaymentToResponse(payment),
    };
  }

  /**
   * Complete payment (webhook/callback)
   * Accessible by: system admin, platform
   */
  @Post('payments/:paymentId/complete')
  // @Roles('platform', 'system admin')
  @Public()
  @HttpCode(HttpStatus.OK)
  async completePaymentTransaction(
    @Param('paymentId') paymentId: string,
    @Body() dto: CompletePaymentDto,
  ): Promise<{ payment: PaymentResponseDto }> {
    const payment = await this.completePayment.execute(
      paymentId,
      dto.providerTxnId,
    );
    return {
      payment: this.mapPaymentToResponse(payment),
    };
  }

  // ============================================
  // TIER SERVICE ENDPOINTS
  // ============================================

  /**
   * Create tier service
   * Accessible by: system admin only
   */
  @Post('tiers/:tierId/services')
  @Roles('system admin')
  @Permissions('create:tier-services')
  @HttpCode(HttpStatus.CREATED)
  async createNewTierService(
    @Param('tierId') tierId: string,
    @Body()
    dto: {
      serviceId: string;
      quotaPerMonth?: number;
      quotaPerYear?: number;
      rolloverUnused?: boolean;
      discountPercent?: number;
    },
  ): Promise<{ tierService: any }> {
    const tierService = await this.createTierService.execute({
      tierId: parseInt(tierId),
      ...dto,
    });
    return { tierService };
  }

  /**
   * Get tier services for a tier
   * Accessible by: everyone
   */
  @Public()
  @Get('tiers/:tierId/services')
  async getTierServices(
    @Param('tierId') tierId: string,
  ): Promise<{ tierServices: any[] }> {
    const tierServices = await this.getTierServicesByTierId.execute(
      parseInt(tierId),
    );
    return { tierServices };
  }

  /**
   * Update tier service
   * Accessible by: system admin only
   */
  @Put('tier-services/:id')
  @Roles('system admin')
  @Permissions('update:tier-services')
  async updateTierServiceById(
    @Param('id') id: string,
    @Body()
    dto: {
      quotaPerMonth?: number;
      quotaPerYear?: number;
      rolloverUnused?: boolean;
      discountPercent?: number;
      isActive?: boolean;
    },
  ): Promise<{ tierService: any }> {
    const tierService = await this.updateTierService.execute(id, dto);
    return { tierService };
  }

  /**
   * Delete tier service
   * Accessible by: system admin only
   */
  @Delete('tier-services/:id')
  @Roles('system admin')
  @Permissions('delete:tier-services')
  @HttpCode(HttpStatus.OK)
  async deleteTierServiceById(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.deleteTierService.execute(id);
    return { message: 'Tier service deleted successfully' };
  }

  /**
   * Check service quota for tier
   * Accessible by: everyone
   */
  @Public()
  @Get('tiers/:tierId/services/:serviceId/quota')
  async checkTierServiceQuota(
    @Param('tierId') tierId: string,
    @Param('serviceId') serviceId: string,
  ): Promise<{ quota: any }> {
    const quota = await this.checkServiceQuota.execute(
      parseInt(tierId),
      serviceId,
    );
    return { quota };
  }

  // ============================================
  // SERVICE USAGE ENDPOINTS
  // ============================================

  /**
   * Record service usage
   * Accessible by: platform, system admin
   */
  @Post(':id/service-usage')
  @Roles('platform', 'system admin')
  @Permissions('create:service-usage')
  @HttpCode(HttpStatus.CREATED)
  async recordUsage(
    @Param('id') membershipId: string,
    @Body()
    dto: {
      serviceId: string;
      consultationId?: string;
      legalOpinionId?: string;
      serviceRequestId?: string;
      litigationCaseId?: string;
      callRequestId?: string;
    },
  ): Promise<{ usage: any }> {
    const usage = await this.recordServiceUsage.execute({
      membershipId,
      ...dto,
    });
    return { usage };
  }

  /**
   * Get service usage history
   * Accessible by: owner, system admin
   */
  @Get(':id/service-usage')
  @Roles('user', 'system admin')
  async getUsageHistory(
    @Param('id') membershipId: string,
    @Query('serviceId') serviceId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ usage: any[] }> {
    const usage = await this.getServiceUsageHistory.execute(membershipId, {
      serviceId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    return { usage };
  }

  /**
   * Get service usage summary
   * Accessible by: owner, system admin
   */
  @Get(':id/service-usage/summary')
  @Roles('user', 'system admin')
  async getUsageSummary(
    @Param('id') membershipId: string,
  ): Promise<{ summary: any[] }> {
    const summary = await this.getServiceUsageSummary.execute(membershipId);
    return { summary };
  }

  /**
   * Check remaining service quota
   * Accessible by: owner, system admin, platform
   */
  @Get(':id/service-usage/:serviceId/remaining')
  @Roles('user', 'platform', 'system admin')
  async checkRemainingQuota(
    @Param('id') membershipId: string,
    @Param('serviceId') serviceId: string,
  ): Promise<{ quota: any }> {
    const quota = await this.checkRemainingServiceQuota.execute(
      membershipId,
      serviceId,
    );
    return { quota };
  }

  /**
   * Get unbilled usage
   * Accessible by: system admin, platform
   */
  @Get(':id/service-usage/unbilled')
  @Roles('platform', 'system admin')
  async getUnbilledServiceUsage(
    @Param('id') membershipId: string,
  ): Promise<{ usage: any[] }> {
    const usage = await this.getUnbilledUsage.execute(membershipId);
    return { usage };
  }

  /**
   * Mark usage as billed
   * Accessible by: system admin, platform
   */
  @Patch('service-usage/:usageId/bill')
  @Roles('platform', 'system admin')
  @Permissions('update:service-usage')
  async markAsBilled(
    @Param('usageId') usageId: string,
    @Body() dto: { amount: number; currency?: string },
  ): Promise<{ usage: any }> {
    const usage = await this.markUsageAsBilled.execute(
      usageId,
      dto.amount,
      dto.currency || 'SAR',
    );
    return { usage };
  }

  // ============================================
  // TIER CHANGE ENDPOINTS
  // ============================================

  /**
   * Change membership tier (upgrade/downgrade)
   * Accessible by: owner, system admin
   */
  @Post(':id/change-tier')
  @Roles('user', 'system admin')
  @HttpCode(HttpStatus.OK)
  async changeTier(
    @Param('id') membershipId: string,
    @Body() dto: { newTierId: number; reason?: string },
    @Req() req: any,
  ): Promise<{ result: any }> {
    const result = await this.changeMembershipTier.execute({
      membershipId,
      newTierId: dto.newTierId,
      reason: dto.reason,
      changedBy: req.user?.userId,
    });
    return { result };
  }

  /**
   * Upgrade membership
   * Accessible by: owner, system admin
   */
  @Post(':id/upgrade')
  @Roles('user', 'system admin')
  @HttpCode(HttpStatus.OK)
  async upgrade(
    @Param('id') membershipId: string,
    @Body() dto: { newTierId: number },
    @Req() req: any,
  ): Promise<{ result: any }> {
    const result = await this.upgradeMembership.execute(
      membershipId,
      dto.newTierId,
      req.user?.userId,
    );
    return { result };
  }

  /**
   * Downgrade membership
   * Accessible by: owner, system admin
   */
  @Post(':id/downgrade')
  @Roles('user', 'system admin')
  @HttpCode(HttpStatus.OK)
  async downgrade(
    @Param('id') membershipId: string,
    @Body() dto: { newTierId: number },
    @Req() req: any,
  ): Promise<{ result: any }> {
    const result = await this.downgradeMembership.execute(
      membershipId,
      dto.newTierId,
      req.user?.userId,
    );
    return { result };
  }

  /**
   * Get membership change history
   * Accessible by: owner, system admin
   */
  @Get(':id/change-history')
  @Roles('user', 'system admin')
  async getChangeHistory(
    @Param('id') membershipId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ history: any[] }> {
    const history = await this.getMembershipChangeHistory.execute(
      membershipId,
      {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      },
    );
    return { history };
  }

  // ============================================
  // LIFECYCLE ENDPOINTS
  // ============================================

  /**
   * Pause membership
   * Accessible by: owner, system admin
   */
  @Post(':id/pause')
  @Roles('user', 'system admin')
  @HttpCode(HttpStatus.OK)
  async pause(
    @Param('id') membershipId: string,
    @Body() dto: { reason?: string; pauseUntil?: Date },
    @Req() req: any,
  ): Promise<{ membership: MembershipResponseDto }> {
    const membership = await this.pauseMembership.execute({
      membershipId,
      reason: dto.reason,
      pausedBy: req.user?.userId,
      pauseUntil: dto.pauseUntil ? new Date(dto.pauseUntil) : undefined,
    });
    return { membership: this.mapMembershipToResponse(membership) };
  }

  /**
   * Resume membership
   * Accessible by: owner, system admin
   */
  @Post(':id/resume')
  @Roles('user', 'system admin')
  @HttpCode(HttpStatus.OK)
  async resume(
    @Param('id') membershipId: string,
    @Body() dto: { extendEndDate?: boolean },
    @Req() req: any,
  ): Promise<{ membership: MembershipResponseDto }> {
    const membership = await this.resumeMembership.execute({
      membershipId,
      resumedBy: req.user?.userId,
      extendEndDate: dto.extendEndDate,
    });
    return { membership: this.mapMembershipToResponse(membership) };
  }

  /**
   * Reactivate membership
   * Accessible by: owner, system admin
   */
  @Post(':id/reactivate')
  @Roles('user', 'system admin')
  @HttpCode(HttpStatus.OK)
  async reactivate(
    @Param('id') membershipId: string,
    @Body() dto: { durationInMonths: number },
    @Req() req: any,
  ): Promise<{ membership: MembershipResponseDto }> {
    const membership = await this.reactivateMembership.execute(
      membershipId,
      dto.durationInMonths,
      req.user?.userId,
    );
    return { membership: this.mapMembershipToResponse(membership) };
  }

  /**
   * Check membership status
   * Accessible by: owner, system admin
   */
  @Get(':id/status')
  @Roles('user', 'system admin')
  async getMembershipStatus(
    @Param('id') membershipId: string,
  ): Promise<{ status: any }> {
    const status = await this.checkMembershipStatus.execute(membershipId);
    return { status };
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  /**
   * List all memberships (Admin)
   * Accessible by: system admin, platform
   */
  @Get('admin/list')
  @Roles('system admin', 'platform')
  @Permissions('read:memberships')
  async listAllMemberships(
    @Query('isActive') isActive?: string,
    @Query('tierId') tierId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ memberships: MembershipResponseDto[]; total: number }> {
    const result = await this.listMemberships.execute({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      tierId: tierId ? parseInt(tierId) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    return {
      memberships: result.memberships.map((m) =>
        this.mapMembershipToResponse(m),
      ),
      total: result.total,
    };
  }

  /**
   * Get membership statistics (Admin)
   * Accessible by: system admin, platform
   */
  @Get('admin/statistics')
  @Roles('system admin', 'platform')
  @Permissions('read:statistics')
  async getStatistics(): Promise<{ statistics: any }> {
    const statistics = await this.getMembershipStatistics.execute();
    return { statistics };
  }

  /**
   * Get tier distribution (Admin)
   * Accessible by: system admin, platform
   */
  @Get('admin/tier-distribution')
  @Roles('system admin', 'platform')
  @Permissions('read:statistics')
  async tierDistribution(): Promise<{ distribution: any[] }> {
    const distribution = await this.getTierDistribution.execute();
    return { distribution };
  }

  /**
   * Get tier change statistics (Admin)
   * Accessible by: system admin, platform
   */
  @Get('admin/tier-change-stats')
  @Roles('system admin', 'platform')
  @Permissions('read:statistics')
  async tierChangeStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ stats: any }> {
    const stats = await this.getTierChangeStatistics.execute(
      new Date(startDate),
      new Date(endDate),
    );
    return { stats };
  }

  /**
   * Get expiring memberships (Admin)
   * Accessible by: system admin, platform
   */
  @Get('admin/expiring')
  @Roles('system admin', 'platform')
  @Permissions('read:memberships')
  async getExpiring(
    @Query('days') days: string,
    @Query('includeAutoRenew') includeAutoRenew?: string,
  ): Promise<{ memberships: MembershipResponseDto[] }> {
    const memberships = await this.getExpiringMemberships.execute({
      days: parseInt(days) || 30,
      includeAutoRenew: includeAutoRenew !== 'false',
    });
    return {
      memberships: memberships.map((m) => this.mapMembershipToResponse(m)),
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private mapMembershipToResponse(membership: any): MembershipResponseDto {
    return {
      id: membership.id,
      userId: membership.userId,
      tierId: membership.tierId,
      startDate: membership.startDate,
      endDate: membership.endDate,
      isActive: membership.isActive,
      autoRenew: membership.autoRenew,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }

  private mapTierToResponse(tier: any): MembershipTierResponseDto {
    return {
      id: tier.id,
      name: tier.name,
      nameAr: tier.nameAr,
      description: tier.description,
      descriptionAr: tier.descriptionAr,
      price: tier.price.amount,
      currency: tier.price.currency,
      billingCycle: tier.billingCycle.value,
      quota: tier.quota,
      benefits: tier.benefits,
      isActive: tier.isActive,
    };
  }

  private mapPaymentToResponse(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      provider: payment.provider,
      providerTxnId: payment.providerTxnId,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: payment.status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
