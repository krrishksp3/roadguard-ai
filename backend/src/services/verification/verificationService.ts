import { prisma } from '../../config/prisma';
import { aiService } from '../ai/AIService';

export class VerificationService {
  public static async processRepairVerification(reportId: string, afterImageUrl: string, notes?: string) {
    const report = await prisma.roadReport.findUnique({
      where: { id: reportId },
      include: { aiAnalysis: true },
    });

    if (!report) {
      throw new Error(`Report with id ${reportId} not found`);
    }

    if (report.status === 'CANCELLED') {
      throw new Error('Cannot run repair verification on a cancelled report.');
    }

    // Enforce strict authority lifecycle: cannot skip Acknowledged, Field Inspection, and Repair in Progress
    const invalidPriorStatuses = ['REPORTED', 'AI_ANALYZED', 'PRIORITY_CALCULATED', 'ASSIGNED'];
    if (invalidPriorStatuses.includes(report.status)) {
      throw new Error(
        `Lifecycle order violation: Complaint must complete ACKNOWLEDGED, INSPECTION_SCHEDULED, and REPAIR_IN_PROGRESS before AI repair verification (current status: ${report.status}).`
      );
    }

    const beforeImageUrl = report.imageUrl;
    const damageType = report.damageType;
    const originalSeverity = report.severity;

    // Execute AI comparison
    const aiResult = await aiService.verifyRepair(
      beforeImageUrl,
      afterImageUrl,
      damageType,
      originalSeverity
    );

    // Save verification result in DB
    const verification = await prisma.repairVerification.upsert({
      where: { reportId },
      create: {
        reportId,
        beforeImageUrl,
        afterImageUrl,
        locationMatchConfidence: aiResult.locationMatchConfidence,
        visibleImprovementScore: aiResult.visibleImprovementScore,
        remainingDamageScore: aiResult.remainingDamageScore,
        overallConfidence: aiResult.overallConfidence,
        recommendation: aiResult.recommendation,
        recommendationExplanation: aiResult.explanation,
        authorityNotes: notes,
      },
      update: {
        afterImageUrl,
        locationMatchConfidence: aiResult.locationMatchConfidence,
        visibleImprovementScore: aiResult.visibleImprovementScore,
        remainingDamageScore: aiResult.remainingDamageScore,
        overallConfidence: aiResult.overallConfidence,
        recommendation: aiResult.recommendation,
        recommendationExplanation: aiResult.explanation,
        authorityNotes: notes,
      },
    });

    const isPassed = aiResult.recommendation === 'PASS';

    // If passed and in repair phase, advance to AI_VERIFIED and accept evidence
    // If failed/rejected: DO NOT update complaint status, DO NOT mark AI_VERIFIED, DO NOT save as accepted evidence
    if (isPassed) {
      await prisma.roadReport.update({
        where: { id: reportId },
        data: {
          status: 'AI_VERIFIED',
          repairAfterImageUrl: afterImageUrl,
        },
      });

      await prisma.statusTimelineEvent.create({
        data: {
          reportId,
          status: 'AI_VERIFIED',
          label: 'AI Repair Verification Completed',
          description: `Visual inspection score: ${aiResult.visibleImprovementScore}/100. AI Recommendation: PASS. Pending Executive Engineer final sign-off.`,
          notes: aiResult.explanation,
        },
      });
    } else {
      // Revert/discard pending invalid after-image from report evidence
      await prisma.roadReport.update({
        where: { id: reportId },
        data: {
          repairAfterImageUrl: null,
        },
      });

      await prisma.statusTimelineEvent.create({
        data: {
          reportId,
          status: report.status,
          label: 'AI Repair Audit Rejected Evidence',
          description: aiResult.explanation,
          notes: 'Remediation could not be established. Re-upload valid comparable evidence.',
        },
      });
    }

    return verification;
  }
}
