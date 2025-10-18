export interface WeatherData {
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  current: {
    timestamp: Date;
    temperature: number; // Celsius
    feelsLike: number;
    pressure: number; // hPa
    humidity: number; // %
    visibility: number; // meters
    windSpeed: number; // m/s
    windDirection: number; // degrees
    windGust?: number; // m/s
    clouds: number; // %
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    };
    rain?: number; // mm/h
    snow?: number; // mm/h
  };
  forecast?: WeatherForecast[];
}

export interface WeatherForecast {
  timestamp: Date;
  temperature: number;
  feelsLike: number;
  pressure: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  clouds: number;
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  };
  rain?: number;
  snow?: number;
  pop?: number; // Probability of precipitation (0-1)
}

export interface WeatherAlert {
  type: 'wind' | 'visibility' | 'storm' | 'fog' | 'ice';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedArea: {
    latitude: number;
    longitude: number;
    radius: number; // nautical miles
  };
  validFrom: Date;
  validUntil: Date;
  recommendations: string[];
}

export interface MaritimeConditions {
  seaState: {
    waveHeight: number; // meters
    wavePeriod: number; // seconds
    waveDirection: number; // degrees
    description: string;
  };
  visibility: {
    distance: number; // nautical miles
    condition: 'excellent' | 'good' | 'moderate' | 'poor' | 'very_poor';
  };
  windConditions: {
    beaufortScale: number; // 0-12
    description: string;
    isSafeForNavigation: boolean;
  };
  warnings: string[];
}
