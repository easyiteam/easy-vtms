import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('berth_reservations')
@Index(['berthId', 'status'])
@Index(['vesselMmsi', 'status'])
@Index(['arrivalTime', 'departureTime'])
export class BerthReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  berthId: string;

  @Column({ type: 'varchar', length: 50 })
  berthCode: string;

  // Vessel information
  @Column({ type: 'varchar', length: 20 })
  vesselMmsi: string;

  @Column({ type: 'varchar', length: 200 })
  vesselName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vesselType: string;

  @Column({ type: 'int', nullable: true })
  vesselLength: number;

  @Column({ type: 'int', nullable: true })
  vesselBeam: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  vesselDraft: number;

  // Timing
  @Column({ type: 'timestamp' })
  arrivalTime: Date;

  @Column({ type: 'timestamp' })
  departureTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualArrival: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualDeparture: Date;

  // Status
  @Column({ type: 'varchar', length: 50 })
  status: ReservationStatus;

  // Services
  @Column({ type: 'jsonb', nullable: true })
  requestedServices: {
    pilotage?: boolean;
    tugboats?: number;
    linesmen?: number;
    freshWater?: boolean;
    fuel?: boolean;
    wasteDisposal?: boolean;
    customs?: boolean;
    immigration?: boolean;
  };

  // Purpose
  @Column({ type: 'varchar', length: 100 })
  purpose: string; // loading, unloading, bunkering, repairs, etc.

  @Column({ type: 'text', nullable: true })
  cargoDescription: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  cargoQuantity: number;

  // Contact
  @Column({ type: 'varchar', length: 200, nullable: true })
  agentName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  agentEmail: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  agentPhone: string;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCost: number;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
