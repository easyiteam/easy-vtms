import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { WeatherData, WeatherForecast, WeatherAlert, MaritimeConditions } from './types/weather.types';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;
  private readonly apiBaseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheDuration = 10 * 60 * 1000; // 10 minutes

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENWEATHER_API_KEY') || 'demo';
    if (this.apiKey === 'demo') {
      this.logger.warn('OpenWeather API key not configured, using demo mode');
    }
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    const cacheKey = `current_${lat}_${lon}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.apiKey === 'demo') {
        return this.getMockWeatherData(lat, lon);
      }

      const response = await axios.get(`${this.apiBaseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
        },
      });

      const data = this.transformCurrentWeather(response.data, lat, lon);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch weather data: ${error.message}`);
      return this.getMockWeatherData(lat, lon);
    }
  }

  /**
   * Get weather forecast for a location
   */
  async getWeatherForecast(lat: number, lon: number, hours: number = 24): Promise<WeatherData> {
    const cacheKey = `forecast_${lat}_${lon}_${hours}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.apiKey === 'demo') {
        return this.getMockWeatherDataWithForecast(lat, lon, hours);
      }

      const response = await axios.get(`${this.apiBaseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
        },
      });

      const data = this.transformForecastWeather(response.data, lat, lon, hours);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch forecast data: ${error.message}`);
      return this.getMockWeatherDataWithForecast(lat, lon, hours);
    }
  }

  /**
   * Get maritime conditions based on weather data
   */
  async getMaritimeConditions(lat: number, lon: number): Promise<MaritimeConditions> {
    const weather = await this.getCurrentWeather(lat, lon);
    return this.calculateMaritimeConditions(weather);
  }

  /**
   * Generate weather alerts based on conditions
   */
  async generateWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    const weather = await this.getCurrentWeather(lat, lon);
    const alerts: WeatherAlert[] = [];

    // Wind alert
    if (weather.current.windSpeed > 15) { // > 30 knots
      alerts.push({
        type: 'wind',
        severity: weather.current.windSpeed > 25 ? 'critical' : 'high',
        title: 'High Wind Warning',
        description: `Wind speed: ${this.msToKnots(weather.current.windSpeed).toFixed(1)} knots`,
        affectedArea: { latitude: lat, longitude: lon, radius: 50 },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 6 * 3600000),
        recommendations: [
          'Reduce speed',
          'Secure all loose items',
          'Monitor weather updates',
        ],
      });
    }

    // Visibility alert
    if (weather.current.visibility < 1000) {
      alerts.push({
        type: 'visibility',
        severity: weather.current.visibility < 500 ? 'critical' : 'high',
        title: 'Low Visibility Warning',
        description: `Visibility: ${(weather.current.visibility / 1852).toFixed(1)} NM`,
        affectedArea: { latitude: lat, longitude: lon, radius: 20 },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 3 * 3600000),
        recommendations: [
          'Reduce speed',
          'Use radar',
          'Sound fog signals',
          'Post additional lookouts',
        ],
      });
    }

    // Storm alert
    if (weather.current.weather.main === 'Thunderstorm') {
      alerts.push({
        type: 'storm',
        severity: 'critical',
        title: 'Thunderstorm Warning',
        description: weather.current.weather.description,
        affectedArea: { latitude: lat, longitude: lon, radius: 100 },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 12 * 3600000),
        recommendations: [
          'Seek shelter if possible',
          'Avoid open waters',
          'Disconnect electronics',
          'Monitor weather radar',
        ],
      });
    }

    // Fog alert
    if (weather.current.weather.main === 'Fog' || weather.current.weather.main === 'Mist') {
      alerts.push({
        type: 'fog',
        severity: 'medium',
        title: 'Fog Advisory',
        description: weather.current.weather.description,
        affectedArea: { latitude: lat, longitude: lon, radius: 30 },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 6 * 3600000),
        recommendations: [
          'Reduce speed',
          'Use navigation lights',
          'Sound fog signals',
        ],
      });
    }

    return alerts;
  }

  /**
   * Calculate maritime conditions from weather data
   */
  private calculateMaritimeConditions(weather: WeatherData): MaritimeConditions {
    const windSpeedKnots = this.msToKnots(weather.current.windSpeed);
    const beaufortScale = this.calculateBeaufortScale(windSpeedKnots);
    const visibilityNM = weather.current.visibility / 1852;

    // Estimate wave height based on wind speed (simplified)
    const waveHeight = Math.pow(windSpeedKnots / 10, 2) * 0.5;

    return {
      seaState: {
        waveHeight: Math.max(0.1, waveHeight),
        wavePeriod: 5 + waveHeight * 2,
        waveDirection: weather.current.windDirection,
        description: this.getSeaStateDescription(waveHeight),
      },
      visibility: {
        distance: visibilityNM,
        condition: this.getVisibilityCondition(visibilityNM),
      },
      windConditions: {
        beaufortScale,
        description: this.getBeaufortDescription(beaufortScale),
        isSafeForNavigation: beaufortScale <= 6,
      },
      warnings: this.generateWarnings(weather, beaufortScale, visibilityNM),
    };
  }

  /**
   * Transform OpenWeather API response to our format
   */
  private transformCurrentWeather(data: any, lat: number, lon: number): WeatherData {
    return {
      location: {
        latitude: lat,
        longitude: lon,
        name: data.name,
      },
      current: {
        timestamp: new Date(data.dt * 1000),
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        pressure: data.main.pressure,
        humidity: data.main.humidity,
        visibility: data.visibility,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        windGust: data.wind.gust,
        clouds: data.clouds.all,
        weather: data.weather[0],
        rain: data.rain?.['1h'],
        snow: data.snow?.['1h'],
      },
    };
  }

  /**
   * Transform forecast API response
   */
  private transformForecastWeather(data: any, lat: number, lon: number, hours: number): WeatherData {
    const current = data.list[0];
    const maxForecasts = Math.ceil(hours / 3); // API returns 3-hour intervals

    const forecast: WeatherForecast[] = data.list.slice(0, maxForecasts).map((item: any) => ({
      timestamp: new Date(item.dt * 1000),
      temperature: item.main.temp,
      feelsLike: item.main.feels_like,
      pressure: item.main.pressure,
      humidity: item.main.humidity,
      windSpeed: item.wind.speed,
      windDirection: item.wind.deg,
      clouds: item.clouds.all,
      weather: item.weather[0],
      rain: item.rain?.['3h'],
      snow: item.snow?.['3h'],
      pop: item.pop,
    }));

    return {
      location: {
        latitude: lat,
        longitude: lon,
        name: data.city.name,
      },
      current: {
        timestamp: new Date(current.dt * 1000),
        temperature: current.main.temp,
        feelsLike: current.main.feels_like,
        pressure: current.main.pressure,
        humidity: current.main.humidity,
        visibility: 10000, // Not provided in forecast
        windSpeed: current.wind.speed,
        windDirection: current.wind.deg,
        windGust: current.wind.gust,
        clouds: current.clouds.all,
        weather: current.weather[0],
        rain: current.rain?.['3h'],
        snow: current.snow?.['3h'],
      },
      forecast,
    };
  }

  /**
   * Generate mock weather data for demo mode
   */
  private getMockWeatherData(lat: number, lon: number): WeatherData {
    return {
      location: { latitude: lat, longitude: lon, name: 'Demo Location' },
      current: {
        timestamp: new Date(),
        temperature: 18 + Math.random() * 5,
        feelsLike: 17 + Math.random() * 5,
        pressure: 1013 + Math.random() * 10,
        humidity: 65 + Math.random() * 20,
        visibility: 8000 + Math.random() * 2000,
        windSpeed: 5 + Math.random() * 10,
        windDirection: Math.random() * 360,
        windGust: 8 + Math.random() * 12,
        clouds: Math.random() * 100,
        weather: {
          id: 800,
          main: 'Clear',
          description: 'clear sky',
          icon: '01d',
        },
      },
    };
  }

  /**
   * Generate mock weather data with forecast
   */
  private getMockWeatherDataWithForecast(lat: number, lon: number, hours: number): WeatherData {
    const base = this.getMockWeatherData(lat, lon);
    const forecast: WeatherForecast[] = [];

    for (let i = 1; i <= Math.ceil(hours / 3); i++) {
      forecast.push({
        timestamp: new Date(Date.now() + i * 3 * 3600000),
        temperature: 18 + Math.random() * 5,
        feelsLike: 17 + Math.random() * 5,
        pressure: 1013 + Math.random() * 10,
        humidity: 65 + Math.random() * 20,
        windSpeed: 5 + Math.random() * 10,
        windDirection: Math.random() * 360,
        clouds: Math.random() * 100,
        weather: {
          id: 800,
          main: 'Clear',
          description: 'clear sky',
          icon: '01d',
        },
        pop: Math.random() * 0.3,
      });
    }

    return { ...base, forecast };
  }

  // Helper methods
  private msToKnots(ms: number): number {
    return ms * 1.94384;
  }

  private calculateBeaufortScale(knots: number): number {
    if (knots < 1) return 0;
    if (knots < 4) return 1;
    if (knots < 7) return 2;
    if (knots < 11) return 3;
    if (knots < 17) return 4;
    if (knots < 22) return 5;
    if (knots < 28) return 6;
    if (knots < 34) return 7;
    if (knots < 41) return 8;
    if (knots < 48) return 9;
    if (knots < 56) return 10;
    if (knots < 64) return 11;
    return 12;
  }

  private getBeaufortDescription(scale: number): string {
    const descriptions = [
      'Calm',
      'Light air',
      'Light breeze',
      'Gentle breeze',
      'Moderate breeze',
      'Fresh breeze',
      'Strong breeze',
      'Near gale',
      'Gale',
      'Strong gale',
      'Storm',
      'Violent storm',
      'Hurricane',
    ];
    return descriptions[scale] || 'Unknown';
  }

  private getSeaStateDescription(waveHeight: number): string {
    if (waveHeight < 0.5) return 'Calm (glassy)';
    if (waveHeight < 1) return 'Calm (rippled)';
    if (waveHeight < 2) return 'Smooth';
    if (waveHeight < 3) return 'Slight';
    if (waveHeight < 4) return 'Moderate';
    if (waveHeight < 6) return 'Rough';
    if (waveHeight < 9) return 'Very rough';
    if (waveHeight < 14) return 'High';
    return 'Very high';
  }

  private getVisibilityCondition(nm: number): 'excellent' | 'good' | 'moderate' | 'poor' | 'very_poor' {
    if (nm > 10) return 'excellent';
    if (nm > 5) return 'good';
    if (nm > 2) return 'moderate';
    if (nm > 1) return 'poor';
    return 'very_poor';
  }

  private generateWarnings(weather: WeatherData, beaufort: number, visibilityNM: number): string[] {
    const warnings: string[] = [];

    if (beaufort >= 7) {
      warnings.push('Strong winds - consider delaying departure');
    }
    if (visibilityNM < 2) {
      warnings.push('Low visibility - use caution');
    }
    if (weather.current.weather.main === 'Thunderstorm') {
      warnings.push('Thunderstorm activity - seek shelter');
    }
    if (weather.current.temperature < 0) {
      warnings.push('Freezing conditions - risk of ice formation');
    }

    return warnings;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}
