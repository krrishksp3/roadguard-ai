import { prisma } from '../../config/prisma';

// Haversine distance in meters
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOfId?: string;
  nearbyReportsCount: number;
}

export class DuplicateDetector {
  /**
   * Check if a newly submitted report is geographically and temporally adjacent to an existing open report.
   * Proximity threshold: 120 meters.
   * Time window: past 14 days.
   */
  public static async checkForDuplicates(
    latitude: number,
    longitude: number,
    damageType: string,
    excludeReportId?: string
  ): Promise<DuplicateCheckResult> {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Fetch active reports in the database
    const candidates = await prisma.roadReport.findMany({
      where: {
        createdAt: { gte: fourteenDaysAgo },
        status: { notIn: ['RESOLVED'] },
        ...(excludeReportId ? { id: { not: excludeReportId } } : {}),
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        damageType: true,
        status: true,
      },
    });

    let nearbyReportsCount = 0;
    let primaryDuplicateId: string | undefined;

    for (const report of candidates) {
      const dist = getDistanceMeters(latitude, longitude, report.latitude, report.longitude);
      if (dist <= 150) {
        nearbyReportsCount++;
        // If within 80 meters and similar damage type, mark as potential duplicate
        if (dist <= 80 && (report.damageType === damageType || damageType === 'other') && !primaryDuplicateId) {
          primaryDuplicateId = report.id;
        }
      }
    }

    return {
      isDuplicate: !!primaryDuplicateId,
      duplicateOfId: primaryDuplicateId,
      nearbyReportsCount,
    };
  }
}
