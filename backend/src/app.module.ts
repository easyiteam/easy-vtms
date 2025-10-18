import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EncModule } from "./enc/enc.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { RedisModule } from "./redis/redis.module";
import { WeatherModule } from "./weather/weather.module";
import { VtsModule } from "./vts/vts.module";
import { PortModule } from "./port/port.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { SecurityModule } from "./security/security.module";
import { OptimizationModule } from "./optimization/optimization.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			useFactory: async () => {
				const { DataSource } = await import("typeorm");

				// Create a temporary connection to install PostGIS
				const tempDataSource = new DataSource({
					type: "postgres",
					host: process.env.DATABASE_HOST || "localhost",
					port: parseInt(process.env.DATABASE_PORT) || 5432,
					username: process.env.DATABASE_USER || "enc_user",
					password: process.env.DATABASE_PASSWORD || "enc_password",
					database: process.env.DATABASE_NAME || "enc_db",
				});

				try {
					console.log("Initializing PostGIS extension...");
					await tempDataSource.initialize();
					await tempDataSource.query("CREATE EXTENSION IF NOT EXISTS postgis");
					console.log("PostGIS extension installed successfully");
					await tempDataSource.destroy();

					// Add a small delay to ensure extension is fully loaded
					await new Promise((resolve) => setTimeout(resolve, 1000));
				} catch (error) {
					console.error("Failed to initialize PostGIS:", error);
					if (tempDataSource.isInitialized) {
						await tempDataSource.destroy();
					}
					throw error; // Re-throw to prevent app from starting with broken DB
				}

				return {
					type: "postgres",
					host: process.env.DATABASE_HOST || "localhost",
					port: parseInt(process.env.DATABASE_PORT) || 5432,
					username: process.env.DATABASE_USER || "enc_user",
					password: process.env.DATABASE_PASSWORD || "enc_password",
					database: process.env.DATABASE_NAME || "enc_db",
					entities: [__dirname + "/**/*.entity{.ts,.js}"],
					synchronize: process.env.NODE_ENV !== "production",
					logging: process.env.NODE_ENV === "development",
				};
			},
		}),
		RedisModule,
		EncModule,
		RealtimeModule,
		WeatherModule,
		VtsModule,
		PortModule,
		AnalyticsModule,
		SecurityModule,
		OptimizationModule,
	],
})
export class AppModule {}
