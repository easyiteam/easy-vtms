import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
}

export enum AuditEntity {
  VESSEL = 'vessel',
  ALERT = 'alert',
  MESSAGE = 'message',
  BERTH = 'berth',
  RESERVATION = 'reservation',
  PILOT_SERVICE = 'pilot_service',
  USER = 'user',
  ENC = 'enc',
  SYSTEM = 'system',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'entity'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Column({ type: 'varchar', length: 50 })
  entity: AuditEntity;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  userName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValue: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValue: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isSuccess: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
