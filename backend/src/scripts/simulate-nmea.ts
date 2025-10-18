#!/usr/bin/env ts-node

/**
 * Standalone NMEA Simulator
 * Sends simulated NMEA data to Redis for testing
 */

import { createClient } from 'redis';

interface VesselSimulation {
  mmsi: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
}

const vessels: VesselSimulation[] = [
  {
    mmsi: '123456789',
    name: 'CARGO SHIP A',
    latitude: 48.1173,
    longitude: -1.6778,
    speed: 12,
    course: 45,
  },
  {
    mmsi: '987654321',
    name: 'TANKER B',
    latitude: 48.2,
    longitude: -1.5,
    speed: 8,
    course: 180,
  },
  {
    mmsi: '555666777',
    name: 'FISHING VESSEL C',
    latitude: 48.0,
    longitude: -1.8,
    speed: 5,
    course: 270,
  },
];

async function main() {
  const redisUrl = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
  const client = createClient({ url: redisUrl });

  await client.connect();
  console.log('✅ Connected to Redis');
  console.log('🚢 Starting NMEA simulation...');
  console.log(`📡 Simulating ${vessels.length} vessels\n`);

  setInterval(() => {
    vessels.forEach((vessel) => {
      // Update position
      updateVesselPosition(vessel);

      // Generate NMEA RMC sentence
      const nmeaSentence = generateNmeaRMC(vessel);

      // Create AIS data
      const aisData = {
        type: 'AIS',
        mmsi: vessel.mmsi,
        vesselName: vessel.name,
        latitude: vessel.latitude,
        longitude: vessel.longitude,
        speed: vessel.speed,
        course: vessel.course,
        heading: vessel.course,
        timestamp: new Date().toISOString(),
      };

      // Publish to Redis
      client.publish('nmea:data', JSON.stringify({
        type: 'RMC',
        raw: nmeaSentence,
        ...aisData,
      }));

      client.publish('ais:data', JSON.stringify(aisData));

      console.log(`📍 ${vessel.name} (${vessel.mmsi}): ${vessel.latitude.toFixed(4)}, ${vessel.longitude.toFixed(4)} | Speed: ${vessel.speed.toFixed(1)} kts | Course: ${vessel.course.toFixed(0)}°`);
    });

    console.log('---');
  }, 2000);
}

function updateVesselPosition(vessel: VesselSimulation) {
  const distanceNm = (vessel.speed * 2) / 3600; // Distance in 2 seconds
  const distanceDeg = distanceNm / 60;

  const courseRad = (vessel.course * Math.PI) / 180;
  vessel.latitude += distanceDeg * Math.cos(courseRad);
  vessel.longitude += distanceDeg * Math.sin(courseRad) / Math.cos((vessel.latitude * Math.PI) / 180);

  // Add randomness to course
  vessel.course += (Math.random() - 0.5) * 10;
  if (vessel.course < 0) vessel.course += 360;
  if (vessel.course >= 360) vessel.course -= 360;

  // Add randomness to speed
  vessel.speed += (Math.random() - 0.5) * 0.5;
  if (vessel.speed < 0) vessel.speed = 0;
  if (vessel.speed > 20) vessel.speed = 20;
}

function generateNmeaRMC(vessel: VesselSimulation): string {
  const time = new Date();
  const timeStr = time.toISOString().substring(11, 19).replace(/:/g, '');
  const dateStr = time.toISOString().substring(8, 10) + 
                  time.toISOString().substring(5, 7) + 
                  time.toISOString().substring(2, 4);

  const latDeg = Math.abs(Math.floor(vessel.latitude));
  const latMin = (Math.abs(vessel.latitude) - latDeg) * 60;
  const latStr = `${latDeg.toString().padStart(2, '0')}${latMin.toFixed(3).padStart(6, '0')}`;
  const latDir = vessel.latitude >= 0 ? 'N' : 'S';

  const lonDeg = Math.abs(Math.floor(vessel.longitude));
  const lonMin = (Math.abs(vessel.longitude) - lonDeg) * 60;
  const lonStr = `${lonDeg.toString().padStart(3, '0')}${lonMin.toFixed(3).padStart(6, '0')}`;
  const lonDir = vessel.longitude >= 0 ? 'E' : 'W';

  return `$GPRMC,${timeStr},A,${latStr},${latDir},${lonStr},${lonDir},${vessel.speed.toFixed(1)},${vessel.course.toFixed(1)},${dateStr},,,A*00`;
}

main().catch(console.error);
