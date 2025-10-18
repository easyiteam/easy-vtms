import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SecurityService } from '../security.service';
import { AUDIT_LOG_KEY, AuditLogMetadata } from '../decorators/audit-log.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityService: SecurityService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditLogMetadata>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    // Si pas de metadata, on skip l'audit
    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query, ip, headers } = request;

    // Extraction des informations utilisateur (si authentification en place)
    const userId = request.user?.id || 'anonymous';
    const userName = request.user?.name || 'Anonymous User';

    // Extraction de l'entity ID depuis params ou body
    const entityId = params?.id || body?.id || null;

    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        // Log en cas de succès
        const duration = Date.now() - startTime;

        this.securityService.logAudit({
          action: auditMetadata.action,
          entity: auditMetadata.entity,
          entityId,
          userId,
          userName,
          ipAddress: ip || request.connection?.remoteAddress,
          userAgent: headers['user-agent'],
          description: auditMetadata.description || `${method} ${url}`,
          newValue: method !== 'GET' ? body : undefined,
          metadata: {
            method,
            url,
            params,
            query,
            duration,
            statusCode: 200,
          },
          isSuccess: true,
        });
      }),
      catchError((error) => {
        // Log en cas d'erreur
        const duration = Date.now() - startTime;

        this.securityService.logAudit({
          action: auditMetadata.action,
          entity: auditMetadata.entity,
          entityId,
          userId,
          userName,
          ipAddress: ip || request.connection?.remoteAddress,
          userAgent: headers['user-agent'],
          description: auditMetadata.description || `${method} ${url}`,
          newValue: method !== 'GET' ? body : undefined,
          metadata: {
            method,
            url,
            params,
            query,
            duration,
            statusCode: error.status || 500,
          },
          isSuccess: false,
          errorMessage: error.message,
        });

        throw error;
      }),
    );
  }
}
