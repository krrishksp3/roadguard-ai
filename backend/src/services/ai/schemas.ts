import { z } from 'zod';

export const ACCEPTED_ROAD_DAMAGE_CLASSES = [
  'POTHOLE',
  'ROAD_CRACK',
  'SURFACE_FAILURE',
  'OPEN_MANHOLE',
  'BROKEN_ROAD_EDGE',
  'WATERLOGGED_ROAD',
  'DEBRIS_ON_ROAD',
  'DAMAGED_DRAIN/CULVERT',
  'ROAD_OBSTRUCTION',
  'OTHER_ROAD_HAZARD',
  // Canonical / legacy lower-case aliases
  'pothole',
  'crack',
  'surface_deterioration',
  'waterlogging',
  'road_edge_damage',
  'drainage_damage',
  'signage_damage',
  'other',
] as const;

export const REJECTED_IMAGE_CLASSES = [
  'NO_ROAD_DAMAGE',
  'NO_DAMAGE_FOUND',
  'NON_ROAD_IMAGE',
  'INSUFFICIENT_EVIDENCE',
  'INVALID_EVIDENCE',
] as const;

export function isAcceptedRoadDamageClass(cls?: string | null): boolean {
  if (!cls) return false;
  const upper = cls.trim().toUpperCase();
  const lower = cls.trim().toLowerCase();
  if ((REJECTED_IMAGE_CLASSES as readonly string[]).includes(upper)) {
    return false;
  }
  return (
    (ACCEPTED_ROAD_DAMAGE_CLASSES as readonly string[]).includes(upper) ||
    (ACCEPTED_ROAD_DAMAGE_CLASSES as readonly string[]).includes(lower)
  );
}

export const AIAnalysisOutputSchema = z.object({
  damageDetected: z.boolean(),
  damageType: z.string(),
  severity: z.string(),
  safetyRisk: z.string(),
  confidence: z.number().min(0).max(1),
  evidenceReason: z.string(),
  visibleDamage: z.boolean(),
  roadSafetyRisk: z.number().min(0).max(100),
  description: z.string(),
  recommendedAction: z.string(),
  imageQuality: z.object({
    isAcceptable: z.boolean(),
    isBlurry: z.boolean(),
    isTooDark: z.boolean(),
    hasRoadVisible: z.boolean(),
    qualityScore: z.number().min(0).max(100),
    warningMessage: z.string().optional(),
  }),
  validRoadDamage: z.boolean().optional(),
  classification: z.enum([
    'VALID_ROAD_DAMAGE',
    'NO_DAMAGE_FOUND',
    'NON_ROAD_IMAGE',
    'INSUFFICIENT_EVIDENCE',
    'INVALID_EVIDENCE',
    'NEEDS_REVIEW',
  ]).optional(),
  cancellationReason: z.string().optional(),
});

export type AIAnalysisOutput = z.infer<typeof AIAnalysisOutputSchema>;

export const AIVerificationOutputSchema = z.object({
  locationMatchConfidence: z.number().min(0).max(100),
  visibleImprovementScore: z.number().min(0).max(100),
  remainingDamageScore: z.number().min(0).max(100),
  overallConfidence: z.number().min(0).max(100),
  recommendation: z.enum(['PASS', 'NEEDS_REINSPECTION', 'INCONCLUSIVE', 'REJECT']),
  explanation: z.string(),
});

export type AIVerificationOutput = z.infer<typeof AIVerificationOutputSchema>;

