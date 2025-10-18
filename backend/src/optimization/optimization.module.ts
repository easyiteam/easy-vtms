import { Module, Global } from '@nestjs/common';
import { OptimizationService } from './optimization.service';
import { OptimizationController } from './optimization.controller';

@Global()
@Module({
  controllers: [OptimizationController],
  providers: [OptimizationService],
  exports: [OptimizationService],
})
export class OptimizationModule {}
