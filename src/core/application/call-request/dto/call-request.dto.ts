// src/core/application/call-request/dto/call-request.dto.ts

import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsEnum,
  IsUUID,
  Min,
  Max,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import { CallStatus } from '../../../domain/call-request/value-objects/call-status.vo';
import { CallPlatformType } from '../../../domain/call-request/value-objects/call-platform.vo';

// ============================================
// CREATE CALL REQUEST DTO
// ============================================

export class CreateCallRequestDto {
  @IsUUID()
  subscriberId: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  purpose: string;

  @IsOptional()
  @IsString()
  consultationType?: string;

  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @IsOptional()
  @IsString()
  preferredTime?: string;
}

// ============================================
// SCHEDULE CALL DTO
// ============================================

export class ScheduleCallDto {
  @IsDateString()
  scheduledAt: string;

  @IsInt()
  @Min(15)
  @Max(120)
  durationMinutes: number;

  @IsOptional()
  @IsEnum(CallPlatformType)
  platform?: CallPlatformType;

  @IsOptional()
  @IsUrl()
  callLink?: string;
}

// ============================================
// ASSIGN PROVIDER DTO
// ============================================

export class AssignProviderDto {
  @IsUUID()
  providerId: string;
}

// ============================================
// RESCHEDULE CALL DTO
// ============================================

export class RescheduleCallDto {
  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ============================================
// END CALL DTO
// ============================================

export class EndCallDto {
  @IsOptional()
  @IsUrl()
  recordingUrl?: string;
}

// ============================================
// CANCEL CALL DTO
// ============================================

export class CancelCallDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ============================================
// UPDATE CALL LINK DTO
// ============================================

export class UpdateCallLinkDto {
  @IsUrl()
  callLink: string;

  @IsOptional()
  @IsEnum(CallPlatformType)
  platform?: CallPlatformType;
}

// ============================================
// QUERY DTOs
// ============================================

export class GetCallRequestsQueryDto {
  @IsOptional()
  @IsUUID()
  subscriberId?: string;

  @IsOptional()
  @IsUUID()
  providerId?: string;

  @IsOptional()
  @IsEnum(CallStatus)
  status?: CallStatus;

  @IsOptional()
  @IsString()
  consultationType?: string;

  @IsOptional()
  @IsDateString()
  scheduledAfter?: string;

  @IsOptional()
  @IsDateString()
  scheduledBefore?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(['createdAt', 'scheduledAt', 'updatedAt'])
  orderBy?: 'createdAt' | 'scheduledAt' | 'updatedAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  orderDirection?: 'asc' | 'desc';
}

// ============================================
// RESPONSE DTOs
// ============================================

export class CallRequestResponseDto {
  id: string;
  requestNumber: string;
  subscriberId: string;
  assignedProviderId: string | null;
  consultationType: string | null;
  purpose: string;
  preferredDate: Date | null;
  preferredTime: string | null;
  status: CallStatus;
  scheduledAt: Date | null;
  scheduledDuration: number | null;
  actualDuration: number | null;
  callStartedAt: Date | null;
  callEndedAt: Date | null;
  recordingUrl: string | null;
  callPlatform: string | null;
  callLink: string | null;
  submittedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CallRequestListResponseDto {
  data: CallRequestResponseDto[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class CallMinutesSummaryDto {
  subscriberId: string;
  totalMinutes: number;
  billableMinutes: number;
  periodStart: Date;
  periodEnd: Date;
}

export class ProviderAvailabilityDto {
  providerId: string;
  isAvailable: boolean;
  conflictingCalls?: CallRequestResponseDto[];
}
