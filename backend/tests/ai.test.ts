import { DemoAIProvider } from '../src/services/ai/DemoAIProvider';
import { AIAnalysisOutputSchema } from '../src/services/ai/schemas';

describe('DemoAIProvider — Strict Image-First Validation Matrix', () => {
  const provider = new DemoAIProvider();

  // CASE 1: Genuine pothole image -> accepted -> damageDetected true -> risk workflow continues
  it('CASE 1: Genuine pothole image is accepted with damageDetected true', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      imageFilename: 'pothole-reference.jpg',
      description: 'Cavity on lane',
    });
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('pothole');
    expect(res.roadSafetyRisk).toBeGreaterThan(0);
    expect(res.confidence).toBeGreaterThan(0.5);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 2: Genuine road crack image -> accepted -> damageDetected true
  it('CASE 2: Genuine road crack image is accepted with damageDetected true', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/crack-evidence.svg',
      imageFilename: 'crack-evidence.svg',
      description: 'Alligator cracking along lane',
    });
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('crack');
    expect(res.roadSafetyRisk).toBeGreaterThan(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 3: Normal road image -> rejected -> risk 0 -> no assignment
  it('CASE 3: Normal road image without defects is rejected with risk 0 and damageDetected false', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/normal_road_surface.jpg',
      imageFilename: 'normal_road_surface.jpg',
      description: 'Road surface view',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NO_DAMAGE_FOUND');
    expect(res.damageType).toBe('NO_ROAD_DAMAGE');
    expect(res.severity).toBe('NONE');
    expect(res.safetyRisk).toBe('NONE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 4: Bus/vehicle scene without road damage -> rejected -> risk 0 -> no assignment
  it('CASE 4: Bus/vehicle scene without road damage is rejected with risk 0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/city_bus_traffic_scene.jpg',
      imageFilename: 'city_bus_traffic_scene.jpg',
      description: 'Traffic on highway',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NO_DAMAGE_FOUND');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 5: Person image -> rejected -> no authority workflow
  it('CASE 5: Person/selfie image is rejected as NON_ROAD_IMAGE with risk 0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/person_portrait_selfie.jpg',
      imageFilename: 'person_portrait_selfie.jpg',
      description: 'Person selfie',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 6: ID card/document image -> rejected -> no authority workflow
  it('CASE 6: ID card/document image is rejected as NON_ROAD_IMAGE with risk 0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/student_id_card.png',
      imageFilename: 'student_id_card.png',
      description: 'College student badge',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 7: Cartoon/random unrelated image -> rejected -> no authority workflow
  it('CASE 7: Cartoon/random unrelated image is rejected as NON_ROAD_IMAGE with risk 0', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/cartoon_anime_drawing.png',
      imageFilename: 'cartoon_anime_drawing.png',
      description: 'Drawing',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NON_ROAD_IMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.confidence).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 8: User selects POTHOLE but image is normal road -> rejected -> user input must NOT override image evidence
  it('CASE 8: User selects POTHOLE but image is normal road -> rejected with NO_DAMAGE_FOUND', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/normal_asphalt_carriageway.jpg',
      imageFilename: 'normal_asphalt_carriageway.jpg',
      description: 'Pothole here',
      damageTypeHint: 'pothole', // Citizen selected Pothole!
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NO_DAMAGE_FOUND');
    expect(res.damageType).toBe('NO_ROAD_DAMAGE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 9: User description says "large pothole" but image has no pothole -> rejected
  it('CASE 9: User description says "large pothole" but image is intact road -> rejected', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/smooth_paved_road.jpg',
      imageFilename: 'smooth_paved_road.jpg',
      description: 'large dangerous pothole in middle of road', // Citizen text claim!
      damageTypeHint: 'pothole',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('NO_DAMAGE_FOUND');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 10: Low-confidence/insufficient image -> needs review or rejected -> never automatically assigned
  it('CASE 10: Low-confidence/insufficient/blurry image is rejected as INSUFFICIENT_EVIDENCE', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/uploads/blurry_night_obscured_capture.jpg',
      imageFilename: 'blurry_night_obscured_capture.jpg',
      description: 'Dark road photo',
    });
    expect(res.damageDetected).toBe(false);
    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.damageType).toBe('INSUFFICIENT_EVIDENCE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  // CASE 11: Valid road damage with misleading citizen text ("normal pic") still correctly accepted
  it('CASE 11: Valid road damage image with misleading text "normal pic" remains VALID', async () => {
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/large-road-pothole.jpg',
      imageFilename: 'large-road-pothole.jpg',
      description: 'normal pic', // Citizen description says normal pic, but image is a pothole!
    });
    expect(res.damageDetected).toBe(true);
    expect(res.validRoadDamage).toBe(true);
    expect(res.classification).toBe('VALID_ROAD_DAMAGE');
    expect(res.damageType).toBe('pothole');
    expect(res.roadSafetyRisk).toBeGreaterThan(0);
  });

  // CASE 12: Determinism: Same image input produces identical validation and classification results
  it('CASE 12: Exact same image uploaded twice produces identical deterministic result', async () => {
    const res1 = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/potholes-on-road.jpg',
      imageFilename: 'potholes-on-road.jpg',
      description: 'Pothole 1',
    });
    const res2 = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/potholes-on-road.jpg',
      imageFilename: 'potholes-on-road.jpg',
      description: 'Different user text for same pothole',
    });
    expect(res1.damageDetected).toBe(res2.damageDetected);
    expect(res1.validRoadDamage).toBe(res2.validRoadDamage);
    expect(res1.damageType).toBe(res2.damageType);
    expect(res1.severity).toBe(res2.severity);
    expect(res1.roadSafetyRisk).toBe(res2.roadSafetyRisk);
    expect(res1.confidence).toBe(res2.confidence);
  });
});

import { GeminiProvider } from '../src/services/ai/GeminiProvider';
import { AIService } from '../src/services/ai/AIService';

describe('GeminiProvider — Multimodal Vision AI & Configurable Model', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws a clear error when GEMINI_API_KEY is missing (no silent fallback)', async () => {
    const provider = new GeminiProvider('', 'gemini-2.5-flash');
    await expect(
      provider.analyzeRoadDamage({
        imageUrl: '/demo-evidence/pothole-reference.jpg',
        description: 'Pothole test',
      })
    ).rejects.toThrow(/GEMINI_API_KEY is not configured/);
  });

  it('uses configurable model from constructor or GEMINI_MODEL env', () => {
    const provider1 = new GeminiProvider('dummy-key', 'gemini-2.0-flash');
    expect(provider1.getModelName()).toBe('gemini-2.0-flash');

    const provider2 = new GeminiProvider('dummy-key');
    expect(provider2.getModelName()).toBe('gemini-2.5-flash');
  });

  it('TEST A: Genuine pothole photo receives valid road damage classification and risk from vision', async () => {
    const mockGeminiOutput = {
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType: 'pothole',
      severity: 'high',
      confidence: 0.94,
      visibleDamage: true,
      roadSafetyRisk: 82,
      description: 'Deep circular asphalt pothole in traffic lane with visible base aggregate.',
      recommendedAction: 'Full depth asphalt compaction patch.',
      imageQuality: {
        isAcceptable: true,
        isBlurry: false,
        isTooDark: false,
        hasRoadVisible: true,
        qualityScore: 95,
      },
    };

    let capturedUrl = '';
    let capturedBody: any = null;

    global.fetch = jest.fn().mockImplementation(async (url: string, opts: any) => {
      capturedUrl = url;
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockGeminiOutput) }],
              },
            },
          ],
        }),
      };
    });

    const provider = new GeminiProvider('fake-test-gemini-key', 'gemini-2.5-flash');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      imageFilename: 'pothole-reference.jpg',
      description: 'Deep road depression',
    });

    expect(capturedUrl).toContain('gemini-2.5-flash:generateContent');
    expect(capturedUrl).toContain('key=fake-test-gemini-key');
    expect(capturedBody.contents[0].parts[1].inlineData).toBeDefined();
    expect(capturedBody.contents[0].parts[1].inlineData.mimeType).toBe('image/jpeg');
    expect(capturedBody.contents[0].parts[1].inlineData.data.length).toBeGreaterThan(100);

    expect(res.validRoadDamage).toBe(true);
    expect(res.damageType).toBe('pothole');
    expect(res.severity).toBe('high');
    expect(res.roadSafetyRisk).toBe(82);
    expect(AIAnalysisOutputSchema.safeParse(res).success).toBe(true);
  });

  it('TEST B: Severe road damage returns critical severity and valid classification', async () => {
    const mockOutput = {
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType: 'pothole',
      severity: 'critical',
      confidence: 0.96,
      visibleDamage: true,
      roadSafetyRisk: 92,
      description: 'Severe structural subgrade collapse with jagged broken pavement edges.',
      recommendedAction: 'Emergency road closure and sub-base reconstruction.',
      imageQuality: { isAcceptable: true, isBlurry: false, isTooDark: false, hasRoadVisible: true, qualityScore: 90 },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockOutput) }] } }],
      }),
    });

    const provider = new GeminiProvider('fake-key', 'gemini-2.5-flash');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/severe-damage-reference.jpg',
      description: 'Caved road',
    });

    expect(res.validRoadDamage).toBe(true);
    expect(res.severity).toBe('critical');
    expect(res.roadSafetyRisk).toBe(92);
  });

  it('TEST C: Unrelated ID / document is rejected as INVALID_EVIDENCE with risk 0', async () => {
    const mockOutput = {
      validRoadDamage: false,
      classification: 'INVALID_EVIDENCE',
      damageType: 'other',
      severity: 'low',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'The uploaded image shows an identity card document, not road infrastructure.',
      recommendedAction: 'No civil action required.',
      cancellationReason: 'Identity document uploaded instead of road hazard.',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockOutput) }] } }],
      }),
    });

    const provider = new GeminiProvider('fake-key');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg', // buffer to simulate upload
      description: 'My ID card',
    });

    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('INVALID_EVIDENCE');
    expect(res.roadSafetyRisk).toBe(0);
    expect(res.visibleDamage).toBe(false);
  });

  it('TEST D: Unrelated interior / cartoon is rejected with risk 0', async () => {
    const mockOutput = {
      validRoadDamage: false,
      classification: 'INVALID_EVIDENCE',
      damageType: 'other',
      severity: 'low',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'Indoor room or cartoon illustration.',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockOutput) }] } }],
      }),
    });

    const provider = new GeminiProvider('fake-key');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      description: 'Interior pic',
    });

    expect(res.validRoadDamage).toBe(false);
    expect(res.roadSafetyRisk).toBe(0);
  });

  it('TEST E: Genuine road image with description "normal pic" remains VALID if road damage is visible', async () => {
    const mockOutput = {
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType: 'pothole',
      severity: 'high',
      confidence: 0.91,
      visibleDamage: true,
      roadSafetyRisk: 78,
      description: 'Image clearly depicts damaged asphalt roadway despite citizen writing normal pic.',
      recommendedAction: 'Asphalt patching.',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockOutput) }] } }],
      }),
    });

    const provider = new GeminiProvider('fake-key');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      description: 'normal pic', // Misleading text!
    });

    expect(res.validRoadDamage).toBe(true);
    expect(res.visibleDamage).toBe(true);
    expect(res.damageType).toBe('pothole');
  });

  it('TEST F: Invalid image with description "huge pothole" remains INVALID with risk 0', async () => {
    const mockOutput = {
      validRoadDamage: false,
      classification: 'INVALID_EVIDENCE',
      damageType: 'other',
      severity: 'low',
      confidence: 0,
      visibleDamage: false,
      roadSafetyRisk: 0,
      description: 'Photograph does not show pavement or road hazard despite description.',
      cancellationReason: 'Invalid road-damage evidence.',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockOutput) }] } }],
      }),
    });

    const provider = new GeminiProvider('fake-key');
    const res = await provider.analyzeRoadDamage({
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      description: 'huge dangerous pothole on road', // Misleading text!
    });

    expect(res.validRoadDamage).toBe(false);
    expect(res.classification).toBe('INVALID_EVIDENCE');
    expect(res.roadSafetyRisk).toBe(0);
  });

  it('does NOT silently fall back to DemoAIProvider when Gemini API fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Quota exceeded or invalid API key',
    });

    const provider = new GeminiProvider('invalid-key', 'gemini-2.5-flash');
    await expect(
      provider.analyzeRoadDamage({
        imageUrl: '/demo-evidence/pothole-reference.jpg',
        description: 'Test',
      })
    ).rejects.toThrow(/Google Gemini API request failed with HTTP 403/);
  });
});

describe('AIService Provider Selection & Diagnostics', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('selects GeminiProvider when AI_PROVIDER=gemini', () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-gemini-key-12345';
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';

    const service = new AIService();
    expect(service.getProviderName()).toBe('Google Gemini Vision Provider');
    expect(service.getModelName()).toBe('gemini-2.5-flash');
    expect(service.isDemo()).toBe(false);

    const diag = service.getDiagnosticInfo();
    expect(diag.provider).toBe('gemini');
    expect(diag.isKeyConfigured).toBe(true);
    expect(diag.status).toBe('ready');
    // NEVER expose raw key
    expect(JSON.stringify(diag)).not.toContain('test-gemini-key-12345');
  });

  it('selects DemoAIProvider when AI_PROVIDER=demo', () => {
    process.env.AI_PROVIDER = 'demo';

    const service = new AIService();
    expect(service.getProviderName()).toContain('DemoAIProvider');
    expect(service.isDemo()).toBe(true);

    const diag = service.getDiagnosticInfo();
    expect(diag.provider).toBe('demo');
    expect(diag.status).toBe('offline_demo');
  });
});

