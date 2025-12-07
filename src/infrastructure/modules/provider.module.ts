// ============================================
// PROVIDER MODULE
// src/modules/provider/provider.module.ts
// ============================================

import { Module } from '@nestjs/common';

// Import PrismaModule and PrismaService
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';

// Controllers
import {
    ProviderProfileController,
    ProviderUserController,
    ProviderServiceController,
    ProviderScheduleController,
} from '../../interface/http/provider.controller';

// Repositories
import {
    PrismaProviderProfileRepository,
    PrismaProviderUserRepository,
    PrismaProviderServiceRepository,
    PrismaProviderScheduleRepository,
} from '../../infrastructure/persistence/provider/prisma.repository';

// Use Cases - Provider Profile
import {
    CreateProviderProfileUseCase,
    GetProviderProfileUseCase,
    UpdateProviderProfileUseCase,
    DeleteProviderProfileUseCase,
    ApproveProviderProfileUseCase,
    RejectProviderProfileUseCase,
    ListProviderProfilesUseCase,
} from '../../core/application/provider/use-cases/provider-usecase';

// Use Cases - Provider User
import {
    CreateProviderUserUseCase,
    GetProviderUserUseCase,
    UpdateProviderUserUseCase,
    DeleteProviderUserUseCase,
    ListProviderUsersByProviderUseCase,
} from '../../core/application/provider/use-cases/provider-usecase';

// Use Cases - Provider Service
import {
    CreateProviderServiceUseCase,
    GetProviderServiceUseCase,
    UpdateProviderServiceUseCase,
    DeleteProviderServiceUseCase,
    ListProviderServicesByProviderUseCase,
} from '../../core/application/provider/use-cases/provider-usecase';

// Use Cases - Provider Schedule
import {
    CreateProviderScheduleUseCase,
    GetProviderScheduleUseCase,
    UpdateProviderScheduleUseCase,
    DeleteProviderScheduleUseCase,
    ListProviderSchedulesByProviderUseCase,
} from '../../core/application/provider/use-cases/provider-usecase';

@Module({
    imports: [PrismaModule],  // ✅ Import PrismaModule
    controllers: [
        ProviderProfileController,
        ProviderUserController,
        ProviderServiceController,
        ProviderScheduleController,
    ],
    providers: [
        // ============================================
        // REPOSITORIES - Now inject PrismaService
        // ============================================
        {
            provide: 'PROVIDER_PROFILE_REPOSITORY',
            useFactory: (prisma: PrismaService) => {
                return new PrismaProviderProfileRepository(prisma);
            },
            inject: [PrismaService],  // ✅ Inject PrismaService
        },
        {
            provide: 'PROVIDER_USER_REPOSITORY',
            useFactory: (prisma: PrismaService) => {
                return new PrismaProviderUserRepository(prisma);
            },
            inject: [PrismaService],
        },
        {
            provide: 'PROVIDER_SERVICE_REPOSITORY',
            useFactory: (prisma: PrismaService) => {
                return new PrismaProviderServiceRepository(prisma);
            },
            inject: [PrismaService],
        },
        {
            provide: 'PROVIDER_SCHEDULE_REPOSITORY',
            useFactory: (prisma: PrismaService) => {
                return new PrismaProviderScheduleRepository(prisma);
            },
            inject: [PrismaService],
        },

        // ============================================
        // PROVIDER PROFILE USE CASES
        // ============================================
        {
            provide: CreateProviderProfileUseCase,
            useFactory: (repo) => {
                return new CreateProviderProfileUseCase(repo);
            },
            inject: ['PROVIDER_PROFILE_REPOSITORY'],
        },
        {
            provide: GetProviderProfileUseCase,
            useFactory: (repo) => {
                return new GetProviderProfileUseCase(repo);
            },
            inject: ['PROVIDER_PROFILE_REPOSITORY'],
        },
        {
            provide: UpdateProviderProfileUseCase,
            useFactory: (repo) => {
                return new UpdateProviderProfileUseCase(repo);
            },
            inject: ['PROVIDER_PROFILE_REPOSITORY'],
        },
        {
            provide: DeleteProviderProfileUseCase,
            useFactory: (repo) => {
                return new DeleteProviderProfileUseCase(repo);
            },
            inject: ['PROVIDER_PROFILE_REPOSITORY'],
        },
        {
            provide: ApproveProviderProfileUseCase,
            useFactory: (repo) => {
                return new ApproveProviderProfileUseCase(repo);
            },
            inject: ['PROVIDER_PROFILE_REPOSITORY'],
        },
        {
            provide: RejectProviderProfileUseCase,
            useFactory: (repo) => {
                return new RejectProviderProfileUseCase(repo);
            },
            inject: ['PROVIDER_PROFILE_REPOSITORY'],
        },
        {
            provide: ListProviderProfilesUseCase,
            useFactory: (repo) => {
                return new ListProviderProfilesUseCase(repo);
            },
            inject: ['PROVIDER_PROFILE_REPOSITORY'],
        },

        // ============================================
        // PROVIDER USER USE CASES
        // ============================================
        {
            provide: CreateProviderUserUseCase,
            useFactory: (repo) => {
                return new CreateProviderUserUseCase(repo);
            },
            inject: ['PROVIDER_USER_REPOSITORY'],
        },
        {
            provide: GetProviderUserUseCase,
            useFactory: (repo) => {
                return new GetProviderUserUseCase(repo);
            },
            inject: ['PROVIDER_USER_REPOSITORY'],
        },
        {
            provide: UpdateProviderUserUseCase,
            useFactory: (repo) => {
                return new UpdateProviderUserUseCase(repo);
            },
            inject: ['PROVIDER_USER_REPOSITORY'],
        },
        {
            provide: DeleteProviderUserUseCase,
            useFactory: (repo) => {
                return new DeleteProviderUserUseCase(repo);
            },
            inject: ['PROVIDER_USER_REPOSITORY'],
        },
        {
            provide: ListProviderUsersByProviderUseCase,
            useFactory: (repo) => {
                return new ListProviderUsersByProviderUseCase(repo);
            },
            inject: ['PROVIDER_USER_REPOSITORY'],
        },

        // ============================================
        // PROVIDER SERVICE USE CASES
        // ============================================
        {
            provide: CreateProviderServiceUseCase,
            useFactory: (repo) => {
                return new CreateProviderServiceUseCase(repo);
            },
            inject: ['PROVIDER_SERVICE_REPOSITORY'],
        },
        {
            provide: GetProviderServiceUseCase,
            useFactory: (repo) => {
                return new GetProviderServiceUseCase(repo);
            },
            inject: ['PROVIDER_SERVICE_REPOSITORY'],
        },
        {
            provide: UpdateProviderServiceUseCase,
            useFactory: (repo) => {
                return new UpdateProviderServiceUseCase(repo);
            },
            inject: ['PROVIDER_SERVICE_REPOSITORY'],
        },
        {
            provide: DeleteProviderServiceUseCase,
            useFactory: (repo) => {
                return new DeleteProviderServiceUseCase(repo);
            },
            inject: ['PROVIDER_SERVICE_REPOSITORY'],
        },
        {
            provide: ListProviderServicesByProviderUseCase,
            useFactory: (repo) => {
                return new ListProviderServicesByProviderUseCase(repo);
            },
            inject: ['PROVIDER_SERVICE_REPOSITORY'],
        },

        // ============================================
        // PROVIDER SCHEDULE USE CASES
        // ============================================
        {
            provide: CreateProviderScheduleUseCase,
            useFactory: (repo) => {
                return new CreateProviderScheduleUseCase(repo);
            },
            inject: ['PROVIDER_SCHEDULE_REPOSITORY'],
        },
        {
            provide: GetProviderScheduleUseCase,
            useFactory: (repo) => {
                return new GetProviderScheduleUseCase(repo);
            },
            inject: ['PROVIDER_SCHEDULE_REPOSITORY'],
        },
        {
            provide: UpdateProviderScheduleUseCase,
            useFactory: (repo) => {
                return new UpdateProviderScheduleUseCase(repo);
            },
            inject: ['PROVIDER_SCHEDULE_REPOSITORY'],
        },
        {
            provide: DeleteProviderScheduleUseCase,
            useFactory: (repo) => {
                return new DeleteProviderScheduleUseCase(repo);
            },
            inject: ['PROVIDER_SCHEDULE_REPOSITORY'],
        },
        {
            provide: ListProviderSchedulesByProviderUseCase,
            useFactory: (repo) => {
                return new ListProviderSchedulesByProviderUseCase(repo);
            },
            inject: ['PROVIDER_SCHEDULE_REPOSITORY'],
        },
    ],
    exports: [
        'PROVIDER_PROFILE_REPOSITORY',
        'PROVIDER_USER_REPOSITORY',
        'PROVIDER_SERVICE_REPOSITORY',
        'PROVIDER_SCHEDULE_REPOSITORY',
    ],
})
export class ProviderModule {}