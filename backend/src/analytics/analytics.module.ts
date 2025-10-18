import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Alert } from '../realtime/entities/alert.entity';
import { VtsMessage } from '../vts/entities/vts-message.entity';
import { BerthReservation } from '../port/entities/berth-reservation.entity';
import { PilotService } from '../port/entities/pilot-service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, VtsMessage, BerthReservation, PilotService]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
