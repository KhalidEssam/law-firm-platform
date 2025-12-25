// src/infrastructure/modules/reports.module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

// Controllers
import {
    ReportsController,
    AnalyticsController,
    DashboardController,
} from '../../interface/http/reports.controller';

// Repository Implementations
import {
    PrismaReportRepository,
    PrismaAnalyticsMetricRepository,
} from '../persistence/reports/prisma-reports.repository';
import { PrismaReportDataProvider } from '../persistence/reports/prisma-report-data-provider';

// Repository Tokens
import {
    REPORT_REPOSITORY,
    ANALYTICS_METRIC_REPOSITORY,
} from '../../core/application/reports/ports/reports.repository';
import { REPORT_DATA_PROVIDER } from '../../core/application/reports/ports/report-data-provider';

// Report Generation Use Cases
import {
    CreateReportUseCase,
    GetReportByIdUseCase,
    ListReportsUseCase,
    DeleteReportUseCase,
    GenerateFinancialReportUseCase,
    GenerateOperationalReportUseCase,
    GeneratePerformanceReportUseCase,
    GenerateComplianceReportUseCase,
    GetReportStatisticsUseCase,
} from '../../core/application/reports/use-cases/report-generation.use-cases';

// Analytics Metrics Use Cases
import {
    RecordMetricUseCase,
    RecordMetricBatchUseCase,
    QueryMetricsUseCase,
    AggregateMetricsUseCase,
    GetTimeSeriesUseCase,
    GetMetricSummaryUseCase,
    ListMetricNamesUseCase,
    DeleteOldMetricsUseCase,
    RecordCommonMetricsService,
} from '../../core/application/reports/use-cases/analytics-metrics.use-cases';

@Module({
    imports: [PrismaModule],
    controllers: [
        ReportsController,
        AnalyticsController,
        DashboardController,
    ],
    providers: [
        // ============================================
        // REPOSITORIES & DATA PROVIDERS
        // ============================================
        {
            provide: REPORT_REPOSITORY,
            useClass: PrismaReportRepository,
        },
        {
            provide: ANALYTICS_METRIC_REPOSITORY,
            useClass: PrismaAnalyticsMetricRepository,
        },
        {
            provide: REPORT_DATA_PROVIDER,
            useClass: PrismaReportDataProvider,
        },

        // ============================================
        // REPORT GENERATION USE CASES
        // ============================================
        CreateReportUseCase,
        GetReportByIdUseCase,
        ListReportsUseCase,
        DeleteReportUseCase,
        GenerateFinancialReportUseCase,
        GenerateOperationalReportUseCase,
        GeneratePerformanceReportUseCase,
        GenerateComplianceReportUseCase,
        GetReportStatisticsUseCase,

        // ============================================
        // ANALYTICS METRICS USE CASES
        // ============================================
        RecordMetricUseCase,
        RecordMetricBatchUseCase,
        QueryMetricsUseCase,
        AggregateMetricsUseCase,
        GetTimeSeriesUseCase,
        GetMetricSummaryUseCase,
        ListMetricNamesUseCase,
        DeleteOldMetricsUseCase,

        // ============================================
        // SERVICES
        // ============================================
        RecordCommonMetricsService,
    ],
    exports: [
        // Export repositories for use in other modules
        REPORT_REPOSITORY,
        ANALYTICS_METRIC_REPOSITORY,

        // Export use cases for integration
        RecordMetricUseCase,
        RecordMetricBatchUseCase,
        RecordCommonMetricsService,

        // Export report generation for job scheduling
        GenerateFinancialReportUseCase,
        GenerateOperationalReportUseCase,
        GeneratePerformanceReportUseCase,
        GenerateComplianceReportUseCase,
    ],
})
export class ReportsModule {}
