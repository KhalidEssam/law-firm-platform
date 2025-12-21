// src/core/application/consultation/use-cases/sla-aware-consultation.use-cases.ts
//
// SLA-Aware Consultation Use Cases
// These use cases wrap core consultation operations with SLA functionality

import { Injectable, Inject, Logger } from '@nestjs/common';
import {
    ConsultationRequest,
    ConsultationId,
    UserId,
    ConsultationTypeVO,
    Urgency,
    ConsultationCategory,
    Subject,
    Description,
} from '../../../domain/consultation/value-objects/consultation-request-domain';

import { RequestStatusHistory } from '../../../domain/consultation/entities/consultation-request-entities';

import type { IConsultationRequestUnitOfWork } from '../ports/repository';

import {
    CreateConsultationRequestDTO,
    ConsultationRequestResponseDTO,
} from '../consultation request.dtos';

import { SLAIntegrationService } from '../../sla/services/sla-integration.service';
import { SLAStatus as SLAModuleStatus } from '../../../domain/sla/value-objects/sla-status.vo';
import { SLAStatus, SLAStatusType } from '../../../domain/consultation/value-objects/consultation-request-domain';

// ============================================
// HELPER: MAP SLA STATUS BETWEEN MODULES
// ============================================

function mapSLAModuleStatusToConsultation(status: SLAModuleStatus): SLAStatus {
    // Map from SLA module status to consultation domain status
    // SLA module uses: on_track, at_risk, breached
    // Consultation uses: on_time, at_risk, breached, not_applicable
    const mapping: Record<string, string> = {
        'on_track': 'on_time',
        'at_risk': 'at_risk',
        'breached': 'breached',
    };
    const consultationStatus = mapping[status] || 'on_time';
    return SLAStatus.create(consultationStatus);
}

// ============================================
// USE CASE: CREATE CONSULTATION WITH SLA
// ============================================

@Injectable()
export class CreateConsultationWithSLAUseCase {
    private readonly logger = new Logger(CreateConsultationWithSLAUseCase.name);

    constructor(
        @Inject('IConsultationRequestUnitOfWork')
        private readonly unitOfWork: IConsultationRequestUnitOfWork,
        private readonly slaIntegration: SLAIntegrationService,
    ) {}

    async execute(dto: CreateConsultationRequestDTO): Promise<ConsultationRequestResponseDTO> {
        // Validate input
        this.validate(dto);

        // Calculate SLA deadlines BEFORE creating the request
        const slaResult = await this.slaIntegration.applySLAToRequest(
            'consultation',
            dto.urgency || 'normal',
            new Date(),
        );

        if (slaResult) {
            this.logger.log(
                `SLA applied: deadline=${slaResult.slaDeadline.toISOString()}, ` +
                `policy=${slaResult.policyName}`,
            );
        } else {
            this.logger.warn('No SLA policy found for consultation request');
        }

        // Create domain entity with SLA data
        const consultation = ConsultationRequest.create({
            subscriberId: UserId.create(dto.subscriberId),
            consultationType: ConsultationTypeVO.create(dto.consultationType),
            category: dto.category ? ConsultationCategory.create(dto.category) : undefined,
            subject: Subject.create(dto.subject),
            description: Description.create(dto.description),
            urgency: dto.urgency ? Urgency.create(dto.urgency) : Urgency.normal(),
        });

        // Set SLA fields if policy was found
        if (slaResult) {
            consultation.setSLADeadline(slaResult.slaDeadline);
            consultation.setSLAStatus(mapSLAModuleStatusToConsultation(slaResult.slaStatus));
        }

        // Use transaction to ensure consistency
        return await this.unitOfWork.transaction(async (uow) => {
            // Save consultation with SLA
            const saved = await uow.consultationRequests.create(consultation);

            // Create initial status history
            const statusHistory = RequestStatusHistory.create({
                consultationId: saved.id,
                toStatus: saved.status,
                reason: slaResult
                    ? `Initial creation with SLA (Policy: ${slaResult.policyName})`
                    : 'Initial creation (No SLA policy)',
            });
            await uow.statusHistories.create(statusHistory);

            return this.toDTO(saved, slaResult);
        });
    }

    private validate(dto: CreateConsultationRequestDTO): void {
        if (!dto.subscriberId) {
            throw new Error('Subscriber ID is required');
        }
        if (!dto.consultationType) {
            throw new Error('Consultation type is required');
        }
        if (!dto.subject) {
            throw new Error('Subject is required');
        }
        if (!dto.description) {
            throw new Error('Description is required');
        }
    }

    private toDTO(
        consultation: ConsultationRequest,
        _slaResult?: { responseDeadline: Date; resolutionDeadline: Date; escalationDeadline: Date | null } | null,
    ): ConsultationRequestResponseDTO {
        return {
            id: consultation.id.getValue(),
            requestNumber: consultation.requestNumber.getValue(),
            subscriberId: consultation.subscriberId?.getValue() || '',
            assignedProviderId: consultation.assignedProviderId?.getValue(),
            consultationType: consultation.consultationType.getValue(),
            category: consultation.category?.getValue(),
            subject: consultation.subject.getValue(),
            description: consultation.description.getValue(),
            urgency: consultation.urgency.getValue(),
            status: consultation.status.getValue(),
            submittedAt: consultation.submittedAt,
            assignedAt: consultation.assignedAt,
            respondedAt: consultation.respondedAt,
            completedAt: consultation.completedAt,
            slaDeadline: consultation.slaDeadline,
            slaStatus: consultation.slaStatus?.getValue(),
            createdAt: consultation.createdAt,
            updatedAt: consultation.updatedAt,
        };
    }
}

// ============================================
// USE CASE: CHECK CONSULTATION SLA STATUS
// ============================================

@Injectable()
export class CheckConsultationSLAStatusUseCase {
    constructor(
        @Inject('IConsultationRequestRepository')
        private readonly repository: any,
        private readonly slaIntegration: SLAIntegrationService,
    ) {}

    async execute(consultationId: string): Promise<{
        requestId: string;
        currentStatus: string;
        isBreached: boolean;
        isAtRisk: boolean;
        timeRemaining?: string;
        urgencyScore: number;
    }> {
        const id = ConsultationId.create(consultationId);
        const consultation = await this.repository.findById(id);

        if (!consultation) {
            throw new Error(`Consultation request with ID ${consultationId} not found`);
        }

        const slaData = {
            requestId: consultation.id.getValue(),
            requestType: 'consultation',
            priority: consultation.urgency?.getValue() || 'normal',
            createdAt: consultation.createdAt,
            respondedAt: consultation.respondedAt,
            resolvedAt: consultation.completedAt,
            slaDeadline: consultation.slaDeadline,
            currentSlaStatus: consultation.slaStatus?.getValue(),
        };

        const result = this.slaIntegration.checkSLAStatus(slaData);
        const urgencyScore = this.slaIntegration.getUrgencyScore(slaData);

        return {
            requestId: consultationId,
            currentStatus: result.currentStatus,
            isBreached: result.isBreached,
            isAtRisk: result.isAtRisk,
            timeRemaining: result.timeToDeadline
                ? this.slaIntegration.formatTimeRemaining(result.timeToDeadline)
                : undefined,
            urgencyScore,
        };
    }
}

// ============================================
// USE CASE: GET CONSULTATIONS SORTED BY URGENCY
// ============================================

@Injectable()
export class GetConsultationsByUrgencyUseCase {
    constructor(
        @Inject('IConsultationRequestRepository')
        private readonly repository: any,
        private readonly slaIntegration: SLAIntegrationService,
    ) {}

    async execute(filters?: { status?: string[]; providerId?: string }): Promise<
        Array<{
            id: string;
            requestNumber: string;
            subject: string;
            urgency: string;
            slaStatus: string;
            timeRemaining: string;
            urgencyScore: number;
        }>
    > {
        // Get active consultations
        const consultations = await this.repository.getAll({
            status: filters?.status || ['pending', 'assigned', 'in_progress'],
            assignedProviderId: filters?.providerId,
        });

        // Map to SLA data format
        const slaDataList = consultations.map((c: any) => ({
            requestId: c.id.getValue(),
            requestType: 'consultation',
            priority: c.urgency?.getValue() || 'normal',
            createdAt: c.createdAt,
            respondedAt: c.respondedAt,
            resolvedAt: c.completedAt,
            slaDeadline: c.slaDeadline,
            currentSlaStatus: c.slaStatus?.getValue(),
            // Keep original data for output
            _original: c,
        }));

        // Sort by urgency
        const sorted = this.slaIntegration.sortByUrgency(slaDataList);

        // Return formatted results
        return sorted.map((data: any) => {
            const result = this.slaIntegration.checkSLAStatus(data);
            const urgencyScore = this.slaIntegration.getUrgencyScore(data);

            return {
                id: data.requestId,
                requestNumber: data._original.requestNumber?.getValue() || '',
                subject: data._original.subject?.getValue() || '',
                urgency: data.priority,
                slaStatus: result.currentStatus,
                timeRemaining: result.timeToDeadline
                    ? this.slaIntegration.formatTimeRemaining(result.timeToDeadline)
                    : 'No deadline',
                urgencyScore,
            };
        });
    }
}

// ============================================
// USE CASE: UPDATE CONSULTATION SLA STATUS
// ============================================

@Injectable()
export class UpdateConsultationSLAStatusUseCase {
    private readonly logger = new Logger(UpdateConsultationSLAStatusUseCase.name);

    constructor(
        @Inject('IConsultationRequestUnitOfWork')
        private readonly unitOfWork: IConsultationRequestUnitOfWork,
        private readonly slaIntegration: SLAIntegrationService,
    ) {}

    async execute(consultationId: string): Promise<{
        updated: boolean;
        previousStatus: string | null;
        newStatus: string;
    }> {
        const id = ConsultationId.create(consultationId);

        return await this.unitOfWork.transaction(async (uow) => {
            const consultation = await uow.consultationRequests.findById(id);

            if (!consultation) {
                throw new Error(`Consultation request with ID ${consultationId} not found`);
            }

            const slaData = {
                requestId: consultation.id.getValue(),
                requestType: 'consultation',
                priority: consultation.urgency?.getValue() || 'normal',
                createdAt: consultation.createdAt,
                respondedAt: consultation.respondedAt,
                resolvedAt: consultation.completedAt,
                slaDeadline: consultation.slaDeadline,
                currentSlaStatus: consultation.slaStatus?.getValue(),
            };

            const result = this.slaIntegration.checkSLAStatus(slaData);

            if (result.hasChanged) {
                // Map status from SLA module format to consultation domain format
                const domainStatus = mapSLAModuleStatusToConsultation(result.currentStatus as any);
                consultation.setSLAStatus(domainStatus);
                await uow.consultationRequests.update(consultation);

                this.logger.log(
                    `Updated SLA status for ${consultationId}: ` +
                    `${result.previousStatus} -> ${result.currentStatus}`,
                );
            }

            return {
                updated: result.hasChanged,
                previousStatus: result.previousStatus,
                newStatus: result.currentStatus,
            };
        });
    }
}
