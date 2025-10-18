import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { VtsMessage, MessageType, MessagePriority, MessageStatus } from './entities/vts-message.entity';
import { MessageTemplate } from './entities/message-template.entity';

export interface CreateMessageDto {
  type: MessageType;
  priority: MessagePriority;
  subject: string;
  content: string;
  senderType: 'vts' | 'vessel' | 'port' | 'system';
  senderName?: string;
  senderMmsi?: string;
  recipientType: 'vts' | 'vessel' | 'port' | 'broadcast';
  recipientName?: string;
  recipientMmsi?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
  expiresAt?: Date;
}

export interface MessageFilters {
  mmsi?: string;
  type?: MessageType;
  priority?: MessagePriority;
  status?: MessageStatus;
  startDate?: Date;
  endDate?: Date;
  senderType?: string;
  recipientType?: string;
}

@Injectable()
export class VtsService {
  constructor(
    @InjectRepository(VtsMessage)
    private messageRepository: Repository<VtsMessage>,
    @InjectRepository(MessageTemplate)
    private templateRepository: Repository<MessageTemplate>,
  ) {
    this.initializeStandardTemplates();
  }

  /**
   * Create a new VTS message
   */
  async createMessage(dto: CreateMessageDto): Promise<VtsMessage> {
    const message = this.messageRepository.create({
      ...dto,
      status: MessageStatus.DRAFT,
    });

    return this.messageRepository.save(message);
  }

  /**
   * Create message from template
   */
  async createMessageFromTemplate(
    templateId: string,
    data: Record<string, any>,
    sender: { type: string; name?: string; mmsi?: string },
    recipient: { type: string; name?: string; mmsi?: string },
  ): Promise<VtsMessage> {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Replace template variables
    const subject = this.replaceTemplateVariables(template.subjectTemplate, data);
    const content = this.replaceTemplateVariables(template.contentTemplate, data);

    const message = this.messageRepository.create({
      type: template.type,
      priority: template.priority,
      subject,
      content,
      senderType: sender.type as any,
      senderName: sender.name,
      senderMmsi: sender.mmsi,
      recipientType: recipient.type as any,
      recipientName: recipient.name,
      recipientMmsi: recipient.mmsi,
      templateId: template.id,
      templateData: data,
      status: MessageStatus.DRAFT,
    });

    // Update template usage
    template.usageCount++;
    template.lastUsedAt = new Date();
    await this.templateRepository.save(template);

    return this.messageRepository.save(message);
  }

  /**
   * Send a message
   */
  async sendMessage(messageId: string): Promise<VtsMessage> {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.status !== MessageStatus.DRAFT) {
      throw new BadRequestException('Only draft messages can be sent');
    }

    message.status = MessageStatus.SENT;
    message.deliveredAt = new Date();

    return this.messageRepository.save(message);
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<VtsMessage> {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.status === MessageStatus.SENT || message.status === MessageStatus.DELIVERED) {
      message.status = MessageStatus.READ;
      message.readAt = new Date();
    }

    return this.messageRepository.save(message);
  }

  /**
   * Acknowledge message
   */
  async acknowledgeMessage(messageId: string): Promise<VtsMessage> {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.status = MessageStatus.ACKNOWLEDGED;
    message.acknowledgedAt = new Date();

    return this.messageRepository.save(message);
  }

  /**
   * Get messages for a vessel
   */
  async getMessagesForVessel(mmsi: string, filters?: MessageFilters): Promise<VtsMessage[]> {
    const query = this.messageRepository.createQueryBuilder('message');

    query.where('(message.recipientMmsi = :mmsi OR message.recipientType = :broadcast)', {
      mmsi,
      broadcast: 'broadcast',
    });

    if (filters?.type) {
      query.andWhere('message.type = :type', { type: filters.type });
    }

    if (filters?.priority) {
      query.andWhere('message.priority = :priority', { priority: filters.priority });
    }

    if (filters?.status) {
      query.andWhere('message.status = :status', { status: filters.status });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('message.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    query.orderBy('message.createdAt', 'DESC');

    return query.getMany();
  }

  /**
   * Get all messages with filters
   */
  async getMessages(filters?: MessageFilters): Promise<VtsMessage[]> {
    const where: any = {};

    if (filters?.mmsi) {
      // This will be handled in a more complex query
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.senderType) {
      where.senderType = filters.senderType;
    }

    if (filters?.recipientType) {
      where.recipientType = filters.recipientType;
    }

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    }

    return this.messageRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * Get message by ID
   */
  async getMessage(id: string): Promise<VtsMessage> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  /**
   * Delete message
   */
  async deleteMessage(id: string): Promise<void> {
    const result = await this.messageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Message not found');
    }
  }

  /**
   * Get all templates
   */
  async getTemplates(category?: string): Promise<MessageTemplate[]> {
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }

    return this.templateRepository.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  /**
   * Create custom template
   */
  async createTemplate(data: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const template = this.templateRepository.create({
      ...data,
      isStandard: false,
    });

    return this.templateRepository.save(template);
  }

  /**
   * Get message statistics
   */
  async getMessageStatistics(mmsi?: string): Promise<any> {
    const query = this.messageRepository.createQueryBuilder('message');

    if (mmsi) {
      query.where('(message.recipientMmsi = :mmsi OR message.senderMmsi = :mmsi)', { mmsi });
    }

    const [total, sent, delivered, read, acknowledged] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('message.status = :status', { status: MessageStatus.SENT }).getCount(),
      query.clone().andWhere('message.status = :status', { status: MessageStatus.DELIVERED }).getCount(),
      query.clone().andWhere('message.status = :status', { status: MessageStatus.READ }).getCount(),
      query.clone().andWhere('message.status = :status', { status: MessageStatus.ACKNOWLEDGED }).getCount(),
    ]);

    const byType = await query
      .clone()
      .select('message.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('message.type')
      .getRawMany();

    const byPriority = await query
      .clone()
      .select('message.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('message.priority')
      .getRawMany();

    return {
      total,
      byStatus: {
        sent,
        delivered,
        read,
        acknowledged,
      },
      byType: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }

  /**
   * Replace template variables with actual values
   */
  private replaceTemplateVariables(template: string, data: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  /**
   * Initialize standard message templates
   */
  private async initializeStandardTemplates(): Promise<void> {
    const standardTemplates = [
      {
        code: 'VTS_CLEARANCE_ENTRY',
        name: 'Entry Clearance',
        description: 'Clearance for vessel to enter port area',
        type: MessageType.CLEARANCE,
        priority: MessagePriority.NORMAL,
        category: 'clearance',
        subjectTemplate: 'Entry Clearance - {{vesselName}}',
        contentTemplate: 'Vessel {{vesselName}} (MMSI: {{mmsi}}) is cleared to enter port area via {{channel}}. Proceed to berth {{berth}}. ETA: {{eta}}.',
        variables: [
          { name: 'vesselName', label: 'Vessel Name', type: 'text' as const, required: true },
          { name: 'mmsi', label: 'MMSI', type: 'text' as const, required: true },
          { name: 'channel', label: 'Channel', type: 'text' as const, required: true },
          { name: 'berth', label: 'Berth', type: 'text' as const, required: true },
          { name: 'eta', label: 'ETA', type: 'date' as const, required: true },
        ],
      },
      {
        code: 'VTS_SPEED_RESTRICTION',
        name: 'Speed Restriction',
        description: 'Speed restriction notice',
        type: MessageType.INSTRUCTION,
        priority: MessagePriority.HIGH,
        category: 'safety',
        subjectTemplate: 'Speed Restriction - {{area}}',
        contentTemplate: 'All vessels in {{area}} are required to reduce speed to maximum {{maxSpeed}} knots. Reason: {{reason}}. Effective until {{endTime}}.',
        variables: [
          { name: 'area', label: 'Area', type: 'text' as const, required: true },
          { name: 'maxSpeed', label: 'Max Speed (knots)', type: 'number' as const, required: true },
          { name: 'reason', label: 'Reason', type: 'text' as const, required: true },
          { name: 'endTime', label: 'End Time', type: 'date' as const, required: true },
        ],
      },
      {
        code: 'VTS_WEATHER_WARNING',
        name: 'Weather Warning',
        description: 'Weather warning for vessels',
        type: MessageType.WARNING,
        priority: MessagePriority.HIGH,
        category: 'weather',
        subjectTemplate: 'Weather Warning - {{condition}}',
        contentTemplate: 'Weather warning issued for {{area}}. {{condition}} expected. Wind: {{windSpeed}} knots from {{windDirection}}. Visibility: {{visibility}} NM. Recommendation: {{recommendation}}.',
        variables: [
          { name: 'area', label: 'Area', type: 'text' as const, required: true },
          { name: 'condition', label: 'Condition', type: 'text' as const, required: true },
          { name: 'windSpeed', label: 'Wind Speed (knots)', type: 'number' as const, required: true },
          { name: 'windDirection', label: 'Wind Direction', type: 'text' as const, required: true },
          { name: 'visibility', label: 'Visibility (NM)', type: 'number' as const, required: true },
          { name: 'recommendation', label: 'Recommendation', type: 'text' as const, required: true },
        ],
      },
      {
        code: 'VTS_TRAFFIC_INFO',
        name: 'Traffic Information',
        description: 'Traffic information for vessels',
        type: MessageType.INFORMATION,
        priority: MessagePriority.NORMAL,
        category: 'traffic',
        subjectTemplate: 'Traffic Information - {{area}}',
        contentTemplate: 'Traffic update for {{area}}: {{vesselCount}} vessels currently in area. {{additionalInfo}}',
        variables: [
          { name: 'area', label: 'Area', type: 'text' as const, required: true },
          { name: 'vesselCount', label: 'Vessel Count', type: 'number' as const, required: true },
          { name: 'additionalInfo', label: 'Additional Information', type: 'text' as const, required: false },
        ],
      },
      {
        code: 'VTS_EMERGENCY_ALERT',
        name: 'Emergency Alert',
        description: 'Emergency alert broadcast',
        type: MessageType.EMERGENCY,
        priority: MessagePriority.EMERGENCY,
        category: 'emergency',
        subjectTemplate: 'EMERGENCY ALERT - {{situation}}',
        contentTemplate: 'EMERGENCY: {{situation}} at position {{latitude}}, {{longitude}}. All vessels in vicinity take immediate action: {{action}}. Contact VTS on channel {{channel}}.',
        variables: [
          { name: 'situation', label: 'Situation', type: 'text' as const, required: true },
          { name: 'latitude', label: 'Latitude', type: 'number' as const, required: true },
          { name: 'longitude', label: 'Longitude', type: 'number' as const, required: true },
          { name: 'action', label: 'Required Action', type: 'text' as const, required: true },
          { name: 'channel', label: 'VHF Channel', type: 'text' as const, required: true },
        ],
      },
    ];

    for (const templateData of standardTemplates) {
      const existing = await this.templateRepository.findOne({
        where: { code: templateData.code },
      });

      if (!existing) {
        const template = this.templateRepository.create({
          ...templateData,
          isStandard: true,
          isActive: true,
        });
        await this.templateRepository.save(template);
      }
    }
  }
}
