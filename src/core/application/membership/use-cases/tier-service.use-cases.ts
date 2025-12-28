// ============================================
// TIER SERVICE USE CASES
// core/application/membership/use-cases/tier-service.use-cases.ts
// ============================================

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { TierService } from '../../../domain/membership/entities/tier-service.entity';
import { type ITierServiceRepository } from '../ports/repository';

// ============================================
// DTOs
// ============================================

export interface CreateTierServiceDto {
  tierId: number;
  serviceId: string;
  quotaPerMonth?: number | null;
  quotaPerYear?: number | null;
  rolloverUnused?: boolean;
  discountPercent?: number;
  isActive?: boolean;
}

export interface UpdateTierServiceDto {
  quotaPerMonth?: number | null;
  quotaPerYear?: number | null;
  rolloverUnused?: boolean;
  discountPercent?: number;
  isActive?: boolean;
}

export interface TierServiceResponseDto {
  id: string;
  tierId: number;
  serviceId: string;
  quotaPerMonth: number | null;
  quotaPerYear: number | null;
  rolloverUnused: boolean;
  discountPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CREATE TIER SERVICE USE CASE
// ============================================

@Injectable()
export class CreateTierServiceUseCase {
  constructor(
    @Inject('ITierServiceRepository')
    private readonly tierServiceRepo: ITierServiceRepository,
  ) {}

  async execute(dto: CreateTierServiceDto): Promise<TierService> {
    // Check if already exists
    const existing = await this.tierServiceRepo.findByTierAndService(
      dto.tierId,
      dto.serviceId,
    );
    if (existing) {
      throw new ConflictException(
        'Tier service already exists for this tier and service combination',
      );
    }

    const tierService = TierService.create({
      tierId: dto.tierId,
      serviceId: dto.serviceId,
      quotaPerMonth: dto.quotaPerMonth,
      quotaPerYear: dto.quotaPerYear,
      rolloverUnused: dto.rolloverUnused,
      discountPercent: dto.discountPercent,
      isActive: dto.isActive,
    });

    return await this.tierServiceRepo.create(tierService);
  }
}

// ============================================
// GET TIER SERVICE BY ID USE CASE
// ============================================

@Injectable()
export class GetTierServiceByIdUseCase {
  constructor(
    @Inject('ITierServiceRepository')
    private readonly tierServiceRepo: ITierServiceRepository,
  ) {}

  async execute(id: string): Promise<TierService> {
    const tierService = await this.tierServiceRepo.findById(id);
    if (!tierService) {
      throw new NotFoundException('Tier service not found');
    }
    return tierService;
  }
}

// ============================================
// GET TIER SERVICES BY TIER ID USE CASE
// ============================================

@Injectable()
export class GetTierServicesByTierIdUseCase {
  constructor(
    @Inject('ITierServiceRepository')
    private readonly tierServiceRepo: ITierServiceRepository,
  ) {}

  async execute(
    tierId: number,
    options?: { isActive?: boolean },
  ): Promise<TierService[]> {
    return await this.tierServiceRepo.findByTierId(tierId, options);
  }
}

// ============================================
// GET TIER SERVICE BY TIER AND SERVICE USE CASE
// ============================================

@Injectable()
export class GetTierServiceByTierAndServiceUseCase {
  constructor(
    @Inject('ITierServiceRepository')
    private readonly tierServiceRepo: ITierServiceRepository,
  ) {}

  async execute(
    tierId: number,
    serviceId: string,
  ): Promise<TierService | null> {
    return await this.tierServiceRepo.findByTierAndService(tierId, serviceId);
  }
}

// ============================================
// UPDATE TIER SERVICE USE CASE
// ============================================

@Injectable()
export class UpdateTierServiceUseCase {
  constructor(
    @Inject('ITierServiceRepository')
    private readonly tierServiceRepo: ITierServiceRepository,
  ) {}

  async execute(id: string, dto: UpdateTierServiceDto): Promise<TierService> {
    const tierService = await this.tierServiceRepo.findById(id);
    if (!tierService) {
      throw new NotFoundException('Tier service not found');
    }

    if (
      dto.quotaPerMonth !== undefined ||
      dto.quotaPerYear !== undefined ||
      dto.rolloverUnused !== undefined
    ) {
      tierService.updateQuota({
        quotaPerMonth: dto.quotaPerMonth,
        quotaPerYear: dto.quotaPerYear,
        rolloverUnused: dto.rolloverUnused,
      });
    }

    if (dto.discountPercent !== undefined) {
      tierService.updateDiscount(dto.discountPercent);
    }

    if (dto.isActive === true) {
      tierService.activate();
    } else if (dto.isActive === false) {
      tierService.deactivate();
    }

    return await this.tierServiceRepo.update(tierService);
  }
}

// ============================================
// DELETE TIER SERVICE USE CASE
// ============================================

@Injectable()
export class DeleteTierServiceUseCase {
  constructor(
    @Inject('ITierServiceRepository')
    private readonly tierServiceRepo: ITierServiceRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const tierService = await this.tierServiceRepo.findById(id);
    if (!tierService) {
      throw new NotFoundException('Tier service not found');
    }

    await this.tierServiceRepo.delete(id);
  }
}

// ============================================
// BULK CREATE TIER SERVICES USE CASE
// ============================================

@Injectable()
export class BulkCreateTierServicesUseCase {
  constructor(
    @Inject('ITierServiceRepository')
    private readonly tierServiceRepo: ITierServiceRepository,
  ) {}

  async execute(
    tierId: number,
    services: Omit<CreateTierServiceDto, 'tierId'>[],
  ): Promise<TierService[]> {
    const tierServices = services.map((s) =>
      TierService.create({
        tierId,
        serviceId: s.serviceId,
        quotaPerMonth: s.quotaPerMonth,
        quotaPerYear: s.quotaPerYear,
        rolloverUnused: s.rolloverUnused,
        discountPercent: s.discountPercent,
        isActive: s.isActive,
      }),
    );

    return await this.tierServiceRepo.createMany(tierServices);
  }
}

// ============================================
// CHECK SERVICE QUOTA USE CASE
// ============================================

@Injectable()
export class CheckServiceQuotaUseCase {
  constructor(
    @Inject('ITierServiceRepository')
    private readonly tierServiceRepo: ITierServiceRepository,
  ) {}

  async execute(
    tierId: number,
    serviceId: string,
  ): Promise<{
    quotaPerMonth: number | null;
    quotaPerYear: number | null;
    rolloverUnused: boolean;
    isUnlimited: boolean;
  } | null> {
    const quota = await this.tierServiceRepo.getQuota(tierId, serviceId);
    if (!quota) {
      return null;
    }

    return {
      ...quota,
      isUnlimited: quota.quotaPerMonth === null && quota.quotaPerYear === null,
    };
  }
}
