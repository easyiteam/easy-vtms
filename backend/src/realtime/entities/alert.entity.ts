import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AlertType, AlertSeverity, AlertStatus } from '../services/alert.service';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  type: AlertType;

  @Column({
    type: 'varchar',
    length: 20,
  })
  severity: AlertSeverity;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ACTIVE',
  })
  status: AlertStatus;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'vessel_mmsi', type: 'varchar', length: 20, nullable: true })
  vesselMmsi: string;

  @Column({ name: 'vessel_name', type: 'varchar', length: 255, nullable: true })
  vesselName: string;

  @Column({ name: 'related_vessel_mmsi', type: 'varchar', length: 20, nullable: true })
  relatedVesselMmsi: string;

  @Column({ name: 'related_vessel_name', type: 'varchar', length: 255, nullable: true })
  relatedVesselName: string;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ name: 'acknowledged_by', type: 'varchar', length: 255, nullable: true })
  acknowledgedBy: string;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'resolved_by', type: 'varchar', length: 255, nullable: true })
  resolvedBy: string;

  @Column({ name: 'dismissed_at', type: 'timestamp', nullable: true })
  dismissedAt: Date;

  @Column({ name: 'dismissed_by', type: 'varchar', length: 255, nullable: true })
  dismissedBy: string;
}
