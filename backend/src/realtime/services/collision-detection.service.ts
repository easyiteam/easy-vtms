import { Injectable } from '@nestjs/common';

export interface VesselData {
  mmsi: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number; // knots
  course: number; // degrees
  heading: number;
  length?: number;
  width?: number;
}

export interface CollisionRisk {
  vessel1: VesselData;
  vessel2: VesselData;
  cpa: number; // Closest Point of Approach in nautical miles
  tcpa: number; // Time to CPA in minutes
  distance: number; // Current distance in nautical miles
  bearing: number; // Bearing from vessel1 to vessel2
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
}

@Injectable()
export class CollisionDetectionService {
  private readonly EARTH_RADIUS_NM = 3440.065; // Earth radius in nautical miles
  private readonly CRITICAL_CPA = 0.5; // 0.5 NM
  private readonly HIGH_CPA = 1.0; // 1 NM
  private readonly MEDIUM_CPA = 2.0; // 2 NM
  private readonly MAX_TCPA = 30; // 30 minutes

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in nautical miles
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_NM * c;
  }

  /**
   * Calculate bearing from point 1 to point 2
   * Returns bearing in degrees (0-360)
   */
  calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

    const bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }

  /**
   * Calculate CPA (Closest Point of Approach) and TCPA (Time to CPA)
   * Based on relative motion between two vessels
   */
  calculateCPATCPA(vessel1: VesselData, vessel2: VesselData): { cpa: number; tcpa: number } {
    // Convert speeds from knots to NM/min
    const v1 = vessel1.speed / 60;
    const v2 = vessel2.speed / 60;

    // Convert courses to radians
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const c1 = toRad(vessel1.course);
    const c2 = toRad(vessel2.course);

    // Calculate velocity components
    const v1x = v1 * Math.sin(c1);
    const v1y = v1 * Math.cos(c1);
    const v2x = v2 * Math.sin(c2);
    const v2y = v2 * Math.cos(c2);

    // Relative velocity
    const vrx = v1x - v2x;
    const vry = v1y - v2y;
    const vr = Math.sqrt(vrx * vrx + vry * vry);

    // If no relative motion, vessels are moving in parallel
    if (vr < 0.01) {
      const distance = this.calculateDistance(
        vessel1.latitude,
        vessel1.longitude,
        vessel2.latitude,
        vessel2.longitude,
      );
      return { cpa: distance, tcpa: Infinity };
    }

    // Calculate relative position
    const distance = this.calculateDistance(
      vessel1.latitude,
      vessel1.longitude,
      vessel2.latitude,
      vessel2.longitude,
    );
    const bearing = this.calculateBearing(
      vessel1.latitude,
      vessel1.longitude,
      vessel2.latitude,
      vessel2.longitude,
    );

    // Position components
    const dx = distance * Math.sin(toRad(bearing));
    const dy = distance * Math.cos(toRad(bearing));

    // Time to CPA (in minutes)
    const tcpa = -(dx * vrx + dy * vry) / (vr * vr);

    // If TCPA is negative, vessels are diverging
    if (tcpa < 0) {
      return { cpa: distance, tcpa: -1 };
    }

    // CPA distance
    const cpa = Math.sqrt(
      (dx + vrx * tcpa) * (dx + vrx * tcpa) + (dy + vry * tcpa) * (dy + vry * tcpa),
    );

    return { cpa, tcpa };
  }

  /**
   * Determine risk level based on CPA and TCPA
   */
  determineRiskLevel(cpa: number, tcpa: number): 'critical' | 'high' | 'medium' | 'low' {
    // Vessels diverging or TCPA too far in future
    if (tcpa < 0 || tcpa > this.MAX_TCPA) {
      return 'low';
    }

    // Critical: Very close CPA and imminent
    if (cpa < this.CRITICAL_CPA && tcpa < 10) {
      return 'critical';
    }

    // High: Close CPA
    if (cpa < this.HIGH_CPA && tcpa < 15) {
      return 'high';
    }

    // Medium: Moderate CPA
    if (cpa < this.MEDIUM_CPA && tcpa < 20) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Check collision risks between all vessels
   */
  checkCollisionRisks(vessels: VesselData[]): CollisionRisk[] {
    const risks: CollisionRisk[] = [];

    // Compare each vessel with every other vessel
    for (let i = 0; i < vessels.length; i++) {
      for (let j = i + 1; j < vessels.length; j++) {
        const vessel1 = vessels[i];
        const vessel2 = vessels[j];

        // Skip if either vessel is stationary (speed < 0.5 knots)
        if (vessel1.speed < 0.5 || vessel2.speed < 0.5) {
          continue;
        }

        const distance = this.calculateDistance(
          vessel1.latitude,
          vessel1.longitude,
          vessel2.latitude,
          vessel2.longitude,
        );

        // Skip if vessels are too far apart (> 10 NM)
        if (distance > 10) {
          continue;
        }

        const { cpa, tcpa } = this.calculateCPATCPA(vessel1, vessel2);
        const riskLevel = this.determineRiskLevel(cpa, tcpa);

        // Only report medium or higher risks
        if (riskLevel !== 'low') {
          const bearing = this.calculateBearing(
            vessel1.latitude,
            vessel1.longitude,
            vessel2.latitude,
            vessel2.longitude,
          );

          risks.push({
            vessel1,
            vessel2,
            cpa,
            tcpa,
            distance,
            bearing,
            riskLevel,
            timestamp: new Date(),
          });
        }
      }
    }

    // Sort by risk level (critical first) and then by TCPA
    risks.sort((a, b) => {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const levelDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      if (levelDiff !== 0) return levelDiff;
      return a.tcpa - b.tcpa;
    });

    return risks;
  }

  /**
   * Calculate safe passing distance based on vessel dimensions
   */
  calculateSafePassingDistance(vessel1: VesselData, vessel2: VesselData): number {
    const length1 = vessel1.length || 100; // Default 100m if not specified
    const length2 = vessel2.length || 100;
    const width1 = vessel1.width || 20;
    const width2 = vessel2.width || 20;

    // Safe distance = sum of lengths + safety margin (in meters)
    const safeDistanceMeters = length1 + length2 + Math.max(width1, width2) * 2 + 200;

    // Convert to nautical miles (1 NM = 1852 meters)
    return safeDistanceMeters / 1852;
  }

  /**
   * Check if vessel is in a collision course with another
   */
  isCollisionCourse(vessel1: VesselData, vessel2: VesselData): boolean {
    const { cpa, tcpa } = this.calculateCPATCPA(vessel1, vessel2);
    const safeDistance = this.calculateSafePassingDistance(vessel1, vessel2);

    return tcpa > 0 && tcpa < this.MAX_TCPA && cpa < safeDistance;
  }
}
