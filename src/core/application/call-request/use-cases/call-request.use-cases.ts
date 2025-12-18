// src/core/application/call-request/use-cases/call-request.use-cases.ts

import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CallRequest } from '../../../domain/call-request/entities/call-request.entity';
import { CallStatus } from '../../../domain/call-request/value-objects/call-status.vo';
import { CallPlatformType } from '../../../domain/call-request/value-objects/call-platform.vo';
import {
    type ICallRequestRepository,
    CallRequestFilter,
    PaginationOptions,
    PaginatedResult,
} from '../ports/call-request.repository';
import { type IProviderValidationService } from '../ports/provider-validation.port';
import {
    CreateCallRequestDto,
    ScheduleCallDto,
    AssignProviderDto,
    RescheduleCallDto,
    EndCallDto,
    CancelCallDto,
    UpdateCallLinkDto,
    GetCallRequestsQueryDto,
} from '../dto/call-request.dto';

// ============================================
// 1. CREATE CALL REQUEST USE CASE
// ============================================

@Injectable()
export class CreateCallRequestUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(dto: CreateCallRequestDto): Promise<CallRequest> {
        // Check if subscriber has too many pending calls
        const hasPending = await this.callRequestRepo.hasPendingCalls(dto.subscriberId);
        if (hasPending) {
            // Allow multiple pending, but could add a limit here
        }

        const callRequest = CallRequest.create({
            subscriberId: dto.subscriberId,
            purpose: dto.purpose,
            consultationType: dto.consultationType,
            preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
            preferredTime: dto.preferredTime,
        });

        return await this.callRequestRepo.create(callRequest);
    }
}

// ============================================
// 2. GET CALL REQUEST BY ID USE CASE
// ============================================

@Injectable()
export class GetCallRequestByIdUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(id: string): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(id);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${id} not found`);
        }
        return callRequest;
    }
}

// ============================================
// 3. GET CALL REQUESTS USE CASE
// ============================================

@Injectable()
export class GetCallRequestsUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(query: GetCallRequestsQueryDto): Promise<PaginatedResult<CallRequest>> {
        const filter: CallRequestFilter = {};

        if (query.subscriberId) filter.subscriberId = query.subscriberId;
        if (query.providerId) filter.assignedProviderId = query.providerId;
        if (query.status) filter.status = query.status;
        if (query.consultationType) filter.consultationType = query.consultationType;
        if (query.scheduledAfter) filter.scheduledAfter = new Date(query.scheduledAfter);
        if (query.scheduledBefore) filter.scheduledBefore = new Date(query.scheduledBefore);

        const pagination: PaginationOptions = {
            limit: query.limit || 20,
            offset: query.offset || 0,
            orderBy: query.orderBy || 'createdAt',
            orderDirection: query.orderDirection || 'desc',
        };

        return await this.callRequestRepo.findAll(filter, pagination);
    }
}

// ============================================
// 4. ASSIGN PROVIDER USE CASE
// ============================================

@Injectable()
export class AssignProviderUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
        @Inject('IProviderValidationService')
        private readonly providerValidation: IProviderValidationService,
    ) {}

    async execute(callRequestId: string, dto: AssignProviderDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        // Validate that the provider is a valid ProviderUser linked to an approved ProviderProfile
        const validationResult = await this.providerValidation.validateProviderForAssignment(dto.providerId);
        if (!validationResult.isValid) {
            throw new BadRequestException(validationResult.error);
        }

        callRequest.assignProvider(dto.providerId);

        return await this.callRequestRepo.update(callRequest);
    }
}

// ============================================
// 5. SCHEDULE CALL USE CASE
// ============================================

@Injectable()
export class ScheduleCallUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string, dto: ScheduleCallDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        const scheduledAt = new Date(dto.scheduledAt);

        // Check for provider conflicts if assigned
        if (callRequest.assignedProviderId) {
            const isAvailable = await this.callRequestRepo.isProviderAvailable(
                callRequest.assignedProviderId,
                scheduledAt,
                dto.durationMinutes,
            );

            if (!isAvailable) {
                throw new ConflictException(
                    'Provider is not available at the requested time. Please choose a different time slot.'
                );
            }
        }

        callRequest.schedule({
            scheduledAt,
            durationMinutes: dto.durationMinutes,
            platform: dto.platform,
            callLink: dto.callLink,
        });

        return await this.callRequestRepo.update(callRequest);
    }
}

// ============================================
// 6. RESCHEDULE CALL USE CASE
// ============================================

@Injectable()
export class RescheduleCallUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string, dto: RescheduleCallDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        const scheduledAt = new Date(dto.scheduledAt);
        const durationMinutes = dto.durationMinutes || callRequest.scheduledDuration || 30;

        // Check for provider conflicts
        if (callRequest.assignedProviderId) {
            const conflicts = await this.callRequestRepo.findConflictingCalls(
                callRequest.assignedProviderId,
                scheduledAt,
                durationMinutes,
            );

            // Exclude current call from conflicts
            const otherConflicts = conflicts.filter(c => c.id !== callRequestId);
            if (otherConflicts.length > 0) {
                throw new ConflictException(
                    'Provider has conflicting calls at the requested time'
                );
            }
        }

        callRequest.reschedule({
            scheduledAt,
            durationMinutes: dto.durationMinutes,
            reason: dto.reason,
        });

        return await this.callRequestRepo.update(callRequest);
    }
}

// ============================================
// 7. START CALL USE CASE
// ============================================

@Injectable()
export class StartCallUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        callRequest.startCall();

        return await this.callRequestRepo.update(callRequest);
    }
}

// ============================================
// 8. END CALL USE CASE
// ============================================

@Injectable()
export class EndCallUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string, dto?: EndCallDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        callRequest.endCall(dto?.recordingUrl);

        return await this.callRequestRepo.update(callRequest);
    }
}

// ============================================
// 9. CANCEL CALL USE CASE
// ============================================

@Injectable()
export class CancelCallUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string, dto?: CancelCallDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        callRequest.cancel(dto?.reason);

        return await this.callRequestRepo.update(callRequest);
    }
}

// ============================================
// 10. MARK NO SHOW USE CASE
// ============================================

@Injectable()
export class MarkNoShowUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        callRequest.markNoShow();

        return await this.callRequestRepo.update(callRequest);
    }
}

// ============================================
// 11. UPDATE CALL LINK USE CASE
// ============================================

@Injectable()
export class UpdateCallLinkUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(callRequestId: string, dto: UpdateCallLinkDto): Promise<CallRequest> {
        const callRequest = await this.callRequestRepo.findById(callRequestId);
        if (!callRequest) {
            throw new NotFoundException(`Call request with ID ${callRequestId} not found`);
        }

        callRequest.updateCallLink(dto.callLink, dto.platform);

        return await this.callRequestRepo.update(callRequest);
    }
}

// ============================================
// 12. GET SUBSCRIBER CALLS USE CASE
// ============================================

@Injectable()
export class GetSubscriberCallsUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(subscriberId: string, options?: PaginationOptions): Promise<CallRequest[]> {
        return await this.callRequestRepo.findBySubscriber(subscriberId, options);
    }
}

// ============================================
// 13. GET PROVIDER CALLS USE CASE
// ============================================

@Injectable()
export class GetProviderCallsUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(providerId: string, options?: PaginationOptions): Promise<CallRequest[]> {
        return await this.callRequestRepo.findByProvider(providerId, options);
    }
}

// ============================================
// 14. GET UPCOMING CALLS USE CASE
// ============================================

@Injectable()
export class GetUpcomingCallsUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(providerId: string, limit: number = 10): Promise<CallRequest[]> {
        return await this.callRequestRepo.findUpcomingCallsForProvider(providerId, limit);
    }
}

// ============================================
// 15. GET OVERDUE CALLS USE CASE
// ============================================

@Injectable()
export class GetOverdueCallsUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(): Promise<CallRequest[]> {
        return await this.callRequestRepo.findOverdueCalls();
    }
}

// ============================================
// 16. GET CALL MINUTES SUMMARY USE CASE
// ============================================

@Injectable()
export class GetCallMinutesSummaryUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(
        subscriberId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<{ totalMinutes: number; billableMinutes: number }> {
        const totalMinutes = await this.callRequestRepo.getTotalCallMinutes(
            subscriberId,
            startDate,
            endDate,
        );

        // Calculate billable minutes (rounded up to 15-minute increments)
        const billableMinutes = Math.ceil(totalMinutes / 15) * 15;

        return {
            totalMinutes,
            billableMinutes,
        };
    }
}

// ============================================
// 17. CHECK PROVIDER AVAILABILITY USE CASE
// ============================================

@Injectable()
export class CheckProviderAvailabilityUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(
        providerId: string,
        scheduledAt: Date,
        durationMinutes: number,
    ): Promise<{ isAvailable: boolean; conflictingCalls: CallRequest[] }> {
        const isAvailable = await this.callRequestRepo.isProviderAvailable(
            providerId,
            scheduledAt,
            durationMinutes,
        );

        let conflictingCalls: CallRequest[] = [];
        if (!isAvailable) {
            conflictingCalls = await this.callRequestRepo.findConflictingCalls(
                providerId,
                scheduledAt,
                durationMinutes,
            );
        }

        return { isAvailable, conflictingCalls };
    }
}

// ============================================
// 18. GET SCHEDULED CALLS FOR DATE RANGE USE CASE
// ============================================

@Injectable()
export class GetScheduledCallsUseCase {
    constructor(
        @Inject('ICallRequestRepository')
        private readonly callRequestRepo: ICallRequestRepository,
    ) {}

    async execute(
        startDate: Date,
        endDate: Date,
        providerId?: string,
    ): Promise<CallRequest[]> {
        return await this.callRequestRepo.findScheduledCalls(startDate, endDate, providerId);
    }
}
