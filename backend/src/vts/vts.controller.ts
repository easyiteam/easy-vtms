import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { VtsService, CreateMessageDto, MessageFilters } from './vts.service';
import { MessageType, MessagePriority, MessageStatus } from './entities/vts-message.entity';

@Controller('api/vts')
export class VtsController {
  constructor(private readonly vtsService: VtsService) {}

  /**
   * POST /api/vts/messages
   * Create a new message
   */
  @Post('messages')
  async createMessage(@Body() dto: CreateMessageDto) {
    return this.vtsService.createMessage(dto);
  }

  /**
   * POST /api/vts/messages/from-template
   * Create message from template
   */
  @Post('messages/from-template')
  async createMessageFromTemplate(
    @Body() body: {
      templateId: string;
      data: Record<string, any>;
      sender: { type: string; name?: string; mmsi?: string };
      recipient: { type: string; name?: string; mmsi?: string };
    },
  ) {
    return this.vtsService.createMessageFromTemplate(
      body.templateId,
      body.data,
      body.sender,
      body.recipient,
    );
  }

  /**
   * GET /api/vts/messages
   * Get all messages with optional filters
   */
  @Get('messages')
  async getMessages(
    @Query('mmsi') mmsi?: string,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('senderType') senderType?: string,
    @Query('recipientType') recipientType?: string,
  ) {
    const filters: MessageFilters = {};

    if (mmsi) filters.mmsi = mmsi;
    if (type) filters.type = type as MessageType;
    if (priority) filters.priority = priority as MessagePriority;
    if (status) filters.status = status as MessageStatus;
    if (senderType) filters.senderType = senderType;
    if (recipientType) filters.recipientType = recipientType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    if (mmsi) {
      return this.vtsService.getMessagesForVessel(mmsi, filters);
    }

    return this.vtsService.getMessages(filters);
  }

  /**
   * GET /api/vts/messages/:id
   * Get message by ID
   */
  @Get('messages/:id')
  async getMessage(@Param('id') id: string) {
    return this.vtsService.getMessage(id);
  }

  /**
   * PUT /api/vts/messages/:id/send
   * Send a message
   */
  @Put('messages/:id/send')
  async sendMessage(@Param('id') id: string) {
    return this.vtsService.sendMessage(id);
  }

  /**
   * PUT /api/vts/messages/:id/read
   * Mark message as read
   */
  @Put('messages/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.vtsService.markAsRead(id);
  }

  /**
   * PUT /api/vts/messages/:id/acknowledge
   * Acknowledge message
   */
  @Put('messages/:id/acknowledge')
  async acknowledgeMessage(@Param('id') id: string) {
    return this.vtsService.acknowledgeMessage(id);
  }

  /**
   * DELETE /api/vts/messages/:id
   * Delete message
   */
  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string) {
    await this.vtsService.deleteMessage(id);
    return { success: true };
  }

  /**
   * GET /api/vts/templates
   * Get all templates
   */
  @Get('templates')
  async getTemplates(@Query('category') category?: string) {
    return this.vtsService.getTemplates(category);
  }

  /**
   * GET /api/vts/templates/:id
   * Get template by ID
   */
  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.vtsService.getTemplate(id);
  }

  /**
   * POST /api/vts/templates
   * Create custom template
   */
  @Post('templates')
  async createTemplate(@Body() data: any) {
    return this.vtsService.createTemplate(data);
  }

  /**
   * GET /api/vts/statistics
   * Get message statistics
   */
  @Get('statistics')
  async getStatistics(@Query('mmsi') mmsi?: string) {
    return this.vtsService.getMessageStatistics(mmsi);
  }
}
