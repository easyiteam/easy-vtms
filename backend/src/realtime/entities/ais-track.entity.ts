import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { VesselType } from '../enums/vessel-type.enum';
import { NavigationStatus } from '../enums/navigation-status.enum';

@Entity('ais_tracks')
export class AisTrack {
  @PrimaryGeneratedColumn()
  id: number;

  // Identification
  @Column()
  mmsi: string;

  @Column({ name: 'imo_number', nullable: true })
  imoNumber: string;

  @Column({ name: 'call_sign', nullable: true })
  callSign: string;

  @Column({ name: 'vessel_name', nullable: true })
  vesselName: string;

  // Vessel characteristics
  @Column({ 
    name: 'vessel_type', 
    type: 'int',
    nullable: true,
    default: VesselType.UNKNOWN 
  })
  vesselType: VesselType;

  @Column({ name: 'length', type: 'double precision', nullable: true })
  length: number; // meters

  @Column({ name: 'width', type: 'double precision', nullable: true })
  width: number; // meters

  @Column({ name: 'height', type: 'double precision', nullable: true })
  height: number; // meters

  @Column({ name: 'draught', type: 'double precision', nullable: true })
  draught: number; // meters

  // Position & movement
  @CreateDateColumn()
  timestamp: Date;

  @Column('double precision')
  latitude: number;

  @Column('double precision')
  longitude: number;

  @Column('double precision', { nullable: true })
  speed: number; // knots

  @Column('double precision', { nullable: true })
  course: number; // degrees

  @Column('int', { nullable: true })
  heading: number; // degrees

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geom: string;

  // Navigation
  @Column({ 
    name: 'navigation_status',
    type: 'int',
    nullable: true,
    default: NavigationStatus.NOT_DEFINED
  })
  navigationStatus: NavigationStatus;

  @Column({ name: 'destination', nullable: true })
  destination: string;

  @Column({ name: 'eta', type: 'timestamp', nullable: true })
  eta: Date;

  @Column({ name: 'rate_of_turn', type: 'double precision', nullable: true })
  rateOfTurn: number; // degrees per minute
}
