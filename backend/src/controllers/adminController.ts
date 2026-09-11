import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { NotificationService } from '../services/notification/notificationService';
import { SLAService } from '../services/sla/slaService';

export class AdminController {
  // GET /api/admin/overview
  public static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Fetch critical reports (riskScore >= 80)
      const criticalReports = await prisma.roadReport.findMany({
        where: { riskScore: { gte: 80 }, status: { not: 'RESOLVED' } },
        include: {
          department: true,
          roadSegment: { include: { tender: true } },
          timeline: { orderBy: { timestamp: 'desc' }, take: 2 },
        },
        orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
        take: 20,
      });

      // 2. Fetch overdue SLA reports
      const allActiveReports = await prisma.roadReport.findMany({
        where: { status: { not: 'RESOLVED' } },
        include: {
          department: true,
          roadSegment: { include: { tender: true } },
        },
        orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
      });

      const overdueReports = allActiveReports.filter((r) => {
        const sla = SLAService.evaluateOverdueStatus(r.createdAt, r.slaDueAt, r.status);
        return sla.isOverdue;
      });

      // 3. Fetch authority escalated reports
      const escalatedTimelineEvents = await prisma.statusTimelineEvent.findMany({
        where: {
          label: { contains: 'Escalated' },
        },
        select: { reportId: true },
      });
      const escalatedIds = Array.from(new Set(escalatedTimelineEvents.map((e) => e.reportId)));

      const escalatedReports = await prisma.roadReport.findMany({
        where: { id: { in: escalatedIds } },
        include: {
          department: true,
          roadSegment: { include: { tender: true } },
          timeline: { orderBy: { timestamp: 'desc' } },
        },
      });

      // 4. Fetch contractor / recurring hotspot issues
      const contractorIssues = await prisma.roadReport.findMany({
        where: {
          OR: [{ isRecurring: true }, { status: 'NEEDS_REINSPECTION' }],
        },
        include: {
          department: true,
          roadSegment: { include: { tender: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 20,
      });

      // 5. Overall statistics
      const [totalCount, resolvedCount, departmentStats] = await Promise.all([
        prisma.roadReport.count(),
        prisma.roadReport.count({ where: { status: 'RESOLVED' } }),
        prisma.department.findMany({
          include: {
            _count: { select: { reports: true } },
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          stats: {
            totalReports: totalCount,
            criticalCount: criticalReports.length,
            overdueCount: overdueReports.length,
            escalatedCount: escalatedReports.length,
            resolvedCount,
          },
          criticalReports,
          overdueReports,
          escalatedReports,
          contractorIssues,
          departments: departmentStats,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/admin/action
  public static async takeAction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId, actionType, notes, targetDepartmentId } = req.body;

      if (!reportId || !actionType) {
        res.status(400).json({ success: false, message: 'Report ID and actionType are required' });
        return;
      }

      const report = await prisma.roadReport.findUnique({
        where: { id: reportId },
        include: { department: true },
      });

      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      const actionLabels: Record<string, { label: string; desc: string; newStatus?: string }> = {
        ESCALATE_AUTHORITY: {
          label: 'District Magistrate Directive: Immediate Remediation Ordered',
          desc: 'High-level administration directive issued to Executive Engineer for priority resolution within 24h.',
        },
        REQUIRE_INSPECTION: {
          label: 'Executive Directive: Mandatory Joint Field Inspection',
          desc: 'District Admin mandated Senior Divisional Engineer joint cross-section inspection.',
          newStatus: 'INSPECTION_SCHEDULED',
        },
        REQUIRE_REINSPECTION: {
          label: 'Quality Audit Audit Failed: Reinspection Mandated',
          desc: 'Administrative quality assessment rejected contractor rectification. Immediate rework ordered.',
          newStatus: 'NEEDS_REINSPECTION',
        },
        REQUIRE_EVIDENCE: {
          label: 'Evidence Defect: Fresh Geotagged Proof Required',
          desc: 'District Admin ordered high-resolution before/after photographic proof with coordinates.',
        },
        FLAG_CONTRACTOR_SLA: {
          label: 'Contractor Penalty & Notice Flagged',
          desc: 'Liquidated damages notice flagged against contractor under Public Works Procurement Rules.',
        },
        DIRECTIVE: {
          label: 'District Administrative Instruction Recorded',
          desc: notes || 'Administrative directive recorded for executive compliance.',
        },
      };

      const meta = actionLabels[actionType] || actionLabels.DIRECTIVE;

      const updateData: any = {};
      if (meta.newStatus) {
        updateData.status = meta.newStatus;
      }
      if (targetDepartmentId) {
        updateData.departmentId = targetDepartmentId;
      }

      const [updatedReport] = await Promise.all([
        prisma.roadReport.update({
          where: { id: reportId },
          data: updateData,
          include: {
            aiAnalysis: true,
            priorityAssessment: true,
            timeline: { orderBy: { timestamp: 'asc' } },
            department: true,
            roadSegment: true,
            verificationResult: true,
          },
        }),
        prisma.statusTimelineEvent.create({
          data: {
            reportId,
            status: meta.newStatus || report.status,
            label: meta.label,
            description: notes ? `${meta.desc} Remarks: ${notes}` : meta.desc,
            actorRole: 'ADMIN',
            actorName: req.user?.name || 'District Administrator',
            notes,
          },
        }),
      ]);

      // Notify authorities of the responsible department
      const authorities = await prisma.user.findMany({
        where: {
          role: 'AUTHORITY',
          ...(report.departmentId ? { departmentId: report.departmentId } : {}),
        },
      });

      for (const auth of authorities) {
        await NotificationService.notify(
          auth.id,
          meta.label,
          `District Admin issued directive on Case ${reportId}: ${notes || meta.desc}`,
          reportId,
          'SLA_ALERT'
        );
      }

      // Notify Citizen as well
      await NotificationService.notify(
        report.userId,
        'Administrative Intervention',
        `District Administration has intervened on your report ${reportId}: ${meta.label}`,
        reportId,
        'INFO'
      );

      res.status(200).json({
        success: true,
        message: 'Administrative action recorded and dispatched successfully',
        data: updatedReport,
      });
    } catch (error) {
      next(error);
    }
  }
}
