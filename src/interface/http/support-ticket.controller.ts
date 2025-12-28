// ============================================
// SUPPORT TICKET CONTROLLER
// src/interface/http/support-ticket.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Permissions } from '../../auth/permissions.decorator';

// ============================================
// USE CASES
// ============================================
import {
  CreateSupportTicketUseCase,
  GetSupportTicketByIdUseCase,
  GetSupportTicketByNumberUseCase,
  ListSupportTicketsUseCase,
  GetUserSupportTicketsUseCase,
  GetAssignedTicketsUseCase,
  AssignTicketUseCase,
  StartTicketProgressUseCase,
  ResolveTicketUseCase,
  CloseTicketUseCase,
  ReopenTicketUseCase,
  UpdateTicketPriorityUseCase,
  UpdateTicketDetailsUseCase,
  GetOpenTicketsUseCase,
  GetActiveTicketsUseCase,
  GetUnassignedTicketsUseCase,
  GetHighPriorityTicketsUseCase,
  GetOverdueTicketsUseCase,
  GetTicketsRequiringAttentionUseCase,
  GetTicketsByCategoryUseCase,
  GetSupportTicketStatisticsUseCase,
  GetAgentWorkloadUseCase,
  DeleteSupportTicketUseCase,
} from '../../core/application/support-ticket/use-cases/support-ticket.use-cases';

// ============================================
// DTOs
// ============================================
import {
  CreateSupportTicketDto,
  UpdateSupportTicketDto,
  AssignTicketDto,
  UpdateTicketPriorityDto,
  ListSupportTicketsQueryDto,
  SupportTicketResponseDto,
  SupportTicketListResponseDto,
  SupportTicketStatisticsResponseDto,
  AgentWorkloadResponseDto,
} from '../../core/application/support-ticket/dto/support-ticket.dto';

@Controller('support-tickets')
export class SupportTicketController {
  constructor(
    private readonly createTicketUseCase: CreateSupportTicketUseCase,
    private readonly getTicketByIdUseCase: GetSupportTicketByIdUseCase,
    private readonly getTicketByNumberUseCase: GetSupportTicketByNumberUseCase,
    private readonly listTicketsUseCase: ListSupportTicketsUseCase,
    private readonly getUserTicketsUseCase: GetUserSupportTicketsUseCase,
    private readonly getAssignedTicketsUseCase: GetAssignedTicketsUseCase,
    private readonly assignTicketUseCase: AssignTicketUseCase,
    private readonly startProgressUseCase: StartTicketProgressUseCase,
    private readonly resolveTicketUseCase: ResolveTicketUseCase,
    private readonly closeTicketUseCase: CloseTicketUseCase,
    private readonly reopenTicketUseCase: ReopenTicketUseCase,
    private readonly updatePriorityUseCase: UpdateTicketPriorityUseCase,
    private readonly updateDetailsUseCase: UpdateTicketDetailsUseCase,
    private readonly getOpenTicketsUseCase: GetOpenTicketsUseCase,
    private readonly getActiveTicketsUseCase: GetActiveTicketsUseCase,
    private readonly getUnassignedTicketsUseCase: GetUnassignedTicketsUseCase,
    private readonly getHighPriorityTicketsUseCase: GetHighPriorityTicketsUseCase,
    private readonly getOverdueTicketsUseCase: GetOverdueTicketsUseCase,
    private readonly getTicketsRequiringAttentionUseCase: GetTicketsRequiringAttentionUseCase,
    private readonly getTicketsByCategoryUseCase: GetTicketsByCategoryUseCase,
    private readonly getStatisticsUseCase: GetSupportTicketStatisticsUseCase,
    private readonly getAgentWorkloadUseCase: GetAgentWorkloadUseCase,
    private readonly deleteTicketUseCase: DeleteSupportTicketUseCase,
  ) {}

  // ============================================
  // CREATE TICKET
  // ============================================
  @Post()
  @Roles('user', 'partner', 'platform', 'system admin')
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @Body() dto: CreateSupportTicketDto,
  ): Promise<{ ticket: SupportTicketResponseDto }> {
    const ticket = await this.createTicketUseCase.execute(dto);
    return { ticket: this.mapToResponse(ticket) };
  }

  // ============================================
  // LIST & SEARCH ENDPOINTS
  // ============================================
  @Get()
  @Roles('system admin', 'platform')
  @Permissions('read:support-tickets')
  async listTickets(
    @Query() query: ListSupportTicketsQueryDto,
  ): Promise<SupportTicketListResponseDto> {
    const result = await this.listTicketsUseCase.execute(query);
    return {
      tickets: result.tickets.map((t) => this.mapToResponse(t)),
      total: result.total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };
  }

  @Get('open')
  @Roles('system admin', 'platform')
  @Permissions('read:support-tickets')
  async getOpenTickets(): Promise<{ tickets: SupportTicketResponseDto[] }> {
    const tickets = await this.getOpenTicketsUseCase.execute();
    return { tickets: tickets.map((t) => this.mapToResponse(t)) };
  }

  @Get('active')
  @Roles('system admin', 'platform')
  @Permissions('read:support-tickets')
  async getActiveTickets(): Promise<{ tickets: SupportTicketResponseDto[] }> {
    const tickets = await this.getActiveTicketsUseCase.execute();
    return { tickets: tickets.map((t) => this.mapToResponse(t)) };
  }

  @Get('unassigned')
  @Roles('system admin', 'platform')
  @Permissions('read:support-tickets')
  async getUnassignedTickets(): Promise<{
    tickets: SupportTicketResponseDto[];
  }> {
    const tickets = await this.getUnassignedTicketsUseCase.execute();
    return { tickets: tickets.map((t) => this.mapToResponse(t)) };
  }

  @Get('high-priority')
  @Roles('system admin', 'platform')
  @Permissions('read:support-tickets')
  async getHighPriorityTickets(): Promise<{
    tickets: SupportTicketResponseDto[];
  }> {
    const tickets = await this.getHighPriorityTicketsUseCase.execute();
    return { tickets: tickets.map((t) => this.mapToResponse(t)) };
  }

  @Get('overdue')
  @Roles('system admin', 'platform')
  @Permissions('read:support-tickets')
  async getOverdueTickets(
    @Query('maxAgeDays') maxAgeDays?: number,
  ): Promise<{ tickets: SupportTicketResponseDto[] }> {
    const tickets = await this.getOverdueTicketsUseCase.execute(maxAgeDays);
    return { tickets: tickets.map((t) => this.mapToResponse(t)) };
  }

  @Get('requiring-attention')
  @Roles('system admin', 'platform')
  @Permissions('read:support-tickets')
  async getTicketsRequiringAttention(): Promise<{
    tickets: SupportTicketResponseDto[];
  }> {
    const tickets = await this.getTicketsRequiringAttentionUseCase.execute();
    return { tickets: tickets.map((t) => this.mapToResponse(t)) };
  }

  @Get('statistics')
  @Roles('system admin', 'platform')
  @Permissions('read:support-tickets')
  async getStatistics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<{ statistics: SupportTicketStatisticsResponseDto }> {
    const statistics = await this.getStatisticsUseCase.execute(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
    return { statistics };
  }

  @Get('category/:category')
  @Roles('system admin', 'platform')
  @Permissions('read:support-tickets')
  async getTicketsByCategory(
    @Param('category') category: string,
  ): Promise<{ tickets: SupportTicketResponseDto[] }> {
    const tickets = await this.getTicketsByCategoryUseCase.execute(category);
    return { tickets: tickets.map((t) => this.mapToResponse(t)) };
  }

  @Get('number/:ticketNumber')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getTicketByNumber(
    @Param('ticketNumber') ticketNumber: string,
  ): Promise<{ ticket: SupportTicketResponseDto }> {
    const ticket = await this.getTicketByNumberUseCase.execute(ticketNumber);
    return { ticket: this.mapToResponse(ticket) };
  }

  @Get('user/:userId')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getUserTickets(
    @Param('userId') userId: string,
  ): Promise<{ tickets: SupportTicketResponseDto[] }> {
    const tickets = await this.getUserTicketsUseCase.execute(userId);
    return { tickets: tickets.map((t) => this.mapToResponse(t)) };
  }

  @Get('assigned/:agentId')
  @Roles('partner', 'platform', 'system admin')
  @Permissions('read:support-tickets')
  async getAssignedTickets(
    @Param('agentId') agentId: string,
  ): Promise<{ tickets: SupportTicketResponseDto[] }> {
    const tickets = await this.getAssignedTicketsUseCase.execute(agentId);
    return { tickets: tickets.map((t) => this.mapToResponse(t)) };
  }

  @Get('agent/:agentId/workload')
  @Roles('partner', 'platform', 'system admin')
  @Permissions('read:support-tickets')
  async getAgentWorkload(
    @Param('agentId') agentId: string,
  ): Promise<{ workload: AgentWorkloadResponseDto }> {
    const workload = await this.getAgentWorkloadUseCase.execute(agentId);
    return {
      workload: {
        assignedTo: agentId,
        ...workload,
      },
    };
  }

  @Get(':id')
  @Roles('user', 'partner', 'platform', 'system admin')
  async getTicketById(
    @Param('id') id: string,
  ): Promise<{ ticket: SupportTicketResponseDto }> {
    const ticket = await this.getTicketByIdUseCase.execute(id);
    return { ticket: this.mapToResponse(ticket) };
  }

  // ============================================
  // WORKFLOW ENDPOINTS
  // ============================================
  @Patch(':id/assign')
  @Roles('system admin', 'platform')
  @Permissions('update:support-tickets')
  async assignTicket(
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
  ): Promise<{ ticket: SupportTicketResponseDto }> {
    const ticket = await this.assignTicketUseCase.execute(id, dto);
    return { ticket: this.mapToResponse(ticket) };
  }

  @Patch(':id/start-progress')
  @Roles('partner', 'platform', 'system admin')
  @Permissions('update:support-tickets')
  async startProgress(
    @Param('id') id: string,
  ): Promise<{ ticket: SupportTicketResponseDto }> {
    const ticket = await this.startProgressUseCase.execute(id);
    return { ticket: this.mapToResponse(ticket) };
  }

  @Patch(':id/resolve')
  @Roles('partner', 'platform', 'system admin')
  @Permissions('update:support-tickets')
  async resolveTicket(
    @Param('id') id: string,
  ): Promise<{ ticket: SupportTicketResponseDto }> {
    const ticket = await this.resolveTicketUseCase.execute(id);
    return { ticket: this.mapToResponse(ticket) };
  }

  @Patch(':id/close')
  @Roles('system admin', 'platform')
  @Permissions('update:support-tickets')
  async closeTicket(
    @Param('id') id: string,
  ): Promise<{ ticket: SupportTicketResponseDto }> {
    const ticket = await this.closeTicketUseCase.execute(id);
    return { ticket: this.mapToResponse(ticket) };
  }

  @Patch(':id/reopen')
  @Roles('user', 'partner', 'platform', 'system admin')
  async reopenTicket(
    @Param('id') id: string,
  ): Promise<{ ticket: SupportTicketResponseDto }> {
    const ticket = await this.reopenTicketUseCase.execute(id);
    return { ticket: this.mapToResponse(ticket) };
  }

  @Patch(':id/priority')
  @Roles('system admin', 'platform')
  @Permissions('update:support-tickets')
  async updatePriority(
    @Param('id') id: string,
    @Body() dto: UpdateTicketPriorityDto,
  ): Promise<{ ticket: SupportTicketResponseDto }> {
    const ticket = await this.updatePriorityUseCase.execute(id, dto);
    return { ticket: this.mapToResponse(ticket) };
  }

  @Patch(':id')
  @Roles('user', 'partner', 'platform', 'system admin')
  async updateTicketDetails(
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketDto,
  ): Promise<{ ticket: SupportTicketResponseDto }> {
    const ticket = await this.updateDetailsUseCase.execute(id, dto);
    return { ticket: this.mapToResponse(ticket) };
  }

  // ============================================
  // DELETE ENDPOINT
  // ============================================
  @Delete(':id')
  @Roles('system admin')
  @Permissions('delete:support-tickets')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTicket(@Param('id') id: string): Promise<void> {
    await this.deleteTicketUseCase.execute(id);
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  private mapToResponse(ticket: any): SupportTicketResponseDto {
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subscriberId: ticket.subscriberId,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category.getValue(),
      priority: ticket.priority.getValue(),
      status: ticket.status.getValue(),
      assignedTo: ticket.assignedTo,
      resolvedAt: ticket.resolvedAt?.toISOString(),
      isAssigned: ticket.isAssigned(),
      isOverdue: ticket.isOverdue(),
      ageInDays: ticket.getAgeInDays(),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }
}
