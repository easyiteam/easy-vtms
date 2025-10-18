import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('api/weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  /**
   * GET /api/weather/current
   * Get current weather for a location
   */
  @Get('current')
  async getCurrentWeather(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    if (!lat || !lon) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('Invalid latitude or longitude');
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new BadRequestException('Latitude/longitude out of valid range');
    }

    return this.weatherService.getCurrentWeather(latitude, longitude);
  }

  /**
   * GET /api/weather/forecast
   * Get weather forecast for a location
   */
  @Get('forecast')
  async getWeatherForecast(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('hours') hours?: string,
  ) {
    if (!lat || !lon) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const forecastHours = hours ? parseInt(hours, 10) : 24;

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('Invalid latitude or longitude');
    }

    if (forecastHours < 3 || forecastHours > 120) {
      throw new BadRequestException('Forecast hours must be between 3 and 120');
    }

    return this.weatherService.getWeatherForecast(latitude, longitude, forecastHours);
  }

  /**
   * GET /api/weather/maritime
   * Get maritime conditions for a location
   */
  @Get('maritime')
  async getMaritimeConditions(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    if (!lat || !lon) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('Invalid latitude or longitude');
    }

    return this.weatherService.getMaritimeConditions(latitude, longitude);
  }

  /**
   * GET /api/weather/alerts
   * Get weather alerts for a location
   */
  @Get('alerts')
  async getWeatherAlerts(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    if (!lat || !lon) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('Invalid latitude or longitude');
    }

    const alerts = await this.weatherService.generateWeatherAlerts(latitude, longitude);

    return {
      location: { latitude, longitude },
      alertsCount: alerts.length,
      alerts,
      timestamp: new Date(),
    };
  }
}
