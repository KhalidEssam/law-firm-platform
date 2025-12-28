// ============================================
// LIST METRIC NAMES USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import {
  type IAnalyticsMetricRepository,
  ANALYTICS_METRIC_REPOSITORY,
} from '../../ports/reports.repository';

@Injectable()
export class ListMetricNamesUseCase {
  constructor(
    @Inject(ANALYTICS_METRIC_REPOSITORY)
    private readonly metricRepo: IAnalyticsMetricRepository,
  ) {}

  async execute(): Promise<string[]> {
    return this.metricRepo.getDistinctMetricNames();
  }
}
