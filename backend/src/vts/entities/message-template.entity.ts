import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MessageType, MessagePriority } from './vts-message.entity';

@Entity('message_templates')
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  type: MessageType;

  @Column({ type: 'varchar', length: 50 })
  priority: MessagePriority;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'text' })
  subjectTemplate: string;

  @Column({ type: 'text' })
  contentTemplate: string;

  // Template variables
  @Column({ type: 'jsonb' })
  variables: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'vessel' | 'location';
    required: boolean;
    defaultValue?: any;
    options?: string[];
    placeholder?: string;
  }>;

  // Usage tracking
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isStandard: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
