import { prisma } from '../../config/prisma';

export class RoadHealthService {
  /**
   * Recalculates health metrics and recurring damage status for a specific road segment.
   */
  public static async updateSegmentHealth(roadSegmentId: string): Promise<void> {
    const segment = await prisma.roadSegment.findUnique({
      where: { id: roadSegmentId },
      include: { reports: true },
    });

    if (!segment) return;

    const total = segment.reports.length;
    const open = segment.reports.filter((r) => r.status !== 'RESOLVED').length;
    const critical = segment.reports.filter((r) => r.severity === 'critical' && r.status !== 'RESOLVED').length;
    const resolved = segment.reports.filter((r) => r.status === 'RESOLVED').length;

    // Recurring damage detection heuristic:
    // If more than 3 complaints logged in this segment within the past 6 months
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const recentReports = segment.reports.filter((r) => new Date(r.createdAt) >= sixMonthsAgo);
    const isRecurringHotspot = recentReports.length >= 3;

    // Health Score calculation (100 is ideal, subtracted by open issues, critical issues, and recurrence)
    let healthScore = 100;
    healthScore -= open * 4;
    healthScore -= critical * 8;
    if (isRecurringHotspot) healthScore -= 15;
    healthScore = Math.max(15, Math.min(100, healthScore));

    // Reporting coverage estimation:
    // Based on complaint density per kilometer
    const densityPerKm = total / Math.max(1, segment.lengthKm);
    let reportingCoverage = 'MODERATE';
    if (densityPerKm > 3) reportingCoverage = 'HIGH';
    else if (densityPerKm < 0.8) reportingCoverage = 'LIMITED';

    await prisma.roadSegment.update({
      where: { id: roadSegmentId },
      data: {
        healthScore,
        openComplaints: open,
        criticalComplaints: critical,
        resolvedComplaints: resolved,
        recurringDamageCount: recentReports.length,
        isRecurringHotspot,
        reportingCoverage,
      },
    });
  }

  /**
   * Fetch all road health summaries with analytics
   */
  public static async getAllRoadHealth() {
    return prisma.roadSegment.findMany({
      include: {
        department: true,
        tender: true,
        _count: {
          select: { reports: true },
        },
      },
      orderBy: { healthScore: 'asc' }, // lowest health first
    });
  }
}
