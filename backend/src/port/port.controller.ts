import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { PortService } from './port.service';
import { BerthStatus, BerthType } from './entities/berth.entity';
import { ReservationStatus } from './entities/berth-reservation.entity';
import { PilotServiceStatus } from './entities/pilot-service.entity';

@ApiTags('port')
@Controller('api/port')
export class PortController {
  constructor(private readonly portService: PortService) {}

  // ===== BERTH ENDPOINTS =====

  @Get('berths')
  @ApiOperation({ summary: 'Get all berths', description: 'Returns all berths or filters by type' })
  @ApiQuery({ name: 'type', required: false, enum: BerthType, description: 'Filter by berth type' })
  @ApiResponse({ status: 200, description: 'Berths retrieved successfully' })
  async getAllBerths(@Query('type') type?: string) {
    if (type) {
      return this.portService.getAvailableBerths(type as BerthType);
    }
    return this.portService.getAllBerths();
  }

  /**
   * GET /api/port/berths/available
   * Get available berths
   */
  @Get('berths/available')
  async getAvailableBerths(@Query('type') type?: string) {
    return this.portService.getAvailableBerths(type as BerthType);
  }

  /**
   * GET /api/port/berths/:id
   * Get berth by ID
   */
  @Get('berths/:id')
  async getBerth(@Param('id') id: string) {
    return this.portService.getBerth(id);
  }

  /**
   * PUT /api/port/berths/:id/status
   * Update berth status
   */
  @Put('berths/:id/status')
  async updateBerthStatus(
    @Param('id') id: string,
    @Body('status') status: BerthStatus,
  ) {
    return this.portService.updateBerthStatus(id, status);
  }

  /**
   * PUT /api/port/berths/:id/occupy
   * Occupy berth
   */
  @Put('berths/:id/occupy')
  async occupyBerth(
    @Param('id') id: string,
    @Body() body: { vesselMmsi: string; vesselName: string; expectedDeparture?: string },
  ) {
    const expectedDeparture = body.expectedDeparture ? new Date(body.expectedDeparture) : undefined;
    return this.portService.occupyBerth(id, body.vesselMmsi, body.vesselName, expectedDeparture);
  }

  /**
   * PUT /api/port/berths/:id/release
   * Release berth
   */
  @Put('berths/:id/release')
  async releaseBerth(@Param('id') id: string) {
    return this.portService.releaseBerth(id);
  }

  // ===== RESERVATION ENDPOINTS =====

  /**
   * POST /api/port/reservations
   * Create reservation
   */
  @Post('reservations')
  async createReservation(@Body() data: any) {
    // Convert date strings to Date objects
    if (data.arrivalTime) data.arrivalTime = new Date(data.arrivalTime);
    if (data.departureTime) data.departureTime = new Date(data.departureTime);

    return this.portService.createReservation(data);
  }

  /**
   * GET /api/port/reservations
   * Get reservations
   */
  @Get('reservations')
  async getReservations(
    @Query('berthId') berthId?: string,
    @Query('vesselMmsi') vesselMmsi?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (berthId) filters.berthId = berthId;
    if (vesselMmsi) filters.vesselMmsi = vesselMmsi;
    if (status) filters.status = status as ReservationStatus;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.portService.getReservations(filters);
  }

  /**
   * PUT /api/port/reservations/:id/confirm
   * Confirm reservation
   */
  @Put('reservations/:id/confirm')
  async confirmReservation(@Param('id') id: string) {
    return this.portService.confirmReservation(id);
  }

  /**
   * PUT /api/port/reservations/:id/activate
   * Activate reservation
   */
  @Put('reservations/:id/activate')
  async activateReservation(@Param('id') id: string) {
    return this.portService.activateReservation(id);
  }

  /**
   * PUT /api/port/reservations/:id/complete
   * Complete reservation
   */
  @Put('reservations/:id/complete')
  async completeReservation(@Param('id') id: string) {
    return this.portService.completeReservation(id);
  }

  /**
   * PUT /api/port/reservations/:id/cancel
   * Cancel reservation
   */
  @Put('reservations/:id/cancel')
  async cancelReservation(@Param('id') id: string, @Body('reason') reason: string) {
    return this.portService.cancelReservation(id, reason);
  }

  // ===== PILOT SERVICE ENDPOINTS =====

  /**
   * POST /api/port/pilot-services
   * Request pilot service
   */
  @Post('pilot-services')
  async requestPilotService(@Body() data: any) {
    if (data.scheduledTime) data.scheduledTime = new Date(data.scheduledTime);
    return this.portService.requestPilotService(data);
  }

  /**
   * GET /api/port/pilot-services
   * Get pilot services
   */
  @Get('pilot-services')
  async getPilotServices(
    @Query('vesselMmsi') vesselMmsi?: string,
    @Query('pilotId') pilotId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (vesselMmsi) filters.vesselMmsi = vesselMmsi;
    if (pilotId) filters.pilotId = pilotId;
    if (status) filters.status = status as PilotServiceStatus;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.portService.getPilotServices(filters);
  }

  /**
   * PUT /api/port/pilot-services/:id/assign
   * Assign pilot
   */
  @Put('pilot-services/:id/assign')
  async assignPilot(
    @Param('id') id: string,
    @Body() body: { pilotId: string; pilotName: string; pilotLicense: string },
  ) {
    return this.portService.assignPilot(id, body.pilotId, body.pilotName, body.pilotLicense);
  }

  /**
   * PUT /api/port/pilot-services/:id/start
   * Start pilot service
   */
  @Put('pilot-services/:id/start')
  async startPilotService(@Param('id') id: string) {
    return this.portService.startPilotService(id);
  }

  /**
   * PUT /api/port/pilot-services/:id/complete
   * Complete pilot service
   */
  @Put('pilot-services/:id/complete')
  async completePilotService(@Param('id') id: string, @Body('notes') notes?: string) {
    return this.portService.completePilotService(id, notes);
  }

  // ===== STATISTICS =====

  /**
   * GET /api/port/statistics
   * Get port statistics
   */
  @Get('statistics')
  async getStatistics() {
    return this.portService.getPortStatistics();
  }
}
