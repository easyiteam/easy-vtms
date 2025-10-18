import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PilotServiceStatus {
  REQUESTED = 'requested',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PilotServiceType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  SHIFTING = 'shifting',
}

@Entity('pilot_services')
@Index(['vesselMmsi', 'status'])
@Index(['pilotId', 'status'])
@Index(['scheduledTime'])
export class PilotService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: PilotServiceType;

  @Column({ type: 'varchar', length: 50 })
  status: PilotServiceStatus;

  // Vessel information
  @Column({ type: 'varchar', length: 20 })
  vesselMmsi: string;

  @Column({ type: 'varchar', length: 200 })
  vesselName: string;

  @Column({ type: 'int', nullable: true })
  vesselLength: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  vesselDraft: number;

  // Pilot information
  @Column({ type: 'varchar', length: 100, nullable: true })
  pilotId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  pilotName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pilotLicense: string;

  // Location
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  boardingLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  boardingLongitude: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  boardingLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  destinationLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  destinationLongitude: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  destinationLocation: string;

  // Timing
  @Column({ type: 'timestamp' })
  scheduledTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualBoardingTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualCompletionTime: Date;

  @Column({ type: 'int', nullable: true })
  estimatedDuration: number; // minutes

  // Additional services
  @Column({ type: 'int', default: 0 })
  tugboatsRequired: number;

  @Column({ type: 'boolean', default: false })
  escortRequired: boolean;

  // Weather conditions
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  windSpeed: number; // knots

  @Column({ type: 'int', nullable: true })
  windDirection: number; // degrees

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  visibility: number; // nautical miles

  @Column({ type: 'varchar', length: 100, nullable: true })
  weatherCondition: string;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  additionalFees: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalCost: number;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  incidentReport: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
