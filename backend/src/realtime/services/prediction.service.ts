import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AisTrack } from '../entities/ais-track.entity';
import type { PredictedPoint, TrajectoryPrediction, AnomalyDetection } from '../types/prediction.types';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(
    @InjectRepository(AisTrack)
    private aisTrackRepository: Repository<AisTrack>,
  ) {}

  /**
   * Predict vessel trajectory based on current speed and course
   * Uses simple dead reckoning algorithm
   */
  async predictTrajectory(
    mmsi: string,
    predictionMinutes: number = 60,
    intervalMinutes: number = 5,
  ): Promise<TrajectoryPrediction | null> {
    // Get current vessel position
    const currentTrack = await this.aisTrackRepository.findOne({
      where: { mmsi },
      order: { timestamp: 'DESC' },
    });

    if (!currentTrack) {
      this.logger.warn(`No track found for MMSI ${mmsi}`);
      return null;
    }

    // Get historical data for better prediction
    const historicalTracks = await this.aisTrackRepository.find({
      where: { mmsi },
      order: { timestamp: 'DESC' },
      take: 10,
    });

    // Calculate average speed and course from recent history
    const avgSpeed = this.calculateAverageSpeed(historicalTracks);
    const avgCourse = this.calculateAverageCourse(historicalTracks);
    const speedVariance = this.calculateSpeedVariance(historicalTracks);

    const predictedPoints: PredictedPoint[] = [];
    let currentLat = currentTrack.latitude;
    let currentLon = currentTrack.longitude;
    let currentTime = new Date(currentTrack.timestamp);

    const numPoints = Math.floor(predictionMinutes / intervalMinutes);

    for (let i = 1; i <= numPoints; i++) {
      const minutesAhead = i * intervalMinutes;
      const hoursAhead = minutesAhead / 60;

      // Dead reckoning calculation
      const distanceNM = avgSpeed * hoursAhead;
      const newPosition = this.calculateNewPosition(
        currentLat,
        currentLon,
        avgCourse,
        distanceNM,
      );

      // Calculate confidence (decreases over time and with speed variance)
      const timeDecay = Math.exp(-minutesAhead / 120); // Decay over 2 hours
      const varianceDecay = Math.exp(-speedVariance / 2);
      const confidence = timeDecay * varianceDecay;

      predictedPoints.push({
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
        timestamp: new Date(currentTime.getTime() + minutesAhead * 60000),
        speed: avgSpeed,
        course: avgCourse,
        confidence: Math.max(0.1, confidence),
      });

      currentLat = newPosition.latitude;
      currentLon = newPosition.longitude;
    }

    return {
      mmsi,
      currentPosition: {
        latitude: currentTrack.latitude,
        longitude: currentTrack.longitude,
        timestamp: currentTrack.timestamp,
      },
      predictedPoints,
    };
  }

  /**
   * Calculate ETA to a destination point
   */
  async calculateETA(
    mmsi: string,
    destinationLat: number,
    destinationLon: number,
  ): Promise<TrajectoryPrediction | null> {
    const currentTrack = await this.aisTrackRepository.findOne({
      where: { mmsi },
      order: { timestamp: 'DESC' },
    });

    if (!currentTrack) {
      return null;
    }

    // Calculate distance to destination
    const distance = this.calculateDistance(
      currentTrack.latitude,
      currentTrack.longitude,
      destinationLat,
      destinationLon,
    );

    // Get average speed
    const historicalTracks = await this.aisTrackRepository.find({
      where: { mmsi },
      order: { timestamp: 'DESC' },
      take: 10,
    });

    const avgSpeed = this.calculateAverageSpeed(historicalTracks);

    if (avgSpeed === 0) {
      this.logger.warn(`Vessel ${mmsi} has zero speed`);
      return null;
    }

    // Calculate ETA (hours = distance / speed)
    const hoursToDestination = distance / avgSpeed;
    const eta = new Date(
      currentTrack.timestamp.getTime() + hoursToDestination * 3600000,
    );

    // Generate predicted points along the route
    const bearing = this.calculateBearing(
      currentTrack.latitude,
      currentTrack.longitude,
      destinationLat,
      destinationLon,
    );

    const predictedPoints: PredictedPoint[] = [];
    const numPoints = Math.min(Math.ceil(hoursToDestination), 24); // Max 24 points

    for (let i = 1; i <= numPoints; i++) {
      const fraction = i / numPoints;
      const distanceNM = distance * fraction;
      const newPosition = this.calculateNewPosition(
        currentTrack.latitude,
        currentTrack.longitude,
        bearing,
        distanceNM,
      );

      const timeOffset = hoursToDestination * fraction * 3600000;
      const confidence = Math.exp(-i / 12); // Decay confidence over time

      predictedPoints.push({
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
        timestamp: new Date(currentTrack.timestamp.getTime() + timeOffset),
        speed: avgSpeed,
        course: bearing,
        confidence: Math.max(0.1, confidence),
      });
    }

    return {
      mmsi,
      currentPosition: {
        latitude: currentTrack.latitude,
        longitude: currentTrack.longitude,
        timestamp: currentTrack.timestamp,
      },
      predictedPoints,
      estimatedArrival: {
        latitude: destinationLat,
        longitude: destinationLon,
        eta,
        distance,
      },
    };
  }

  /**
   * Detect anomalies in vessel behavior
   */
  async detectAnomalies(mmsi: string): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Get recent tracks
    const recentTracks = await this.aisTrackRepository.find({
      where: { mmsi },
      order: { timestamp: 'DESC' },
      take: 20,
    });

    if (recentTracks.length < 5) {
      return anomalies;
    }

    const currentTrack = recentTracks[0];
    const historicalTracks = recentTracks.slice(1);

    // 1. Speed anomaly detection
    const avgSpeed = this.calculateAverageSpeed(historicalTracks);
    const speedStdDev = this.calculateSpeedStdDev(historicalTracks, avgSpeed);
    const speedDeviation = Math.abs(currentTrack.speed - avgSpeed);

    if (speedDeviation > 2 * speedStdDev && speedStdDev > 0) {
      anomalies.push({
        mmsi,
        type: 'speed',
        severity: speedDeviation > 3 * speedStdDev ? 'high' : 'medium',
        description: `Unusual speed detected: ${currentTrack.speed.toFixed(1)} kts (avg: ${avgSpeed.toFixed(1)} kts)`,
        detectedAt: new Date(),
        currentValue: currentTrack.speed,
        expectedValue: avgSpeed,
        deviation: speedDeviation,
      });
    }

    // 2. Course change anomaly
    if (historicalTracks.length >= 2) {
      const recentCourse = historicalTracks[0].course;
      const courseChange = Math.abs(currentTrack.course - recentCourse);
      const normalizedChange = courseChange > 180 ? 360 - courseChange : courseChange;

      if (normalizedChange > 45 && currentTrack.speed > 1) {
        anomalies.push({
          mmsi,
          type: 'course',
          severity: normalizedChange > 90 ? 'high' : 'medium',
          description: `Sudden course change: ${normalizedChange.toFixed(0)}° deviation`,
          detectedAt: new Date(),
          currentValue: currentTrack.course,
          expectedValue: recentCourse,
          deviation: normalizedChange,
        });
      }
    }

    // 3. Signal loss detection
    const timeSinceLastUpdate = Date.now() - currentTrack.timestamp.getTime();
    const minutesSinceUpdate = timeSinceLastUpdate / 60000;

    if (minutesSinceUpdate > 10) {
      anomalies.push({
        mmsi,
        type: 'signal_loss',
        severity: minutesSinceUpdate > 30 ? 'critical' : 'high',
        description: `No signal for ${minutesSinceUpdate.toFixed(0)} minutes`,
        detectedAt: new Date(),
        currentValue: minutesSinceUpdate,
      });
    }

    // 4. Drift detection (low speed with high course variance)
    if (currentTrack.speed < 0.5) {
      const courseVariance = this.calculateCourseVariance(recentTracks.slice(0, 5));
      if (courseVariance > 30) {
        anomalies.push({
          mmsi,
          type: 'drift',
          severity: 'medium',
          description: `Possible drift detected: Low speed (${currentTrack.speed.toFixed(1)} kts) with high course variance`,
          detectedAt: new Date(),
          currentValue: courseVariance,
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate average speed from tracks
   */
  private calculateAverageSpeed(tracks: AisTrack[]): number {
    if (tracks.length === 0) return 0;
    const sum = tracks.reduce((acc, track) => acc + track.speed, 0);
    return sum / tracks.length;
  }

  /**
   * Calculate average course from tracks
   */
  private calculateAverageCourse(tracks: AisTrack[]): number {
    if (tracks.length === 0) return 0;
    
    // Convert to vectors to handle circular mean
    let sinSum = 0;
    let cosSum = 0;
    
    tracks.forEach(track => {
      const radians = (track.course * Math.PI) / 180;
      sinSum += Math.sin(radians);
      cosSum += Math.cos(radians);
    });
    
    const avgRadians = Math.atan2(sinSum / tracks.length, cosSum / tracks.length);
    let avgDegrees = (avgRadians * 180) / Math.PI;
    
    if (avgDegrees < 0) avgDegrees += 360;
    
    return avgDegrees;
  }

  /**
   * Calculate speed variance
   */
  private calculateSpeedVariance(tracks: AisTrack[]): number {
    if (tracks.length < 2) return 0;
    const avgSpeed = this.calculateAverageSpeed(tracks);
    const variance = tracks.reduce((acc, track) => {
      return acc + Math.pow(track.speed - avgSpeed, 2);
    }, 0) / tracks.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate speed standard deviation
   */
  private calculateSpeedStdDev(tracks: AisTrack[], avgSpeed: number): number {
    if (tracks.length < 2) return 0;
    const variance = tracks.reduce((acc, track) => {
      return acc + Math.pow(track.speed - avgSpeed, 2);
    }, 0) / tracks.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate course variance
   */
  private calculateCourseVariance(tracks: AisTrack[]): number {
    if (tracks.length < 2) return 0;
    
    const courses = tracks.map(t => t.course);
    let maxDiff = 0;
    
    for (let i = 0; i < courses.length - 1; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        let diff = Math.abs(courses[i] - courses[j]);
        if (diff > 180) diff = 360 - diff;
        maxDiff = Math.max(maxDiff, diff);
      }
    }
    
    return maxDiff;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in nautical miles
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate bearing from point 1 to point 2
   * Returns bearing in degrees (0-360)
   */
  private calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  /**
   * Calculate new position given start point, bearing, and distance
   */
  private calculateNewPosition(
    lat: number,
    lon: number,
    bearing: number,
    distanceNM: number,
  ): { latitude: number; longitude: number } {
    const R = 3440.065; // Earth's radius in nautical miles
    const bearingRad = (bearing * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distanceNM / R) +
        Math.cos(latRad) * Math.sin(distanceNM / R) * Math.cos(bearingRad),
    );

    const newLonRad =
      lonRad +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(distanceNM / R) * Math.cos(latRad),
        Math.cos(distanceNM / R) - Math.sin(latRad) * Math.sin(newLatRad),
      );

    return {
      latitude: (newLatRad * 180) / Math.PI,
      longitude: (newLonRad * 180) / Math.PI,
    };
  }
}
