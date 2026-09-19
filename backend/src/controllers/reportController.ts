import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { reportCreateSchema, reportStatusUpdateSchema, afterPhotoUploadSchema } from '../validators/schemas';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { aiService } from '../services/ai/AIService';
import { RoadRiskEngine } from '../services/priority/riskEngine';
import { DuplicateDetector } from '../services/duplicate/duplicateDetector';
import { JurisdictionService } from '../services/jurisdiction/jurisdictionService';
import { RoadHealthService } from '../services/roadHealth/roadHealthService';
import { SLAService } from '../services/sla/slaService';
import { NotificationService } from '../services/notification/notificationService';
import { isAcceptedRoadDamageClass } from '../services/ai/schemas';

let reportCounter = 100;

export class ReportController {
  public static async createReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = reportCreateSchema.parse(req.body);
      
      // Resolve valid user ID (foreign key integrity)
      let userId = req.user?.id;
      if (!userId) {
        const primaryCitizen = await prisma.user.findFirst({ where: { role: 'CITIZEN' } });
        userId = primaryCitizen?.id || 'user-citizen-01';
      }

      // Check idempotency if clientReportId provided
      if (data.clientReportId) {
        const existing = await prisma.roadReport.findUnique({
          where: { clientReportId: data.clientReportId },
          include: {
            aiAnalysis: true,
            priorityAssessment: true,
            timeline: { orderBy: { timestamp: 'asc' } },
            roadSegment: { include: { tender: true } },
            department: true,
          },
        });
        if (existing) {
          res.status(200).json({ success: true, message: 'Report already synced', data: existing });
          return;
        }
      }

      // Generate standardized unique Report ID
      const count = await prisma.roadReport.count();
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const reportId = `RG-MRT-2026-${String(count + 1).padStart(2, '0')}${uniqueSuffix}`;

      // 1. AI Road Damage Classification — Image is Primary Signal (Evaluated BEFORE any jurisdiction/assignment)
      let aiResult;
      try {
        aiResult = await aiService.analyzeRoadDamage(data.imageUrl, data.description, data.damageTypeHint, data.imageFilename);
      } catch (err) {
        console.error('[ReportController] AI analysis error:', err);
        // If cloud AI provider was explicitly configured (Gemini/OpenAI), do NOT silently fallback or fake a report.
        if (!aiService.isDemo()) {
          res.status(503).json({
            success: false,
            message: `AI Vision analysis failed: ${(err as Error).message}`,
            aiProvider: aiService.getProviderName(),
          });
          return;
        }

        aiResult = {
          damageDetected: false,
          validRoadDamage: false,
          classification: 'INSUFFICIENT_EVIDENCE' as const,
          damageType: 'INSUFFICIENT_EVIDENCE' as const,
          severity: 'NONE' as const,
          safetyRisk: 'NONE' as const,
          confidence: 0,
          visibleDamage: false,
          roadSafetyRisk: 0,
          evidenceReason: 'Image analysis could not be completed for the uploaded photograph. Evidence is insufficient.',
          description: 'Insufficient image evidence: The uploaded image could not be processed for road defect verification.',
          recommendedAction: 'Please submit a clear, well-lit photograph directly facing the road distress.',
          cancellationReason: 'Road damage could not be verified from this image. Image quality is insufficient.',
          imageQuality: { isAcceptable: false, isBlurry: true, isTooDark: false, hasRoadVisible: false, qualityScore: 0 },
        };
      }

      // 2. HARD IMAGE-FIRST VALIDATION CHECK — STOP WORKFLOW IMMEDIATELY IF NOT VALID ROAD DAMAGE
      const isAcceptedClass = isAcceptedRoadDamageClass(aiResult.damageType);
      const isDamageValid = Boolean(
        aiResult.damageDetected === true &&
        isAcceptedClass &&
        aiResult.classification === 'VALID_ROAD_DAMAGE' &&
        aiResult.roadSafetyRisk > 0
      );

      if (!isDamageValid) {
        const cancelledReport = await prisma.roadReport.create({
          data: {
            id: reportId,
            clientReportId: data.clientReportId,
            userId,
            imageUrl: data.imageUrl,
            additionalImages: data.additionalImages ? JSON.stringify(data.additionalImages) : null,
            evidenceSource: data.evidenceSource || 'USER_UPLOADED',
            evidenceSourceMetadata: data.evidenceSourceMetadata || null,
            imageFilename: data.imageFilename || null,
            imageMimeType: data.imageMimeType || null,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address || 'Meerut Road Network, Meerut, UP',
            description: data.description,
            damageType: aiResult.damageType || 'NO_ROAD_DAMAGE',
            severity: 'NONE',
            status: 'CANCELLED',
            roadSegmentId: null,
            departmentId: null,
            riskScore: 0,
            isDuplicate: false,
            isRecurring: false,
            slaTargetHours: 0,
            slaDueAt: new Date(),
            isOverdue: false,
            aiAnalysis: {
              create: {
                damageType: aiResult.damageType || 'NO_ROAD_DAMAGE',
                severity: 'NONE',
                confidence: 0,
                visibleDamage: false,
                roadSafetyRisk: 0,
                description: aiResult.description || 'Road damage could not be verified from this image.',
                recommendedAction: aiResult.recommendedAction || 'No civil action required. Report cancelled at intake due to invalid evidence.',
                isAcceptableQuality: aiResult.imageQuality?.isAcceptable ?? false,
                qualityScore: aiResult.imageQuality?.qualityScore ?? 0,
                isBlurry: aiResult.imageQuality?.isBlurry ?? false,
                isTooDark: aiResult.imageQuality?.isTooDark ?? false,
                hasRoadVisible: aiResult.imageQuality?.hasRoadVisible ?? false,
                qualityWarning: aiResult.imageQuality?.warningMessage || 'No supported road distress identified in photograph.',
              },
            },
            priorityAssessment: {
              create: {
                overallScore: 0,
                riskLevel: 'LOW',
                severityScore: 0,
                safetyRiskScore: 0,
                densityScore: 0,
                roadImportanceScore: 0,
                recurrenceScore: 0,
                slaUrgencyScore: 0,
                explanation: JSON.stringify(['No road risk detected. Uploaded evidence does not show supported civil infrastructure defect.']),
              },
            },
            timeline: {
              create: [
                {
                  status: 'REPORTED',
                  label: 'Report Submitted',
                  description: 'Citizen submitted photograph for intake verification.',
                },
                {
                  status: 'CANCELLED',
                  label: 'Report Cancelled — Invalid Evidence',
                  description: 'Road damage could not be verified from this image. Workflow stopped at intake.',
                },
              ],
            },
          },
          include: {
            aiAnalysis: true,
            priorityAssessment: true,
            timeline: { orderBy: { timestamp: 'asc' } },
            roadSegment: true,
            department: true,
          },
        });

        // STOP WORKFLOW:
        // No jurisdiction routing
        // No risk score calculation (NO RISK FOUND)
        // No duplicate detection
        // No department assignment
        // No authority notification
        // No admin notification
        // No road segment health recalculation
        res.status(201).json({
          success: true,
          damageDetected: false,
          validRoadDamage: false,
          classification: aiResult.classification || 'NO_DAMAGE_FOUND',
          damageType: 'NONE',
          priority: 'NONE',
          severity: 'NONE',
          safetyRisk: 'NONE',
          riskScore: 0,
          status: 'CANCELLED',
          evidenceReason: aiResult.evidenceReason || aiResult.cancellationReason || 'The uploaded photograph does not show supported road damage.',
          reason: aiResult.evidenceReason || aiResult.cancellationReason || 'The uploaded photograph does not show supported road damage.',
          message: 'Road damage could not be verified from this image. Your report was not forwarded to the authority because the uploaded image did not provide sufficient road-damage evidence.',
          data: cancelledReport,
        });
        return;
      }

      // 3. ONLY IF VALID ROAD DAMAGE:
      // A. Jurisdiction & Road Segment Resolution
      const jurisdiction = await JurisdictionService.resolveJurisdiction(data.latitude, data.longitude);

      // B. Duplicate Detection (Valid road reports only)
      const duplicateCheck = await DuplicateDetector.checkForDuplicates(
        data.latitude,
        data.longitude,
        data.imageUrl,
        data.imageFilename
      );

      // C. SLA Calculation
      const slaTargetHours = SLAService.getTargetHours(aiResult.severity);
      const now = new Date();
      const slaDueAt = SLAService.calculateDueDate(now, aiResult.severity);

      // D. Dynamic Road Risk Score (0 - 100)
      const priorityResult = RoadRiskEngine.calculate({
        damageDetected: true,
        damageType: aiResult.damageType,
        classification: aiResult.classification,
        severity: aiResult.severity,
        roadSafetyRisk: aiResult.roadSafetyRisk,
        aiConfidence: aiResult.confidence,
        nearbyReportsCount: duplicateCheck.nearbyReportsCount,
        roadImportance: 'MAJOR_DISTRICT',
        isRecurringHotspot: jurisdiction.isRecurringHotspot,
        roadHealthScore: 70,
        hoursSinceReported: 0,
        slaTargetHours,
      });

      const finalStatus = 'ASSIGNED';
      const finalRiskScore = priorityResult.overallScore;

      // 6. Persist Report & Sub-models
      const report = await prisma.roadReport.create({
        data: {
          id: reportId,
          clientReportId: data.clientReportId,
          userId,
          imageUrl: data.imageUrl,
          additionalImages: data.additionalImages ? JSON.stringify(data.additionalImages) : null,
          evidenceSource: data.evidenceSource || 'USER_UPLOADED',
          evidenceSourceMetadata: data.evidenceSourceMetadata || null,
          imageFilename: data.imageFilename || null,
          imageMimeType: data.imageMimeType || null,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address || `${jurisdiction.roadSegmentName || 'Meerut Road Network'}, Meerut, UP`,
          description: data.description,
          damageType: aiResult.damageType,
          severity: aiResult.severity,
          status: finalStatus,
          roadSegmentId: jurisdiction.roadSegmentId,
          departmentId: jurisdiction.departmentId,
          riskScore: finalRiskScore,
          isDuplicate: duplicateCheck.isDuplicate,
          duplicateOfId: duplicateCheck.duplicateOfId,
          isRecurring: jurisdiction.isRecurringHotspot,
          slaTargetHours,
          slaDueAt,
          isOverdue: false,
          aiAnalysis: {
            create: {
              damageType: aiResult.damageType,
              severity: aiResult.severity,
              confidence: aiResult.confidence,
              visibleDamage: aiResult.visibleDamage,
              roadSafetyRisk: aiResult.roadSafetyRisk,
              description: aiResult.description,
              recommendedAction: aiResult.recommendedAction,
              isAcceptableQuality: aiResult.imageQuality.isAcceptable,
              qualityScore: aiResult.imageQuality.qualityScore,
              isBlurry: aiResult.imageQuality.isBlurry,
              isTooDark: aiResult.imageQuality.isTooDark,
              hasRoadVisible: aiResult.imageQuality.hasRoadVisible,
              qualityWarning: aiResult.imageQuality.warningMessage,
              potentialDuplicateOf: duplicateCheck.duplicateOfId,
              isDuplicate: duplicateCheck.isDuplicate,
            },
          },
          priorityAssessment: {
            create: {
              overallScore: finalRiskScore,
              riskLevel: priorityResult.riskLevel,
              severityScore: priorityResult.breakdown.severityScore,
              safetyRiskScore: priorityResult.breakdown.safetyRiskScore,
              densityScore: priorityResult.breakdown.densityScore,
              roadImportanceScore: priorityResult.breakdown.roadImportanceScore,
              recurrenceScore: priorityResult.breakdown.recurrenceScore,
              slaUrgencyScore: priorityResult.breakdown.slaUrgencyScore,
              explanation: JSON.stringify(priorityResult.explanation),
            },
          },
          timeline: {
            create: [
              {
                status: 'REPORTED',
                label: 'Complaint Registered',
                description: 'Citizen submitted road distress report with geolocated evidence.',
              },
              {
                status: 'AI_ANALYZED',
                label: 'AI Computer Vision Analysis',
                description: `Identified ${aiResult.damageType} with ${Math.round(aiResult.confidence * 100)}% confidence. Severity rated ${aiResult.severity.toUpperCase()}.`,
              },
              {
                status: 'PRIORITY_CALCULATED',
                label: 'Road Risk Score Computed',
                description: `Dynamic Risk Score evaluated at ${priorityResult.overallScore}/100 (${priorityResult.riskLevel}).`,
              },
              {
                status: 'ASSIGNED',
                label: 'Assigned to Responsible Department',
                description: duplicateCheck.isDuplicate
                  ? `Automated dispatch to ${jurisdiction.departmentName || 'PWD Meerut'}. Linked as duplicate of active complaint #${duplicateCheck.duplicateOfId}.`
                  : `Automated dispatch to ${jurisdiction.departmentName || 'PWD Meerut'}.`,
              },
            ],
          },
        },
        include: {
          aiAnalysis: true,
          priorityAssessment: true,
          timeline: { orderBy: { timestamp: 'asc' } },
          roadSegment: { include: { tender: true } },
          department: true,
        },
      });

      // Update segment health
      if (jurisdiction.roadSegmentId) {
        await RoadHealthService.updateSegmentHealth(jurisdiction.roadSegmentId);
      }

      // Notify citizen
      await NotificationService.notify(
        userId,
        'Road Complaint Registered',
        `Your report ${reportId} has been verified by AI (Risk: ${priorityResult.overallScore}/100) and assigned to ${jurisdiction.departmentName}.`,
        reportId,
        'ASSIGNMENT'
      );

      const statusCode = duplicateCheck.isDuplicate ? 200 : 201;
      res.status(statusCode).json({
        success: true,
        damageDetected: true,
        validRoadDamage: true,
        classification: aiResult.classification,
        damageType: aiResult.damageType,
        severity: report.severity,
        riskScore: report.riskScore,
        status: report.status,
        isDuplicate: duplicateCheck.isDuplicate,
        duplicateOfId: duplicateCheck.duplicateOfId,
        message: duplicateCheck.isDuplicate
          ? `Duplicate road-damage evidence linked to active complaint: ${duplicateCheck.duplicateOfId}`
          : 'Road report registered and analyzed successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAllReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, severity, departmentId, isOverdue, search, sortBy = 'newest', page = '1', limit = '50' } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const take = parseInt(limit as string, 10) || 50;
      const skip = (pageNum - 1) * take;

      const where: any = {};
      if (status) {
        where.status = status as string;
      } else {
        where.status = { not: 'CANCELLED' };
      }
      // Guarantee CANCELLED submissions are never exposed in authority or admin worklists
      const authUser = (req as AuthenticatedRequest).user;
      if (authUser && authUser.role !== 'CITIZEN' && where.status === 'CANCELLED') {
        where.status = { not: 'CANCELLED' };
      }
      if (severity) where.severity = severity as string;
      if (departmentId) where.departmentId = departmentId as string;
      if (isOverdue === 'true') where.isOverdue = true;
      if (search) {
        where.OR = [
          { id: { contains: search as string } },
          { description: { contains: search as string } },
          { address: { contains: search as string } },
        ];
      }

      const orderBy: any = sortBy === 'risk'
        ? [{ riskScore: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }, { riskScore: 'desc' }];

      const [reports, total] = await Promise.all([
        prisma.roadReport.findMany({
          where,
          include: {
            aiAnalysis: true,
            priorityAssessment: true,
            department: true,
            roadSegment: { include: { tender: true } },
            verificationResult: true,
          },
          orderBy,
          skip,
          take,
        }),
        prisma.roadReport.count({ where }),
      ]);

      // Check SLA status dynamically
      const updatedReports = reports.map((r) => {
        const slaStatus = SLAService.evaluateOverdueStatus(r.createdAt, r.slaDueAt, r.status);
        return {
          ...r,
          isOverdue: slaStatus.isOverdue,
          overdueHours: slaStatus.overdueHours,
        };
      });

      res.status(200).json({
        success: true,
        data: updatedReports,
        meta: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const report = await prisma.roadReport.findUnique({
        where: { id },
        include: {
          aiAnalysis: true,
          priorityAssessment: true,
          department: true,
          assignedOfficer: { select: { id: true, name: true, email: true } },
          roadSegment: {
            include: {
              department: true,
              tender: true,
            },
          },
          verificationResult: true,
          timeline: { orderBy: { timestamp: 'asc' } },
        },
      });

      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      const authUser = (req as AuthenticatedRequest).user;
      if (report.status === 'CANCELLED' && authUser && authUser.role === 'AUTHORITY') {
        res.status(404).json({ success: false, message: 'Report not accessible to authority (Cancelled intake submission)' });
        return;
      }

      // Enforce strict citizen ownership: A citizen can only view their own report
      if (authUser && authUser.role === 'CITIZEN' && report.userId !== authUser.id) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view another citizen\'s report.',
        });
        return;
      }

      // Cancelled intake submissions are only visible to their creator
      if (report.status === 'CANCELLED' && (!authUser || authUser.id !== report.userId)) {
        res.status(404).json({
          success: false,
          message: 'Report not accessible (Cancelled intake submission)',
        });
        return;
      }

      const slaStatus = SLAService.evaluateOverdueStatus(report.createdAt, report.slaDueAt, report.status);

      res.status(200).json({
        success: true,
        data: {
          ...report,
          isOverdue: slaStatus.isOverdue,
          overdueHours: slaStatus.overdueHours,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCitizenReports(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const reports = await prisma.roadReport.findMany({
        where: { userId },
        include: {
          aiAnalysis: true,
          priorityAssessment: true,
          department: true,
          roadSegment: true,
          timeline: { orderBy: { timestamp: 'asc' } },
          verificationResult: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  public static async updateReportStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = reportStatusUpdateSchema.parse(req.body);

      const report = await prisma.roadReport.findUnique({ where: { id } });
      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      const updateData: any = {
        status: body.status,
      };

      if (body.assignedOfficerId) updateData.assignedOfficerId = body.assignedOfficerId;
      if (body.departmentId) updateData.departmentId = body.departmentId;
      if (body.damageTypeOverride) updateData.damageType = body.damageTypeOverride;
      if (body.severityOverride) updateData.severity = body.severityOverride;

      // Status labels and descriptions
      const statusLabels: Record<string, { label: string; desc: string }> = {
        ACKNOWLEDGED: {
          label: 'Complaint Acknowledged',
          desc: 'Responsible authority acknowledged report and scheduled preliminary verification.',
        },
        INSPECTION_SCHEDULED: {
          label: 'Field Inspection Scheduled',
          desc: 'Junior Engineer dispatched for on-site physical cross-section measurement.',
        },
        REPAIR_IN_PROGRESS: {
          label: 'Repair Work in Progress',
          desc: 'Road maintenance contractor mobilized on-site with materials and roller equipment.',
        },
        REPAIR_COMPLETED: {
          label: 'Repair Completed On-Site',
          desc: 'Pavement repair finished. Before/After evidence uploaded for AI audit.',
        },
        RESOLVED: {
          label: 'Complaint Formally Resolved',
          desc: 'Quality audit passed. Case closed by authorized Executive Engineer.',
        },
        NEEDS_REINSPECTION: {
          label: 'Reinspection Required',
          desc: 'AI or authority audit identified incomplete remediation. Contractor instructed to rework.',
        },
      };

      const meta = statusLabels[body.status] || {
        label: `Status Updated to ${body.status}`,
        desc: body.notes || 'Administrative status progression.',
      };

      const [updatedReport] = await Promise.all([
        prisma.roadReport.update({
          where: { id },
          data: updateData,
          include: {
            aiAnalysis: true,
            priorityAssessment: true,
            timeline: { orderBy: { timestamp: 'asc' } },
            department: true,
            roadSegment: true,
          },
        }),
        prisma.statusTimelineEvent.create({
          data: {
            reportId: id,
            status: body.status,
            label: meta.label,
            description: body.notes ? `${meta.desc} Note: ${body.notes}` : meta.desc,
            actorRole: req.user?.role || 'AUTHORITY',
            actorName: req.user?.name || 'Authority Officer',
            notes: body.notes,
          },
        }),
      ]);

      // If resolved, update road health
      if (body.status === 'RESOLVED' && report.roadSegmentId) {
        await RoadHealthService.updateSegmentHealth(report.roadSegmentId);
      }

      // Notify citizen
      await NotificationService.notify(
        report.userId,
        meta.label,
        `Your road complaint ${id} status changed to: ${body.status}.`,
        id,
        body.status === 'RESOLVED' ? 'RESOLUTION' : 'INFO'
      );

      res.status(200).json({ success: true, message: 'Status updated successfully', data: updatedReport });
    } catch (error) {
      next(error);
    }
  }

  public static async uploadAfterRepairPhoto(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = afterPhotoUploadSchema.parse(req.body);

      const report = await prisma.roadReport.findUnique({ where: { id } });
      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      if (report.status === 'CANCELLED') {
        res.status(400).json({ success: false, message: 'Cannot upload repair evidence for a cancelled report.' });
        return;
      }

      // Lifecycle enforcement: cannot jump directly from early intake states
      const earlyStates = ['REPORTED', 'AI_ANALYZED', 'PRIORITY_CALCULATED', 'ASSIGNED'];
      if (earlyStates.includes(report.status)) {
        res.status(400).json({
          success: false,
          message: `Lifecycle order violation: Complaint must pass through ACKNOWLEDGED, INSPECTION_SCHEDULED, and REPAIR_IN_PROGRESS before after-repair evidence can be submitted (current status: ${report.status}).`,
        });
        return;
      }

      // Validate after-repair evidence image
      const nonRoadKeywords = [
        'id_card', 'idcard', 'student', 'classroom', 'aadhaar', 'license', 'certificate',
        'chess', 'game', 'board', 'pawn', 'king', 'queen', 'knight', 'bishop', 'checkers',
        'poster', 'banner', 'flyer', 'ad', 'qr', 'qrcode', 'qr_code', 'barcode',
        'person', 'selfie', 'face', 'human', 'boy', 'girl', 'man', 'woman',
        'product', 'indoor', 'interior', 'furniture', 'cartoon', 'religious', 'temple', 'fake'
      ];
      const afterLower = body.afterImageUrl.toLowerCase();
      const afterTokens = afterLower.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
      const isInvalidAfter = nonRoadKeywords.some((kw) => {
        if (kw.length <= 4 || ['person', 'human', 'face', 'game', 'chess', 'board'].includes(kw)) {
          return afterTokens.includes(kw) || new RegExp(`\\b${kw}\\b`, 'i').test(afterLower);
        }
        return afterLower.includes(kw) || afterTokens.includes(kw);
      });

      if (isInvalidAfter) {
        res.status(400).json({
          success: false,
          message: 'Invalid after-repair evidence: the uploaded image does not appear to show a valid road/repair view.',
        });
        return;
      }

      // Update report: if in REPAIR_IN_PROGRESS, advance to REPAIR_COMPLETED. Do NOT mark AI_VERIFIED or RESOLVED here.
      const newStatus = report.status === 'REPAIR_IN_PROGRESS' ? 'REPAIR_COMPLETED' : report.status;
      const updatedReport = await prisma.roadReport.update({
        where: { id },
        data: {
          repairAfterImageUrl: body.afterImageUrl,
          status: newStatus,
        },
        include: {
          aiAnalysis: true,
          priorityAssessment: true,
          timeline: { orderBy: { timestamp: 'asc' } },
          department: true,
          roadSegment: true,
          verificationResult: true,
        },
      });

      await prisma.statusTimelineEvent.create({
        data: {
          reportId: id,
          status: newStatus,
          label: 'After-Repair Photo Uploaded',
          description: body.notes
            ? `Genuine remediation evidence photographed on-site. Note: ${body.notes}`
            : 'Genuine on-site remediation photograph uploaded for quality verification audit.',
          actorRole: req.user?.role || 'AUTHORITY',
          actorName: req.user?.name || 'Field Maintenance Team',
          notes: body.notes,
        },
      });

      res.status(200).json({
        success: true,
        message: 'After-repair photo saved successfully against report',
        data: updatedReport,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async escalateReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const report = await prisma.roadReport.findUnique({ where: { id } });
      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      await prisma.statusTimelineEvent.create({
        data: {
          reportId: id,
          status: report.status,
          label: 'Escalated to District Administration',
          description: reason
            ? `Authority Officer escalated this case for administrative intervention. Note: ${reason}`
            : 'Authority Officer escalated this case for administrative intervention and resource allocation.',
          actorRole: req.user?.role || 'AUTHORITY',
          actorName: req.user?.name || 'Authority Officer',
          notes: reason,
        },
      });

      // Notify system administrators
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await NotificationService.notify(
          admin.id,
          'Authority Case Escalation',
          `Case ${id} on ${report.address || 'corridor'} was escalated by ${req.user?.name || 'Authority'}: ${reason || 'Immediate action requested.'}`,
          id,
          'SLA_ALERT'
        );
      }

      const updatedReport = await prisma.roadReport.findUnique({
        where: { id },
        include: {
          aiAnalysis: true,
          priorityAssessment: true,
          timeline: { orderBy: { timestamp: 'asc' } },
          department: true,
          roadSegment: true,
          verificationResult: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Report escalated to District Administration successfully',
        data: updatedReport,
      });
    } catch (error) {
      next(error);
    }
  }
}
