import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Alert } from '../realtime/entities/alert.entity';
import { VtsMessage } from '../vts/entities/vts-message.entity';
import { BerthReservation } from '../port/entities/berth-reservation.entity';
import { PilotService } from '../port/entities/pilot-service.entity';

export interface DashboardStats {
  vessels: {
    total: number;
    active: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  alerts: {
    total: number;
    active: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    last24h: number;
  };
  messages: {
    total: number;
    unread: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    last24h: number;
  };
  port: {
    berths: {
      total: number;
      occupied: number;
      available: number;
      occupancyRate: number;
    };
    reservations: {
      active: number;
      pending: number;
      completed24h: number;
    };
    pilotServices: {
      pending: number;
      inProgress: number;
      completed24h: number;
    };
  };
  performance: {
    averageResponseTime: number;
    systemUptime: number;
    dataPoints: number;
  };
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface ReportData {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalVessels: number;
    totalAlerts: number;
    totalMessages: number;
    totalReservations: number;
    averageOccupancy: number;
  };
  alerts: {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    topVessels: Array<{ mmsi: string; count: number }>;
  };
  port: {
    totalReservations: number;
    completedReservations: number;
    cancelledReservations: number;
    averageDuration: number;
    totalRevenue: number;
  };
  messages: {
    total: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    responseRate: number;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(VtsMessage)
    private messageRepository: Repository<VtsMessage>,
    @InjectRepository(BerthReservation)
    private reservationRepository: Repository<BerthReservation>,
    @InjectRepository(PilotService)
    private pilotServiceRepository: Repository<PilotService>,
  ) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Alerts stats
    const [totalAlerts, activeAlerts, alerts24h] = await Promise.all([
      this.alertRepository.count(),
      this.alertRepository.count({ where: { status: 'ACTIVE' as any } }),
      this.alertRepository.count({
        where: { createdAt: Between(yesterday, now) },
      }),
    ]);

    const alertsBySeverity = await this.alertRepository
      .createQueryBuilder('alert')
      .select('alert.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .where('alert.status = :status', { status: 'ACTIVE' })
      .groupBy('alert.severity')
      .getRawMany();

    const alertsByType = await this.alertRepository
      .createQueryBuilder('alert')
      .select('alert.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('alert.status = :status', { status: 'ACTIVE' })
      .groupBy('alert.type')
      .getRawMany();

    // Messages stats
    const [totalMessages, unreadMessages, messages24h] = await Promise.all([
      this.messageRepository.count(),
      this.messageRepository.count({
        where: { status: 'sent' as any },
      }),
      this.messageRepository.count({
        where: { createdAt: Between(yesterday, now) },
      }),
    ]);

    const messagesByPriority = await this.messageRepository
      .createQueryBuilder('message')
      .select('message.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('message.priority')
      .getRawMany();

    const messagesByType = await this.messageRepository
      .createQueryBuilder('message')
      .select('message.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('message.type')
      .getRawMany();

    // Port stats
    const [activeReservations, pendingReservations, completedReservations24h] =
      await Promise.all([
        this.reservationRepository.count({ where: { status: 'active' as any } }),
        this.reservationRepository.count({ where: { status: 'pending' as any } }),
        this.reservationRepository.count({
          where: {
            status: 'completed' as any,
            updatedAt: Between(yesterday, now),
          },
        }),
      ]);

    const [pendingPilotServices, inProgressPilotServices, completedPilotServices24h] =
      await Promise.all([
        this.pilotServiceRepository.count({ where: { status: 'requested' as any } }),
        this.pilotServiceRepository.count({ where: { status: 'in_progress' as any } }),
        this.pilotServiceRepository.count({
          where: {
            status: 'completed' as any,
            updatedAt: Between(yesterday, now),
          },
        }),
      ]);

    return {
      vessels: {
        total: 0, // Would come from WebSocket store
        active: 0,
        byType: {},
        byStatus: {},
      },
      alerts: {
        total: totalAlerts,
        active: activeAlerts,
        bySeverity: alertsBySeverity.reduce((acc, item) => {
          acc[item.severity] = parseInt(item.count);
          return acc;
        }, {}),
        byType: alertsByType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
        last24h: alerts24h,
      },
      messages: {
        total: totalMessages,
        unread: unreadMessages,
        byPriority: messagesByPriority.reduce((acc, item) => {
          acc[item.priority] = parseInt(item.count);
          return acc;
        }, {}),
        byType: messagesByType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
        last24h: messages24h,
      },
      port: {
        berths: {
          total: 3, // From sample data
          occupied: 0,
          available: 3,
          occupancyRate: 0,
        },
        reservations: {
          active: activeReservations,
          pending: pendingReservations,
          completed24h: completedReservations24h,
        },
        pilotServices: {
          pending: pendingPilotServices,
          inProgress: inProgressPilotServices,
          completed24h: completedPilotServices24h,
        },
      },
      performance: {
        averageResponseTime: 150, // Mock data
        systemUptime: 99.9,
        dataPoints: totalAlerts + totalMessages,
      },
    };
  }

  /**
   * Get time series data for alerts
   */
  async getAlertsTimeSeries(days: number = 7): Promise<TimeSeriesData[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const data = await this.alertRepository
      .createQueryBuilder('alert')
      .select("DATE_TRUNC('day', alert.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('alert.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy("DATE_TRUNC('day', alert.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return data.map((item) => ({
      timestamp: new Date(item.date),
      value: parseInt(item.count),
    }));
  }

  /**
   * Get time series data for messages
   */
  async getMessagesTimeSeries(days: number = 7): Promise<TimeSeriesData[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const data = await this.messageRepository
      .createQueryBuilder('message')
      .select("DATE_TRUNC('day', message.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('message.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy("DATE_TRUNC('day', message.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return data.map((item) => ({
      timestamp: new Date(item.date),
      value: parseInt(item.count),
    }));
  }

  /**
   * Generate report for a period
   */
  async generateReport(startDate: Date, endDate: Date): Promise<ReportData> {
    // Alerts analysis
    const alerts = await this.alertRepository.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    const alertsBySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsByType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsByVessel = alerts.reduce((acc, alert) => {
      if (alert.vesselMmsi) {
        acc[alert.vesselMmsi] = (acc[alert.vesselMmsi] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topVessels = Object.entries(alertsByVessel)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([mmsi, count]) => ({ mmsi, count }));

    // Messages analysis
    const messages = await this.messageRepository.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    const messagesByType = messages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const messagesByPriority = messages.reduce((acc, msg) => {
      acc[msg.priority] = (acc[msg.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const acknowledgedMessages = messages.filter(
      (m) => m.status === 'acknowledged',
    ).length;
    const responseRate =
      messages.length > 0 ? (acknowledgedMessages / messages.length) * 100 : 0;

    // Port analysis
    const reservations = await this.reservationRepository.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    const completedReservations = reservations.filter(
      (r) => r.status === 'completed',
    );
    const cancelledReservations = reservations.filter(
      (r) => r.status === 'cancelled',
    );

    const totalDuration = completedReservations.reduce((sum, r) => {
      if (r.actualArrival && r.actualDeparture) {
        return (
          sum +
          (r.actualDeparture.getTime() - r.actualArrival.getTime()) /
            (1000 * 3600)
        );
      }
      return sum;
    }, 0);

    const averageDuration =
      completedReservations.length > 0
        ? totalDuration / completedReservations.length
        : 0;

    const totalRevenue = completedReservations.reduce(
      (sum, r) => sum + (r.actualCost || 0),
      0,
    );

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalVessels: 0, // Would need vessel tracking
        totalAlerts: alerts.length,
        totalMessages: messages.length,
        totalReservations: reservations.length,
        averageOccupancy: 0, // Would need berth tracking
      },
      alerts: {
        total: alerts.length,
        bySeverity: alertsBySeverity,
        byType: alertsByType,
        topVessels,
      },
      port: {
        totalReservations: reservations.length,
        completedReservations: completedReservations.length,
        cancelledReservations: cancelledReservations.length,
        averageDuration,
        totalRevenue,
      },
      messages: {
        total: messages.length,
        byType: messagesByType,
        byPriority: messagesByPriority,
        responseRate,
      },
    };
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(
    entity: 'alerts' | 'messages' | 'reservations',
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    let data: any[] = [];
    let headers: string[] = [];

    switch (entity) {
      case 'alerts':
        data = await this.alertRepository.find({
          where: { createdAt: Between(startDate, endDate) },
        });
        headers = [
          'ID',
          'Type',
          'Severity',
          'Vessel MMSI',
          'Description',
          'Created At',
          'Resolved At',
          'Is Active',
        ];
        break;

      case 'messages':
        data = await this.messageRepository.find({
          where: { createdAt: Between(startDate, endDate) },
        });
        headers = [
          'ID',
          'Type',
          'Priority',
          'Status',
          'Subject',
          'Sender',
          'Recipient',
          'Created At',
        ];
        break;

      case 'reservations':
        data = await this.reservationRepository.find({
          where: { createdAt: Between(startDate, endDate) },
        });
        headers = [
          'ID',
          'Berth Code',
          'Vessel MMSI',
          'Vessel Name',
          'Status',
          'Arrival',
          'Departure',
          'Cost',
        ];
        break;
    }

    // Generate CSV
    const csvRows = [headers.join(',')];

    for (const item of data) {
      const row = this.formatCSVRow(entity, item);
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  private formatCSVRow(entity: string, item: any): string[] {
    switch (entity) {
      case 'alerts':
        return [
          item.id,
          item.type,
          item.severity,
          item.vesselMmsi || '',
          `"${item.description}"`,
          item.createdAt.toISOString(),
          item.resolvedAt?.toISOString() || '',
          item.isActive.toString(),
        ];

      case 'messages':
        return [
          item.id,
          item.type,
          item.priority,
          item.status,
          `"${item.subject}"`,
          item.senderName || item.senderType,
          item.recipientName || item.recipientType,
          item.createdAt.toISOString(),
        ];

      case 'reservations':
        return [
          item.id,
          item.berthCode,
          item.vesselMmsi,
          `"${item.vesselName}"`,
          item.status,
          item.arrivalTime.toISOString(),
          item.departureTime.toISOString(),
          item.actualCost?.toString() || '',
        ];

      default:
        return [];
    }
  }
}
