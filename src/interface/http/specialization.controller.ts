// ============================================
// SPECIALIZATION CONTROLLER
// src/interface/http/specialization.controller.ts
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

// Specialization Use Cases
import {
  CreateSpecializationUseCase,
  GetSpecializationUseCase,
  UpdateSpecializationUseCase,
  DeleteSpecializationUseCase,
  ListSpecializationsUseCase,
} from '../../core/application/specialization/use-cases/specialization';
import type {
  CreateSpecializationDTO,
  UpdateSpecializationDTO,
} from '../../core/application/specialization/use-cases/specialization';

// Provider Specialization Use Cases
import {
  CreateProviderSpecializationUseCase,
  GetProviderSpecializationUseCase,
  UpdateProviderSpecializationUseCase,
  DeleteProviderSpecializationUseCase,
  ListProviderSpecializationsUseCase,
  RecordCaseResultUseCase,
} from '../../core/application/specialization/use-cases/provider-specialization';
import type {
  CreateProviderSpecializationDTO,
  UpdateProviderSpecializationDTO,
} from '../../core/application/specialization/use-cases/provider-specialization';

// ============================================
// SPECIALIZATION CONTROLLER (Master List)
// ============================================

@Controller('specializations')
export class SpecializationController {
  constructor(
    private readonly createSpecialization: CreateSpecializationUseCase,
    private readonly getSpecialization: GetSpecializationUseCase,
    private readonly updateSpecialization: UpdateSpecializationUseCase,
    private readonly deleteSpecialization: DeleteSpecializationUseCase,
    private readonly listSpecializations: ListSpecializationsUseCase,
  ) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Public()
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('searchTerm') searchTerm?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.listSpecializations.execute({
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      searchTerm,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      data: result.specializations.map((spec) => ({
        id: spec.id,
        name: spec.name,
        nameAr: spec.nameAr,
        description: spec.description,
        descriptionAr: spec.descriptionAr,
        category: spec.category,
        isActive: spec.isActive,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  @Public()
  @Get('categories')
  async getCategories() {
    const categories = await this.listSpecializations.getCategories();
    return { categories };
  }

  @Public()
  @Get('active')
  async findActive() {
    const specializations = await this.listSpecializations.executeActive();
    return {
      data: specializations.map((spec) => ({
        id: spec.id,
        name: spec.name,
        nameAr: spec.nameAr,
        category: spec.category,
      })),
    };
  }

  @Public()
  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    const specializations =
      await this.listSpecializations.executeByCategory(category);
    return {
      data: specializations.map((spec) => ({
        id: spec.id,
        name: spec.name,
        nameAr: spec.nameAr,
        description: spec.description,
        descriptionAr: spec.descriptionAr,
        category: spec.category,
        isActive: spec.isActive,
      })),
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const spec = await this.getSpecialization.execute(id);
    return {
      id: spec.id,
      name: spec.name,
      nameAr: spec.nameAr,
      description: spec.description,
      descriptionAr: spec.descriptionAr,
      category: spec.category,
      isActive: spec.isActive,
      createdAt: spec.createdAt,
      updatedAt: spec.updatedAt,
    };
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post()
  @Roles('admin')
  @Permissions('specializations:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSpecializationDTO) {
    const spec = await this.createSpecialization.execute(dto);
    return {
      id: spec.id,
      name: spec.name,
      nameAr: spec.nameAr,
      description: spec.description,
      descriptionAr: spec.descriptionAr,
      category: spec.category,
      isActive: spec.isActive,
      createdAt: spec.createdAt,
    };
  }

  @Put(':id')
  @Roles('admin')
  @Permissions('specializations:update')
  async update(
    @Param('id') id: string,
    @Body() dto: Omit<UpdateSpecializationDTO, 'id'>,
  ) {
    const spec = await this.updateSpecialization.execute({ ...dto, id });
    return {
      id: spec.id,
      name: spec.name,
      nameAr: spec.nameAr,
      description: spec.description,
      descriptionAr: spec.descriptionAr,
      category: spec.category,
      isActive: spec.isActive,
      updatedAt: spec.updatedAt,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @Permissions('specializations:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deleteSpecialization.execute(id);
  }

  @Put(':id/activate')
  @Roles('admin')
  @Permissions('specializations:update')
  async activate(@Param('id') id: string) {
    const spec = await this.updateSpecialization.execute({
      id,
      isActive: true,
    });
    return { id: spec.id, isActive: spec.isActive };
  }

  @Put(':id/deactivate')
  @Roles('admin')
  @Permissions('specializations:update')
  async deactivate(@Param('id') id: string) {
    const spec = await this.updateSpecialization.execute({
      id,
      isActive: false,
    });
    return { id: spec.id, isActive: spec.isActive };
  }
}

// ============================================
// PROVIDER SPECIALIZATION CONTROLLER
// ============================================

@Controller('provider-specializations')
export class ProviderSpecializationController {
  constructor(
    private readonly createProviderSpecialization: CreateProviderSpecializationUseCase,
    private readonly getProviderSpecialization: GetProviderSpecializationUseCase,
    private readonly updateProviderSpecialization: UpdateProviderSpecializationUseCase,
    private readonly deleteProviderSpecialization: DeleteProviderSpecializationUseCase,
    private readonly listProviderSpecializations: ListProviderSpecializationsUseCase,
    private readonly recordCaseResult: RecordCaseResultUseCase,
  ) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Public()
  @Get()
  async findAll(
    @Query('providerId') providerId?: string,
    @Query('specializationId') specializationId?: string,
    @Query('isCertified') isCertified?: string,
    @Query('minExperienceYears') minExperienceYears?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.listProviderSpecializations.execute({
      providerId,
      specializationId,
      isCertified:
        isCertified !== undefined ? isCertified === 'true' : undefined,
      minExperienceYears: minExperienceYears
        ? parseInt(minExperienceYears, 10)
        : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      data: result.providerSpecializations.map((ps) => ({
        id: ps.id,
        providerId: ps.providerId,
        specializationId: ps.specializationId,
        experienceYears: ps.experienceYears,
        isCertified: ps.isCertified,
        certifications: ps.certifications,
        caseCount: ps.caseCount,
        successRate: ps.successRate,
        createdAt: ps.createdAt,
        updatedAt: ps.updatedAt,
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  @Public()
  @Get('provider/:providerId')
  async findByProvider(@Param('providerId') providerId: string) {
    const specializations =
      await this.listProviderSpecializations.executeByProvider(providerId);
    return {
      data: specializations.map((ps) => ({
        id: ps.id,
        specializationId: ps.specializationId,
        experienceYears: ps.experienceYears,
        isCertified: ps.isCertified,
        certifications: ps.certifications,
        caseCount: ps.caseCount,
        successRate: ps.successRate,
      })),
    };
  }

  @Public()
  @Get('provider/:providerId/expertise')
  async getProviderExpertise(@Param('providerId') providerId: string) {
    const expertise =
      await this.listProviderSpecializations.getProviderExpertise(providerId);
    return {
      specializations: expertise.specializations.map((ps) => ({
        id: ps.id,
        specializationId: ps.specializationId,
        experienceYears: ps.experienceYears,
        isCertified: ps.isCertified,
        caseCount: ps.caseCount,
        successRate: ps.successRate,
      })),
      totalCases: expertise.totalCases,
      averageSuccessRate: expertise.averageSuccessRate,
    };
  }

  @Public()
  @Get('provider/:providerId/certified')
  async findCertifiedByProvider(@Param('providerId') providerId: string) {
    const specializations =
      await this.listProviderSpecializations.executeCertifiedByProvider(
        providerId,
      );
    return {
      data: specializations.map((ps) => ({
        id: ps.id,
        specializationId: ps.specializationId,
        certifications: ps.certifications,
        caseCount: ps.caseCount,
        successRate: ps.successRate,
      })),
    };
  }

  @Public()
  @Get('specialization/:specializationId/top-providers')
  async findTopProviders(
    @Param('specializationId') specializationId: string,
    @Query('limit') limit?: string,
  ) {
    const providers =
      await this.listProviderSpecializations.findTopProvidersBySpecialization(
        specializationId,
        limit ? parseInt(limit, 10) : undefined,
      );
    return {
      data: providers.map((ps) => ({
        id: ps.id,
        providerId: ps.providerId,
        experienceYears: ps.experienceYears,
        isCertified: ps.isCertified,
        caseCount: ps.caseCount,
        successRate: ps.successRate,
      })),
    };
  }

  @Public()
  @Get('specialization/:specializationId/count')
  async countProviders(@Param('specializationId') specializationId: string) {
    const count =
      await this.listProviderSpecializations.countProvidersBySpecialization(
        specializationId,
      );
    return { count };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const ps = await this.getProviderSpecialization.execute(id);
    return {
      id: ps.id,
      providerId: ps.providerId,
      specializationId: ps.specializationId,
      experienceYears: ps.experienceYears,
      isCertified: ps.isCertified,
      certifications: ps.certifications,
      caseCount: ps.caseCount,
      successRate: ps.successRate,
      createdAt: ps.createdAt,
      updatedAt: ps.updatedAt,
    };
  }

  // ============================================
  // PROVIDER ENDPOINTS
  // ============================================

  @Post()
  @Roles('provider', 'admin')
  @Permissions('provider-specializations:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProviderSpecializationDTO) {
    const ps = await this.createProviderSpecialization.execute(dto);
    return {
      id: ps.id,
      providerId: ps.providerId,
      specializationId: ps.specializationId,
      experienceYears: ps.experienceYears,
      isCertified: ps.isCertified,
      createdAt: ps.createdAt,
    };
  }

  @Put(':id')
  @Roles('provider', 'admin')
  @Permissions('provider-specializations:update')
  async update(
    @Param('id') id: string,
    @Body() dto: Omit<UpdateProviderSpecializationDTO, 'id'>,
  ) {
    const ps = await this.updateProviderSpecialization.execute({ ...dto, id });
    return {
      id: ps.id,
      experienceYears: ps.experienceYears,
      isCertified: ps.isCertified,
      certifications: ps.certifications,
      caseCount: ps.caseCount,
      successRate: ps.successRate,
      updatedAt: ps.updatedAt,
    };
  }

  @Delete(':id')
  @Roles('provider', 'admin')
  @Permissions('provider-specializations:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deleteProviderSpecialization.execute(id);
  }

  @Post(':id/certification')
  @Roles('provider', 'admin')
  @Permissions('provider-specializations:update')
  async addCertification(
    @Param('id') id: string,
    @Body()
    certification: {
      name: string;
      issuingAuthority: string;
      issueDate?: Date;
      expiryDate?: Date;
      certificateNumber?: string;
    },
  ) {
    const ps = await this.updateProviderSpecialization.addCertification(
      id,
      certification,
    );
    return {
      id: ps.id,
      isCertified: ps.isCertified,
      certifications: ps.certifications,
      updatedAt: ps.updatedAt,
    };
  }

  @Delete(':id/certification/:certificationName')
  @Roles('provider', 'admin')
  @Permissions('provider-specializations:update')
  async removeCertification(
    @Param('id') id: string,
    @Param('certificationName') certificationName: string,
  ) {
    const ps = await this.updateProviderSpecialization.removeCertification(
      id,
      certificationName,
    );
    return {
      id: ps.id,
      isCertified: ps.isCertified,
      certifications: ps.certifications,
      updatedAt: ps.updatedAt,
    };
  }

  // ============================================
  // SYSTEM ENDPOINTS (for case tracking)
  // ============================================

  @Post('record-case-result')
  @Roles('system', 'admin')
  @Permissions('provider-specializations:record-case')
  async recordCase(
    @Body()
    dto: {
      providerId: string;
      specializationId: string;
      wasSuccessful: boolean;
    },
  ) {
    const ps = await this.recordCaseResult.execute(dto);
    return {
      id: ps.id,
      caseCount: ps.caseCount,
      successRate: ps.successRate,
      updatedAt: ps.updatedAt,
    };
  }
}
