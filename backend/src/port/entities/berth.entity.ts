import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum BerthStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
}

export enum BerthType {
  CONTAINER = 'container',
  BULK = 'bulk',
  TANKER = 'tanker',
  PASSENGER = 'passenger',
  GENERAL = 'general',
  RO_RO = 'ro-ro',
}

@Entity('berths')
@Index(['status', 'type'])
export class Berth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  type: BerthType;

  @Column({ type: 'varchar', length: 50 })
  status: BerthStatus;

  // Location
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  // Dimensions
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  length: number; // meters

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  width: number; // meters

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  depth: number; // meters

  // Capacity
  @Column({ type: 'int' })
  maxVesselLength: number; // meters

  @Column({ type: 'int' })
  maxVesselBeam: number; // meters

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxVesselDraft: number; // meters

  @Column({ type: 'int', nullable: true })
  maxVesselDWT: number; // deadweight tonnage

  // Facilities
  @Column({ type: 'jsonb', nullable: true })
  facilities: {
    cranes?: number;
    forklifts?: number;
    electricity?: boolean;
    water?: boolean;
    fuel?: boolean;
    wasteDisposal?: boolean;
    security?: boolean;
  };

  // Current occupation
  @Column({ type: 'varchar', length: 20, nullable: true })
  currentVesselMmsi: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  currentVesselName: string;

  @Column({ type: 'timestamp', nullable: true })
  occupiedSince: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectedDeparture: Date;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dailyRate: number;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
