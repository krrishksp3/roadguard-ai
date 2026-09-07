import { DemoAIProvider } from '../src/services/ai/DemoAIProvider';
import { AIAnalysisOutputSchema, AIVerificationOutputSchema } from '../src/services/ai/schemas';

describe('DemoAIProvider', () => {
  const provider = new DemoAIProvider();

  it('should analyze pothole damage and conform strictly to Zod schema', async () => {
    const analysis = await provider.analyzeRoadDamage({
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7',
      description: 'Massive deep pothole right on the road center',
      damageTypeHint: 'pothole',
    });

    expect(analysis.damageType).toBe('pothole');
    expect(analysis.visibleDamage).toBe(true);
    expect(analysis.confidence).toBeGreaterThan(0.7);
    expect(analysis.roadSafetyRisk).toBeGreaterThan(50);

    // Validate Zod schema
    const parseResult = AIAnalysisOutputSchema.safeParse(analysis);
    expect(parseResult.success).toBe(true);
  });

  it('should perform repair verification and conform to AIVerificationOutputSchema', async () => {
    const verification = await provider.verifyRepair({
      beforeImageUrl: 'https://images.unsplash.com/before.jpg',
      afterImageUrl: 'https://images.unsplash.com/after.jpg',
      damageType: 'pothole',
      originalSeverity: 'high',
    });

    expect(verification.recommendation).toBe('PASS');
    expect(verification.locationMatchConfidence).toBeGreaterThan(80);
    expect(verification.visibleImprovementScore).toBeGreaterThan(80);

    const parseResult = AIVerificationOutputSchema.safeParse(verification);
    expect(parseResult.success).toBe(true);
  });
});
