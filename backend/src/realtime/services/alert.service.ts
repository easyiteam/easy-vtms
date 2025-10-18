import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../entities/alert.entity';

export enum AlertType {
  COLLISION_RISK = 'COLLISION_RISK',
  ZONE_VIOLATION = 'ZONE_VIOLATION',
  SPEED_VIOLATION = 'SPEED_VIOLATION',
  COURSE_DEVIATION = 'COURSE_DEVIATION',
  AIS_SIGNAL_LOST = 'AIS_SIGNAL_LOST',
  GROUNDING_RISK = 'GROUNDING_RISK',
  RESTRICTED_AREA = 'RESTRICTED_AREA',
  WEATHER_WARNING = 'WEATHER_WARNING',
}

export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export interface CreateAlertDto {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  vesselMmsi?: string;
  vesselName?: string;
  relatedVesselMmsi?: string;
  relatedVesselName?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class AlertService {
  private activeAlerts: Map<string, Alert> = new Map();

  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {
    this.loadActiveAlerts();
  }

  /**
   * Load active alerts from database on startup
   */
  private async loadActiveAlerts() {
    const alerts = await this.alertRepository.find({
      where: { status: AlertStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    alerts.forEach((alert) => {
      this.activeAlerts.set(alert.id, alert);
    });
  }

  /**
   * Create a new alert
   */
  async createAlert(dto: CreateAlertDto): Promise<Alert> {
    // Check for duplicate active alerts
    const duplicateKey = this.generateAlertKey(dto);
    const existingAlert = Array.from(this.activeAlerts.values()).find(
      (alert) =>
        alert.type === dto.type &&
        alert.vesselMmsi === dto.vesselMmsi &&
        alert.relatedVesselMmsi === dto.relatedVesselMmsi &&
        alert.status === AlertStatus.ACTIVE,
    );

    if (existingAlert) {
      // Update existing alert timestamp
      existingAlert.updatedAt = new Date();
      await this.alertRepository.save(existingAlert);
      return existingAlert;
    }

    // Create new alert
    const alert = this.alertRepository.create({
      ...dto,
      status: AlertStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedAlert = await this.alertRepository.save(alert);
    this.activeAlerts.set(savedAlert.id, savedAlert);

    return savedAlert;
  }

  /**
   * Generate unique key for alert deduplication
   */
  private generateAlertKey(dto: CreateAlertDto): string {
    return `${dto.type}_${dto.vesselMmsi}_${dto.relatedVesselMmsi}`;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).sort(
      (a, b) => this.getSeverityOrder(b.severity) - this.getSeverityOrder(a.severity),
    );
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.severity === severity,
    );
  }

  /**
   * Get alerts by vessel
   */
  getAlertsByVessel(mmsi: string): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.vesselMmsi === mmsi || alert.relatedVesselMmsi === mmsi,
    );
  }

  /**
   * Get alert by ID
   */
  async getAlertById(id: string): Promise<Alert | null> {
    return this.alertRepository.findOne({ where: { id } });
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(id: string, acknowledgedBy?: string): Promise<Alert> {
    const alert = this.activeAlerts.get(id);
    if (!alert) {
      throw new Error(`Alert ${id} not found`);
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    alert.updatedAt = new Date();

    await this.alertRepository.save(alert);
    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(id: string, resolvedBy?: string): Promise<Alert> {
    const alert = this.activeAlerts.get(id);
    if (!alert) {
      throw new Error(`Alert ${id} not found`);
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.updatedAt = new Date();

    await this.alertRepository.save(alert);
    this.activeAlerts.delete(id);

    return alert;
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(id: string, dismissedBy?: string): Promise<Alert> {
    const alert = this.activeAlerts.get(id);
    if (!alert) {
      throw new Error(`Alert ${id} not found`);
    }

    alert.status = AlertStatus.DISMISSED;
    alert.dismissedAt = new Date();
    alert.dismissedBy = dismissedBy;
    alert.updatedAt = new Date();

    await this.alertRepository.save(alert);
    this.activeAlerts.delete(id);

    return alert;
  }

  /**
   * Auto-resolve alerts that are no longer valid
   */
  async autoResolveAlert(type: AlertType, vesselMmsi: string, relatedVesselMmsi?: string) {
    const alerts = Array.from(this.activeAlerts.values()).filter(
      (alert) =>
        alert.type === type &&
        alert.vesselMmsi === vesselMmsi &&
        (!relatedVesselMmsi || alert.relatedVesselMmsi === relatedVesselMmsi),
    );

    for (const alert of alerts) {
      await this.resolveAlert(alert.id, 'SYSTEM');
    }
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics() {
    const alerts = Array.from(this.activeAlerts.values());

    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === AlertSeverity.CRITICAL).length,
      high: alerts.filter((a) => a.severity === AlertSeverity.HIGH).length,
      medium: alerts.filter((a) => a.severity === AlertSeverity.MEDIUM).length,
      low: alerts.filter((a) => a.severity === AlertSeverity.LOW).length,
      info: alerts.filter((a) => a.severity === AlertSeverity.INFO).length,
      byType: this.getAlertCountByType(alerts),
    };
  }

  /**
   * Get alert count by type
   */
  private getAlertCountByType(alerts: Alert[]): Record<string, number> {
    const counts: Record<string, number> = {};
    alerts.forEach((alert) => {
      counts[alert.type] = (counts[alert.type] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get severity order for sorting
   */
  private getSeverityOrder(severity: AlertSeverity): number {
    const order = {
      [AlertSeverity.CRITICAL]: 5,
      [AlertSeverity.HIGH]: 4,
      [AlertSeverity.MEDIUM]: 3,
      [AlertSeverity.LOW]: 2,
      [AlertSeverity.INFO]: 1,
    };
    return order[severity] || 0;
  }

  /**
   * Clean up old resolved/dismissed alerts
   */
  async cleanupOldAlerts(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.alertRepository
      .createQueryBuilder()
      .delete()
      .where('status IN (:...statuses)', {
        statuses: [AlertStatus.RESOLVED, AlertStatus.DISMISSED],
      })
      .andWhere('updatedAt < :cutoffDate', { cutoffDate })
      .execute();
  }

  /**
   * Get alert history
   */
  async getAlertHistory(limit: number = 100, offset: number = 0): Promise<Alert[]> {
    return this.alertRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
