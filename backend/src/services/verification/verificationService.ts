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

    // Update report status to AI_VERIFIED
    await prisma.roadReport.update({
      where: { id: reportId },
      data: {
        status: 'AI_VERIFIED',
        repairAfterImageUrl: afterImageUrl,
      },
    });

    // Add to timeline
    await prisma.statusTimelineEvent.create({
      data: {
        reportId,
        status: 'AI_VERIFIED',
        label: 'AI Repair Verification Completed',
        description: `Visual inspection score: ${aiResult.visibleImprovementScore}/100. AI Recommendation: ${aiResult.recommendation}.`,
        notes: aiResult.explanation,
      },
    });

    return verification;
  }
}
