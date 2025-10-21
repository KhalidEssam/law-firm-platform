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
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator'; // ✅ use this

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
    CreatePaymentUseCase,
    CompletePaymentUseCase,
} from '../../core/application/membership/use-cases/membership.use-cases';

// DTOs
import {
    CreateMembershipDto,
    CancelMembershipDto,
    RenewMembershipDto,
    ToggleAutoRenewDto,
    ApplyCouponDto,
    ConsumeQuotaDto,
    CreateMembershipTierDto,
    UpdateMembershipTierDto,
    CreateCouponDto,
    UpdateCouponDto,
    CreatePaymentDto,
    CompletePaymentDto,
    ListMembershipsQueryDto,
    ListTiersQueryDto,
    ListCouponsQueryDto,
    MembershipResponseDto,
    MembershipTierResponseDto,
    QuotaResponseDto,
    PaymentResponseDto,
    CouponResponseDto,
    ApplyCouponResponseDto,
} from '../../core/application/membership/dto/index.dto';

import { QuotaResource } from '../../core/domain/membership/value-objects/quota-resource.vo';

@Controller('memberships')
// @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class MembershipController {
    constructor(
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
        private readonly createPayment: CreatePaymentUseCase,
        private readonly completePayment: CompletePaymentUseCase,
    ) { }

    // ============================================
    // MEMBERSHIP ENDPOINTS
    // ============================================

    /**
     * Create a new membership
     * Accessible by: user, partner, platform, system admin
     */
    @Post()
    @Roles('user', 'partner', 'platform', 'system admin')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateMembershipDto): Promise<{ membership: MembershipResponseDto }> {
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
    async getMyMembership(@Req() req: any): Promise<{ membership: MembershipResponseDto | null }> {
        const userId = req.user.userId; // Assuming JWT payload has userId
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
    @Permissions('read:memberships')
    async getByUserId(@Param('userId') userId: string): Promise<{ membership: MembershipResponseDto | null }> {
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
        @Body() dto: CancelMembershipDto,
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
    @Roles('user', 'partner', 'platform', 'system admin')
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
    @Roles('platform', 'system admin')
    @Permissions('update:quotas')
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
    // TIER ENDPOINTS
    // ============================================

    /**
     * List all tiers
     * Accessible by: everyone (public)
     */
    @Public()  // ← Is this here?
    @Get('tiers')
    async listAllTiers(@Query() query: ListTiersQueryDto): Promise<{ tiers: MembershipTierResponseDto[] }> {
        const tiers = await this.listTiers.execute(query);
        return {
            tiers: tiers.map((tier) => this.mapTierToResponse(tier)),
        };
    }

    /**
     * Get tier by ID
     * Accessible by: everyone (public)
     */
    @Public()
    @Get('tiers/:id')
    async getTierById(@Param('id') id: string): Promise<{ tier: MembershipTierResponseDto }> {
        // Implementation would use GetTierByIdUseCase
        return { tier: {} as MembershipTierResponseDto };
    }
    /**
     * Get membership by ID
     * Accessible by: system admin, platform
     */
    @Get(':id')
    @Roles('system admin', 'platform')
    @Permissions('read:memberships')
    async getById(@Param('id') id: string): Promise<{ membership: MembershipResponseDto }> {
        const membership = await this.getMembershipById.execute(id);
        return {
            membership: this.mapMembershipToResponse(membership),
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
    @Roles('user', 'system admin')
    @HttpCode(HttpStatus.CREATED)
    async createMembershipPayment(
        @Param('id') id: string,
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
    @Roles('platform', 'system admin')
    @HttpCode(HttpStatus.OK)
    async completePaymentTransaction(
        @Param('paymentId') paymentId: string,
        @Body() dto: CompletePaymentDto,
    ): Promise<{ payment: PaymentResponseDto }> {
        const payment = await this.completePayment.execute(paymentId, dto.providerTxnId);
        return {
            payment: this.mapPaymentToResponse(payment),
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