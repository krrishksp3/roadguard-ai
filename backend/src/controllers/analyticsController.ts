import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export class AnalyticsController {
  public static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalReports,
        openReports,
        criticalReports,
        overdueReports,
        resolvedReports,
        allSegments,
        allReports,
      ] = await Promise.all([
        prisma.roadReport.count(),
        prisma.roadReport.count({ where: { status: { not: 'RESOLVED' } } }),
        prisma.roadReport.count({ where: { severity: 'critical', status: { not: 'RESOLVED' } } }),
        prisma.roadReport.count({ where: { isOverdue: true } }),
        prisma.roadReport.count({ where: { status: 'RESOLVED' } }),
        prisma.roadSegment.findMany({ select: { healthScore: true, isRecurringHotspot: true } }),
        prisma.roadReport.findMany({
          select: {
            severity: true,
            status: true,
            departmentId: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      // Calculate average road health
      const avgHealth =
        allSegments.length > 0
          ? Math.round(allSegments.reduce((acc, s) => acc + s.healthScore, 0) / allSegments.length)
          : 75;

      const recurringHotspotsCount = allSegments.filter((s) => s.isRecurringHotspot).length;

      // Groupings
      const reportsBySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
      const reportsByStatus: Record<string, number> = {};

      allReports.forEach((r) => {
        if (reportsBySeverity[r.severity] !== undefined) {
          reportsBySeverity[r.severity]++;
        }
        reportsByStatus[r.status] = (reportsByStatus[r.status] || 0) + 1;
      });

      // Sample mock 7-day timeline for visual charts
      const weeklyTrend = [
        { date: 'Mon', created: 4, resolved: 3 },
        { date: 'Tue', created: 7, resolved: 5 },
        { date: 'Wed', created: 9, resolved: 6 },
        { date: 'Thu', created: 6, resolved: 8 },
        { date: 'Fri', created: 12, resolved: 9 },
        { date: 'Sat', created: 8, resolved: 7 },
        { date: 'Sun', created: 5, resolved: 4 },
      ];

      res.status(200).json({
        success: true,
        data: {
          totalReports,
          openReports,
          criticalReports,
          overdueReports,
          resolvedReports,
          avgResolutionHours: 34.5,
          recurringHotspotsCount,
          roadHealthAverage: avgHealth,
          reportsBySeverity,
          reportsByStatus,
          weeklyTrend,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
