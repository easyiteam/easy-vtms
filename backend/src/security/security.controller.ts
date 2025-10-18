import { Controller, Get, Post, Body, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { SecurityService, AuditLogEntry } from './security.service';
import { AuditAction, AuditEntity } from './entities/audit-log.entity';

@ApiTags('security')
@Controller('api/security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('audit')
  @ApiOperation({ summary: 'Log audit entry', description: 'Creates a new audit log entry for tracking user actions' })
  @ApiBody({ description: 'Audit log entry data' })
  @ApiResponse({ status: 201, description: 'Audit log created successfully' })
  async logAudit(@Body() entry: AuditLogEntry) {
    return this.securityService.logAudit(entry);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Get audit logs', description: 'Retrieves audit logs with optional filters' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction, description: 'Filter by action type' })
  @ApiQuery({ name: 'entity', required: false, enum: AuditEntity, description: 'Filter by entity type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of results' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};

    if (userId) filters.userId = userId;
    if (action) filters.action = action as AuditAction;
    if (entity) filters.entity = entity as AuditEntity;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit, 10);

    return this.securityService.getAuditLogs(filters);
  }

  @Get('audit/statistics')
  @ApiOperation({ summary: 'Get audit statistics', description: 'Returns audit statistics for a specified period' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 30)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getAuditStatistics(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.securityService.getAuditStatistics(daysNum);
  }

  @Delete('audit/cleanup')
  @ApiOperation({ summary: 'Clean old audit logs', description: 'Deletes audit logs older than retention period (GDPR compliance)' })
  @ApiResponse({ status: 200, description: 'Old logs cleaned successfully' })
  async cleanOldAuditLogs() {
    const deleted = await this.securityService.cleanOldAuditLogs();
    return { deleted, message: `Deleted ${deleted} old audit logs` };
  }

  @Post('validate-password')
  @ApiOperation({ summary: 'Validate password strength', description: 'Validates password against security policy' })
  @ApiBody({ schema: { properties: { password: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Password validation result' })
  async validatePassword(@Body('password') password: string) {
    return this.securityService.validatePassword(password);
  }

  @Post('anonymize')
  @ApiOperation({ summary: 'Anonymize user data', description: 'Anonymizes user data for GDPR compliance (right to be forgotten)' })
  @ApiBody({ schema: { properties: { userId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'User data anonymized successfully' })
  async anonymizeUserData(@Body('userId') userId: string) {
    await this.securityService.anonymizeUserData(userId);
    return { success: true, message: 'User data anonymized' };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get security configuration', description: 'Returns current security configuration settings' })
  @ApiResponse({ status: 200, description: 'Security configuration retrieved' })
  async getSecurityConfig() {
    return this.securityService.getSecurityConfig();
  }

  @Post('config')
  @ApiOperation({ summary: 'Update security configuration', description: 'Updates security configuration settings' })
  @ApiBody({ description: 'Security configuration updates' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateSecurityConfig(@Body() config: any) {
    return this.securityService.updateSecurityConfig(config);
  }

  @Get('report')
  @ApiOperation({ summary: 'Generate security report', description: 'Generates comprehensive security report with recommendations' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 30)' })
  @ApiResponse({ status: 200, description: 'Security report generated successfully' })
  async generateSecurityReport(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.securityService.generateSecurityReport(daysNum);
  }
}
