import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortService } from './port.service';
import { PortController } from './port.controller';
import { Berth } from './entities/berth.entity';
import { BerthReservation } from './entities/berth-reservation.entity';
import { PilotService } from './entities/pilot-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Berth, BerthReservation, PilotService])],
  controllers: [PortController],
  providers: [PortService],
  exports: [PortService],
})
export class PortModule {}
