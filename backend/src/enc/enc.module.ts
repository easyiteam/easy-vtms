import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EncLayer } from "./entities/enc-layer.entity";
import { EncController } from "./enc.controller";
import { EncService } from "./enc.service";

@Module({
	imports: [TypeOrmModule.forFeature([EncLayer])],
	controllers: [EncController],
	providers: [EncService],
	exports: [EncService],
})
export class EncModule {}
