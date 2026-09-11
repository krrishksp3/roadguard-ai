import { z } from 'zod';

export const AIAnalysisOutputSchema = z.object({
  damageType: z.enum([
    'pothole',
    'crack',
    'surface_deterioration',
    'waterlogging',
    'road_edge_damage',
    'drainage_damage',
    'signage_damage',
    'other',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
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
  classification: z.enum(['VALID_ROAD_DAMAGE', 'INVALID_EVIDENCE']).optional(),
  cancellationReason: z.string().optional(),
});

export type AIAnalysisOutput = z.infer<typeof AIAnalysisOutputSchema>;

export const AIVerificationOutputSchema = z.object({
  locationMatchConfidence: z.number().min(0).max(100),
  visibleImprovementScore: z.number().min(0).max(100),
  remainingDamageScore: z.number().min(0).max(100),
  overallConfidence: z.number().min(0).max(100),
  recommendation: z.enum(['PASS', 'NEEDS_REINSPECTION', 'INCONCLUSIVE']),
  explanation: z.string(),
});

export type AIVerificationOutput = z.infer<typeof AIVerificationOutputSchema>;
