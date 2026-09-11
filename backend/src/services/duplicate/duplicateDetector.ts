import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

export function getImageFingerprint(url?: string | null, filename?: string | null): string {
  try {
    const candidates = [
      url ? path.basename(url.split('?')[0]) : '',
      filename || ''
    ].filter(Boolean);

    for (const name of candidates) {
      const searchDirs = [
        path.resolve(__dirname, '../../../uploads', name),
        path.resolve(__dirname, '../../uploads', name),
        path.resolve(process.cwd(), 'uploads', name),
        path.resolve(process.cwd(), 'uploads/demo', name),
      ];
      for (const p of searchDirs) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          return crypto.createHash('md5').update(buf).digest('hex');
        }
      }
    }
  } catch {
    // Non-blocking
  }
  return '';
}

export function isSameImage(
  url1?: string | null,
  filename1?: string | null,
  url2?: string | null,
  filename2?: string | null
): boolean {
  if (!url1 && !filename1 && !url2 && !filename2) return false;
  
  // Direct exact URL match
  if (url1 && url2 && url1 === url2) return true;
  
  // Direct content hash match
  const fp1 = getImageFingerprint(url1, filename1);
  const fp2 = getImageFingerprint(url2, filename2);
  if (fp1 && fp2 && fp1 === fp2) return true;

  // Extract clean basename from URLs
  const base1 = (url1 || '').split('/').pop()?.split('?')[0]?.toLowerCase();
  const base2 = (url2 || '').split('/').pop()?.split('?')[0]?.toLowerCase();
  if (base1 && base2 && base1 === base2 && base1 !== 'image.jpg' && base1 !== 'photo.jpg') {
    return true;
  }

  // Filename match (ignoring generic auto-generated camera names)
  const fn1 = (filename1 || '').trim().toLowerCase();
  const fn2 = (filename2 || '').trim().toLowerCase();
  const genericNames = ['image.jpg', 'photo.jpg', 'file.jpg', 'upload.jpg', 'evidence.jpg', 'blob', ''];
  if (fn1 && fn2 && fn1 === fn2 && !genericNames.includes(fn1)) {
    return true;
  }

  return false;
}

export class DuplicateDetector {
  /**
   * Check if a newly submitted report is a duplicate of an existing active report:
   * CASE A: Same image + same/matching location (<= 150m) -> DUPLICATE
   * CASE B: Same image + DIFFERENT location (> 150m) -> NOT duplicate
   * CASE C: Different images + same location (<= 150m) -> NOT duplicate
   */
  public static async checkForDuplicates(
    latitude: number,
    longitude: number,
    imageUrl?: string,
    imageFilename?: string,
    excludeReportId?: string
  ): Promise<DuplicateCheckResult> {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Fetch active reports in the database
    const candidates = await prisma.roadReport.findMany({
      where: {
        createdAt: { gte: fourteenDaysAgo },
        status: { notIn: ['RESOLVED', 'CANCELLED'] },
        ...(excludeReportId ? { id: { not: excludeReportId } } : {}),
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        imageFilename: true,
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
        // CASE A: Same image + matching location (dist <= 150m)
        const sameImg = isSameImage(imageUrl, imageFilename, report.imageUrl, report.imageFilename);
        if (sameImg && !primaryDuplicateId) {
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
