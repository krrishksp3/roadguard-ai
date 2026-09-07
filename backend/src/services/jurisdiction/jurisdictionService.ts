import { prisma } from '../../config/prisma';
import { getDistanceMeters } from '../duplicate/duplicateDetector';

export interface AssignedJurisdiction {
  roadSegmentId?: string;
  roadSegmentName?: string;
  departmentId?: string;
  departmentName?: string;
  tenderId?: string;
  isRecurringHotspot: boolean;
  roadHealthScore: number;
}

export class JurisdictionService {
  /**
   * Find the nearest road segment and responsible administrative department for a given coordinate.
   */
  public static async resolveJurisdiction(lat: number, lng: number): Promise<AssignedJurisdiction> {
    const segments = await prisma.roadSegment.findMany({
      include: {
        department: true,
        tender: true,
      },
    });

    if (segments.length === 0) {
      // Fallback if no segments yet in DB
      const defaultDept = await prisma.department.findFirst();
      return {
        departmentId: defaultDept?.id,
        departmentName: defaultDept?.name || 'Public Works Department (PWD Meerut)',
        isRecurringHotspot: false,
        roadHealthScore: 75,
      };
    }

    let closestSegment = segments[0];
    let minDistance = Infinity;

    for (const segment of segments) {
      // Midpoint approximation of segment
      const midLat = (segment.startLat + segment.endLat) / 2;
      const midLng = (segment.startLng + segment.endLng) / 2;
      const dist = getDistanceMeters(lat, lng, midLat, midLng);

      if (dist < minDistance) {
        minDistance = dist;
        closestSegment = segment;
      }
    }

    return {
      roadSegmentId: closestSegment.id,
      roadSegmentName: closestSegment.name,
      departmentId: closestSegment.departmentId,
      departmentName: closestSegment.department.name,
      tenderId: closestSegment.tender?.id,
      isRecurringHotspot: closestSegment.isRecurringHotspot,
      roadHealthScore: closestSegment.healthScore,
    };
  }
}
