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

  it('should reject clearly unrelated images (poster, QR code, product, interior) even if description says "pothole"', async () => {
    // 1. Poster image with description "pothole"
    const posterRes = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/campaign_poster.png',
      imageFilename: 'campaign_poster.png',
      description: 'pothole',
    });
    expect(posterRes.validRoadDamage).toBe(false);
    expect(posterRes.classification).toBe('INVALID_EVIDENCE');
    expect(posterRes.confidence).toBe(0);
    expect(posterRes.roadSafetyRisk).toBe(0);

    // 2. QR code image with description "pothole"
    const qrRes = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/payment_qr_code.png',
      imageFilename: 'payment_qr_code.png',
      description: 'pothole',
    });
    expect(qrRes.validRoadDamage).toBe(false);
    expect(qrRes.classification).toBe('INVALID_EVIDENCE');
    expect(qrRes.confidence).toBe(0);
    expect(qrRes.roadSafetyRisk).toBe(0);

    // 3. Product image with description "pothole"
    const productRes = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/product_box_package.jpg',
      imageFilename: 'product_box_package.jpg',
      description: 'pothole',
    });
    expect(productRes.validRoadDamage).toBe(false);
    expect(productRes.classification).toBe('INVALID_EVIDENCE');

    // 4. Filename contains pothole but is a poster (CASE 4)
    const potholePosterRes = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/pothole_awareness_poster.jpg',
      imageFilename: 'pothole_awareness_poster.jpg',
      description: 'pothole',
    });
    expect(potholePosterRes.validRoadDamage).toBe(false);
    expect(potholePosterRes.classification).toBe('INVALID_EVIDENCE');

    // 5. Ambiguous / uncertain image without recognized defect (CASE 5)
    const uncertainRes = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/random_snapshot_123.jpg',
      imageFilename: 'random_snapshot_123.jpg',
      description: 'look at this',
    });
    expect(uncertainRes.validRoadDamage).toBe(false);
    expect(uncertainRes.classification).toBe('INVALID_EVIDENCE');
    expect(uncertainRes.confidence).toBe(0);
  });
});
