import { Body, Controller, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { CreateMembershipUseCase } from '../../core/application/membership/use-cases/create-membership.use-case';
import { ApplyCouponUseCase } from '../../core/application/membership/use-cases/apply-coupon.use-case';
import { CheckQuotaUseCase } from '../../core/application/membership/use-cases/check-quota.use-case';
import { ConsumeQuotaUseCase } from '../../core/application/membership/use-cases/consume-quota.use-case';
import { type CreateMembershipDTO } from '../../core/application/membership/dto/create-membership.dto';
import { QuotaResource } from '../../core/domain/membership/value-objects/quota-resource.vo';
import type { IMembershipRepository } from '../../core/domain/membership/repositories/membership.repository';

@Controller('memberships')
export class MembershipController {
    constructor(
        private readonly createMembershipUseCase: CreateMembershipUseCase,
        private readonly applyCouponUseCase: ApplyCouponUseCase,
        private readonly checkQuotaUseCase: CheckQuotaUseCase,
        private readonly consumeQuotaUseCase: ConsumeQuotaUseCase,
        @Inject('IMembershipRepository')
        private readonly membershipRepository: IMembershipRepository,
    ) { }

    @Post()
    async create(@Body() dto: CreateMembershipDTO) {
        const membership = await this.createMembershipUseCase.execute(dto);
        return { message: 'Membership created successfully', membership };
    }

    @Get(':userId')
    async getCurrentMembership(@Param('userId') userId: string) {
        const membership = await this.membershipRepository.findActiveByUserId(userId);
        if (!membership) {
            return { message: 'No active membership found' };
        }
        return { membership };
    }

    @Post(':membershipId/apply-coupon')
    async applyCoupon(
        @Param('membershipId') membershipId: string,
        @Body() dto: { couponCode: string }
    ) {
        const result = await this.applyCouponUseCase.execute(membershipId, dto.couponCode);
        return { message: 'Coupon applied successfully', discountAmount: result.discountAmount };
    }

    @Get(':membershipId/quota/:resource')
    async checkQuota(
        @Param('membershipId') membershipId: string,
        @Param('resource') resource: QuotaResource
    ) {
        const quota = await this.checkQuotaUseCase.execute(membershipId, resource);
        return { quota };
    }

    @Put(':membershipId/quota/:resource/consume')
    async consumeQuota(
        @Param('membershipId') membershipId: string,
        @Param('resource') resource: QuotaResource,
        @Body() dto: { amount: number }
    ) {
        await this.consumeQuotaUseCase.execute(membershipId, resource, dto.amount);
        return { message: 'Quota consumed successfully' };
    }
}