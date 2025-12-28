// ============================================
// UPDATE SLA STATUSES USE CASE (BACKGROUND JOB)
// ============================================

import { ConsultationStatus } from '../../../../domain/consultation/value-objects/consultation-request-domain';

import { IConsultationRequestRepository } from '../../ports/repository';

export interface UpdateSLAStatusesResult {
  updatedCount: number;
  updatedIds: string[];
  executedAt: Date;
}

export class UpdateSLAStatusesUseCase {
  constructor(private readonly repository: IConsultationRequestRepository) {}

  async execute(): Promise<UpdateSLAStatusesResult> {
    // Find all active consultations (not completed or cancelled)
    const activeConsultations = await this.repository.getAll({
      status: [
        ConsultationStatus.PENDING,
        ConsultationStatus.ASSIGNED,
        ConsultationStatus.IN_PROGRESS,
        ConsultationStatus.AWAITING_INFO,
        ConsultationStatus.RESPONDED,
      ],
    });

    // Update SLA statuses
    const ids = activeConsultations.map((c) => c.id);
    const updated = await this.repository.updateSLAStatuses(ids);

    return {
      updatedCount: updated,
      updatedIds: ids.map((id) => id.getValue()),
      executedAt: new Date(),
    };
  }
}
