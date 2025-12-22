// ============================================
// GET CONSULTATION STATISTICS USE CASE
// ============================================

import {
    IConsultationRequestRepository,
    ConsultationRequestFilters,
} from '../../ports/repository';

import { ConsultationStatisticsDTO } from '../../consultation request.dtos';

export class GetConsultationStatisticsUseCase {
    constructor(
        private readonly repository: IConsultationRequestRepository
    ) {}

    async execute(filters?: ConsultationRequestFilters): Promise<ConsultationStatisticsDTO> {
        const stats = await this.repository.getStatistics(filters);
        return stats;
    }
}
