// ============================================
// PROVIDER PROFILE CONTROLLER
// presentation/http/controllers/ProviderProfileController.ts
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
} from '@nestjs/common';

import { UpdateProviderProfileUseCase } from 'src/core/application/provider/use-cases/provider-usecase';
import { CreateProviderProfileUseCase } from 'src/core/application/provider/use-cases/provider-usecase';
import { GetProviderProfileUseCase } from 'src/core/application/provider/use-cases/provider-usecase';
import { DeleteProviderProfileUseCase } from 'src/core/application/provider/use-cases/provider-usecase';
import { ApproveProviderProfileUseCase } from 'src/core/application/provider/use-cases/provider-usecase';
import { RejectProviderProfileUseCase } from 'src/core/application/provider/use-cases/provider-usecase';
import { ListProviderProfilesUseCase } from 'src/core/application/provider/use-cases/provider-usecase';


import { VerificationStatus } from 'src/core/domain/provider/value-objects/verfication-status.vo';

import { CreateProviderProfileDtos } from '../../../application/dtos';


@Controller('provider-profiles')
export class ProviderProfileController {
    constructor(
        private readonly createProviderProfile: CreateProviderProfileUseCase,
        private readonly getProviderProfile: GetProviderProfileUseCase,
        private readonly updateProviderProfile: UpdateProviderProfileUseCase,
        private readonly deleteProviderProfile: DeleteProviderProfileUseCase,
        private readonly approveProviderProfile: ApproveProviderProfileUseCase,
        private readonly rejectProviderProfile: RejectProviderProfileUseCase,
        private readonly listProviderProfiles: ListProviderProfilesUseCase,
    ) { }



    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateProviderProfileDtos) {
        const profile = await this.createProviderProfile.execute(dto);
        return {
            id: profile.id,
            userId: profile.userId,
            organizationName: profile.organizationName.name,
            organizationNameAr: profile.organizationName.nameAr,
            licenseNumber: profile.licenseNumber.value,
            verificationStatus: profile.verificationStatus.status,
            isActive: profile.isActive,
            createdAt: profile.createdAt,
        };
    }


    
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const profile = await this.getProviderProfile.execute(id);
        if (!profile) {
            throw new Error('Provider profile not found');
        }
        return {
            id: profile.id,
            userId: profile.userId,
            organizationName: profile.organizationName.name,
            organizationNameAr: profile.organizationName.nameAr,
            licenseNumber: profile.licenseNumber.value,
            verificationStatus: profile.verificationStatus.status,
            isActive: profile.isActive,
            contactInfo: profile.contactInfo?.toJSON(),
            workingDays: profile.workingDays?.toJSON(),
            workingHours: profile.workingHours?.toJSON(),
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
        };
    }

    @Get()
    async findAll(
        @Query('verificationStatus') verificationStatus?: string,
        @Query('isActive') isActive?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        // Validate and cast verificationStatus safely
        const validStatuses: VerificationStatus[] = ['pending', 'approved', 'rejected', 'suspended'];
        const parsedVerificationStatus = validStatuses.includes(verificationStatus as VerificationStatus)
            ? (verificationStatus as VerificationStatus)
            : undefined;

        const result = await this.listProviderProfiles.execute({
            verificationStatus: parsedVerificationStatus,
            isActive: isActive ? isActive === 'true' : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
        });

        return {
            data: result.profiles.map((profile) => ({
                id: profile.id,
                userId: profile.userId,
                organizationName: profile.organizationName.name,
                licenseNumber: profile.licenseNumber.value,
                verificationStatus: profile.verificationStatus.status,
                isActive: profile.isActive,
                createdAt: profile.createdAt,
            })),
            total: result.total,
        };
    }
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body()
        updates: {
            description?: string;
            descriptionAr?: string;
            businessEmail?: string;
            businessPhone?: string;
            website?: string;
        },
    ) {
        const profile = await this.updateProviderProfile.execute(id, updates);
        return {
            id: profile.id,
            organizationName: profile.organizationName.name,
            verificationStatus: profile.verificationStatus.status,
            updatedAt: profile.updatedAt,
        };
    }

    @Post(':id/approve')
    @HttpCode(HttpStatus.OK)
    async approve(@Param('id') id: string) {
        const profile = await this.approveProviderProfile.execute(id);
        return {
            id: profile.id,
            verificationStatus: profile.verificationStatus.status,
            isActive: profile.isActive,
            updatedAt: profile.updatedAt,
        };
    }

    @Post(':id/reject')
    @HttpCode(HttpStatus.OK)
    async reject(@Param('id') id: string) {
        const profile = await this.rejectProviderProfile.execute(id);
        return {
            id: profile.id,
            verificationStatus: profile.verificationStatus.status,
            isActive: profile.isActive,
            updatedAt: profile.updatedAt,
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @Query('soft') soft?: string) {
        await this.deleteProviderProfile.execute(id, soft !== 'false');
    }
}

// ============================================
// PROVIDER USER CONTROLLER
// presentation/http/controllers/ProviderUserController.ts
// ============================================

import {
    CreateProviderUserUseCase,
    GetProviderUserUseCase,
    UpdateProviderUserUseCase,
    DeleteProviderUserUseCase,
    ListProviderUsersByProviderUseCase,
} from 'src/core/application/provider/use-cases/provider-usecase';

@Controller('provider-users')
export class ProviderUserController {
    constructor(
        private readonly createProviderUser: CreateProviderUserUseCase,
        private readonly getProviderUser: GetProviderUserUseCase,
        private readonly updateProviderUser: UpdateProviderUserUseCase,
        private readonly deleteProviderUser: DeleteProviderUserUseCase,
        private readonly listProviderUsers: ListProviderUsersByProviderUseCase,
    ) { }


    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body()
        dto: {
            providerId: string;
            userId: string;
            role: ProviderUserRole;
            specializations?: string[];
        },
    ) {
        const providerUser = await this.createProviderUser.execute(dto);
        return {
            id: providerUser.id,
            providerId: providerUser.providerId,
            userId: providerUser.userId,
            role: providerUser.role.role,
            specializations: providerUser.specializations,
            isActive: providerUser.isActive,
            canAcceptRequests: providerUser.canAcceptRequests,
            createdAt: providerUser.createdAt,
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const providerUser = await this.getProviderUser.execute(id);
        if (!providerUser) {
            throw new Error('Provider user not found');
        }
        return {
            id: providerUser.id,
            providerId: providerUser.providerId,
            userId: providerUser.userId,
            role: providerUser.role.role,
            specializations: providerUser.specializations,
            isActive: providerUser.isActive,
            canAcceptRequests: providerUser.canAcceptRequests,
            createdAt: providerUser.createdAt,
            updatedAt: providerUser.updatedAt,
        };
    }

    @Get('provider/:providerId')
    async findByProvider(
        @Param('providerId') providerId: string,
        @Query('isActive') isActive?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const result = await this.listProviderUsers.execute(providerId, {
            isActive: isActive ? isActive === 'true' : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });

        return {
            data: result.users.map((user) => ({
                id: user.id,
                userId: user.userId,
                role: user.role.role,
                specializations: user.specializations,
                isActive: user.isActive,
                canAcceptRequests: user.canAcceptRequests,
            })),
            total: result.total,
        };
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body()
        updates: {
            specializations?: string[];
            canAcceptRequests?: boolean;
        },
    ) {
        const providerUser = await this.updateProviderUser.execute(id, updates);
        return {
            id: providerUser.id,
            specializations: providerUser.specializations,
            canAcceptRequests: providerUser.canAcceptRequests,
            updatedAt: providerUser.updatedAt,
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @Query('soft') soft?: string) {
        await this.deleteProviderUser.execute(id, soft !== 'false');
    }
}

// ============================================
// PROVIDER SERVICE CONTROLLER
// presentation/http/controllers/ProviderServiceController.ts
// ============================================
import { ServiceType } from 'src/core/domain/provider/value-objects/service-type.vo';

import {
    CreateProviderServiceUseCase,
    GetProviderServiceUseCase,
    UpdateProviderServiceUseCase,
    DeleteProviderServiceUseCase,
    ListProviderServicesByProviderUseCase,
} from 'src/core/application/provider/use-cases/provider-usecase';

@Controller('provider-services')
export class ProviderServiceController {
    constructor(
        private readonly createProviderService: CreateProviderServiceUseCase,
        private readonly getProviderService: GetProviderServiceUseCase,
        private readonly updateProviderService: UpdateProviderServiceUseCase,
        private readonly deleteProviderService: DeleteProviderServiceUseCase,
        private readonly listProviderServices: ListProviderServicesByProviderUseCase,
    ) { }
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body()
    dto: {
        providerId: string;
        serviceType: ServiceType;
        category?: string;
        pricing?: any;
    },) {
        const service = await this.createProviderService.execute(dto);
        return {
            id: service.id,
            providerId: service.providerId,
            serviceType: service.serviceType.type,
            category: service.serviceType.category,
            isActive: service.isActive,
            pricing: service.pricing?.toJSON(),
            createdAt: service.createdAt,
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const service = await this.getProviderService.execute(id);
        if (!service) {
            throw new Error('Provider service not found');
        }
        return {
            id: service.id,
            providerId: service.providerId,
            serviceType: service.serviceType.type,
            category: service.serviceType.category,
            isActive: service.isActive,
            pricing: service.pricing?.toJSON(),
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
        };
    }
    @Get('provider/:providerId')
    async findByProvider(
        @Param('providerId') providerId: string,
        @Query('serviceType') serviceType?: string,
        @Query('isActive') isActive?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const validTypes: ServiceType[] = [
            'consultation',
            'legal_opinion',
            'litigation',
            'specific_service',
        ];
        const parsedServiceType = validTypes.includes(serviceType as ServiceType)
            ? (serviceType as ServiceType)
            : undefined;
        const result = await this.listProviderServices.execute(providerId, {
            serviceType: parsedServiceType,
            isActive: isActive ? isActive === 'true' : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });

        return {
            data: result.services.map((service) => ({
                id: service.id,
                serviceType: service.serviceType.type,
                category: service.serviceType.category,
                isActive: service.isActive,
                pricing: service.pricing?.toJSON(),
            })),
            total: result.total,
        };
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body()
        updates: {
            pricing?: any;
            isActive?: boolean;
        },
    ) {
        const service = await this.updateProviderService.execute(id, updates);
        return {
            id: service.id,
            pricing: service.pricing?.toJSON(),
            isActive: service.isActive,
            updatedAt: service.updatedAt,
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.deleteProviderService.execute(id);
    }
}

// ============================================
// PROVIDER SCHEDULE CONTROLLER
// presentation/http/controllers/ProviderScheduleController.ts
// ============================================

import {
    CreateProviderScheduleUseCase,
    GetProviderScheduleUseCase,
    UpdateProviderScheduleUseCase,
    DeleteProviderScheduleUseCase,
    ListProviderSchedulesByProviderUseCase,
} from 'src/core/application/provider/use-cases/provider-usecase';
import { ProviderUserRole } from 'src/core/domain/provider/value-objects/provider-user-role.vo';

@Controller('provider-schedules')
export class ProviderScheduleController {
    constructor(
        private readonly createProviderSchedule: CreateProviderScheduleUseCase,
        private readonly getProviderSchedule: GetProviderScheduleUseCase,
        private readonly updateProviderSchedule: UpdateProviderScheduleUseCase,
        private readonly deleteProviderSchedule: DeleteProviderScheduleUseCase,
        private readonly listProviderSchedules: ListProviderSchedulesByProviderUseCase,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body()
        dto: {
            providerId: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        },
    ) {
        const schedule = await this.createProviderSchedule.execute(dto);
        return {
            id: schedule.id,
            providerId: schedule.providerId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.timeSlot.startTime,
            endTime: schedule.timeSlot.endTime,
            isAvailable: schedule.isAvailable,
            createdAt: schedule.createdAt,
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const schedule = await this.getProviderSchedule.execute(id);
        if (!schedule) {
            throw new Error('Provider schedule not found');
        }
        return {
            id: schedule.id,
            providerId: schedule.providerId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.timeSlot.startTime,
            endTime: schedule.timeSlot.endTime,
            isAvailable: schedule.isAvailable,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
        };
    }

    @Get('provider/:providerId')
    async findByProvider(
        @Param('providerId') providerId: string,
        @Query('dayOfWeek') dayOfWeek?: string,
        @Query('isAvailable') isAvailable?: string,
    ) {
        const schedules = await this.listProviderSchedules.execute(providerId, {
            dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : undefined,
            isAvailable: isAvailable ? isAvailable === 'true' : undefined,
        });

        return schedules.map((schedule) => ({
            id: schedule.id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.timeSlot.startTime,
            endTime: schedule.timeSlot.endTime,
            isAvailable: schedule.isAvailable,
        }));
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body()
        updates: {
            startTime?: string;
            endTime?: string;
            isAvailable?: boolean;
        },
    ) {
        const schedule = await this.updateProviderSchedule.execute(id, updates);
        return {
            id: schedule.id,
            startTime: schedule.timeSlot.startTime,
            endTime: schedule.timeSlot.endTime,
            isAvailable: schedule.isAvailable,
            updatedAt: schedule.updatedAt,
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.deleteProviderSchedule.execute(id);
    }
}