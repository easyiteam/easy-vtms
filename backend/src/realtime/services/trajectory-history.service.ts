import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { AisTrack } from '../entities/ais-track.entity';

export interface TrajectoryPoint {
  mmsi: string;
  vesselName?: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  heading?: number;
  timestamp: Date;
}

export interface TrajectoryQuery {
  mmsi?: string;
  startTime?: Date;
  endTime?: Date;
  minSpeed?: number;
  maxSpeed?: number;
  limit?: number;
}

export interface TrajectoryStats {
  mmsi: string;
  vesselName?: string;
  totalPoints: number;
  totalDistance: number; // Nautical miles
  averageSpeed: number; // Knots
  maxSpeed: number;
  minSpeed: number;
  duration: number; // Minutes
  startTime: Date;
  endTime: Date;
}

export interface AggregatedPoint {
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  heading?: number;
  pointCount: number; // Number of points aggregated
}

@Injectable()
export class TrajectoryHistoryService {
  private readonly logger = new Logger(TrajectoryHistoryService.name);
  private readonly EARTH_RADIUS_NM = 3440.065; // Earth radius in nautical miles
  private readonly RETENTION_DAYS = 90; // Keep data for 90 days

  constructor(
    @InjectRepository(AisTrack)
    private aisTrackRepository: Repository<AisTrack>,
  ) {
    // Schedule cleanup every day
    this.scheduleCleanup();
  }

  /**
   * Get trajectory points for a vessel
   */
  async getTrajectory(query: TrajectoryQuery): Promise<TrajectoryPoint[]> {
    const queryBuilder = this.aisTrackRepository.createQueryBuilder('track');

    // Filter by MMSI
    if (query.mmsi) {
      queryBuilder.andWhere('track.mmsi = :mmsi', { mmsi: query.mmsi });
    }

    // Filter by time range
    if (query.startTime && query.endTime) {
      queryBuilder.andWhere('track.timestamp BETWEEN :startTime AND :endTime', {
        startTime: query.startTime,
        endTime: query.endTime,
      });
    } else if (query.startTime) {
      queryBuilder.andWhere('track.timestamp >= :startTime', {
        startTime: query.startTime,
      });
    } else if (query.endTime) {
      queryBuilder.andWhere('track.timestamp <= :endTime', {
        endTime: query.endTime,
      });
    }

    // Filter by speed
    if (query.minSpeed !== undefined) {
      queryBuilder.andWhere('track.speed >= :minSpeed', {
        minSpeed: query.minSpeed,
      });
    }
    if (query.maxSpeed !== undefined) {
      queryBuilder.andWhere('track.speed <= :maxSpeed', {
        maxSpeed: query.maxSpeed,
      });
    }

    // Order by timestamp
    queryBuilder.orderBy('track.timestamp', 'ASC');

    // Limit results
    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    const tracks = await queryBuilder.getMany();

    return tracks.map((track) => ({
      mmsi: track.mmsi,
      vesselName: track.vesselName,
      latitude: track.latitude,
      longitude: track.longitude,
      speed: track.speed,
      course: track.course,
      heading: track.heading,
      timestamp: track.timestamp,
    }));
  }

  /**
   * Get aggregated trajectory (downsampled for performance)
   * Aggregates points into time buckets (e.g., 1 minute, 5 minutes)
   */
  async getAggregatedTrajectory(
    mmsi: string,
    startTime: Date,
    endTime: Date,
    intervalMinutes: number = 1,
  ): Promise<AggregatedPoint[]> {
    // PostgreSQL-specific query for time bucketing
    const query = `
      SELECT 
        date_trunc('minute', timestamp) + 
        (EXTRACT(minute FROM timestamp)::int / $4) * interval '${intervalMinutes} minute' as bucket,
        AVG(latitude) as latitude,
        AVG(longitude) as longitude,
        AVG(speed) as speed,
        AVG(course) as course,
        AVG(heading) as heading,
        COUNT(*) as point_count
      FROM ais_tracks
      WHERE mmsi = $1
        AND timestamp BETWEEN $2 AND $3
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const result = await this.aisTrackRepository.query(query, [
      mmsi,
      startTime,
      endTime,
      intervalMinutes,
    ]);

    return result.map((row: any) => ({
      timestamp: new Date(row.bucket),
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      speed: parseFloat(row.speed),
      course: parseFloat(row.course),
      heading: row.heading ? parseFloat(row.heading) : undefined,
      pointCount: parseInt(row.point_count),
    }));
  }

  /**
   * Calculate trajectory statistics
   */
  async getTrajectoryStats(
    mmsi: string,
    startTime?: Date,
    endTime?: Date,
  ): Promise<TrajectoryStats | null> {
    const query: TrajectoryQuery = { mmsi, startTime, endTime };
    const points = await this.getTrajectory(query);

    if (points.length === 0) {
      return null;
    }

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dist = this.calculateDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude,
      );
      totalDistance += dist;
    }

    // Calculate speeds
    const speeds = points.map((p) => p.speed).filter((s) => s > 0);
    const averageSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);

    // Calculate duration
    const start = new Date(points[0].timestamp);
    const end = new Date(points[points.length - 1].timestamp);
    const duration = (end.getTime() - start.getTime()) / 1000 / 60; // Minutes

    return {
      mmsi,
      vesselName: points[0].vesselName,
      totalPoints: points.length,
      totalDistance,
      averageSpeed,
      maxSpeed,
      minSpeed,
      duration,
      startTime: start,
      endTime: end,
    };
  }

  /**
   * Get all vessels with trajectory data in a time range
   */
  async getVesselsWithTrajectories(
    startTime: Date,
    endTime: Date,
  ): Promise<Array<{ mmsi: string; vesselName?: string; pointCount: number }>> {
    const query = `
      SELECT 
        mmsi,
        vessel_name as "vesselName",
        COUNT(*) as "pointCount"
      FROM ais_tracks
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY mmsi, vessel_name
      ORDER BY "pointCount" DESC
    `;

    return await this.aisTrackRepository.query(query, [startTime, endTime]);
  }

  /**
   * Get heatmap data (density of vessel positions)
   */
  async getHeatmapData(
    startTime: Date,
    endTime: Date,
    gridSize: number = 0.01, // Grid size in degrees (~1km)
  ): Promise<Array<{ latitude: number; longitude: number; count: number }>> {
    const query = `
      SELECT 
        ROUND(latitude / $3) * $3 as latitude,
        ROUND(longitude / $3) * $3 as longitude,
        COUNT(*) as count
      FROM ais_tracks
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY latitude, longitude
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 1000
    `;

    const result = await this.aisTrackRepository.query(query, [
      startTime,
      endTime,
      gridSize,
    ]);

    return result.map((row: any) => ({
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      count: parseInt(row.count),
    }));
  }

  /**
   * Export trajectory to CSV
   */
  async exportTrajectoryCSV(query: TrajectoryQuery): Promise<string> {
    const points = await this.getTrajectory(query);

    const headers = [
      'MMSI',
      'Vessel Name',
      'Timestamp',
      'Latitude',
      'Longitude',
      'Speed (kts)',
      'Course (°)',
      'Heading (°)',
    ];

    const rows = points.map((p) => [
      p.mmsi,
      p.vesselName || '',
      p.timestamp.toISOString(),
      p.latitude.toFixed(6),
      p.longitude.toFixed(6),
      p.speed.toFixed(1),
      p.course.toFixed(1),
      p.heading?.toFixed(1) || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return csv;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_NM * c;
  }

  /**
   * Clean up old trajectory data
   */
  async cleanupOldData(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    const result = await this.aisTrackRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    const deletedCount = result.affected || 0;
    this.logger.log(`Cleaned up ${deletedCount} old trajectory points`);

    return deletedCount;
  }

  /**
   * Schedule automatic cleanup
   */
  private scheduleCleanup() {
    // Run cleanup every day at 2 AM
    const now = new Date();
    const next2AM = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      2,
      0,
      0,
    );
    const msUntil2AM = next2AM.getTime() - now.getTime();

    setTimeout(() => {
      this.cleanupOldData();
      // Then schedule daily
      setInterval(() => this.cleanupOldData(), 24 * 60 * 60 * 1000);
    }, msUntil2AM);

    this.logger.log(
      `Scheduled automatic cleanup in ${Math.round(msUntil2AM / 1000 / 60)} minutes`,
    );
  }

  /**
   * Get trajectory summary for multiple vessels
   */
  async getMultiVesselSummary(
    mmsis: string[],
    startTime: Date,
    endTime: Date,
  ): Promise<TrajectoryStats[]> {
    const summaries: TrajectoryStats[] = [];

    for (const mmsi of mmsis) {
      const stats = await this.getTrajectoryStats(mmsi, startTime, endTime);
      if (stats) {
        summaries.push(stats);
      }
    }

    return summaries;
  }
}
