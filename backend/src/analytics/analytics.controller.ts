import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get dashboard statistics',
    description: 'Returns comprehensive dashboard statistics including vessels, alerts, messages, port operations, and performance metrics'
  })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboard() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('timeseries/alerts')
  @ApiOperation({ 
    summary: 'Get alerts time series data',
    description: 'Returns time series data for alerts over a specified number of days'
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 7)' })
  @ApiResponse({ status: 200, description: 'Time series data retrieved successfully' })
  async getAlertsTimeSeries(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.analyticsService.getAlertsTimeSeries(daysNum);
  }

  @Get('timeseries/messages')
  @ApiOperation({ 
    summary: 'Get messages time series data',
    description: 'Returns time series data for VTS messages over a specified number of days'
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 7)' })
  @ApiResponse({ status: 200, description: 'Time series data retrieved successfully' })
  async getMessagesTimeSeries(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.analyticsService.getMessagesTimeSeries(daysNum);
  }

  @Get('report')
  @ApiOperation({ 
    summary: 'Generate comprehensive report',
    description: 'Generates a detailed report for a specified period including alerts, messages, and port operations'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async generateReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.analyticsService.generateReport(start, end);
  }

  @Get('export')
  @ApiOperation({ 
    summary: 'Export data to CSV',
    description: 'Exports alerts, messages, or reservations data to CSV format'
  })
  @ApiQuery({ name: 'entity', required: true, enum: ['alerts', 'messages', 'reservations'], description: 'Entity type to export' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file generated successfully' })
  async exportData(
    @Query('entity') entity: 'alerts' | 'messages' | 'reservations',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const csv = await this.analyticsService.exportToCSV(entity, start, end);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entity}_export.csv"`);
    res.send(csv);
  }
}
