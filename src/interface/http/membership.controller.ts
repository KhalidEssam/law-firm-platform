// src/modules/membership/membership.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { CreateMembershipUseCase } from '../../core/application/membership/use-cases/create-membership.use-case';
import { type CreateMembershipDTO } from '../../core/application/membership/dto/create-membership.dto';

@Controller('memberships')
export class MembershipController {
    constructor(private readonly createMembershipUseCase: CreateMembershipUseCase) { }

    @Post()
    async create(@Body() dto: CreateMembershipDTO) {
        const membership = await this.createMembershipUseCase.execute(dto);
        return { message: 'Membership created successfully', membership };
    }
}