import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { NmeaService } from "./nmea.service";
import { RedisService } from "../redis/redis.service";
import { VesselType } from "./enums/vessel-type.enum";
import { NavigationStatus } from "./enums/navigation-status.enum";
import { CollisionDetectionService, VesselData } from "./services/collision-detection.service";
import { AlertService, AlertType, AlertSeverity } from "./services/alert.service";

@WebSocketGateway({
	cors: {
		origin: process.env.CORS_ORIGIN || "http://localhost:5173",
		credentials: true,
	},
})
export class RealtimeGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(RealtimeGateway.name);
	private simulationInterval: NodeJS.Timeout;
	private collisionCheckInterval: NodeJS.Timeout;
	private activeVessels: Map<string, VesselData> = new Map();
	private simulatedVessel = {
		// Identification
		mmsi: "123456789",
		imoNumber: "9876543",
		callSign: "SIMV123",
		name: "SIMULATED VESSEL",
		
		// Vessel characteristics
		vesselType: VesselType.CARGO,
		length: 180.0, // meters
		width: 28.5, // meters
		height: 45.0, // meters
		draught: 10.5, // meters
		
		// Position & movement
		latitude: 48.1173,
		longitude: -1.6778,
		speed: 10, // knots
		course: 45, // degrees
		heading: 45, // degrees
		rateOfTurn: 0, // degrees per minute
		
		// Navigation
		navigationStatus: NavigationStatus.UNDERWAY_ENGINE,
		destination: "BREST",
		eta: new Date(Date.now() + 3600000 * 4), // 4 hours from now
	};

	// Second simulated vessel for collision testing
	private simulatedVessel2 = {
		mmsi: "987654321",
		imoNumber: "1234567",
		callSign: "SIMV456",
		name: "SIMULATED VESSEL 2",
		vesselType: VesselType.TANKER,
		length: 200.0,
		width: 32.0,
		height: 50.0,
		draught: 12.0,
		latitude: 48.1273, // ~6 NM north
		longitude: -1.6678, // Slightly east
		speed: 12, // knots
		course: 225, // Opposite direction (southwest)
		heading: 225,
		rateOfTurn: 0,
		navigationStatus: NavigationStatus.UNDERWAY_ENGINE,
		destination: "SAINT-MALO",
		eta: new Date(Date.now() + 3600000 * 3),
	};

	constructor(
		private readonly nmeaService: NmeaService,
		private readonly redisService: RedisService,
		private readonly collisionDetectionService: CollisionDetectionService,
		private readonly alertService: AlertService,
	) {}

	afterInit(server: Server) {
		this.logger.log("WebSocket Gateway initialized");

		// Subscribe to Redis channels for real equipment data
		this.subscribeToRedisChannels();

		// Start simulation
		this.startSimulation();
		
		// Start collision detection
		this.startCollisionDetection();
	}

	handleConnection(client: Socket) {
		this.logger.log(`Client connected: ${client.id}`);

		// Send current vessel position on connect
		client.emit("vessel:position", {
			// Identification
			mmsi: this.simulatedVessel.mmsi,
			imoNumber: this.simulatedVessel.imoNumber,
			callSign: this.simulatedVessel.callSign,
			name: this.simulatedVessel.name,
			
			// Vessel characteristics
			vesselType: this.simulatedVessel.vesselType,
			length: this.simulatedVessel.length,
			width: this.simulatedVessel.width,
			height: this.simulatedVessel.height,
			draught: this.simulatedVessel.draught,
			
			// Position & movement
			latitude: this.simulatedVessel.latitude,
			longitude: this.simulatedVessel.longitude,
			speed: this.simulatedVessel.speed,
			course: this.simulatedVessel.course,
			heading: this.simulatedVessel.heading,
			rateOfTurn: this.simulatedVessel.rateOfTurn,
			
			// Navigation
			navigationStatus: this.simulatedVessel.navigationStatus,
			destination: this.simulatedVessel.destination,
			eta: this.simulatedVessel.eta,
			timestamp: new Date(),
		});
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
	}

	@SubscribeMessage("nmea:send")
	handleNmeaMessage(client: Socket, payload: { sentence: string }) {
		this.logger.log(`Received NMEA: ${payload.sentence}`);

		const data = this.nmeaService.parseRMC(payload.sentence);
		if (data) {
			// Broadcast to all clients
			this.server.emit("nmea:data", data);

			// Save to database if it's AIS data
			if (data.mmsi) {
				this.nmeaService.saveAisTrack({
					mmsi: data.mmsi,
					latitude: data.latitude,
					longitude: data.longitude,
					speed: data.speed,
					course: data.course,
					heading: data.heading ? Math.round(data.heading) : undefined,
				});
			}
		}
	}

	@SubscribeMessage("simulation:start")
	handleStartSimulation() {
		this.logger.log("Starting simulation");
		this.startSimulation();
		return { success: true, message: "Simulation started" };
	}

	@SubscribeMessage("simulation:stop")
	handleStopSimulation() {
		this.logger.log("Stopping simulation");
		this.stopSimulation();
		return { success: true, message: "Simulation stopped" };
	}

	private startSimulation() {
		if (this.simulationInterval) {
			clearInterval(this.simulationInterval);
		}

		// Update interval for smoother movement (60 FPS equivalent)
		const updateInterval = 1000 / 60; // ~16ms for 60 FPS
		let frameCount = 0;
		
		this.simulationInterval = setInterval(() => {
			frameCount++;
			
			// Update simulated vessels positions every frame
			this.updateSimulatedPosition(updateInterval / 1000);
			this.updateSimulatedPosition2(updateInterval / 1000);

			// Broadcast vessel 1 position every frame for smooth interpolation
			this.server.emit("vessel:position", {
				// Identification
				mmsi: this.simulatedVessel.mmsi,
				imoNumber: this.simulatedVessel.imoNumber,
				callSign: this.simulatedVessel.callSign,
				name: this.simulatedVessel.name,
				
				// Vessel characteristics
				vesselType: this.simulatedVessel.vesselType,
				length: this.simulatedVessel.length,
				width: this.simulatedVessel.width,
				height: this.simulatedVessel.height,
				draught: this.simulatedVessel.draught,
				
				// Position & movement
				latitude: this.simulatedVessel.latitude,
				longitude: this.simulatedVessel.longitude,
				speed: this.simulatedVessel.speed,
				course: this.simulatedVessel.course,
				heading: Math.round(this.simulatedVessel.course),
				rateOfTurn: this.simulatedVessel.rateOfTurn,
				
				// Navigation
				navigationStatus: this.simulatedVessel.navigationStatus,
				destination: this.simulatedVessel.destination,
				eta: this.simulatedVessel.eta,
				timestamp: new Date(),
			});

			// Broadcast vessel 2 position
			this.server.emit("vessel:position", {
				mmsi: this.simulatedVessel2.mmsi,
				imoNumber: this.simulatedVessel2.imoNumber,
				callSign: this.simulatedVessel2.callSign,
				name: this.simulatedVessel2.name,
				vesselType: this.simulatedVessel2.vesselType,
				length: this.simulatedVessel2.length,
				width: this.simulatedVessel2.width,
				height: this.simulatedVessel2.height,
				draught: this.simulatedVessel2.draught,
				latitude: this.simulatedVessel2.latitude,
				longitude: this.simulatedVessel2.longitude,
				speed: this.simulatedVessel2.speed,
				course: this.simulatedVessel2.course,
				heading: Math.round(this.simulatedVessel2.course),
				rateOfTurn: this.simulatedVessel2.rateOfTurn,
				navigationStatus: this.simulatedVessel2.navigationStatus,
				destination: this.simulatedVessel2.destination,
				eta: this.simulatedVessel2.eta,
				timestamp: new Date(),
			});

			// Save to database and send NMEA only every 2 seconds (120 frames)
			if (frameCount % 120 === 0) {
				const nmeaSentence = this.nmeaService.generateSimulatedRMC(
					this.simulatedVessel.latitude,
					this.simulatedVessel.longitude,
					this.simulatedVessel.speed,
					this.simulatedVessel.course
				);

				const data = this.nmeaService.parseRMC(nmeaSentence);
				if (data) {
					this.server.emit("nmea:data", {
						...data,
						mmsi: this.simulatedVessel.mmsi,
						vesselName: this.simulatedVessel.name,
					});

					// Save to database
					this.nmeaService.saveAisTrack({
						mmsi: this.simulatedVessel.mmsi,
						imoNumber: this.simulatedVessel.imoNumber,
						callSign: this.simulatedVessel.callSign,
						vesselName: this.simulatedVessel.name,
						vesselType: this.simulatedVessel.vesselType,
						length: this.simulatedVessel.length,
						width: this.simulatedVessel.width,
						height: this.simulatedVessel.height,
						draught: this.simulatedVessel.draught,
						latitude: this.simulatedVessel.latitude,
						longitude: this.simulatedVessel.longitude,
						speed: this.simulatedVessel.speed,
						course: this.simulatedVessel.course,
						heading: Math.round(this.simulatedVessel.course),
						rateOfTurn: this.simulatedVessel.rateOfTurn,
						navigationStatus: this.simulatedVessel.navigationStatus,
						destination: this.simulatedVessel.destination,
						eta: this.simulatedVessel.eta,
					});
				}
			}
		}, updateInterval);

		this.logger.log("Simulation started");
	}

	private stopSimulation() {
		if (this.simulationInterval) {
			clearInterval(this.simulationInterval);
			this.simulationInterval = null;
		}
	}

	private updateSimulatedPosition(deltaTime: number = 2) {
		// Simple simulation: move vessel in the direction of its course
		const distanceNm = (this.simulatedVessel.speed * deltaTime) / 3600; // Distance based on deltaTime
		const distanceDeg = distanceNm / 60; // Convert to degrees (approximate)

		const courseRad = (this.simulatedVessel.course * Math.PI) / 180;
		this.simulatedVessel.latitude += distanceDeg * Math.cos(courseRad);
		this.simulatedVessel.longitude +=
			(distanceDeg * Math.sin(courseRad)) /
			Math.cos((this.simulatedVessel.latitude * Math.PI) / 180);

		// Add some randomness
		this.simulatedVessel.course += (Math.random() - 0.5) * 5;
		if (this.simulatedVessel.course < 0) this.simulatedVessel.course += 360;
		if (this.simulatedVessel.course >= 360) this.simulatedVessel.course -= 360;
	}

	private updateSimulatedPosition2(deltaTime: number = 2) {
		// Move second vessel
		const distanceNm = (this.simulatedVessel2.speed * deltaTime) / 3600;
		const distanceDeg = distanceNm / 60;

		const courseRad = (this.simulatedVessel2.course * Math.PI) / 180;
		this.simulatedVessel2.latitude += distanceDeg * Math.cos(courseRad);
		this.simulatedVessel2.longitude +=
			(distanceDeg * Math.sin(courseRad)) /
			Math.cos((this.simulatedVessel2.latitude * Math.PI) / 180);

		// Add some randomness
		this.simulatedVessel2.course += (Math.random() - 0.5) * 3;
		if (this.simulatedVessel2.course < 0) this.simulatedVessel2.course += 360;
		if (this.simulatedVessel2.course >= 360) this.simulatedVessel2.course -= 360;
	}

	private async subscribeToRedisChannels() {
		// Subscribe to AIS channel
		await this.redisService.subscribe("ais:data", (message) => {
			try {
				const data = JSON.parse(message);
				this.server.emit("ais:data", data);
				this.logger.log("Received AIS data from Redis");
			} catch (error) {
				this.logger.error(`Failed to parse AIS data: ${error.message}`);
			}
		});

		// Subscribe to NMEA channel
		await this.redisService.subscribe("nmea:data", (message) => {
			try {
				const data = JSON.parse(message);
				this.server.emit("nmea:data", data);
				this.logger.log("Received NMEA data from Redis");
			} catch (error) {
				this.logger.error(`Failed to parse NMEA data: ${error.message}`);
			}
		});

		this.logger.log("Subscribed to Redis channels");
	}

	private startCollisionDetection() {
		// Update active vessels list
		this.updateActiveVessels();

		// Check for collisions every 5 seconds
		this.collisionCheckInterval = setInterval(() => {
			this.checkCollisions();
		}, 5000);

		this.logger.log("Collision detection started");
	}

	private updateActiveVessels() {
		// Add simulated vessels to active vessels
		this.activeVessels.set(this.simulatedVessel.mmsi, {
			mmsi: this.simulatedVessel.mmsi,
			name: this.simulatedVessel.name,
			latitude: this.simulatedVessel.latitude,
			longitude: this.simulatedVessel.longitude,
			speed: this.simulatedVessel.speed,
			course: this.simulatedVessel.course,
			heading: this.simulatedVessel.heading,
			length: this.simulatedVessel.length,
			width: this.simulatedVessel.width,
		});

		this.activeVessels.set(this.simulatedVessel2.mmsi, {
			mmsi: this.simulatedVessel2.mmsi,
			name: this.simulatedVessel2.name,
			latitude: this.simulatedVessel2.latitude,
			longitude: this.simulatedVessel2.longitude,
			speed: this.simulatedVessel2.speed,
			course: this.simulatedVessel2.course,
			heading: this.simulatedVessel2.heading,
			length: this.simulatedVessel2.length,
			width: this.simulatedVessel2.width,
		});

		// TODO: Add real vessels from AIS data
	}

	private async checkCollisions() {
		// Update vessel positions
		this.updateActiveVessels();

		const vessels = Array.from(this.activeVessels.values());
		
		// Need at least 2 vessels to check collisions
		if (vessels.length < 2) {
			return;
		}

		// Check for collision risks
		const risks = this.collisionDetectionService.checkCollisionRisks(vessels);

		// Emit collision risks to all clients
		if (risks.length > 0) {
			this.server.emit("collision:risks", risks);
			this.logger.log(`Detected ${risks.length} collision risks`);
		}

		// Create alerts for critical and high risks
		for (const risk of risks) {
			if (risk.riskLevel === 'critical' || risk.riskLevel === 'high') {
				await this.alertService.createAlert({
					type: AlertType.COLLISION_RISK,
					severity: risk.riskLevel === 'critical' ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
					title: `Collision Risk: ${risk.vessel1.name} & ${risk.vessel2.name}`,
					message: `CPA: ${risk.cpa.toFixed(2)} NM, TCPA: ${risk.tcpa.toFixed(1)} min`,
					vesselMmsi: risk.vessel1.mmsi,
					vesselName: risk.vessel1.name,
					relatedVesselMmsi: risk.vessel2.mmsi,
					relatedVesselName: risk.vessel2.name,
					latitude: risk.vessel1.latitude,
					longitude: risk.vessel1.longitude,
					metadata: {
						cpa: risk.cpa,
						tcpa: risk.tcpa,
						distance: risk.distance,
						bearing: risk.bearing,
					},
				});
			}
		}

		// Emit active alerts
		const activeAlerts = this.alertService.getActiveAlerts();
		this.server.emit("alerts:active", activeAlerts);
	}

	@SubscribeMessage("alerts:acknowledge")
	async handleAcknowledgeAlert(client: Socket, payload: { alertId: string }) {
		try {
			const alert = await this.alertService.acknowledgeAlert(payload.alertId, 'OPERATOR');
			this.server.emit("alert:acknowledged", alert);
			return { success: true, alert };
		} catch (error) {
			this.logger.error(`Failed to acknowledge alert: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	@SubscribeMessage("alerts:resolve")
	async handleResolveAlert(client: Socket, payload: { alertId: string }) {
		try {
			const alert = await this.alertService.resolveAlert(payload.alertId, 'OPERATOR');
			this.server.emit("alert:resolved", alert);
			return { success: true, alert };
		} catch (error) {
			this.logger.error(`Failed to resolve alert: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	@SubscribeMessage("alerts:dismiss")
	async handleDismissAlert(client: Socket, payload: { alertId: string }) {
		try {
			const alert = await this.alertService.dismissAlert(payload.alertId, 'OPERATOR');
			this.server.emit("alert:dismissed", alert);
			return { success: true, alert };
		} catch (error) {
			this.logger.error(`Failed to dismiss alert: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	@SubscribeMessage("alerts:get")
	handleGetAlerts() {
		const alerts = this.alertService.getActiveAlerts();
		return { success: true, alerts };
	}
}
