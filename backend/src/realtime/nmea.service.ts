import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AisTrack } from './entities/ais-track.entity';

export interface NmeaData {
  type: string;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  heading?: number;
  mmsi?: string;
  vesselName?: string;
  raw?: string;
}

@Injectable()
export class NmeaService {
  private readonly logger = new Logger(NmeaService.name);

  constructor(
    @InjectRepository(AisTrack)
    private aisTrackRepository: Repository<AisTrack>,
  ) {}

  /**
   * Parse NMEA RMC sentence
   * Example: $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
   */
  parseRMC(sentence: string): NmeaData | null {
    try {
      const parts = sentence.split(',');
      if (parts[0] !== '$GPRMC' && parts[0] !== '$GNRMC') {
        return null;
      }

      const status = parts[2];
      if (status !== 'A') {
        return null; // Invalid data
      }

      const latitude = this.parseCoordinate(parts[3], parts[4]);
      const longitude = this.parseCoordinate(parts[5], parts[6]);
      const speed = parseFloat(parts[7]) || 0; // Speed in knots
      const course = parseFloat(parts[8]) || 0; // Course over ground

      return {
        type: 'RMC',
        timestamp: new Date(),
        latitude,
        longitude,
        speed,
        course,
        raw: sentence,
      };
    } catch (error) {
      this.logger.error(`Failed to parse RMC: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse coordinate from NMEA format
   * Example: 4807.038,N -> 48.1173
   */
  private parseCoordinate(value: string, direction: string): number {
    if (!value || !direction) return 0;

    const degrees = parseInt(value.substring(0, value.indexOf('.') - 2));
    const minutes = parseFloat(value.substring(value.indexOf('.') - 2));
    let decimal = degrees + minutes / 60;

    if (direction === 'S' || direction === 'W') {
      decimal *= -1;
    }

    return decimal;
  }

  /**
   * Generate simulated NMEA RMC sentence
   */
  generateSimulatedRMC(
    latitude: number,
    longitude: number,
    speed: number = 10,
    course: number = 45,
  ): string {
    const time = new Date();
    const timeStr = time.toISOString().substring(11, 19).replace(/:/g, '');
    const dateStr = time.toISOString().substring(8, 10) + 
                    time.toISOString().substring(5, 7) + 
                    time.toISOString().substring(2, 4);

    const latDeg = Math.abs(Math.floor(latitude));
    const latMin = (Math.abs(latitude) - latDeg) * 60;
    const latStr = `${latDeg.toString().padStart(2, '0')}${latMin.toFixed(3).padStart(6, '0')}`;
    const latDir = latitude >= 0 ? 'N' : 'S';

    const lonDeg = Math.abs(Math.floor(longitude));
    const lonMin = (Math.abs(longitude) - lonDeg) * 60;
    const lonStr = `${lonDeg.toString().padStart(3, '0')}${lonMin.toFixed(3).padStart(6, '0')}`;
    const lonDir = longitude >= 0 ? 'E' : 'W';

    return `$GPRMC,${timeStr},A,${latStr},${latDir},${lonStr},${lonDir},${speed.toFixed(1)},${course.toFixed(1)},${dateStr},,,A*00`;
  }

  /**
   * Save AIS track to database
   */
  async saveAisTrack(data: Partial<AisTrack>): Promise<AisTrack> {
    const trackData: any = { ...data };
    
    // Remove geom from data and handle it separately
    delete trackData.geom;
    
    if (data.latitude && data.longitude) {
      // Use raw query to insert with PostGIS geometry
      const result = await this.aisTrackRepository
        .createQueryBuilder()
        .insert()
        .into(AisTrack)
        .values({
          ...trackData,
          geom: () => `ST_GeomFromText('POINT(${data.longitude} ${data.latitude})', 4326)`,
        })
        .returning('*')
        .execute();
      
      return result.raw[0];
    } else {
      const track = this.aisTrackRepository.create(trackData);
      const saved = await this.aisTrackRepository.save(track);
      return Array.isArray(saved) ? saved[0] : saved;
    }
  }

  /**
   * Get recent AIS tracks
   */
  async getRecentTracks(limit: number = 100): Promise<AisTrack[]> {
    return await this.aisTrackRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get tracks by MMSI
   */
  async getTracksByMMSI(mmsi: string, limit: number = 100): Promise<AisTrack[]> {
    return await this.aisTrackRepository.find({
      where: { mmsi },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}
