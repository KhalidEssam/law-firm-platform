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
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

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
  ) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  /**
   * Get single provider profile (Public)
   * Anyone can view approved provider profiles
   */
  @Public()
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

  /**
   * List provider profiles (Public)
   * Anyone can search and filter approved providers
   */
  @Public()
  @Get()
  async findAll(
    @Query('verificationStatus') verificationStatus?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const validStatuses: VerificationStatus[] = [
      'pending',
      'approved',
      'rejected',
      'suspended',
    ];
    const parsedVerificationStatus = validStatuses.includes(
      verificationStatus as VerificationStatus,
    )
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

  // ============================================
  // PROVIDER OWNER ENDPOINTS
  // ============================================

  /**
   * Create provider profile
   * Only authenticated users can create their provider profile
   */
  @Roles('user', 'provider')
  @Permissions('create:provider-profile')
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

  /**
   * Update own provider profile
   * Providers can update their own profile information
   */
  @Roles('provider')
  @Permissions('update:provider-profile')
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

  /**
   * Delete own provider profile
   * Providers can delete their own profile
   */
  @Roles('provider')
  @Permissions('delete:provider-profile')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Query('soft') soft?: string) {
    await this.deleteProviderProfile.execute(id, soft !== 'false');
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  /**
   * Approve provider profile
   * Only admins can approve provider profiles
   */
  @Roles('system_admin', 'platform_admin')
  @Permissions('approve:provider-profile')
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

  /**
   * Reject provider profile
   * Only admins can reject provider profiles
   */
  @Roles('system_admin', 'platform_admin')
  @Permissions('reject:provider-profile')
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
import { ProviderUserRole } from 'src/core/domain/provider/value-objects/provider-user-role.vo';

@Controller('provider-users')
export class ProviderUserController {
  constructor(
    private readonly createProviderUser: CreateProviderUserUseCase,
    private readonly getProviderUser: GetProviderUserUseCase,
    private readonly updateProviderUser: UpdateProviderUserUseCase,
    private readonly deleteProviderUser: DeleteProviderUserUseCase,
    private readonly listProviderUsers: ListProviderUsersByProviderUseCase,
  ) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  /**
   * Get provider user details (Public)
   * Anyone can view provider user information
   */
  @Public()
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

  /**
   * List users by provider (Public)
   * Anyone can view provider staff
   */
  @Public()
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

  // ============================================
  // PROVIDER ADMIN ENDPOINTS
  // ============================================

  /**
   * Create provider user
   * Only provider admins can add users to their organization
   */
  @Roles('provider_admin')
  @Permissions('create:provider-user')
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

  /**
   * Update provider user
   * Provider admins can update their staff
   */
  @Roles('provider_admin')
  @Permissions('update:provider-user')
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

  /**
   * Delete provider user
   * Provider admins can remove users from their organization
   */
  @Roles('provider_admin')
  @Permissions('delete:provider-user')
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
  ) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  /**
   * Get service details (Public)
   * Anyone can view service information
   */
  @Public()
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

  /**
   * List services by provider (Public)
   * Anyone can browse provider services
   */
  @Public()
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

  // ============================================
  // PROVIDER ENDPOINTS
  // ============================================

  /**
   * Create provider service
   * Providers can add services to their offerings
   */
  @Roles('provider', 'provider_admin')
  @Permissions('create:provider-service')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body()
    dto: {
      providerId: string;
      serviceType: ServiceType;
      category?: string;
      pricing?: any;
    },
  ) {
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

  /**
   * Update provider service
   * Providers can update their service offerings
   */
  @Roles('provider', 'provider_admin')
  @Permissions('update:provider-service')
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

  /**
   * Delete provider service
   * Providers can remove services from their offerings
   */
  @Roles('provider', 'provider_admin')
  @Permissions('delete:provider-service')
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

@Controller('provider-schedules')
export class ProviderScheduleController {
  constructor(
    private readonly createProviderSchedule: CreateProviderScheduleUseCase,
    private readonly getProviderSchedule: GetProviderScheduleUseCase,
    private readonly updateProviderSchedule: UpdateProviderScheduleUseCase,
    private readonly deleteProviderSchedule: DeleteProviderScheduleUseCase,
    private readonly listProviderSchedules: ListProviderSchedulesByProviderUseCase,
  ) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  /**
   * Get schedule details (Public)
   * Anyone can view provider schedules
   */
  @Public()
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

  /**
   * List schedules by provider (Public)
   * Anyone can view provider availability
   */
  @Public()
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

  // ============================================
  // PROVIDER ENDPOINTS
  // ============================================

  /**
   * Create schedule
   * Providers can create their availability schedules
   */
  @Roles('provider', 'provider_admin')
  @Permissions('create:provider-schedule')
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

  /**
   * Update schedule
   * Providers can update their availability
   */
  @Roles('provider', 'provider_admin')
  @Permissions('update:provider-schedule')
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

  /**
   * Delete schedule
   * Providers can remove availability slots
   */
  @Roles('provider', 'provider_admin')
  @Permissions('delete:provider-schedule')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deleteProviderSchedule.execute(id);
  }
}
