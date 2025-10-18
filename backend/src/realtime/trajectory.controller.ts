import {
  Controller,
  Get,
  Query,
  Param,
  HttpException,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { TrajectoryHistoryService, TrajectoryQuery } from './services/trajectory-history.service';

@Controller('api/trajectories')
export class TrajectoryController {
  constructor(
    private readonly trajectoryService: TrajectoryHistoryService,
  ) {}

  /**
   * Get trajectory for a specific vessel
   * GET /api/trajectories/:mmsi
   */
  @Get(':mmsi')
  async getVesselTrajectory(
    @Param('mmsi') mmsi: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('minSpeed') minSpeed?: string,
    @Query('maxSpeed') maxSpeed?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const query: TrajectoryQuery = {
        mmsi,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        minSpeed: minSpeed ? parseFloat(minSpeed) : undefined,
        maxSpeed: maxSpeed ? parseFloat(maxSpeed) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      };

      const trajectory = await this.trajectoryService.getTrajectory(query);

      return {
        success: true,
        mmsi,
        pointCount: trajectory.length,
        points: trajectory,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get trajectory: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get aggregated trajectory (downsampled)
   * GET /api/trajectories/:mmsi/aggregated
   */
  @Get(':mmsi/aggregated')
  async getAggregatedTrajectory(
    @Param('mmsi') mmsi: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('interval') interval?: string,
  ) {
    try {
      if (!startTime || !endTime) {
        throw new HttpException(
          'startTime and endTime are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const intervalMinutes = interval ? parseInt(interval) : 1;
      const points = await this.trajectoryService.getAggregatedTrajectory(
        mmsi,
        new Date(startTime),
        new Date(endTime),
        intervalMinutes,
      );

      return {
        success: true,
        mmsi,
        intervalMinutes,
        pointCount: points.length,
        points,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get aggregated trajectory: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get trajectory statistics
   * GET /api/trajectories/:mmsi/stats
   */
  @Get(':mmsi/stats')
  async getTrajectoryStats(
    @Param('mmsi') mmsi: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    try {
      const stats = await this.trajectoryService.getTrajectoryStats(
        mmsi,
        startTime ? new Date(startTime) : undefined,
        endTime ? new Date(endTime) : undefined,
      );

      if (!stats) {
        throw new HttpException(
          'No trajectory data found for this vessel',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        stats,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get trajectory stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all vessels with trajectory data
   * GET /api/trajectories/vessels/list
   */
  @Get('vessels/list')
  async getVesselsWithTrajectories(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    try {
      if (!startTime || !endTime) {
        throw new HttpException(
          'startTime and endTime are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const vessels = await this.trajectoryService.getVesselsWithTrajectories(
        new Date(startTime),
        new Date(endTime),
      );

      return {
        success: true,
        count: vessels.length,
        vessels,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get vessels list: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get heatmap data
   * GET /api/trajectories/heatmap
   */
  @Get('heatmap/data')
  async getHeatmapData(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('gridSize') gridSize?: string,
  ) {
    try {
      if (!startTime || !endTime) {
        throw new HttpException(
          'startTime and endTime are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const grid = gridSize ? parseFloat(gridSize) : 0.01;
      const heatmap = await this.trajectoryService.getHeatmapData(
        new Date(startTime),
        new Date(endTime),
        grid,
      );

      return {
        success: true,
        gridSize: grid,
        pointCount: heatmap.length,
        data: heatmap,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get heatmap data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Export trajectory to CSV
   * GET /api/trajectories/:mmsi/export/csv
   */
  @Get(':mmsi/export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="trajectory.csv"')
  async exportTrajectoryCSV(
    @Param('mmsi') mmsi: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    try {
      const query: TrajectoryQuery = {
        mmsi,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
      };

      const csv = await this.trajectoryService.exportTrajectoryCSV(query);
      return csv;
    } catch (error) {
      throw new HttpException(
        `Failed to export trajectory: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get summary for multiple vessels
   * POST /api/trajectories/summary
   */
  @Get('summary/multi')
  async getMultiVesselSummary(
    @Query('mmsis') mmsis: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    try {
      if (!mmsis || !startTime || !endTime) {
        throw new HttpException(
          'mmsis, startTime and endTime are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const mmsiArray = mmsis.split(',');
      const summaries = await this.trajectoryService.getMultiVesselSummary(
        mmsiArray,
        new Date(startTime),
        new Date(endTime),
      );

      return {
        success: true,
        count: summaries.length,
        summaries,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get multi-vessel summary: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Trigger manual cleanup of old data
   * POST /api/trajectories/cleanup
   */
  @Get('admin/cleanup')
  async cleanupOldData() {
    try {
      const deletedCount = await this.trajectoryService.cleanupOldData();

      return {
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} old trajectory points`,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to cleanup data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
