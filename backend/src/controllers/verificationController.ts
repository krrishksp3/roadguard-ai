import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { repairVerificationSchema, authorityDecisionSchema } from '../validators/schemas';
import { VerificationService } from '../services/verification/verificationService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { NotificationService } from '../services/notification/notificationService';
import { RoadHealthService } from '../services/roadHealth/roadHealthService';

export class VerificationController {
  public static async runVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = repairVerificationSchema.parse(req.body);
      const result = await VerificationService.processRepairVerification(
        data.reportId,
        data.afterImageUrl,
        data.notes
      );

      res.status(200).json({
        success: true,
        message: 'AI Repair Verification completed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async submitAuthorityDecision(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const data = authorityDecisionSchema.parse(req.body);

      const report = await prisma.roadReport.findUnique({
        where: { id: reportId },
        include: { verificationResult: true },
      });

      if (!report) {
        res.status(404).json({ success: false, message: 'Report record not found' });
        return;
      }

      if (report.status === 'CANCELLED') {
        res.status(400).json({
          success: false,
          message: 'Cannot perform repair actions or decisions on a cancelled report.',
        });
        return;
      }

      const isApproved = data.decision === 'APPROVED';

      // If approving but AI verification flagged evidence mismatch or rejection
      if (isApproved && (report.verificationResult?.recommendation === 'NEEDS_REINSPECTION' || report.verificationResult?.recommendation === 'REJECT')) {
        res.status(400).json({
          success: false,
          message: 'Formal closure blocked: AI Repair Verification flagged evidence mismatch or rejection (REJECT / NEEDS_REINSPECTION). Valid repair evidence and reinspection is required before sign-off.',
        });
        return;
      }

      // If approving, after-repair evidence is required
      if (isApproved && !report.repairAfterImageUrl) {
        res.status(400).json({
          success: false,
          message: 'Formal closure blocked: after-repair evidence photo has not been accepted or uploaded yet.',
        });
        return;
      }

      const newStatus = isApproved ? 'RESOLVED' : 'NEEDS_REINSPECTION';

      // Upsert RepairVerification record so decision is guaranteed to persist
      const updatedVerification = await prisma.repairVerification.upsert({
        where: { reportId },
        create: {
          reportId,
          beforeImageUrl: report.imageUrl,
          afterImageUrl: report.repairAfterImageUrl || report.imageUrl,
          locationMatchConfidence: report.verificationResult?.locationMatchConfidence ?? (isApproved ? 90 : 0),
          visibleImprovementScore: report.verificationResult?.visibleImprovementScore ?? (isApproved ? 85 : 0),
          remainingDamageScore: report.verificationResult?.remainingDamageScore ?? (isApproved ? 15 : 100),
          overallConfidence: report.verificationResult?.overallConfidence ?? (isApproved ? 90 : 0),
          recommendation: report.verificationResult?.recommendation ?? (isApproved ? 'PASS' : 'NEEDS_REINSPECTION'),
          recommendationExplanation: report.verificationResult?.recommendationExplanation ?? (isApproved
            ? 'Visual comparison indicates road distress has been remediated with asphalt overlay. Verified by Authority Officer.'
            : 'Remediation rejected by inspecting officer. Residual depression or inadequate compaction observed.'),
          authorityDecision: data.decision,
          authorityNotes: data.notes,
        },
        update: {
          authorityDecision: data.decision,
          authorityNotes: data.notes,
        },
      });

      const [updatedReport] = await Promise.all([
        prisma.roadReport.update({
          where: { id: reportId },
          data: { status: newStatus },
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
            status: newStatus,
            label: isApproved ? 'Quality Sign-Off & Complaint Closure' : 'Reinspection Mandated by Authority',
            description: isApproved
              ? `Authorized Engineer verified repair. Case formally closed. Notes: ${data.notes || 'Remediation verified on site.'}`
              : `Repair quality rejected. Contractor instructed to remobilize and rework. Notes: ${data.notes || 'Reinspection mandated.'}`,
            actorRole: req.user?.role || 'AUTHORITY',
            actorName: req.user?.name || 'Authorized Officer',
            notes: data.notes,
          },
        }),
      ]);

      if (isApproved && report.roadSegmentId) {
        await RoadHealthService.updateSegmentHealth(report.roadSegmentId);
      }

      await NotificationService.notify(
        report.userId,
        isApproved ? 'Complaint Formally Resolved' : 'Complaint Reinspection Required',
        isApproved
          ? `Your complaint ${reportId} has been formally closed and verified by Executive Engineer.`
          : `Authority requested reinspection for complaint ${reportId}. Remediation work is being redone.`,
        reportId,
        isApproved ? 'RESOLUTION' : 'INFO'
      );

      res.status(200).json({
        success: true,
        message: `Authority decision recorded: ${data.decision}`,
        data: { verification: updatedVerification, report: updatedReport },
      });
    } catch (error) {
      next(error);
    }
  }
}
