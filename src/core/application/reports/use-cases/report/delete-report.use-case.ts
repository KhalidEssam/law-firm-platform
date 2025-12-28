// ============================================
// DELETE REPORT USE CASE
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  type IReportRepository,
  REPORT_REPOSITORY,
} from '../../ports/reports.repository';

@Injectable()
export class DeleteReportUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepo: IReportRepository,
  ) {}

  async execute(_id: string): Promise<void> {
    const report = await this.reportRepo.findById(id);
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    await this.reportRepo.delete(id);
  }
}
