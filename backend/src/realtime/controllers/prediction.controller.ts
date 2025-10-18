import { Controller, Get, Query, Param, BadRequestException } from '@nestjs/common';
import { PredictionService } from '../services/prediction.service';

@Controller('api/predictions')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  /**
   * GET /api/predictions/:mmsi/trajectory
   * Predict vessel trajectory based on current course and speed
   */
  @Get(':mmsi/trajectory')
  async predictTrajectory(
    @Param('mmsi') mmsi: string,
    @Query('minutes') minutes?: string,
    @Query('interval') interval?: string,
  ) {
    const predictionMinutes = minutes ? parseInt(minutes, 10) : 60;
    const intervalMinutes = interval ? parseInt(interval, 10) : 5;

    if (predictionMinutes < 5 || predictionMinutes > 1440) {
      throw new BadRequestException('Prediction minutes must be between 5 and 1440');
    }

    if (intervalMinutes < 1 || intervalMinutes > 60) {
      throw new BadRequestException('Interval minutes must be between 1 and 60');
    }

    const prediction = await this.predictionService.predictTrajectory(
      mmsi,
      predictionMinutes,
      intervalMinutes,
    );

    if (!prediction) {
      throw new BadRequestException(`No data found for vessel ${mmsi}`);
    }

    return prediction;
  }

  /**
   * GET /api/predictions/:mmsi/eta
   * Calculate ETA to a destination
   */
  @Get(':mmsi/eta')
  async calculateETA(
    @Param('mmsi') mmsi: string,
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    if (!lat || !lon) {
      throw new BadRequestException('Destination latitude and longitude are required');
    }

    const destLat = parseFloat(lat);
    const destLon = parseFloat(lon);

    if (isNaN(destLat) || isNaN(destLon)) {
      throw new BadRequestException('Invalid latitude or longitude');
    }

    if (destLat < -90 || destLat > 90 || destLon < -180 || destLon > 180) {
      throw new BadRequestException('Latitude/longitude out of valid range');
    }

    const prediction = await this.predictionService.calculateETA(mmsi, destLat, destLon);

    if (!prediction) {
      throw new BadRequestException(`No data found for vessel ${mmsi}`);
    }

    return prediction;
  }

  /**
   * GET /api/predictions/:mmsi/anomalies
   * Detect anomalies in vessel behavior
   */
  @Get(':mmsi/anomalies')
  async detectAnomalies(@Param('mmsi') mmsi: string) {
    const anomalies = await this.predictionService.detectAnomalies(mmsi);
    
    return {
      mmsi,
      anomaliesCount: anomalies.length,
      anomalies,
      timestamp: new Date(),
    };
  }

  /**
   * GET /api/predictions/anomalies/all
   * Get anomalies for all active vessels
   */
  @Get('anomalies/all')
  async detectAllAnomalies() {
    // This would need to be implemented to check all active vessels
    // For now, return empty array
    return {
      vessels: [],
      totalAnomalies: 0,
      timestamp: new Date(),
    };
  }
}
