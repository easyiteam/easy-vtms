import { SetMetadata } from '@nestjs/common';
import { AuditAction, AuditEntity } from '../entities/audit-log.entity';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  action: AuditAction;
  entity: AuditEntity;
  description?: string;
}

/**
 * Decorator to automatically log audit entries for controller methods
 * 
 * @example
 * @AuditLog({ action: AuditAction.CREATE, entity: AuditEntity.VESSEL })
 * @Post('vessels')
 * createVessel() { ... }
 */
export const AuditLog = (metadata: AuditLogMetadata) => SetMetadata(AUDIT_LOG_KEY, metadata);
