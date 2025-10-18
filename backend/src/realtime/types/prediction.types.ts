export interface PredictedPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed: number;
  course: number;
  confidence: number; // 0-1
}

export interface TrajectoryPrediction {
  mmsi: string;
  currentPosition: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  predictedPoints: PredictedPoint[];
  estimatedArrival?: {
    latitude: number;
    longitude: number;
    eta: Date;
    distance: number; // nautical miles
  };
}

export interface AnomalyDetection {
  mmsi: string;
  type: 'speed' | 'course' | 'drift' | 'signal_loss' | 'unusual_route';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  currentValue?: number;
  expectedValue?: number;
  deviation?: number;
}
