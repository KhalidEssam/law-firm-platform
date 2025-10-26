// ============================================
// CONSULTATION REQUEST DTOs
// Data Transfer Objects with Validation
// ============================================

import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsUUID,
    IsInt,
    Min,
    Max,
    Length,
    IsDateString,
    IsNumber,
    IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// ENUMS
// ============================================

export enum ConsultationType {
    LEGAL_ADVICE = 'legal_advice',
    DOCUMENT_REVIEW = 'document_review',
    CONTRACT_DRAFTING = 'contract_drafting',
    LEGAL_OPINION = 'legal_opinion',
    GENERAL_INQUIRY = 'general_inquiry',
}

export enum UrgencyLevel {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum ConsultationStatusEnum {
    PENDING = 'pending',
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    AWAITING_INFO = 'awaiting_info',
    RESPONDED = 'responded',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    DISPUTED = 'disputed',
}

export enum MessageTypeEnum {
    TEXT = 'text',
    SYSTEM = 'system',
    NOTIFICATION = 'notification',
}

// ============================================
// USE CASE 1: CREATE CONSULTATION REQUEST
// ============================================

export class CreateConsultationRequestDTO {
    @ApiProperty({ example: 'user-123', description: 'Subscriber user ID' })
    @IsUUID()
    @IsNotEmpty()
    subscriberId: string;

    @ApiProperty({
        enum: ConsultationType,
        example: ConsultationType.LEGAL_ADVICE,
        description: 'Type of consultation'
    })
    @IsEnum(ConsultationType)
    @IsNotEmpty()
    consultationType: string;

    @ApiPropertyOptional({ example: 'Contract Law', description: 'Legal category' })
    @IsString()
    @IsOptional()
    @Length(1, 100)
    category?: string;

    @ApiProperty({
        example: 'Need advice on employment contract',
        description: 'Subject of consultation'
    })
    @IsString()
    @IsNotEmpty()
    @Length(5, 200)
    subject: string;

    @ApiProperty({
        example: 'I received a new employment contract and need legal advice on the termination clause...',
        description: 'Detailed description'
    })
    @IsString()
    @IsNotEmpty()
    @Length(20, 5000)
    description: string;

    @ApiPropertyOptional({
        enum: UrgencyLevel,
        example: UrgencyLevel.NORMAL,
        default: UrgencyLevel.NORMAL,
        description: 'Urgency level'
    })
    @IsEnum(UrgencyLevel)
    @IsOptional()
    urgency?: string;
}

// ============================================
// USE CASE 2 & 3: RESPONSE DTO
// ============================================

export class ConsultationRequestResponseDTO {
    @ApiProperty({ example: 'consultation-456' })
    id: string;

    @ApiProperty({ example: 'CR-20250123-0001' })
    requestNumber: string;

    @ApiProperty({ example: 'user-123' })
    subscriberId: string;

    @ApiPropertyOptional({ example: 'provider-789' })
    assignedProviderId?: string;

    @ApiProperty({ enum: ConsultationType })
    consultationType: string;

    @ApiPropertyOptional({ example: 'Contract Law' })
    category?: string;

    @ApiProperty({ example: 'Need advice on employment contract' })
    subject: string;

    @ApiProperty({ example: 'Detailed description...' })
    description: string;

    @ApiProperty({ enum: UrgencyLevel })
    urgency: string;

    @ApiProperty({ enum: ConsultationStatusEnum })
    status: string;

    @ApiPropertyOptional()
    slaDeadline?: Date;

    @ApiPropertyOptional({ example: 'on_time' })
    slaStatus?: string;

    @ApiProperty()
    submittedAt: Date;

    @ApiPropertyOptional()
    assignedAt?: Date;

    @ApiPropertyOptional()
    respondedAt?: Date;

    @ApiPropertyOptional()
    completedAt?: Date;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

// ============================================
// USE CASE 3: LIST/FILTER DTO
// ============================================

export class ListConsultationRequestsQueryDTO {
    @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ example: 10, default: 10, description: 'Items per page' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({ example: 'createdAt', description: 'Sort by field' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc', description: 'Sort order' })
    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';

    @ApiPropertyOptional({ example: 'user-123', description: 'Filter by subscriber ID' })
    @IsOptional()
    @IsString()
    subscriberId?: string;

    @ApiPropertyOptional({ example: 'provider-789', description: 'Filter by provider ID' })
    @IsOptional()
    @IsString()
    assignedProviderId?: string;

    @ApiPropertyOptional({ enum: ConsultationStatusEnum, description: 'Filter by status' })
    @IsOptional()
    @IsEnum(ConsultationStatusEnum)
    status?: string;

    @ApiPropertyOptional({ enum: ConsultationType, description: 'Filter by type' })
    @IsOptional()
    @IsEnum(ConsultationType)
    consultationType?: string;

    @ApiPropertyOptional({ enum: UrgencyLevel, description: 'Filter by urgency' })
    @IsOptional()
    @IsEnum(UrgencyLevel)
    urgency?: string;

    @ApiPropertyOptional({ example: 'on_time', description: 'Filter by SLA status' })
    @IsOptional()
    @IsString()
    slaStatus?: string;

    @ApiPropertyOptional({ example: 'contract', description: 'Search term' })
    @IsOptional()
    @IsString()
    searchTerm?: string;
}

export class PaginatedConsultationResponseDTO {
    @ApiProperty({ type: [ConsultationRequestResponseDTO] })
    data: ConsultationRequestResponseDTO[];

    @ApiProperty({
        example: {
            page: 1,
            limit: 10,
            total: 145,
            totalPages: 15,
            hasNext: true,
            hasPrevious: false,
        }
    })
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

// ============================================
// USE CASE 4: ASSIGN TO PROVIDER
// ============================================

export class AssignConsultationDTO {
    @ApiProperty({ example: 'provider-789', description: 'Provider user ID' })
    @IsUUID()
    @IsNotEmpty()
    providerId: string;
}

// ============================================
// USE CASE 7: CANCEL CONSULTATION
// ============================================

export class CancelConsultationDTO {
    @ApiPropertyOptional({
        example: 'Client requested cancellation',
        description: 'Reason for cancellation'
    })
    @IsString()
    @IsOptional()
    @Length(0, 500)
    reason?: string;
}

// ============================================
// USE CASE 8: DISPUTE CONSULTATION
// ============================================

export class DisputeConsultationDTO {
    @ApiProperty({
        example: 'The legal advice provided was incomplete',
        description: 'Reason for dispute'
    })
    @IsString()
    @IsNotEmpty()
    @Length(10, 1000)
    reason: string;
}

// ============================================
// USE CASE 9: UPLOAD DOCUMENT
// ============================================

export class UploadDocumentDTO {
    @ApiProperty({ example: 'consultation-456', description: 'Consultation request ID' })
    @IsUUID()
    @IsNotEmpty()
    consultationId: string;

    @ApiProperty({ example: 'user-123', description: 'User who uploaded' })
    @IsUUID()
    @IsNotEmpty()
    uploadedBy: string;

    @ApiProperty({ example: 'contract.pdf', description: 'File name' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    fileName: string;

    @ApiProperty({
        example: 'https://s3.amazonaws.com/bucket/contract.pdf',
        description: 'File URL'
    })
    @IsString()
    @IsNotEmpty()
    fileUrl: string;

    @ApiProperty({ example: 'application/pdf', description: 'MIME type' })
    @IsString()
    @IsNotEmpty()
    fileType: string;

    @ApiProperty({ example: 2048000, description: 'File size in bytes' })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    fileSize: number;

    @ApiPropertyOptional({
        example: 'Employment contract for review',
        description: 'Document description'
    })
    @IsString()
    @IsOptional()
    @Length(0, 500)
    description?: string;
}

export class DocumentResponseDTO {
    @ApiProperty({ example: 'document-789' })
    id: string;

    @ApiProperty({ example: 'consultation-456' })
    consultationId: string;

    @ApiProperty({ example: 'user-123' })
    uploadedBy: string;

    @ApiProperty({ example: 'contract.pdf' })
    fileName: string;

    @ApiProperty({ example: 'https://s3.amazonaws.com/bucket/contract.pdf' })
    fileUrl: string;

    @ApiProperty({ example: 'application/pdf' })
    fileType: string;

    @ApiProperty({ example: 2048000 })
    fileSize: number;

    @ApiProperty({ example: '2.00 MB' })
    fileSizeFormatted: string;

    @ApiPropertyOptional({ example: 'Employment contract for review' })
    description?: string;

    @ApiProperty({ example: false })
    isVerified: boolean;

    @ApiProperty()
    uploadedAt: Date;
}

// ============================================
// USE CASE 10: SEND MESSAGE
// ============================================

export class SendMessageDTO {
    @ApiProperty({ example: 'consultation-456', description: 'Consultation request ID' })
    @IsUUID()
    @IsNotEmpty()
    consultationId: string;

    @ApiProperty({ example: 'provider-789', description: 'Sender user ID' })
    @IsUUID()
    @IsNotEmpty()
    senderId: string;

    @ApiProperty({
        example: 'Thank you for your request. I will review the contract...',
        description: 'Message content'
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 2000)
    message: string;

    @ApiPropertyOptional({
        enum: MessageTypeEnum,
        example: MessageTypeEnum.TEXT,
        default: MessageTypeEnum.TEXT,
        description: 'Message type'
    })
    @IsEnum(MessageTypeEnum)
    @IsOptional()
    messageType?: string;
}

export class MessageResponseDTO {
    @ApiProperty({ example: 'message-001' })
    id: string;

    @ApiProperty({ example: 'consultation-456' })
    consultationId: string;

    @ApiProperty({ example: 'provider-789' })
    senderId: string;

    @ApiProperty({ example: 'Thank you for your request...' })
    message: string;

    @ApiProperty({ enum: MessageTypeEnum })
    messageType: string;

    @ApiProperty({ example: false })
    isRead: boolean;

    @ApiProperty()
    sentAt: Date;
}

// ============================================
// USE CASE 11: ADD RATING
// ============================================

export class AddRatingDTO {
    @ApiProperty({ example: 'consultation-456', description: 'Consultation request ID' })
    @IsUUID()
    @IsNotEmpty()
    consultationId: string;

    @ApiProperty({ example: 'user-123', description: 'Subscriber user ID' })
    @IsUUID()
    @IsNotEmpty()
    subscriberId: string;

    @ApiProperty({
        example: 5,
        minimum: 1,
        maximum: 5,
        description: 'Rating (1-5 stars)'
    })
    @IsInt()
    @IsNotEmpty()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({
        example: 'Excellent service! Very professional and thorough.',
        description: 'Optional comment'
    })
    @IsString()
    @IsOptional()
    @Length(0, 1000)
    comment?: string;
}

export class RatingResponseDTO {
    @ApiProperty({ example: 'rating-001' })
    id: string;

    @ApiProperty({ example: 'consultation-456' })
    consultationId: string;

    @ApiProperty({ example: 'user-123' })
    subscriberId: string;

    @ApiProperty({ example: 5 })
    rating: number;

    @ApiPropertyOptional({ example: 'Excellent service!' })
    comment?: string;

    @ApiProperty()
    createdAt: Date;
}

// ============================================
// USE CASE 12: GET STATISTICS
// ============================================

export class ConsultationStatisticsDTO {
    @ApiProperty({ example: 150 })
    total: number;

    @ApiProperty({
        example: {
            pending: 30,
            assigned: 25,
            in_progress: 40,
            completed: 45,
            cancelled: 8,
            disputed: 2,
        }
    })
    byStatus: Record<string, number>;

    @ApiProperty({
        example: {
            low: 20,
            normal: 80,
            high: 40,
            urgent: 10,
        }
    })
    byUrgency: Record<string, number>;

    @ApiProperty({
        example: {
            on_time: 120,
            at_risk: 15,
            breached: 8,
        }
    })
    bySLAStatus: Record<string, number>;

    @ApiProperty({ example: 6.5, description: 'Average response time in hours' })
    averageResponseTime: number;

    @ApiProperty({ example: 28.3, description: 'Average completion time in hours' })
    averageCompletionTime: number;

    @ApiProperty({ example: 5.3, description: 'SLA breach rate percentage' })
    slaBreachRate: number;
}

// ============================================
// USE CASE 13: UPDATE SLA STATUSES
// ============================================

export class UpdateSLAStatusesResponseDTO {
    @ApiProperty({ example: 15, description: 'Number of consultations updated' })
    updatedCount: number;

    @ApiProperty({
        example: ['consultation-1', 'consultation-2'],
        description: 'IDs of updated consultations'
    })
    updatedIds: string[];

    @ApiProperty({ example: '2025-01-23T19:30:00.000Z' })
    executedAt: Date;
}

// ============================================
// COMMON ERROR RESPONSE
// ============================================

export class ErrorResponseDTO {
    @ApiProperty({ example: 400 })
    statusCode: number;

    @ApiProperty({ example: 'Validation failed' })
    message: string | string[];

    @ApiProperty({ example: 'Bad Request' })
    error: string;

    @ApiPropertyOptional()
    timestamp?: string;

    @ApiPropertyOptional()
    path?: string;
}