import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { Berth, BerthStatus, BerthType } from './entities/berth.entity';
import { BerthReservation, ReservationStatus } from './entities/berth-reservation.entity';
import { PilotService, PilotServiceStatus, PilotServiceType } from './entities/pilot-service.entity';

@Injectable()
export class PortService {
  constructor(
    @InjectRepository(Berth)
    private berthRepository: Repository<Berth>,
    @InjectRepository(BerthReservation)
    private reservationRepository: Repository<BerthReservation>,
    @InjectRepository(PilotService)
    private pilotServiceRepository: Repository<PilotService>,
  ) {
    this.initializeBerths();
  }

  // ===== BERTH MANAGEMENT =====

  /**
   * Get all berths
   */
  async getAllBerths(): Promise<Berth[]> {
    return this.berthRepository.find({
      order: { code: 'ASC' },
    });
  }

  /**
   * Get berth by ID
   */
  async getBerth(id: string): Promise<Berth> {
    const berth = await this.berthRepository.findOne({ where: { id } });
    if (!berth) {
      throw new NotFoundException('Berth not found');
    }
    return berth;
  }

  /**
   * Get available berths
   */
  async getAvailableBerths(type?: BerthType): Promise<Berth[]> {
    const where: any = { status: BerthStatus.AVAILABLE };
    if (type) {
      where.type = type;
    }

    return this.berthRepository.find({
      where,
      order: { code: 'ASC' },
    });
  }

  /**
   * Update berth status
   */
  async updateBerthStatus(id: string, status: BerthStatus): Promise<Berth> {
    const berth = await this.getBerth(id);
    berth.status = status;

    if (status === BerthStatus.AVAILABLE) {
      berth.currentVesselMmsi = null;
      berth.currentVesselName = null;
      berth.occupiedSince = null;
      berth.expectedDeparture = null;
    }

    return this.berthRepository.save(berth);
  }

  /**
   * Occupy berth
   */
  async occupyBerth(
    id: string,
    vesselMmsi: string,
    vesselName: string,
    expectedDeparture?: Date,
  ): Promise<Berth> {
    const berth = await this.getBerth(id);

    if (berth.status !== BerthStatus.AVAILABLE && berth.status !== BerthStatus.RESERVED) {
      throw new BadRequestException('Berth is not available');
    }

    berth.status = BerthStatus.OCCUPIED;
    berth.currentVesselMmsi = vesselMmsi;
    berth.currentVesselName = vesselName;
    berth.occupiedSince = new Date();
    berth.expectedDeparture = expectedDeparture;

    return this.berthRepository.save(berth);
  }

  /**
   * Release berth
   */
  async releaseBerth(id: string): Promise<Berth> {
    return this.updateBerthStatus(id, BerthStatus.AVAILABLE);
  }

  // ===== RESERVATION MANAGEMENT =====

  /**
   * Create berth reservation
   */
  async createReservation(data: Partial<BerthReservation>): Promise<BerthReservation> {
    // Check berth availability
    const berth = await this.getBerth(data.berthId);

    // Check for conflicts
    const conflicts = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.berthId = :berthId', { berthId: data.berthId })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: [ReservationStatus.CONFIRMED, ReservationStatus.ACTIVE],
      })
      .andWhere(
        '(reservation.arrivalTime <= :departure AND reservation.departureTime >= :arrival)',
        {
          arrival: data.arrivalTime,
          departure: data.departureTime,
        },
      )
      .getMany();

    if (conflicts.length > 0) {
      throw new BadRequestException('Berth is already reserved for this time period');
    }

    // Calculate estimated cost
    const duration = (data.departureTime.getTime() - data.arrivalTime.getTime()) / (1000 * 3600); // hours
    const estimatedCost = berth.hourlyRate ? berth.hourlyRate * duration : null;

    const reservation = this.reservationRepository.create({
      ...data,
      berthCode: berth.code,
      status: ReservationStatus.PENDING,
      estimatedCost,
    });

    return this.reservationRepository.save(reservation);
  }

  /**
   * Get reservations
   */
  async getReservations(filters?: {
    berthId?: string;
    vesselMmsi?: string;
    status?: ReservationStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<BerthReservation[]> {
    const query = this.reservationRepository.createQueryBuilder('reservation');

    if (filters?.berthId) {
      query.andWhere('reservation.berthId = :berthId', { berthId: filters.berthId });
    }

    if (filters?.vesselMmsi) {
      query.andWhere('reservation.vesselMmsi = :vesselMmsi', { vesselMmsi: filters.vesselMmsi });
    }

    if (filters?.status) {
      query.andWhere('reservation.status = :status', { status: filters.status });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('reservation.arrivalTime BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    query.orderBy('reservation.arrivalTime', 'ASC');

    return query.getMany();
  }

  /**
   * Confirm reservation
   */
  async confirmReservation(id: string): Promise<BerthReservation> {
    const reservation = await this.reservationRepository.findOne({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    reservation.status = ReservationStatus.CONFIRMED;

    // Reserve the berth
    await this.updateBerthStatus(reservation.berthId, BerthStatus.RESERVED);

    return this.reservationRepository.save(reservation);
  }

  /**
   * Activate reservation (vessel arrived)
   */
  async activateReservation(id: string): Promise<BerthReservation> {
    const reservation = await this.reservationRepository.findOne({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    reservation.status = ReservationStatus.ACTIVE;
    reservation.actualArrival = new Date();

    // Occupy the berth
    await this.occupyBerth(
      reservation.berthId,
      reservation.vesselMmsi,
      reservation.vesselName,
      reservation.departureTime,
    );

    return this.reservationRepository.save(reservation);
  }

  /**
   * Complete reservation (vessel departed)
   */
  async completeReservation(id: string): Promise<BerthReservation> {
    const reservation = await this.reservationRepository.findOne({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    reservation.status = ReservationStatus.COMPLETED;
    reservation.actualDeparture = new Date();

    // Calculate actual cost
    if (reservation.actualArrival) {
      const berth = await this.getBerth(reservation.berthId);
      const duration =
        (reservation.actualDeparture.getTime() - reservation.actualArrival.getTime()) /
        (1000 * 3600);
      reservation.actualCost = berth.hourlyRate ? berth.hourlyRate * duration : null;
    }

    // Release the berth
    await this.releaseBerth(reservation.berthId);

    return this.reservationRepository.save(reservation);
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(id: string, reason: string): Promise<BerthReservation> {
    const reservation = await this.reservationRepository.findOne({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const wasConfirmed = reservation.status === ReservationStatus.CONFIRMED;

    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancellationReason = reason;

    // Release berth if it was reserved
    if (wasConfirmed) {
      await this.releaseBerth(reservation.berthId);
    }

    return this.reservationRepository.save(reservation);
  }

  // ===== PILOT SERVICE MANAGEMENT =====

  /**
   * Request pilot service
   */
  async requestPilotService(data: Partial<PilotService>): Promise<PilotService> {
    const service = this.pilotServiceRepository.create({
      ...data,
      status: PilotServiceStatus.REQUESTED,
    });

    return this.pilotServiceRepository.save(service);
  }

  /**
   * Get pilot services
   */
  async getPilotServices(filters?: {
    vesselMmsi?: string;
    pilotId?: string;
    status?: PilotServiceStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PilotService[]> {
    const query = this.pilotServiceRepository.createQueryBuilder('service');

    if (filters?.vesselMmsi) {
      query.andWhere('service.vesselMmsi = :vesselMmsi', { vesselMmsi: filters.vesselMmsi });
    }

    if (filters?.pilotId) {
      query.andWhere('service.pilotId = :pilotId', { pilotId: filters.pilotId });
    }

    if (filters?.status) {
      query.andWhere('service.status = :status', { status: filters.status });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('service.scheduledTime BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    query.orderBy('service.scheduledTime', 'ASC');

    return query.getMany();
  }

  /**
   * Assign pilot
   */
  async assignPilot(
    serviceId: string,
    pilotId: string,
    pilotName: string,
    pilotLicense: string,
  ): Promise<PilotService> {
    const service = await this.pilotServiceRepository.findOne({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundException('Pilot service not found');
    }

    service.status = PilotServiceStatus.ASSIGNED;
    service.pilotId = pilotId;
    service.pilotName = pilotName;
    service.pilotLicense = pilotLicense;

    return this.pilotServiceRepository.save(service);
  }

  /**
   * Start pilot service
   */
  async startPilotService(serviceId: string): Promise<PilotService> {
    const service = await this.pilotServiceRepository.findOne({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundException('Pilot service not found');
    }

    service.status = PilotServiceStatus.IN_PROGRESS;
    service.actualBoardingTime = new Date();

    return this.pilotServiceRepository.save(service);
  }

  /**
   * Complete pilot service
   */
  async completePilotService(serviceId: string, notes?: string): Promise<PilotService> {
    const service = await this.pilotServiceRepository.findOne({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundException('Pilot service not found');
    }

    service.status = PilotServiceStatus.COMPLETED;
    service.actualCompletionTime = new Date();
    if (notes) {
      service.notes = notes;
    }

    return this.pilotServiceRepository.save(service);
  }

  /**
   * Get port statistics
   */
  async getPortStatistics(): Promise<any> {
    const [
      totalBerths,
      availableBerths,
      occupiedBerths,
      reservedBerths,
      activeReservations,
      pendingPilotServices,
    ] = await Promise.all([
      this.berthRepository.count(),
      this.berthRepository.count({ where: { status: BerthStatus.AVAILABLE } }),
      this.berthRepository.count({ where: { status: BerthStatus.OCCUPIED } }),
      this.berthRepository.count({ where: { status: BerthStatus.RESERVED } }),
      this.reservationRepository.count({ where: { status: ReservationStatus.ACTIVE } }),
      this.pilotServiceRepository.count({ where: { status: PilotServiceStatus.REQUESTED } }),
    ]);

    const occupancyRate = totalBerths > 0 ? (occupiedBerths / totalBerths) * 100 : 0;

    return {
      berths: {
        total: totalBerths,
        available: availableBerths,
        occupied: occupiedBerths,
        reserved: reservedBerths,
        occupancyRate: occupancyRate.toFixed(2),
      },
      reservations: {
        active: activeReservations,
      },
      pilotServices: {
        pending: pendingPilotServices,
      },
    };
  }

  /**
   * Initialize sample berths
   */
  private async initializeBerths(): Promise<void> {
    const count = await this.berthRepository.count();
    if (count > 0) return;

    const sampleBerths = [
      {
        code: 'A1',
        name: 'Container Terminal A1',
        type: BerthType.CONTAINER,
        status: BerthStatus.AVAILABLE,
        latitude: 36.7,
        longitude: 3.05,
        length: 300,
        width: 40,
        depth: 15,
        maxVesselLength: 350,
        maxVesselBeam: 45,
        maxVesselDraft: 14,
        maxVesselDWT: 100000,
        hourlyRate: 500,
        dailyRate: 10000,
        facilities: {
          cranes: 4,
          electricity: true,
          water: true,
          security: true,
        },
      },
      {
        code: 'B2',
        name: 'Bulk Terminal B2',
        type: BerthType.BULK,
        status: BerthStatus.AVAILABLE,
        latitude: 36.71,
        longitude: 3.06,
        length: 250,
        width: 35,
        depth: 12,
        maxVesselLength: 280,
        maxVesselBeam: 40,
        maxVesselDraft: 11,
        maxVesselDWT: 80000,
        hourlyRate: 400,
        dailyRate: 8000,
        facilities: {
          cranes: 2,
          electricity: true,
          water: true,
        },
      },
      {
        code: 'T1',
        name: 'Tanker Terminal T1',
        type: BerthType.TANKER,
        status: BerthStatus.AVAILABLE,
        latitude: 36.72,
        longitude: 3.07,
        length: 350,
        width: 50,
        depth: 18,
        maxVesselLength: 400,
        maxVesselBeam: 55,
        maxVesselDraft: 17,
        maxVesselDWT: 150000,
        hourlyRate: 800,
        dailyRate: 15000,
        facilities: {
          fuel: true,
          wasteDisposal: true,
          electricity: true,
          security: true,
        },
      },
    ];

    for (const berthData of sampleBerths) {
      const berth = this.berthRepository.create(berthData);
      await this.berthRepository.save(berth);
    }
  }
}
