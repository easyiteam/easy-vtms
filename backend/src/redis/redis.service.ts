import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { createClient, RedisClientType } from "redis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
	private client: RedisClientType;
	private publisher: RedisClientType;
	private subscriber: RedisClientType;

	async onModuleInit() {
		const redisUrl = `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`;

		this.client = createClient({ url: redisUrl });
		this.publisher = createClient({ url: redisUrl });
		this.subscriber = createClient({ url: redisUrl });

		await this.client.connect();
		await this.publisher.connect();
		await this.subscriber.connect();

		console.log("✅ Redis connected");
	}

	async onModuleDestroy() {
		await this.client.quit();
		await this.publisher.quit();
		await this.subscriber.quit();
	}

	getClient(): RedisClientType {
		return this.client;
	}

	getPublisher(): RedisClientType {
		return this.publisher;
	}

	getSubscriber(): RedisClientType {
		return this.subscriber;
	}

	async publish(channel: string, message: string): Promise<void> {
		if (!this.publisher) {
			return;
		}
		await this.publisher.publish(channel, message);
	}

	async subscribe(
		channel: string,
		callback: (message: string) => void
	): Promise<void> {
		if (!this.subscriber) {
			return;
		}
		await this.subscriber.subscribe(channel, callback);
	}
}
