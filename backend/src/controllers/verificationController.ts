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

      const verification = await prisma.repairVerification.findUnique({
        where: { reportId },
        include: { report: true },
      });

      if (!verification) {
        res.status(404).json({ success: false, message: 'Verification record not found for this report' });
        return;
      }

      const isApproved = data.decision === 'APPROVED';
      const newStatus = isApproved ? 'RESOLVED' : 'NEEDS_REINSPECTION';

      const [updatedVerification, updatedReport] = await Promise.all([
        prisma.repairVerification.update({
          where: { reportId },
          data: {
            authorityDecision: data.decision,
            authorityNotes: data.notes,
          },
        }),
        prisma.roadReport.update({
          where: { id: reportId },
          data: { status: newStatus },
        }),
        prisma.statusTimelineEvent.create({
          data: {
            reportId,
            status: newStatus,
            label: isApproved ? 'Quality Sign-Off & Complaint Closure' : 'Reinspection Mandated by Authority',
            description: isApproved
              ? `Authorized Engineer verified repair. Case formally closed. Notes: ${data.notes || 'None'}`
              : `Repair quality rejected. Contractor instructed to remobilize. Notes: ${data.notes || 'None'}`,
            actorRole: req.user?.role || 'AUTHORITY',
            actorName: req.user?.name || 'Authorized Officer',
            notes: data.notes,
          },
        }),
      ]);

      if (isApproved && verification.report.roadSegmentId) {
        await RoadHealthService.updateSegmentHealth(verification.report.roadSegmentId);
      }

      await NotificationService.notify(
        verification.report.userId,
        isApproved ? 'Complaint Resolved' : 'Complaint Reinspection Required',
        isApproved
          ? `Your complaint ${reportId} has been successfully repaired and verified.`
          : `Authority requested reinspection for complaint ${reportId}. Work is being redone.`,
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
