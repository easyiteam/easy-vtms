import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum MessageType {
  INSTRUCTION = 'instruction',
  INFORMATION = 'information',
  WARNING = 'warning',
  CLEARANCE = 'clearance',
  QUERY = 'query',
  RESPONSE = 'response',
  EMERGENCY = 'emergency',
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

export enum MessageStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  ACKNOWLEDGED = 'acknowledged',
  ARCHIVED = 'archived',
}

@Entity('vts_messages')
@Index(['recipientMmsi', 'status'])
@Index(['senderType', 'createdAt'])
export class VtsMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: MessageType;

  @Column({ type: 'varchar', length: 50 })
  priority: MessagePriority;

  @Column({ type: 'varchar', length: 50 })
  status: MessageStatus;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  // Sender information
  @Column({ type: 'varchar', length: 50 })
  senderType: 'vts' | 'vessel' | 'port' | 'system';

  @Column({ type: 'varchar', length: 100, nullable: true })
  senderName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  senderMmsi: string;

  // Recipient information
  @Column({ type: 'varchar', length: 50 })
  recipientType: 'vts' | 'vessel' | 'port' | 'broadcast';

  @Column({ type: 'varchar', length: 100, nullable: true })
  recipientName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientMmsi: string;

  // Template information
  @Column({ type: 'varchar', length: 100, nullable: true })
  templateId: string;

  @Column({ type: 'jsonb', nullable: true })
  templateData: Record<string, any>;

  // Attachments and references
  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    name: string;
    type: string;
    url: string;
    size: number;
  }>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceMessageId: string;

  // Location context
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  locationDescription: string;

  // Timing
  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
