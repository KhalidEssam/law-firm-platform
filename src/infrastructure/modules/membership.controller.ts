
// src/modules/membership/membership.module.ts
import { Module } from '@nestjs/common';
import { MembershipController } from '../../interface/http/membership.controller';
import { CreateMembershipUseCase } from '../../core/application/membership/use-cases/create-membership.use-case';
import { PrismaMembershipRepository } from '../persistence/membership/prisma-membership.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [MembershipController],
    providers: [
        PrismaService,
        CreateMembershipUseCase,
        {
            provide: 'IMembershipRepository',
            useClass: PrismaMembershipRepository,
        },
    ],
})
export class MembershipModule { }
