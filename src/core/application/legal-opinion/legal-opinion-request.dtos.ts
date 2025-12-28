// ============================================
// LEGAL OPINION REQUEST DTOs
// All DTOs in one file (to be modularized later)
// ============================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ============================================
// ENUMS FOR DTOs
// ============================================

export enum OpinionTypeDto {
  LEGAL_ANALYSIS = 'legal_analysis',
  CONTRACT_REVIEW = 'contract_review',
  COMPLIANCE_OPINION = 'compliance_opinion',
  DUE_DILIGENCE = 'due_diligence',
  LITIGATION_RISK = 'litigation_risk',
  REGULATORY_OPINION = 'regulatory_opinion',
  CUSTOM = 'custom',
}

export enum OpinionStatusDto {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ASSIGNED = 'assigned',
  RESEARCH_PHASE = 'research_phase',
  DRAFTING = 'drafting',
  INTERNAL_REVIEW = 'internal_review',
  REVISION_REQUESTED = 'revision_requested',
  REVISING = 'revising',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum OpinionPriorityDto {
  STANDARD = 'standard',
  EXPEDITED = 'expedited',
  RUSH = 'rush',
  URGENT = 'urgent',
}

export enum DeliveryFormatDto {
  PDF = 'pdf',
  WORD = 'word',
  BOTH = 'both',
}

export enum ConfidentialityLevelDto {
  STANDARD = 'standard',
  CONFIDENTIAL = 'confidential',
  HIGHLY_CONFIDENTIAL = 'highly_confidential',
  ATTORNEY_EYES_ONLY = 'attorney_eyes_only',
}

// ============================================
// NESTED DTOs
// ============================================

export class JurisdictionDto {
  @ApiProperty({ example: 'Saudi Arabia' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ example: 'Riyadh' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ example: 'Riyadh' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'sharia_law' })
  @IsString()
  @IsOptional()
  legalSystem?: string;
}

export class MoneyDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'SAR', default: 'SAR' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency: string;
}

// ============================================
// REQUEST DTOs
// ============================================

/**
 * DTO for creating a new legal opinion request
 */
export class CreateOpinionRequestDto {
  @ApiProperty({
    description: 'Type of legal opinion',
    enum: OpinionTypeDto,
    example: OpinionTypeDto.LEGAL_ANALYSIS,
  })
  @IsEnum(OpinionTypeDto)
  @IsNotEmpty()
  opinionType: OpinionTypeDto;

  @ApiProperty({
    description: 'Subject/title of the opinion request',
    example: 'Contract Termination Clause Review',
    minLength: 10,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    description: 'The specific legal question(s) requiring an opinion',
    example:
      'Is the termination clause in section 5.2 enforceable under Saudi labor law?',
    minLength: 50,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  @MaxLength(2000)
  legalQuestion: string;

  @ApiProperty({
    description: 'Background context and situation',
    example: 'We are a company looking to terminate an employment contract...',
    minLength: 100,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(100)
  @MaxLength(5000)
  backgroundContext: string;

  @ApiProperty({
    description: 'Relevant facts for legal analysis',
    example: 'Contract signed on Jan 1, 2023. Employee tenure: 2 years...',
    minLength: 100,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(100)
  @MaxLength(5000)
  relevantFacts: string;

  @ApiPropertyOptional({
    description: 'Specific issues to address',
    example:
      '1. Enforceability of clause\n2. Potential damages\n3. Alternative approaches',
    minLength: 50,
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MinLength(50)
  @MaxLength(2000)
  specificIssues?: string;

  @ApiProperty({
    description: 'Legal jurisdiction',
    type: JurisdictionDto,
  })
  @ValidateNested()
  @Type(() => JurisdictionDto)
  @IsNotEmpty()
  jurisdiction: JurisdictionDto;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: OpinionPriorityDto,
    default: OpinionPriorityDto.STANDARD,
  })
  @IsEnum(OpinionPriorityDto)
  @IsOptional()
  priority?: OpinionPriorityDto;

  @ApiPropertyOptional({
    description: 'Requested delivery date',
    example: '2025-02-15T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  requestedDeliveryDate?: string;

  @ApiPropertyOptional({
    description: 'Delivery format',
    enum: DeliveryFormatDto,
    default: DeliveryFormatDto.PDF,
  })
  @IsEnum(DeliveryFormatDto)
  @IsOptional()
  deliveryFormat?: DeliveryFormatDto;

  @ApiPropertyOptional({
    description: 'Include executive summary',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeExecutiveSummary?: boolean;

  @ApiPropertyOptional({
    description: 'Include legal citations',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeCitations?: boolean;

  @ApiPropertyOptional({
    description: 'Include recommendations',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeRecommendations?: boolean;

  @ApiPropertyOptional({
    description: 'Confidentiality level',
    enum: ConfidentialityLevelDto,
    default: ConfidentialityLevelDto.STANDARD,
  })
  @IsEnum(ConfidentialityLevelDto)
  @IsOptional()
  confidentialityLevel?: ConfidentialityLevelDto;
}

/**
 * DTO for updating an opinion request (only in draft status)
 */
export class UpdateOpinionRequestDto extends PartialType(
  CreateOpinionRequestDto,
) {}

/**
 * DTO for submitting a draft opinion
 */
export class SubmitOpinionRequestDto {
  @ApiProperty({
    description: 'Opinion request ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  opinionRequestId: string;
}

/**
 * DTO for assigning opinion to a lawyer
 */
export class AssignToLawyerDto {
  @ApiProperty({
    description: 'Lawyer user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  lawyerId: string;
}

/**
 * DTO for setting estimated cost
 */
export class SetEstimatedCostDto {
  @ApiProperty({ type: MoneyDto })
  @ValidateNested()
  @Type(() => MoneyDto)
  @IsNotEmpty()
  estimatedCost: MoneyDto;
}

/**
 * DTO for marking as paid
 */
export class MarkAsPaidDto {
  @ApiProperty({
    description: 'Payment reference from payment gateway',
    example: 'PAY-123456789',
  })
  @IsString()
  @IsNotEmpty()
  paymentReference: string;

  @ApiPropertyOptional({ type: MoneyDto })
  @ValidateNested()
  @Type(() => MoneyDto)
  @IsOptional()
  finalCost?: MoneyDto;
}

/**
 * DTO for requesting revision
 */
export class RequestRevisionDto {
  @ApiProperty({
    description: 'Reason for revision request',
    example: 'Need more case law citations',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;
}

/**
 * DTO for cancelling opinion request
 */
export class CancelOpinionRequestDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'No longer needed',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}

/**
 * DTO for rejecting opinion request
 */
export class RejectOpinionRequestDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Out of our practice scope',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}

// ============================================
// QUERY/FILTER DTOs
// ============================================

/**
 * DTO for filtering opinion requests
 */
export class OpinionRequestFilterDto {
  @ApiPropertyOptional({ description: 'Client user ID' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Assigned lawyer ID' })
  @IsUUID()
  @IsOptional()
  assignedLawyerId?: string;

  @ApiPropertyOptional({
    description: 'Status filter (can be array)',
    enum: OpinionStatusDto,
    isArray: true,
  })
  @IsEnum(OpinionStatusDto, { each: true })
  @IsOptional()
  status?: OpinionStatusDto | OpinionStatusDto[];

  @ApiPropertyOptional({
    description: 'Opinion type filter',
    enum: OpinionTypeDto,
    isArray: true,
  })
  @IsEnum(OpinionTypeDto, { each: true })
  @IsOptional()
  opinionType?: OpinionTypeDto | OpinionTypeDto[];

  @ApiPropertyOptional({
    description: 'Priority filter',
    enum: OpinionPriorityDto,
    isArray: true,
  })
  @IsEnum(OpinionPriorityDto, { each: true })
  @IsOptional()
  priority?: OpinionPriorityDto | OpinionPriorityDto[];

  @ApiPropertyOptional({ description: 'Jurisdiction country' })
  @IsString()
  @IsOptional()
  jurisdiction?: string;

  @ApiPropertyOptional({ description: 'Payment status' })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Show only overdue opinions' })
  @IsBoolean()
  @IsOptional()
  isOverdue?: boolean;

  @ApiPropertyOptional({
    description: 'Search term (searches in subject and legal question)',
  })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ApiPropertyOptional({
    description: 'Submitted from date',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  submittedFrom?: string;

  @ApiPropertyOptional({
    description: 'Submitted to date',
    example: '2025-01-31',
  })
  @IsDateString()
  @IsOptional()
  submittedTo?: string;

  @ApiPropertyOptional({
    description: 'Completed from date',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  completedFrom?: string;

  @ApiPropertyOptional({
    description: 'Completed to date',
    example: '2025-01-31',
  })
  @IsDateString()
  @IsOptional()
  completedTo?: string;
}

/**
 * DTO for pagination
 */
export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Combined DTO for list queries
 */
export class ListOpinionRequestsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Client user ID' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Assigned lawyer ID' })
  @IsUUID()
  @IsOptional()
  assignedLawyerId?: string;

  @ApiPropertyOptional({ enum: OpinionStatusDto, isArray: true })
  @IsEnum(OpinionStatusDto, { each: true })
  @IsOptional()
  status?: OpinionStatusDto | OpinionStatusDto[];

  @ApiPropertyOptional({ enum: OpinionTypeDto, isArray: true })
  @IsEnum(OpinionTypeDto, { each: true })
  @IsOptional()
  opinionType?: OpinionTypeDto | OpinionTypeDto[];

  @ApiPropertyOptional({ enum: OpinionPriorityDto, isArray: true })
  @IsEnum(OpinionPriorityDto, { each: true })
  @IsOptional()
  priority?: OpinionPriorityDto | OpinionPriorityDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPaid?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isOverdue?: boolean;
}

// ============================================
// RESPONSE DTOs
// ============================================

/**
 * Basic opinion request response
 */
export class OpinionRequestResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'OP-20250128-0001' })
  opinionNumber: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  clientId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  assignedLawyerId?: string;

  @ApiProperty({ enum: OpinionTypeDto })
  opinionType: OpinionTypeDto;

  @ApiProperty({ example: 'Contract Termination Clause Review' })
  subject: string;

  @ApiProperty({ example: 'Is the termination clause enforceable?' })
  legalQuestion: string;

  @ApiProperty({ example: 'Background context...' })
  backgroundContext: string;

  @ApiProperty({ example: 'Relevant facts...' })
  relevantFacts: string;

  @ApiPropertyOptional({ example: 'Specific issues...' })
  specificIssues?: string;

  @ApiProperty({ type: JurisdictionDto })
  jurisdiction: JurisdictionDto;

  @ApiProperty({ enum: OpinionPriorityDto })
  priority: OpinionPriorityDto;

  @ApiPropertyOptional({ example: '2025-02-15T00:00:00Z' })
  requestedDeliveryDate?: string;

  @ApiPropertyOptional({ example: '2025-02-10T00:00:00Z' })
  actualDeliveryDate?: string;

  @ApiProperty({ enum: OpinionStatusDto })
  status: OpinionStatusDto;

  @ApiPropertyOptional({ example: 1 })
  draftVersion?: number;

  @ApiPropertyOptional({ example: 1 })
  finalVersion?: number;

  @ApiProperty({ enum: DeliveryFormatDto })
  deliveryFormat: DeliveryFormatDto;

  @ApiProperty({ example: true })
  includeExecutiveSummary: boolean;

  @ApiProperty({ example: true })
  includeCitations: boolean;

  @ApiProperty({ example: true })
  includeRecommendations: boolean;

  @ApiPropertyOptional({ type: MoneyDto })
  estimatedCost?: MoneyDto;

  @ApiPropertyOptional({ type: MoneyDto })
  finalCost?: MoneyDto;

  @ApiProperty({ example: false })
  isPaid: boolean;

  @ApiPropertyOptional({ example: 'PAY-123456789' })
  paymentReference?: string;

  @ApiPropertyOptional({ example: '2025-01-28T10:00:00Z' })
  submittedAt?: string;

  @ApiPropertyOptional({ example: '2025-01-28T11:00:00Z' })
  assignedAt?: string;

  @ApiPropertyOptional({ example: '2025-02-05T10:00:00Z' })
  completedAt?: string;

  @ApiPropertyOptional({ example: '2025-02-10T00:00:00Z' })
  expectedCompletionDate?: string;

  @ApiProperty({ enum: ConfidentialityLevelDto })
  confidentialityLevel: ConfidentialityLevelDto;

  @ApiProperty({ example: false })
  isUrgent: boolean;

  @ApiProperty({ example: '2025-01-28T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-28T10:00:00Z' })
  updatedAt: string;
}

/**
 * Paginated response
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: 15 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrevious: boolean;
}

export class PaginatedOpinionRequestResponseDto {
  @ApiProperty({ type: [OpinionRequestResponseDto] })
  data: OpinionRequestResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}

/**
 * Statistics response
 */
export class OpinionStatisticsResponseDto {
  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({
    example: { draft: 10, submitted: 20, completed: 80 },
    description: 'Count by status',
  })
  byStatus: Record<string, number>;

  @ApiProperty({
    example: { legal_analysis: 60, contract_review: 50 },
    description: 'Count by opinion type',
  })
  byType: Record<string, number>;

  @ApiProperty({
    example: { standard: 100, expedited: 30 },
    description: 'Count by priority',
  })
  byPriority: Record<string, number>;

  @ApiProperty({
    example: 72.5,
    description: 'Average completion time in hours',
  })
  averageCompletionTime: number;

  @ApiProperty({ example: 5 })
  overdueCount: number;

  @ApiProperty({ example: 120 })
  paidCount: number;

  @ApiProperty({ example: 30 })
  unpaidCount: number;

  @ApiProperty({ example: 450000 })
  totalRevenue: number;

  @ApiProperty({ example: 3000 })
  averageRevenue: number;
}

// ============================================
// ERROR RESPONSE DTOs
// ============================================

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  message: string;

  @ApiPropertyOptional({ example: 'VALIDATION_ERROR' })
  error?: string;

  @ApiPropertyOptional({ type: [String] })
  details?: string[];
}

// export class ValidationErrorResponseDto extends ErrorResponseDto {
//   @ApiProperty({
//     type: [String],
//     example: ['subject must be longer than 10 characters'],
//   })
//   details: string[];
// }
