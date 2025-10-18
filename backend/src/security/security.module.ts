import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [SecurityService],
})
export class SecurityModule {}
