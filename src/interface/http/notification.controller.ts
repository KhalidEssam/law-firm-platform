// ============================================
// NOTIFICATION CONTROLLER
// src/interface/http/notification.controller.ts
// ============================================

import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Use Cases - Notifications
import {
    SendNotificationUseCase,
    SendTemplatedNotificationUseCase,
    GetNotificationsUseCase,
    MarkNotificationUseCase,
    DeleteNotificationUseCase,
} from '../../core/application/notification/use-cases/notification.use-cases';

// Use Cases - Message Templates
import {
    CreateMessageTemplateUseCase,
    GetMessageTemplateUseCase,
    ListMessageTemplatesUseCase,
    UpdateMessageTemplateUseCase,
    DeleteMessageTemplateUseCase,
    RenderMessageTemplateUseCase,
} from '../../core/application/notification/use-cases/message-template.use-cases';

// Use Cases - Preferences
import {
    GetNotificationPreferencesUseCase,
    SetNotificationPreferenceUseCase,
    BulkSetNotificationPreferencesUseCase,
    InitializeNotificationPreferencesUseCase,
    DeleteNotificationPreferencesUseCase,
} from '../../core/application/notification/use-cases/notification-preference.use-cases';

import { NotificationChannel } from '../../core/domain/notification/value-objects/notification-channel.enum';
import { NotificationType } from '../../core/domain/notification/value-objects/notification-type.enum';

// ============================================
// DTOs
// ============================================

class SendNotificationDto {
    userId: string;
    type: string;
    title: string;
    titleAr?: string;
    message: string;
    messageAr?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    channels?: NotificationChannel[];
    email?: string;
}

class SendTemplatedNotificationDto {
    userId: string;
    templateCode: string;
    variables: Record<string, string>;
    relatedEntityType?: string;
    relatedEntityId?: string;
    channels?: NotificationChannel[];
    email?: string;
}

class ListNotificationsQueryDto {
    userId?: string;
    type?: string;
    isRead?: string;
    relatedEntityType?: string;
    fromDate?: string;
    toDate?: string;
    limit?: string;
    offset?: string;
    orderBy?: 'createdAt' | 'readAt';
    orderDir?: 'asc' | 'desc';
}

class CreateTemplateDto {
    code: string;
    name: string;
    channel: NotificationChannel;
    subject?: string;
    subjectAr?: string;
    body: string;
    bodyAr: string;
    variables?: Array<{
        name: string;
        description?: string;
        required: boolean;
        defaultValue?: string;
    }>;
}

class UpdateTemplateDto {
    name?: string;
    subject?: string;
    subjectAr?: string;
    body?: string;
    bodyAr?: string;
    variables?: Array<{
        name: string;
        description?: string;
        required: boolean;
        defaultValue?: string;
    }>;
    isActive?: boolean;
}

class ListTemplatesQueryDto {
    channel?: NotificationChannel;
    isActive?: string;
    search?: string;
    limit?: string;
    offset?: string;
    orderBy?: 'code' | 'name' | 'createdAt' | 'updatedAt';
    orderDir?: 'asc' | 'desc';
}

class RenderTemplateDto {
    variables: Record<string, string>;
}

class SetPreferenceDto {
    channel: NotificationChannel;
    eventType: string;
    enabled: boolean;
}

class BulkSetPreferencesDto {
    preferences: Array<{
        channel: NotificationChannel;
        eventType: string;
        enabled: boolean;
    }>;
}

// ============================================
// NOTIFICATION CONTROLLER
// ============================================

@Controller('notifications')
export class NotificationController {
    constructor(
        // Notification use cases
        private readonly sendNotificationUseCase: SendNotificationUseCase,
        private readonly sendTemplatedNotificationUseCase: SendTemplatedNotificationUseCase,
        private readonly getNotificationsUseCase: GetNotificationsUseCase,
        private readonly markNotificationUseCase: MarkNotificationUseCase,
        private readonly deleteNotificationUseCase: DeleteNotificationUseCase,
        // Template use cases
        private readonly createTemplateUseCase: CreateMessageTemplateUseCase,
        private readonly getTemplateUseCase: GetMessageTemplateUseCase,
        private readonly listTemplatesUseCase: ListMessageTemplatesUseCase,
        private readonly updateTemplateUseCase: UpdateMessageTemplateUseCase,
        private readonly deleteTemplateUseCase: DeleteMessageTemplateUseCase,
        private readonly renderTemplateUseCase: RenderMessageTemplateUseCase,
        // Preference use cases
        private readonly getPreferencesUseCase: GetNotificationPreferencesUseCase,
        private readonly setPreferenceUseCase: SetNotificationPreferenceUseCase,
        private readonly bulkSetPreferencesUseCase: BulkSetNotificationPreferencesUseCase,
        private readonly initPreferencesUseCase: InitializeNotificationPreferencesUseCase,
        private readonly deletePreferencesUseCase: DeleteNotificationPreferencesUseCase,
    ) {}

    // ============================================
    // NOTIFICATION ENDPOINTS
    // ============================================

    /**
     * Send a notification to a user
     */
    @Post()
    @UseGuards(AuthGuard('jwt'))
    async sendNotification(@Body() dto: SendNotificationDto) {
        const notification = await this.sendNotificationUseCase.execute(dto);
        return {
            success: true,
            data: this.mapNotification(notification),
        };
    }

    /**
     * Send a templated notification
     */
    @Post('templated')
    @UseGuards(AuthGuard('jwt'))
    async sendTemplatedNotification(@Body() dto: SendTemplatedNotificationDto) {
        const notification = await this.sendTemplatedNotificationUseCase.execute(dto);
        return {
            success: true,
            data: this.mapNotification(notification),
        };
    }

    /**
     * Get notification by ID
     */
    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    async getNotification(@Param('id') id: string) {
        const notification = await this.getNotificationsUseCase.byId(id);
        return {
            success: true,
            data: this.mapNotification(notification),
        };
    }

    /**
     * List notifications
     */
    @Get()
    @UseGuards(AuthGuard('jwt'))
    async listNotifications(@Query() query: ListNotificationsQueryDto) {
        const result = await this.getNotificationsUseCase.list({
            userId: query.userId,
            type: query.type,
            isRead: query.isRead === 'true' ? true : query.isRead === 'false' ? false : undefined,
            relatedEntityType: query.relatedEntityType,
            fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
            toDate: query.toDate ? new Date(query.toDate) : undefined,
            limit: query.limit ? parseInt(query.limit) : 50,
            offset: query.offset ? parseInt(query.offset) : 0,
            orderBy: query.orderBy,
            orderDir: query.orderDir,
        });

        return {
            success: true,
            data: result.notifications.map(n => this.mapNotification(n)),
            pagination: {
                total: result.total,
                limit: query.limit ? parseInt(query.limit) : 50,
                offset: query.offset ? parseInt(query.offset) : 0,
            },
        };
    }

    /**
     * Get notifications for a specific user
     */
    @Get('user/:userId')
    @UseGuards(AuthGuard('jwt'))
    async getUserNotifications(
        @Param('userId') userId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const notifications = await this.getNotificationsUseCase.forUser(userId, {
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
        });

        return {
            success: true,
            data: notifications.map(n => this.mapNotification(n)),
        };
    }

    /**
     * Get unread notifications for a user
     */
    @Get('user/:userId/unread')
    @UseGuards(AuthGuard('jwt'))
    async getUnreadNotifications(
        @Param('userId') userId: string,
        @Query('limit') limit?: string,
    ) {
        const notifications = await this.getNotificationsUseCase.unreadForUser(userId, {
            limit: limit ? parseInt(limit) : 50,
        });

        return {
            success: true,
            data: notifications.map(n => this.mapNotification(n)),
        };
    }

    /**
     * Get unread count for a user
     */
    @Get('user/:userId/unread/count')
    @UseGuards(AuthGuard('jwt'))
    async getUnreadCount(@Param('userId') userId: string) {
        const count = await this.getNotificationsUseCase.countUnread(userId);
        return {
            success: true,
            data: { unreadCount: count },
        };
    }

    /**
     * Get notification stats for a user
     */
    @Get('user/:userId/stats')
    @UseGuards(AuthGuard('jwt'))
    async getUserStats(@Param('userId') userId: string) {
        const stats = await this.getNotificationsUseCase.getStats(userId);
        return {
            success: true,
            data: stats,
        };
    }

    /**
     * Mark notification as read
     */
    @Patch(':id/read')
    @UseGuards(AuthGuard('jwt'))
    async markAsRead(@Param('id') id: string) {
        const notification = await this.markNotificationUseCase.asRead(id);
        return {
            success: true,
            data: this.mapNotification(notification),
        };
    }

    /**
     * Mark notification as unread
     */
    @Patch(':id/unread')
    @UseGuards(AuthGuard('jwt'))
    async markAsUnread(@Param('id') id: string) {
        const notification = await this.markNotificationUseCase.asUnread(id);
        return {
            success: true,
            data: this.mapNotification(notification),
        };
    }

    /**
     * Mark all notifications as read for a user
     */
    @Post('user/:userId/read-all')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async markAllAsRead(@Param('userId') userId: string) {
        const count = await this.markNotificationUseCase.allAsRead(userId);
        return {
            success: true,
            data: { markedCount: count },
        };
    }

    /**
     * Delete a notification
     */
    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteNotification(@Param('id') id: string) {
        await this.deleteNotificationUseCase.byId(id);
    }

    /**
     * Delete all notifications for a user
     */
    @Delete('user/:userId')
    @UseGuards(AuthGuard('jwt'))
    async deleteUserNotifications(@Param('userId') userId: string) {
        const count = await this.deleteNotificationUseCase.allForUser(userId);
        return {
            success: true,
            data: { deletedCount: count },
        };
    }

    // ============================================
    // MESSAGE TEMPLATE ENDPOINTS
    // ============================================

    /**
     * Create a message template (Admin only)
     */
    @Post('templates')
    @UseGuards(AuthGuard('jwt'))
    async createTemplate(@Body() dto: CreateTemplateDto) {
        const template = await this.createTemplateUseCase.execute(dto);
        return {
            success: true,
            data: this.mapTemplate(template),
        };
    }

    /**
     * Get template by ID
     */
    @Get('templates/:id')
    @UseGuards(AuthGuard('jwt'))
    async getTemplate(@Param('id') id: string) {
        const template = await this.getTemplateUseCase.byId(id);
        return {
            success: true,
            data: this.mapTemplate(template),
        };
    }

    /**
     * Get template by code
     */
    @Get('templates/code/:code')
    @UseGuards(AuthGuard('jwt'))
    async getTemplateByCode(@Param('code') code: string) {
        const template = await this.getTemplateUseCase.byCode(code);
        return {
            success: true,
            data: this.mapTemplate(template),
        };
    }

    /**
     * List templates
     */
    @Get('templates')
    @UseGuards(AuthGuard('jwt'))
    async listTemplates(@Query() query: ListTemplatesQueryDto) {
        const result = await this.listTemplatesUseCase.execute({
            channel: query.channel,
            isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
            search: query.search,
            limit: query.limit ? parseInt(query.limit) : 50,
            offset: query.offset ? parseInt(query.offset) : 0,
            orderBy: query.orderBy,
            orderDir: query.orderDir,
        });

        return {
            success: true,
            data: result.templates.map(t => this.mapTemplate(t)),
            pagination: {
                total: result.total,
                limit: query.limit ? parseInt(query.limit) : 50,
                offset: query.offset ? parseInt(query.offset) : 0,
            },
        };
    }

    /**
     * Update template
     */
    @Put('templates/:id')
    @UseGuards(AuthGuard('jwt'))
    async updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
        const template = await this.updateTemplateUseCase.execute(id, dto);
        return {
            success: true,
            data: this.mapTemplate(template),
        };
    }

    /**
     * Activate template
     */
    @Patch('templates/:id/activate')
    @UseGuards(AuthGuard('jwt'))
    async activateTemplate(@Param('id') id: string) {
        const template = await this.updateTemplateUseCase.activate(id);
        return {
            success: true,
            data: this.mapTemplate(template),
        };
    }

    /**
     * Deactivate template
     */
    @Patch('templates/:id/deactivate')
    @UseGuards(AuthGuard('jwt'))
    async deactivateTemplate(@Param('id') id: string) {
        const template = await this.updateTemplateUseCase.deactivate(id);
        return {
            success: true,
            data: this.mapTemplate(template),
        };
    }

    /**
     * Delete template
     */
    @Delete('templates/:id')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteTemplate(@Param('id') id: string) {
        await this.deleteTemplateUseCase.execute(id);
    }

    /**
     * Render/preview a template
     */
    @Post('templates/:id/render')
    @UseGuards(AuthGuard('jwt'))
    async renderTemplate(@Param('id') id: string, @Body() dto: RenderTemplateDto) {
        const rendered = await this.renderTemplateUseCase.preview(id, dto.variables);
        return {
            success: true,
            data: rendered,
        };
    }

    // ============================================
    // PREFERENCE ENDPOINTS
    // ============================================

    /**
     * Get user preferences
     */
    @Get('preferences/user/:userId')
    @UseGuards(AuthGuard('jwt'))
    async getUserPreferences(@Param('userId') userId: string) {
        const result = await this.getPreferencesUseCase.forUser(userId);
        return {
            success: true,
            data: result,
        };
    }

    /**
     * Get preferences by channel
     */
    @Get('preferences/user/:userId/channel/:channel')
    @UseGuards(AuthGuard('jwt'))
    async getUserChannelPreferences(
        @Param('userId') userId: string,
        @Param('channel') channel: NotificationChannel,
    ) {
        const prefs = await this.getPreferencesUseCase.forUserAndChannel(userId, channel);
        return {
            success: true,
            data: prefs.map(p => ({
                id: p.id,
                channel: p.channel,
                eventType: p.eventType,
                enabled: p.enabled,
            })),
        };
    }

    /**
     * Check if notification is enabled
     */
    @Get('preferences/user/:userId/check')
    @UseGuards(AuthGuard('jwt'))
    async checkPreference(
        @Param('userId') userId: string,
        @Query('channel') channel: NotificationChannel,
        @Query('eventType') eventType: string,
    ) {
        const enabled = await this.getPreferencesUseCase.isEnabled(userId, channel, eventType);
        return {
            success: true,
            data: { enabled },
        };
    }

    /**
     * Get enabled channels for an event type
     */
    @Get('preferences/user/:userId/channels-for-event')
    @UseGuards(AuthGuard('jwt'))
    async getEnabledChannels(
        @Param('userId') userId: string,
        @Query('eventType') eventType: string,
    ) {
        const channels = await this.getPreferencesUseCase.getEnabledChannelsForEvent(userId, eventType);
        return {
            success: true,
            data: { channels },
        };
    }

    /**
     * Set a single preference
     */
    @Post('preferences/user/:userId')
    @UseGuards(AuthGuard('jwt'))
    async setPreference(@Param('userId') userId: string, @Body() dto: SetPreferenceDto) {
        const pref = await this.setPreferenceUseCase.execute({
            userId,
            channel: dto.channel,
            eventType: dto.eventType,
            enabled: dto.enabled,
        });
        return {
            success: true,
            data: {
                id: pref.id,
                channel: pref.channel,
                eventType: pref.eventType,
                enabled: pref.enabled,
            },
        };
    }

    /**
     * Bulk set preferences
     */
    @Put('preferences/user/:userId')
    @UseGuards(AuthGuard('jwt'))
    async bulkSetPreferences(@Param('userId') userId: string, @Body() dto: BulkSetPreferencesDto) {
        const prefs = await this.bulkSetPreferencesUseCase.execute({
            userId,
            preferences: dto.preferences,
        });
        return {
            success: true,
            data: prefs.map(p => ({
                id: p.id,
                channel: p.channel,
                eventType: p.eventType,
                enabled: p.enabled,
            })),
        };
    }

    /**
     * Enable all for a channel
     */
    @Post('preferences/user/:userId/channel/:channel/enable-all')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async enableAllForChannel(
        @Param('userId') userId: string,
        @Param('channel') channel: NotificationChannel,
    ) {
        await this.bulkSetPreferencesUseCase.enableAllForChannel(userId, channel);
        return { success: true };
    }

    /**
     * Disable all for a channel
     */
    @Post('preferences/user/:userId/channel/:channel/disable-all')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async disableAllForChannel(
        @Param('userId') userId: string,
        @Param('channel') channel: NotificationChannel,
    ) {
        await this.bulkSetPreferencesUseCase.disableAllForChannel(userId, channel);
        return { success: true };
    }

    /**
     * Initialize default preferences for user
     */
    @Post('preferences/user/:userId/initialize')
    @UseGuards(AuthGuard('jwt'))
    async initializePreferences(@Param('userId') userId: string) {
        const prefs = await this.initPreferencesUseCase.forUser(userId);
        return {
            success: true,
            data: prefs.map(p => ({
                id: p.id,
                channel: p.channel,
                eventType: p.eventType,
                enabled: p.enabled,
            })),
        };
    }

    /**
     * Reset preferences to defaults
     */
    @Post('preferences/user/:userId/reset')
    @UseGuards(AuthGuard('jwt'))
    async resetPreferences(@Param('userId') userId: string) {
        const prefs = await this.initPreferencesUseCase.resetToDefaults(userId);
        return {
            success: true,
            data: prefs.map(p => ({
                id: p.id,
                channel: p.channel,
                eventType: p.eventType,
                enabled: p.enabled,
            })),
        };
    }

    /**
     * Delete all preferences for user
     */
    @Delete('preferences/user/:userId')
    @UseGuards(AuthGuard('jwt'))
    async deleteUserPreferences(@Param('userId') userId: string) {
        const count = await this.deletePreferencesUseCase.forUser(userId);
        return {
            success: true,
            data: { deletedCount: count },
        };
    }

    // ============================================
    // HELPERS
    // ============================================

    private mapNotification(n: any) {
        return {
            id: n.id,
            userId: n.userId,
            type: n.type,
            title: n.title,
            titleAr: n.titleAr,
            message: n.message,
            messageAr: n.messageAr,
            relatedEntityType: n.relatedEntityType,
            relatedEntityId: n.relatedEntityId,
            isRead: n.isRead,
            readAt: n.readAt,
            createdAt: n.createdAt,
        };
    }

    private mapTemplate(t: any) {
        return {
            id: t.id,
            code: t.code,
            name: t.name,
            channel: t.channel,
            subject: t.subject,
            subjectAr: t.subjectAr,
            body: t.body,
            bodyAr: t.bodyAr,
            variables: t.variables?.toJSON?.() ?? t.variables,
            isActive: t.isActive,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
        };
    }
}
