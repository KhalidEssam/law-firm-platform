// ============================================
// GENERATE PERFORMANCE REPORT USE CASE
// ============================================

import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Report } from '../../../../domain/reports/entities/report.entity';
import { ReportType } from '../../../../domain/reports/value-objects/report.vo';
import {
    type IReportRepository,
    REPORT_REPOSITORY,
} from '../../ports/reports.repository';
import {
    GenerateReportDto,
    ReportResponseDto,
    PerformanceReportData,
} from '../../dto/reports.dto';

@Injectable()
export class GeneratePerformanceReportUseCase {
    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepo: IReportRepository,
        private readonly prisma: PrismaService,
    ) {}

    async execute(dto: GenerateReportDto): Promise<ReportResponseDto> {
        const report = Report.create({
            name: dto.name || `Performance Report - ${new Date().toISOString().split('T')[0]}`,
            reportType: ReportType.PERFORMANCE,
            parameters: dto.parameters,
            generatedBy: dto.generatedBy,
        });

        let savedReport = await this.reportRepo.create(report);

        try {
            savedReport.startProcessing();
            savedReport = await this.reportRepo.update(savedReport);

            const startDate = dto.parameters?.startDate
                ? new Date(dto.parameters.startDate)
                : new Date(new Date().setMonth(new Date().getMonth() - 1));
            const endDate = dto.parameters?.endDate
                ? new Date(dto.parameters.endDate)
                : new Date();

            const reportData = await this.generatePerformanceData(startDate, endDate);

            savedReport.complete(reportData as unknown as Record<string, unknown>);
            savedReport = await this.reportRepo.update(savedReport);
        } catch (error) {
            savedReport.fail(error instanceof Error ? error.message : 'Unknown error');
            savedReport = await this.reportRepo.update(savedReport);
        }

        return this.toDto(savedReport);
    }

    private async generatePerformanceData(startDate: Date, endDate: Date): Promise<PerformanceReportData> {
        // Get provider ratings
        const ratings = await this.prisma.providerReview.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                isPublic: true,
            },
            _avg: { rating: true },
        });

        // Get rating distribution
        const ratingDistribution = await this.prisma.providerReview.groupBy({
            by: ['rating'],
            _count: { id: true },
            where: {
                createdAt: { gte: startDate, lte: endDate },
                isPublic: true,
            },
        });

        const distribution: Record<string, number> = {};
        for (const r of ratingDistribution) {
            distribution[String(r.rating)] = r._count.id;
        }

        // Get request throughput
        const totalRequests = await this.prisma.consultationRequest.count({
            where: { createdAt: { gte: startDate, lte: endDate } },
        });

        const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        const requestsPerHour = hoursDiff > 0 ? totalRequests / hoursDiff : 0;

        return {
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            responseTime: {
                average: 0,
                p50: 0,
                p95: 0,
                p99: 0,
            },
            throughput: {
                requestsPerHour: Math.round(requestsPerHour * 100) / 100,
                peakHour: 'N/A',
                lowestHour: 'N/A',
            },
            providers: {
                averageRating: ratings._avg.rating || 0,
                ratingDistribution: distribution,
                responseRate: 0,
                completionRate: 0,
            },
            routing: {
                autoAssignRate: 0,
                averageAssignmentTime: 0,
                reassignmentRate: 0,
            },
        };
    }

    private toDto(report: Report): ReportResponseDto {
        const obj = report.toObject();
        return {
            id: obj.id,
            name: obj.name,
            reportType: obj.reportType,
            parameters: obj.parameters,
            generatedBy: obj.generatedBy,
            generatedAt: obj.generatedAt,
            fileUrl: obj.fileUrl,
            status: obj.status,
            resultData: obj.resultData || undefined,
            errorMessage: obj.errorMessage,
        };
    }
}
