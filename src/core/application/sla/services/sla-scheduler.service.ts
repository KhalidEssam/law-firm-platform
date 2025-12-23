// src/core/application/sla/services/sla-scheduler.service.ts
//
// NOTE: This service requires @nestjs/schedule to be installed:
// npm install @nestjs/schedule
//
// And ScheduleModule.forRoot() to be imported in app.module.ts

import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SLAIntegrationService, RequestSLAData } from './sla-integration.service';
import {
    NotificationIntegrationService,
    type SLABreachNotificationPayload,
    type SLAAtRiskNotificationPayload,
} from '../../notification/notification-integration.service';

// ============================================
// INTERFACES
// ============================================

export interface SLAUpdateResult {
    requestId: string;
    requestType: string;
    requestNumber: string;
    previousStatus: string | null;
    newStatus: string;
    isBreached: boolean;
    isAtRisk: boolean;
    subscriberId?: string;
    providerId?: string;
}

export interface SLASchedulerReport {
    executedAt: Date;
    totalChecked: number;
    totalUpdated: number;
    breachesDetected: number;
    atRiskDetected: number;
    updates: SLAUpdateResult[];
    errors: string[];
}

// ============================================
// SLA SCHEDULER SERVICE
// ============================================

@Injectable()
export class SLASchedulerService implements OnModuleInit {
    private readonly logger = new Logger(SLASchedulerService.name);
    private isRunning = false;

    constructor(
        private readonly prisma: PrismaService,
        private readonly slaIntegration: SLAIntegrationService,
        @Optional()
        private readonly notificationService?: NotificationIntegrationService,
    ) {}

    onModuleInit() {
        this.logger.log('SLA Scheduler Service initialized');
        if (this.notificationService) {
            this.logger.log('SLA notifications enabled');
        }
    }

    // ============================================
    // SCHEDULED JOBS
    // ============================================

    /**
     * Run every 5 minutes to check and update SLA statuses.
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async handleSLAStatusCheck(): Promise<void> {
        if (this.isRunning) {
            this.logger.warn('SLA check already running, skipping...');
            return;
        }

        this.isRunning = true;
        this.logger.log('Starting scheduled SLA status check...');

        try {
            const report = await this.checkAllActiveSLAs();

            this.logger.log(
                `SLA check completed: ${report.totalChecked} checked, ${report.totalUpdated} updated, ` +
                `${report.breachesDetected} breaches, ${report.atRiskDetected} at-risk`
            );

            // Log breaches for immediate attention
            if (report.breachesDetected > 0) {
                this.logger.warn(
                    `SLA BREACHES DETECTED: ${report.breachesDetected} requests have breached SLA!`
                );
            }
        } catch (error) {
            this.logger.error(`SLA scheduled check failed: ${error.message}`, error.stack);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Run daily at midnight to generate SLA summary report.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailySLAReport(): Promise<void> {
        this.logger.log('Generating daily SLA report...');

        try {
            const report = await this.generateDailySLAReport();
            this.logger.log(`Daily SLA report generated: ${JSON.stringify(report)}`);

            // Send daily report to admins
            await this.sendDailyReportNotification(report);
        } catch (error) {
            this.logger.error(`Daily SLA report failed: ${error.message}`, error.stack);
        }
    }

    // ============================================
    // CORE CHECK LOGIC
    // ============================================

    /**
     * Check all active requests and update their SLA statuses.
     */
    async checkAllActiveSLAs(): Promise<SLASchedulerReport> {
        const report: SLASchedulerReport = {
            executedAt: new Date(),
            totalChecked: 0,
            totalUpdated: 0,
            breachesDetected: 0,
            atRiskDetected: 0,
            updates: [],
            errors: [],
        };

        // Check each request type
        const requestTypes = [
            { name: 'ConsultationRequest', checker: () => this.checkConsultationSLAs() },
            { name: 'LegalOpinionRequest', checker: () => this.checkLegalOpinionSLAs() },
            { name: 'ServiceRequest', checker: () => this.checkServiceRequestSLAs() },
            { name: 'LitigationCase', checker: () => this.checkLitigationSLAs() },
            { name: 'CallRequest', checker: () => this.checkCallRequestSLAs() },
        ];

        for (const { name, checker } of requestTypes) {
            try {
                const results = await checker();

                report.totalChecked += results.checked;
                report.totalUpdated += results.updated;
                report.breachesDetected += results.breaches;
                report.atRiskDetected += results.atRisk;
                report.updates.push(...results.updates);
            } catch (error) {
                const errorMsg = `Failed to check ${name}: ${error.message}`;
                this.logger.error(errorMsg);
                report.errors.push(errorMsg);
            }
        }

        return report;
    }

    // ============================================
    // REQUEST TYPE SPECIFIC CHECKERS
    // ============================================

    private async checkConsultationSLAs(): Promise<{
        checked: number;
        updated: number;
        breaches: number;
        atRisk: number;
        updates: SLAUpdateResult[];
    }> {
        const activeStatuses = ['pending', 'assigned', 'in_progress', 'scheduled'];

        const requests = await this.prisma.consultationRequest.findMany({
            where: {
                status: { in: activeStatuses as any },
                deletedAt: null,
                slaDeadline: { not: null },
            },
            select: {
                id: true,
                requestNumber: true,
                urgency: true,
                createdAt: true,
                respondedAt: true,
                completedAt: true,
                slaDeadline: true,
                slaStatus: true,
                subscriberId: true,
                assignedProviderId: true,
            },
        });

        return this.processRequests(
            requests.map(r => ({
                ...r,
                providerId: r.assignedProviderId,
            })),
            'consultation',
            async (id, status) => {
                await this.prisma.consultationRequest.update({
                    where: { id },
                    data: { slaStatus: status as any },
                });
            },
        );
    }

    private async checkLegalOpinionSLAs(): Promise<{
        checked: number;
        updated: number;
        breaches: number;
        atRisk: number;
        updates: SLAUpdateResult[];
    }> {
        const activeStatuses = ['pending', 'assigned', 'in_progress', 'quote_sent'];

        const requests = await this.prisma.legalOpinionRequest.findMany({
            where: {
                status: { in: activeStatuses as any },
                deletedAt: null,
                slaDeadline: { not: null },
            },
            select: {
                id: true,
                requestNumber: true,
                createdAt: true,
                completedAt: true,
                slaDeadline: true,
                slaStatus: true,
                subscriberId: true,
                assignedProviderId: true,
            },
        });

        return this.processRequests(
            requests.map(r => ({
                ...r,
                urgency: 'normal',
                respondedAt: null,
                providerId: r.assignedProviderId,
            })),
            'legal_opinion',
            async (id, status) => {
                await this.prisma.legalOpinionRequest.update({
                    where: { id },
                    data: { slaStatus: status as any },
                });
            },
        );
    }

    private async checkServiceRequestSLAs(): Promise<{
        checked: number;
        updated: number;
        breaches: number;
        atRisk: number;
        updates: SLAUpdateResult[];
    }> {
        const activeStatuses = ['pending', 'assigned', 'in_progress', 'quote_sent'];

        const requests = await this.prisma.serviceRequest.findMany({
            where: {
                status: { in: activeStatuses as any },
                deletedAt: null,
                slaDeadline: { not: null },
            },
            select: {
                id: true,
                requestNumber: true,
                createdAt: true,
                completedAt: true,
                slaDeadline: true,
                slaStatus: true,
                subscriberId: true,
                assignedProviderId: true,
            },
        });

        return this.processRequests(
            requests.map(r => ({
                ...r,
                urgency: 'normal',
                respondedAt: null,
                providerId: r.assignedProviderId,
            })),
            'service',
            async (id, status) => {
                await this.prisma.serviceRequest.update({
                    where: { id },
                    data: { slaStatus: status as any },
                });
            },
        );
    }

    private async checkLitigationSLAs(): Promise<{
        checked: number;
        updated: number;
        breaches: number;
        atRisk: number;
        updates: SLAUpdateResult[];
    }> {
        const activeStatuses = ['pending', 'assigned', 'in_progress'];

        const requests = await this.prisma.litigationCase.findMany({
            where: {
                status: { in: activeStatuses as any },
                deletedAt: null,
                slaDeadline: { not: null },
            },
            select: {
                id: true,
                caseNumber: true,
                createdAt: true,
                closedAt: true,
                slaDeadline: true,
                slaStatus: true,
                subscriberId: true,
                assignedProviderId: true,
            },
        });

        return this.processRequests(
            requests.map(r => ({
                ...r,
                requestNumber: r.caseNumber,
                urgency: 'normal',
                respondedAt: null,
                completedAt: r.closedAt,
                providerId: r.assignedProviderId,
            })),
            'litigation',
            async (id, status) => {
                await this.prisma.litigationCase.update({
                    where: { id },
                    data: { slaStatus: status as any },
                });
            },
        );
    }

    private async checkCallRequestSLAs(): Promise<{
        checked: number;
        updated: number;
        breaches: number;
        atRisk: number;
        updates: SLAUpdateResult[];
    }> {
        const activeStatuses = ['pending', 'assigned', 'scheduled'];

        const requests = await this.prisma.callRequest.findMany({
            where: {
                status: { in: activeStatuses as any },
                deletedAt: null,
                slaDeadline: { not: null },
            },
            select: {
                id: true,
                requestNumber: true,
                createdAt: true,
                completedAt: true,
                slaDeadline: true,
                slaStatus: true,
                subscriberId: true,
                assignedProviderId: true,
            },
        });

        return this.processRequests(
            requests.map(r => ({
                ...r,
                urgency: 'normal',
                respondedAt: null,
                providerId: r.assignedProviderId,
            })),
            'call',
            async (id, status) => {
                await this.prisma.callRequest.update({
                    where: { id },
                    data: { slaStatus: status as any },
                });
            },
        );
    }

    // ============================================
    // PROCESSING HELPER
    // ============================================

    private async processRequests(
        requests: Array<{
            id: string;
            requestNumber: string;
            urgency: string;
            createdAt: Date;
            respondedAt: Date | null;
            completedAt: Date | null;
            slaDeadline: Date | null;
            slaStatus: string | null;
            subscriberId: string;
            providerId: string | null;
        }>,
        requestType: string,
        updateFn: (id: string, status: string) => Promise<void>,
    ): Promise<{
        checked: number;
        updated: number;
        breaches: number;
        atRisk: number;
        updates: SLAUpdateResult[];
    }> {
        const result = {
            checked: requests.length,
            updated: 0,
            breaches: 0,
            atRisk: 0,
            updates: [] as SLAUpdateResult[],
        };

        for (const request of requests) {
            const slaData: RequestSLAData = {
                requestId: request.id,
                requestType,
                priority: request.urgency || 'normal',
                createdAt: request.createdAt,
                respondedAt: request.respondedAt || undefined,
                resolvedAt: request.completedAt || undefined,
                slaDeadline: request.slaDeadline || undefined,
                currentSlaStatus: request.slaStatus || undefined,
            };

            const checkResult = this.slaIntegration.checkSLAStatus(slaData);

            if (checkResult.hasChanged) {
                try {
                    await updateFn(request.id, checkResult.currentStatus);

                    result.updated++;
                    const updateResult: SLAUpdateResult = {
                        requestId: request.id,
                        requestType,
                        requestNumber: request.requestNumber,
                        previousStatus: checkResult.previousStatus,
                        newStatus: checkResult.currentStatus,
                        isBreached: checkResult.isBreached,
                        isAtRisk: checkResult.isAtRisk,
                        subscriberId: request.subscriberId,
                        providerId: request.providerId || undefined,
                    };
                    result.updates.push(updateResult);

                    // Trigger notifications for status changes
                    if (checkResult.isBreached) {
                        result.breaches++;
                        await this.triggerBreachNotification(request, requestType);
                    } else if (checkResult.isAtRisk) {
                        result.atRisk++;
                        await this.triggerAtRiskWarning(request, requestType);
                    }
                } catch (error) {
                    this.logger.error(
                        `Failed to update SLA status for ${requestType} ${request.id}: ${error.message}`,
                    );
                }
            }

            // Count current state even if no change
            if (checkResult.isBreached) result.breaches++;
            if (checkResult.isAtRisk) result.atRisk++;
        }

        return result;
    }

    // ============================================
    // NOTIFICATION TRIGGERS
    // ============================================

    private async triggerBreachNotification(
        request: {
            id: string;
            requestNumber: string;
            slaDeadline: Date | null;
            subscriberId: string;
            providerId: string | null;
        },
        requestType: string,
    ): Promise<void> {
        if (!this.notificationService) {
            this.logger.warn('Notification service not available for SLA breach notification');
            return;
        }

        try {
            const payload: SLABreachNotificationPayload = {
                requestId: request.id,
                requestNumber: request.requestNumber,
                requestType,
                subscriberId: request.subscriberId,
                providerId: request.providerId || undefined,
                slaDeadline: request.slaDeadline!,
                breachedAt: new Date(),
            };

            await this.notificationService.notifySLABreach(payload);
            this.logger.log(`SLA breach notification sent for ${requestType} ${request.requestNumber}`);
        } catch (error) {
            this.logger.error(`Failed to send SLA breach notification: ${error.message}`);
        }
    }

    private async triggerAtRiskWarning(
        request: {
            id: string;
            requestNumber: string;
            slaDeadline: Date | null;
            subscriberId: string;
            providerId: string | null;
        },
        requestType: string,
    ): Promise<void> {
        if (!this.notificationService) {
            this.logger.warn('Notification service not available for SLA at-risk warning');
            return;
        }

        try {
            const hoursRemaining = request.slaDeadline
                ? Math.max(0, (request.slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60))
                : 0;

            const payload: SLAAtRiskNotificationPayload = {
                requestId: request.id,
                requestNumber: request.requestNumber,
                requestType,
                subscriberId: request.subscriberId,
                providerId: request.providerId || undefined,
                slaDeadline: request.slaDeadline!,
                hoursRemaining: Math.round(hoursRemaining),
            };

            await this.notificationService.notifySLAAtRisk(payload);
            this.logger.log(`SLA at-risk warning sent for ${requestType} ${request.requestNumber}`);
        } catch (error) {
            this.logger.error(`Failed to send SLA at-risk warning: ${error.message}`);
        }
    }

    private async sendDailyReportNotification(report: {
        date: Date;
        consultations: { total: number; breached: number; atRisk: number; onTrack: number };
        legalOpinions: { total: number; breached: number; atRisk: number; onTrack: number };
        serviceRequests: { total: number; breached: number; atRisk: number; onTrack: number };
        litigationCases: { total: number; breached: number; atRisk: number; onTrack: number };
        callRequests: { total: number; breached: number; atRisk: number; onTrack: number };
    }): Promise<void> {
        if (!this.notificationService) {
            this.logger.warn('Notification service not available for daily report');
            return;
        }

        try {
            // Find admin users to send report to
            const admins = await this.prisma.user.findMany({
                where: {
                    roles: {
                        some: {
                            role: {
                                name: { in: ['admin', 'platform'] },
                            },
                        },
                    },
                    profileStatus: 'active',
                },
                select: {
                    id: true,
                    email: true,
                },
                take: 10, // Limit to first 10 admins
            });

            const totalActive =
                report.consultations.total +
                report.legalOpinions.total +
                report.serviceRequests.total +
                report.litigationCases.total +
                report.callRequests.total;

            const totalBreached =
                report.consultations.breached +
                report.legalOpinions.breached +
                report.serviceRequests.breached +
                report.litigationCases.breached +
                report.callRequests.breached;

            const totalAtRisk =
                report.consultations.atRisk +
                report.legalOpinions.atRisk +
                report.serviceRequests.atRisk +
                report.litigationCases.atRisk +
                report.callRequests.atRisk;

            const totalOnTrack =
                report.consultations.onTrack +
                report.legalOpinions.onTrack +
                report.serviceRequests.onTrack +
                report.litigationCases.onTrack +
                report.callRequests.onTrack;

            for (const admin of admins) {
                await this.notificationService.notifySLADailyReport({
                    adminUserId: admin.id,
                    adminEmail: admin.email,
                    reportDate: report.date,
                    summary: {
                        totalActive,
                        breached: totalBreached,
                        atRisk: totalAtRisk,
                        onTrack: totalOnTrack,
                    },
                    byRequestType: {
                        consultation: report.consultations,
                        legal_opinion: report.legalOpinions,
                        service: report.serviceRequests,
                        litigation: report.litigationCases,
                        call: report.callRequests,
                    },
                });
            }

            this.logger.log(`Daily SLA report sent to ${admins.length} admins`);
        } catch (error) {
            this.logger.error(`Failed to send daily SLA report: ${error.message}`);
        }
    }

    // ============================================
    // REPORTS
    // ============================================

    async generateDailySLAReport(): Promise<{
        date: Date;
        consultations: { total: number; breached: number; atRisk: number; onTrack: number };
        legalOpinions: { total: number; breached: number; atRisk: number; onTrack: number };
        serviceRequests: { total: number; breached: number; atRisk: number; onTrack: number };
        litigationCases: { total: number; breached: number; atRisk: number; onTrack: number };
        callRequests: { total: number; breached: number; atRisk: number; onTrack: number };
    }> {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const countByStatus = async (model: any) => {
            const results = await model.groupBy({
                by: ['slaStatus'],
                where: {
                    createdAt: { gte: yesterday, lt: today },
                    deletedAt: null,
                },
                _count: true,
            });

            const counts = { total: 0, breached: 0, atRisk: 0, onTrack: 0 };
            for (const row of results) {
                counts.total += row._count;
                if (row.slaStatus === 'breached') counts.breached = row._count;
                else if (row.slaStatus === 'at_risk') counts.atRisk = row._count;
                else if (row.slaStatus === 'on_track') counts.onTrack = row._count;
            }
            return counts;
        };

        return {
            date: yesterday,
            consultations: await countByStatus(this.prisma.consultationRequest),
            legalOpinions: await countByStatus(this.prisma.legalOpinionRequest),
            serviceRequests: await countByStatus(this.prisma.serviceRequest),
            litigationCases: await countByStatus(this.prisma.litigationCase),
            callRequests: await countByStatus(this.prisma.callRequest),
        };
    }

    // ============================================
    // MANUAL TRIGGER (FOR ADMIN/TESTING)
    // ============================================

    /**
     * Manually trigger SLA check (for admin endpoint or testing).
     */
    async triggerManualCheck(): Promise<SLASchedulerReport> {
        this.logger.log('Manual SLA check triggered');
        return await this.checkAllActiveSLAs();
    }
}
