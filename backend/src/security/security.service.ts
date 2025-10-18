import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog, AuditAction, AuditEntity } from './entities/audit-log.entity';

export interface AuditLogEntry {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
  isSuccess?: boolean;
  errorMessage?: string;
}

export interface SecurityConfig {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  enableTwoFactor: boolean;
  enableAuditLog: boolean;
  dataRetentionDays: number;
}

@Injectable()
export class SecurityService {
  private readonly securityConfig: SecurityConfig = {
    passwordMinLength: 12,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    enableTwoFactor: false,
    enableAuditLog: true,
    dataRetentionDays: 90,
  };

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log an audit entry
   */
  async logAudit(entry: AuditLogEntry): Promise<AuditLog> {
    if (!this.securityConfig.enableAuditLog) {
      return null;
    }

    const log = this.auditLogRepository.create({
      ...entry,
      isSuccess: entry.isSuccess !== undefined ? entry.isSuccess : true,
    });

    return this.auditLogRepository.save(log);
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters?: {
    userId?: string;
    action?: AuditAction;
    entity?: AuditEntity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('log');

    if (filters?.userId) {
      query.andWhere('log.userId = :userId', { userId: filters.userId });
    }

    if (filters?.action) {
      query.andWhere('log.action = :action', { action: filters.action });
    }

    if (filters?.entity) {
      query.andWhere('log.entity = :entity', { entity: filters.entity });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('log.createdAt BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    }

    query.orderBy('log.createdAt', 'DESC');

    if (filters?.limit) {
      query.take(filters.limit);
    } else {
      query.take(100);
    }

    return query.getMany();
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const [total, byAction, byEntity, byUser, failed] = await Promise.all([
      this.auditLogRepository.count({
        where: { createdAt: Between(startDate, endDate) },
      }),
      this.auditLogRepository
        .createQueryBuilder('log')
        .select('log.action', 'action')
        .addSelect('COUNT(*)', 'count')
        .where('log.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
        .groupBy('log.action')
        .getRawMany(),
      this.auditLogRepository
        .createQueryBuilder('log')
        .select('log.entity', 'entity')
        .addSelect('COUNT(*)', 'count')
        .where('log.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
        .groupBy('log.entity')
        .getRawMany(),
      this.auditLogRepository
        .createQueryBuilder('log')
        .select('log.userId', 'userId')
        .addSelect('log.userName', 'userName')
        .addSelect('COUNT(*)', 'count')
        .where('log.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
        .andWhere('log.userId IS NOT NULL')
        .groupBy('log.userId, log.userName')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany(),
      this.auditLogRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
          isSuccess: false,
        },
      }),
    ]);

    return {
      period: { days, start: startDate, end: endDate },
      total,
      failed,
      successRate: total > 0 ? ((total - failed) / total) * 100 : 100,
      byAction: byAction.reduce((acc, item) => {
        acc[item.action] = parseInt(item.count);
        return acc;
      }, {}),
      byEntity: byEntity.reduce((acc, item) => {
        acc[item.entity] = parseInt(item.count);
        return acc;
      }, {}),
      topUsers: byUser.map((item) => ({
        userId: item.userId,
        userName: item.userName,
        count: parseInt(item.count),
      })),
    };
  }

  /**
   * Clean old audit logs (GDPR compliance)
   */
  async cleanOldAuditLogs(): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - this.securityConfig.dataRetentionDays * 24 * 60 * 60 * 1000,
    );

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.securityConfig.passwordMinLength) {
      errors.push(`Password must be at least ${this.securityConfig.passwordMinLength} characters`);
    }

    if (this.securityConfig.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.securityConfig.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.securityConfig.passwordRequireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (
      this.securityConfig.passwordRequireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Hash sensitive data (for GDPR compliance)
   */
  hashSensitiveData(data: string): string {
    // Simple hash for demo - use proper crypto in production
    return Buffer.from(data).toString('base64');
  }

  /**
   * Anonymize user data (GDPR right to be forgotten)
   */
  async anonymizeUserData(userId: string): Promise<void> {
    // Update audit logs to anonymize user
    await this.auditLogRepository
      .createQueryBuilder()
      .update()
      .set({
        userName: 'ANONYMIZED',
        ipAddress: '0.0.0.0',
        userAgent: 'ANONYMIZED',
      })
      .where('userId = :userId', { userId })
      .execute();
  }

  /**
   * Get security configuration
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(config: Partial<SecurityConfig>): SecurityConfig {
    Object.assign(this.securityConfig, config);
    return this.getSecurityConfig();
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(days: number = 30): Promise<any> {
    const stats = await this.getAuditStatistics(days);
    const recentLogs = await this.getAuditLogs({
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      limit: 50,
    });

    const failedLogins = recentLogs.filter(
      (log) => log.action === AuditAction.LOGIN && !log.isSuccess,
    );

    const suspiciousActivities = recentLogs.filter(
      (log) =>
        !log.isSuccess ||
        log.action === AuditAction.DELETE ||
        log.action === AuditAction.EXPORT,
    );

    return {
      period: stats.period,
      summary: {
        totalActivities: stats.total,
        failedActivities: stats.failed,
        successRate: stats.successRate,
        failedLogins: failedLogins.length,
        suspiciousActivities: suspiciousActivities.length,
      },
      statistics: {
        byAction: stats.byAction,
        byEntity: stats.byEntity,
        topUsers: stats.topUsers,
      },
      recentFailedLogins: failedLogins.slice(0, 10),
      recentSuspiciousActivities: suspiciousActivities.slice(0, 10),
      recommendations: this.generateSecurityRecommendations(stats, failedLogins.length),
    };
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(stats: any, failedLogins: number): string[] {
    const recommendations: string[] = [];

    if (stats.successRate < 95) {
      recommendations.push('Success rate is below 95%. Review failed operations.');
    }

    if (failedLogins > 10) {
      recommendations.push('High number of failed login attempts detected. Consider enabling 2FA.');
    }

    if (!this.securityConfig.enableTwoFactor) {
      recommendations.push('Two-factor authentication is disabled. Enable for better security.');
    }

    if (this.securityConfig.dataRetentionDays > 365) {
      recommendations.push('Data retention period exceeds 1 year. Review for GDPR compliance.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Security configuration looks good. Continue monitoring.');
    }

    return recommendations;
  }
}
