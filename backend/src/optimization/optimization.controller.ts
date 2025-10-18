import { Controller, Get, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { OptimizationService } from './optimization.service';

@ApiTags('optimization')
@Controller('api/optimization')
export class OptimizationController {
  constructor(private readonly optimizationService: OptimizationService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get performance metrics', description: 'Returns performance metrics for recent requests' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of metrics (default: 100)' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  async getMetrics(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.optimizationService.getPerformanceMetrics(limitNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get performance statistics', description: 'Returns aggregated performance statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.optimizationService.getPerformanceStats();
  }

  @Get('cache')
  @ApiOperation({ summary: 'Get cache statistics', description: 'Returns cache hit/miss statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully' })
  async getCacheStats() {
    const stats = this.optimizationService.getCacheStats();
    return Object.fromEntries(stats);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health', description: 'Returns system health status including memory, CPU, and services' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealth() {
    return this.optimizationService.getSystemHealth();
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get optimization recommendations', description: 'Returns AI-generated optimization recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations generated successfully' })
  async getRecommendations() {
    return this.optimizationService.getOptimizationRecommendations();
  }

  @Delete('metrics')
  @ApiOperation({ summary: 'Clear old metrics', description: 'Deletes metrics older than specified minutes' })
  @ApiQuery({ name: 'olderThan', required: false, type: Number, description: 'Minutes threshold (default: 60)' })
  @ApiResponse({ status: 200, description: 'Old metrics cleared successfully' })
  async clearMetrics(@Query('olderThan') olderThan?: string) {
    const minutes = olderThan ? parseInt(olderThan, 10) : 60;
    const cleared = this.optimizationService.clearOldMetrics(minutes);
    return { cleared, message: `Cleared ${cleared} old metrics` };
  }

  @Get('compression')
  @ApiOperation({ summary: 'Get compression configuration', description: 'Returns compression settings and recommendations' })
  @ApiResponse({ status: 200, description: 'Compression config retrieved successfully' })
  async getCompressionConfig() {
    return this.optimizationService.getCompressionRecommendations();
  }

  @Get('rate-limiting')
  @ApiOperation({ summary: 'Get rate limiting configuration', description: 'Returns rate limiting settings and recommendations' })
  @ApiResponse({ status: 200, description: 'Rate limiting config retrieved successfully' })
  async getRateLimitingConfig() {
    return this.optimizationService.getRateLimitingConfig();
  }
}
