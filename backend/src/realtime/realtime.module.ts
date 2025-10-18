import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealtimeGateway } from './realtime.gateway';
import { NmeaService } from './nmea.service';
import { CollisionDetectionService } from './services/collision-detection.service';
import { AlertService } from './services/alert.service';
import { TrajectoryHistoryService } from './services/trajectory-history.service';
import { PredictionService } from './services/prediction.service';
import { TrajectoryController } from './trajectory.controller';
import { PredictionController } from './controllers/prediction.controller';
import { AisTrack } from './entities/ais-track.entity';
import { Alert } from './entities/alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AisTrack, Alert])],
  controllers: [TrajectoryController, PredictionController],
  providers: [
    RealtimeGateway,
    NmeaService,
    CollisionDetectionService,
    AlertService,
    TrajectoryHistoryService,
    PredictionService,
  ],
  exports: [NmeaService, CollisionDetectionService, AlertService, TrajectoryHistoryService, PredictionService],
})
export class RealtimeModule {}
