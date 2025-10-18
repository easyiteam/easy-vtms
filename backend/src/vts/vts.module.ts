import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VtsService } from './vts.service';
import { VtsController } from './vts.controller';
import { VtsMessage } from './entities/vts-message.entity';
import { MessageTemplate } from './entities/message-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VtsMessage, MessageTemplate])],
  controllers: [VtsController],
  providers: [VtsService],
  exports: [VtsService],
})
export class VtsModule {}
