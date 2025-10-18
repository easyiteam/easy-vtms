import { Injectable } from '@nestjs/common';

export interface PerformanceMetrics {
  timestamp: Date;
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  keys: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  database: {
    connected: boolean;
    responseTime: number;
  };
  redis: {
    connected: boolean;
    responseTime: number;
  };
  services: {
    name: string;
    status: 'up' | 'down';
    responseTime: number;
  }[];
}

@Injectable()
export class OptimizationService {
  private performanceMetrics: PerformanceMetrics[] = [];
  private cacheStats: Map<string, CacheStats> = new Map();
  private readonly maxMetricsSize = 1000;
  private startTime: Date = new Date();

  /**
   * Record performance metric
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.performanceMetrics.push(metric);

    // Keep only last N metrics
    if (this.performanceMetrics.length > this.maxMetricsSize) {
      this.performanceMetrics.shift();
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(limit: number = 100): PerformanceMetrics[] {
    return this.performanceMetrics.slice(-limit);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): any {
    if (this.performanceMetrics.length === 0) {
      return {
        total: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        byEndpoint: {},
        byStatusCode: {},
      };
    }

    const durations = this.performanceMetrics.map((m) => m.duration);
    const total = this.performanceMetrics.length;
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / total;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    // Group by endpoint
    const byEndpoint = this.performanceMetrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = { count: 0, totalDuration: 0, avgDuration: 0 };
      }
      acc[key].count++;
      acc[key].totalDuration += metric.duration;
      acc[key].avgDuration = acc[key].totalDuration / acc[key].count;
      return acc;
    }, {} as Record<string, any>);

    // Group by status code
    const byStatusCode = this.performanceMetrics.reduce((acc, metric) => {
      const code = metric.statusCode.toString();
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find slowest endpoints
    const slowestEndpoints = Object.entries(byEndpoint)
      .sort(([, a]: any, [, b]: any) => b.avgDuration - a.avgDuration)
      .slice(0, 10)
      .map(([endpoint, stats]) => ({ endpoint, ...stats }));

    return {
      total,
      averageDuration: Math.round(avg),
      minDuration: Math.round(min),
      maxDuration: Math.round(max),
      byEndpoint,
      byStatusCode,
      slowestEndpoints,
    };
  }

  /**
   * Update cache statistics
   */
  updateCacheStats(cacheName: string, hit: boolean): void {
    let stats = this.cacheStats.get(cacheName);
    if (!stats) {
      stats = { hits: 0, misses: 0, hitRate: 0, size: 0, keys: 0 };
      this.cacheStats.set(cacheName, stats);
    }

    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }

    const total = stats.hits + stats.misses;
    stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Map<string, CacheStats> {
    return this.cacheStats;
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const uptime = (Date.now() - this.startTime.getTime()) / 1000; // seconds
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const memPercentage = (usedMem / totalMem) * 100;

    // Mock CPU usage (in production, use proper monitoring)
    const cpuUsage = Math.random() * 100;

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (memPercentage > 90 || cpuUsage > 90) {
      status = 'unhealthy';
    } else if (memPercentage > 70 || cpuUsage > 70) {
      status = 'degraded';
    }

    return {
      status,
      uptime,
      memory: {
        used: usedMem,
        total: totalMem,
        percentage: memPercentage,
      },
      cpu: {
        usage: cpuUsage,
      },
      database: {
        connected: true,
        responseTime: 5, // Mock
      },
      redis: {
        connected: true,
        responseTime: 2, // Mock
      },
      services: [
        { name: 'WebSocket', status: 'up', responseTime: 1 },
        { name: 'AIS Decoder', status: 'up', responseTime: 3 },
        { name: 'Weather API', status: 'up', responseTime: 150 },
      ],
    };
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    const stats = this.getPerformanceStats();
    const health = await this.getSystemHealth();

    // Check slow endpoints
    if (stats.averageDuration > 500) {
      recommendations.push(
        `Average response time is ${stats.averageDuration}ms. Consider optimizing slow endpoints.`,
      );
    }

    // Check memory usage
    if (health.memory.percentage > 80) {
      recommendations.push(
        `Memory usage is at ${health.memory.percentage.toFixed(1)}%. Consider increasing memory or optimizing memory usage.`,
      );
    }

    // Check CPU usage
    if (health.cpu.usage > 80) {
      recommendations.push(
        `CPU usage is at ${health.cpu.usage.toFixed(1)}%. Consider scaling horizontally or optimizing CPU-intensive operations.`,
      );
    }

    // Check cache hit rate
    const cacheStats = Array.from(this.cacheStats.values());
    const avgHitRate =
      cacheStats.length > 0
        ? cacheStats.reduce((sum, s) => sum + s.hitRate, 0) / cacheStats.length
        : 0;

    if (avgHitRate < 70) {
      recommendations.push(
        `Cache hit rate is ${avgHitRate.toFixed(1)}%. Consider reviewing cache strategy.`,
      );
    }

    // Check error rate
    const errorCount = Object.entries(stats.byStatusCode)
      .filter(([code]) => code.startsWith('5'))
      .reduce((sum, [, count]) => sum + (count as number), 0);

    const errorRate = stats.total > 0 ? (errorCount / stats.total) * 100 : 0;

    if (errorRate > 1) {
      recommendations.push(
        `Error rate is ${errorRate.toFixed(2)}%. Investigate and fix server errors.`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('System is performing well. Continue monitoring.');
    }

    return recommendations;
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanMinutes: number = 60): number {
    const cutoffTime = Date.now() - olderThanMinutes * 60 * 1000;
    const initialLength = this.performanceMetrics.length;

    this.performanceMetrics = this.performanceMetrics.filter(
      (m) => m.timestamp.getTime() > cutoffTime,
    );

    return initialLength - this.performanceMetrics.length;
  }

  /**
   * Get compression recommendations
   */
  getCompressionRecommendations(): any {
    return {
      enabled: true,
      algorithms: ['gzip', 'deflate', 'br'],
      threshold: 1024, // bytes
      level: 6, // compression level
      recommendations: [
        'Enable Brotli compression for better compression ratios',
        'Set appropriate compression thresholds based on response sizes',
        'Consider pre-compressing static assets',
      ],
    };
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitingConfig(): any {
    return {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      recommendations: [
        'Implement different rate limits for authenticated vs anonymous users',
        'Add stricter limits for expensive operations (exports, reports)',
        'Consider implementing distributed rate limiting with Redis',
      ],
    };
  }
}
